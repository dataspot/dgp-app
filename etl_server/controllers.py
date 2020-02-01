import logging
import time

from slugify import slugify

from .models import Models


class Controllers():

    def __init__(self, configuration, connection_string):
        self.models = Models(connection_string=connection_string)
        self.config = configuration

    def create_or_edit_pipeline(self, id, body):
        # Calculate id if necessary
        if not id:
            title = body['name']
            title = title + ' ' + hex(int(time.time()))[2:]
            id = slugify(title, separator='-', to_lower=True)
            body['id'] = id

        # Add record to DB
        ret = self.models.create_or_edit(id, body)
        return ret

    def delete_pipeline(self, id):
        # Delete pipeline from DB
        ret = self.models.delete(id)
        return ret

    def __get_latest_runs(self):
        from airflow.models import DagRun
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
        from airflow.models import TaskInstance, DagBag
        from airflow.utils.db import create_session
        from airflow import settings
        
        dagbag = DagBag(settings.DAGS_FOLDER, store_serialized_dags=settings.STORE_SERIALIZED_DAGS)
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
            return logs
        else:
            return ''

    def query_pipelines(self):
        query_results = self.models.query()
    
        statuses = self.__get_latest_runs()
        for res in query_results.get('result', []):
            if res['key'] in statuses:
                res['value']['status'] = statuses[res['key']]
        query_results['result'] = list(map(lambda x: x.get('value'),query_results.get('result', [])))

        return query_results

    def query_pipeline(self, id):
        result = self.models.query_one(id)
        statuses = self.__get_latest_runs()
        key = result.get('result', {}).get('key')
        if key in statuses:
            status = statuses[key]
            status['logs'] = self.__get_logs(key)
            result.setdefault('result', {}).setdefault('value', {})\
                .setdefault('status', status)
        result['result'] = result.get('result', {}).get('value')
        return result

    def configuration(self):
        return dict(result=self.config)

    def start_pipeline(self, id):
        from airflow.api.common.experimental.trigger_dag import trigger_dag
        from airflow import models
        models.DagModel.get_dagmodel(id).set_is_paused(is_paused=False)
        run = trigger_dag(id)
        return dict(result=run.run_id if run else None) 