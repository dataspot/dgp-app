import sys
import re
import os
import datetime 
import logging
import importlib

LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"
LOG_FORMAT = '%(asctime)s:%(levelname)-8s:%(name)s:%(message)s'

logging.basicConfig(
    format=LOG_FORMAT,
    level=logging.DEBUG,
    datefmt=LOG_DATEFMT,
)

from inspect import signature

from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.operators.bash_operator import BashOperator
from airflow.operators.latest_only_operator import LatestOnlyOperator
from airflow.sensors.external_task_sensor import ExternalTaskSensor
from airflow.utils import dates
from airflow.utils.dates import cron_presets

from etl_server.pipelines.cache import Cache

depends_on = re.compile(r'^.*depends on:\s*([-a-z0-9]+)\s*$', re.IGNORECASE | re.MULTILINE | re.DOTALL)

def wrapper(operator, id):
    _id = id
    _operator = operator
    def func(*args):
        result = None
        try:
            print('CALLING OPERATOR')
            args = args[:len(list(signature(_operator).parameters))]
            result = _operator(*args)
            print('OPERATOR DONE, RESULT={}'.format(result))
        finally:
            from etl_server.pipelines.models import Models
            from etl_server.pipelines.controllers import Controllers
            models = Models(os.environ['ETLS_DATABASE_URL'])
            pipeline = models.query_one(_id)['result']['value']
            if result and not pipeline.get('result'):
                Controllers.trigger_event('accepted', pipeline)
            pipeline['result'] = result
            models.create_or_edit(_id, pipeline, allowed_all=True)
            print('SAVED PIPELINE={}, RESULT={}'.format(_id, result))

    return func


default_args = {
    'owner': 'Airflow',
    'depends_on_past': False,
    'start_date': dates.round_time(datetime.datetime.now() - datetime.timedelta(weeks=26), datetime.timedelta(weeks=52), start_date=datetime.datetime(2020,1,1)),
    'is_paused_upon_creation': False,
}

logging.getLogger('airflow').setLevel(logging.WARNING)
logging.getLogger('airflow.task').setLevel(logging.DEBUG)

for pipeline in Cache.cached_pipelines():
    dag_id = pipeline['id']

    schedule = pipeline['schedule']
    if isinstance(schedule, str):
        if schedule not in cron_presets:
            if len(schedule.split()) not in (5, 6):
                if '@' + schedule in cron_presets:
                    schedule = '@' + schedule
                else:
                    schedule = None
    else:
        schedule = None

    try:
        dag = DAG(dag_id, default_args=default_args, schedule_interval=schedule, catchup=False)

        kind = pipeline['kind']
        description = pipeline.get('description')
        operator = importlib.import_module('.' + kind, package='operators').operator

        main_task = PythonOperator(task_id=dag_id,
                            python_callable=wrapper(operator, dag_id),
                            op_args=[
                                pipeline['name'],pipeline['params'], pipeline
                            ],
                            dag=dag)
        if description and (match := depends_on.match(description)):
            parent_dag_id = match.group(1)
            t0 = ExternalTaskSensor(task_id=dag_id + '__trigger',
                                    external_dag_id=parent_dag_id,
                                    external_task_id=parent_dag_id,
                                    mode='reschedule',
                                    dag=dag)
            t0 >> main_task
        elif schedule is not None:
            t0 = LatestOnlyOperator(task_id=dag_id + '__latest_only', dag=dag)
            t0 >> main_task
        globals()[dag_id] = dag
    except Exception as e:
        logging.error(f'Failed to create a DAG with id {dag_id}, schedule {schedule} because {e}')


task_id = '_clean_scheduler_logs' 
dag_id = task_id + '_dag'
schedule = '0 * * * *'
args = {
    'owner': 'Airflow',
    'depends_on_past': False,
    'start_date': datetime.datetime.now(),
    'is_paused_upon_creation': False,
}
clean_scheduler_logs_dag = DAG(dag_id, default_args=args,
                                schedule_interval=schedule)
clean_scheduler_logs = BashOperator(task_id=task_id,
                                    bash_command='cd /app/airflow/logs/scheduler/ && rm -rf * && echo cleaned',
                                    dag=clean_scheduler_logs_dag)

def event_proxy(handler, **kwargs):
    pipeline = kwargs['dag_run'].conf
    return handler(pipeline)

for event in ('delete', 'failed', 'new', 'submitted', 'accepted'):
    handler = importlib.import_module(f'events.{event}_pipeline').handler
    task_id = f'event_handler_{event}_pipeline'
    dag_id = task_id + '_dag'
    dag = DAG(dag_id, default_args=default_args, schedule_interval=None)
    task = PythonOperator(task_id=task_id, python_callable=event_proxy,
                          op_args=[handler], dag=dag, provide_context=True)
    globals()[dag_id] = dag
