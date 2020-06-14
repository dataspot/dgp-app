"""
Code that goes along with the Airflow tutorial located at:
https://github.com/apache/airflow/blob/master/airflow/example_dags/tutorial.py
"""
import sys
import os
import datetime 
import logging
import importlib

from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.utils import dates

from etl_server.pipelines.models import Models as PipelineModels

etl_models = PipelineModels(os.environ['ETLS_DATABASE_URL'])

default_args = {
    'owner': 'Airflow',
    'depends_on_past': False,
    'start_date': dates.days_ago(1),
}

for pipeline in etl_models.all_pipelines():
    dag_id = pipeline['id']
    logging.info('Initializing DAG %s', dag_id)

    schedule = pipeline['schedule']
    schedule = ('@' + schedule) if schedule != 'manual' else None

    dag = DAG(dag_id, default_args=default_args, schedule_interval=schedule)

    kind = pipeline['kind']
    operator = importlib.import_module('.' + kind, package='operators').operator

    t1 = PythonOperator(task_id=dag_id,
                        python_callable=operator,
                        op_args=[pipeline['name'], pipeline['params']],
                        dag=dag)
    globals()[dag_id] = dag


