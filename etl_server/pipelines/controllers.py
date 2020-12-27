import logging
import time
import re
import os
import json

import slugify

from .models import Models
from .cache import Cache

from airflow.models import TaskInstance, DagBag, DagRun, DagModel
from airflow.utils.db import create_session
from airflow import settings

dagbag = DagBag(settings.DAGS_FOLDER, store_serialized_dags=settings.STORE_SERIALIZED_DAGS)


TABLE_RE = re.compile('<table>.+</table>', re.MULTILINE | re.DOTALL)


class Controllers():

    def __init__(self, configuration, connection_string):
        self.models = Models(connection_string=connection_string)
        self.config = configuration
        if 'schedules' not in configuration:
            configuration['schedules'] = [
                dict(name='@hourly', display='Hourly'),
                dict(name='@daily', display='Daily'),
                dict(name='@weekly', display='Weekly'),
                dict(name='@monthly', display='Monthly'),
                dict(name='@yearly', display='Yearly'),
                dict(name='manual', display='Manual'),
            ]
        Cache.refresh_cached_pipelines(self.models)
        self.unpause_all()

    def unpause_all(self):
        dagbag = DagBag(settings.DAGS_FOLDER)
        dag_ids = dagbag.dag_ids
        for dag_id in dag_ids:
            model = DagModel.get_dagmodel(dag_id)
            if model:
                model.set_is_paused(is_paused=False)
            else:
                logging.warning('Failed to unpause dag %s', dag_id)
        

    def create_or_edit_pipeline(self, id, body, owner, allowed_all):
        # Calculate id if necessary
        if not id:
            title = body['name']
            title = title + ' ' + hex(int(time.time()))[2:]
            id = slugify.slugify(title, separator='-', lowercase=True)
        body['id'] = id

        submitted = False
        if body.get('params', {}).get('dgpConfig', {}).get('__submit'):
            submitted = True
            body['params']['dgpConfig']['__submit'] = False

        # Add record to DB
        ret = self.models.create_or_edit(id, body, owner=owner, allowed_all=allowed_all)
        Cache.refresh_cached_pipelines(self.models)

        if ret.get('created'):
            self.trigger_event('new', ret['result'])
        elif submitted:
            self.trigger_event('submitted', ret['result'])

        return ret

    def delete_pipeline(self, id, user=None):
        # Delete pipeline from DB
        pipeline = self.models.query_one(id)
        pipeline = pipeline.get('result', {}).get('value')
        ret = self.models.delete(id, user)
        Cache.refresh_cached_pipelines(self.models)
        if ret.get('success'):
            self.trigger_event('delete', pipeline)
        return ret

    def __get_latest_runs(self):
        dagruns = DagRun.get_latest_runs()
        statuses = {}
        for run in dagruns:
            statuses[run.dag_id] = dict(
                execution_date=run.execution_date and run.execution_date.isoformat(),
                start_date=run.start_date and run.start_date.isoformat(),
                end_date=run.end_date and run.end_date.isoformat(),
                status=str(run._state)
            )
        return statuses

    def __get_logs(self, id):
        logger = logging.getLogger('airflow.task')
        handler = next((handler for handler in logger.handlers
                        if handler.name == 'task'), None)
        with create_session() as session:
            ti = session.query(TaskInstance)\
                    .filter(TaskInstance.dag_id == id,
                            TaskInstance.task_id == id)\
                    .order_by(TaskInstance.execution_date.desc())\
                    .first()
        if ti is not None:
            dag = dagbag.get_dag(id)
            if dag:
                ti.task = dag.get_task(ti.task_id)
                logs, _ = handler.read(ti, None, metadata={})
            else:
                logs = ''
            if isinstance(logs, list):
                pre, post = logs[:50], logs[50:]
                post = post[-500:]
                logs = ''.join(pre + ['...'] + post)
            if not logs:
                return '', ''
            table = TABLE_RE.findall(logs)
            if len(table) > 0:
                table = table[-1]
                logs = TABLE_RE.sub('', logs)
            else:
                table = ''
            return logs, table
        else:
            return '', ''

    def query_pipelines(self, user=None, public=None):
        query_results = self.models.query()
        results = query_results.get('result', [])
        if user:
            results = list(filter(lambda p: not p['private'] or p['owner'] == user, results))
        elif public:
            results = list(filter(lambda p: not p['private'], results))
    
        statuses = self.__get_latest_runs()
        for res in results:
            status = dict(status='didnt-run')
            status = statuses.get(res['key'], status)
            res['value']['status'] = status
        query_results['result'] = list(map(lambda x: dict(x.get('value'), owner=x.get('owner'), private=x.get('private')), results))

        return query_results

    def query_pipeline(self, id, user=None, public=None):
        ret = self.models.query_one(id)
        result = ret.setdefault('result', {})
        value = result.setdefault('value', {})
        if (user and result['owner'] != user and result['private']) or (public and result['private']):
            return dict(success=False)

        statuses = self.__get_latest_runs()
        key = result.get('key')
        if key in statuses:
            status = statuses[key]
            status['logs'], status['table'] = self.__get_logs(key)
        else:
            status = dict(status='didnt-run', logs='')
        value.setdefault('status', status)
        ret['result'] = value
        return ret

    def configuration(self, admin=False):
        kinds = [
            kind for kind in self.config['kinds']
            if not kind.get('admin') or admin
        ]
        ret = dict(
            (k, v) for k, v in self.config.items()
        )
        ret['kinds'] = kinds
        return dict(result=ret)

    @staticmethod
    def start_pipeline(id):
        from airflow.api.common.experimental.trigger_dag import trigger_dag
        from airflow import models
        models.DagModel.get_dagmodel(id).set_is_paused(is_paused=False)
        run = trigger_dag(id)
        return dict(result=run.run_id if run else None) 

    @staticmethod
    def trigger_event(event, pipeline):
        from airflow.api.common.experimental.trigger_dag import trigger_dag
        from airflow import models
        dag_id = f'event_handler_{event}_pipeline_dag'
        models.DagModel.get_dagmodel(dag_id).set_is_paused(is_paused=False)
        trigger_dag(dag_id, conf=pipeline)

