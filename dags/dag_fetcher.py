"""
Code that goes along with the Airflow tutorial located at:
https://github.com/apache/airflow/blob/master/airflow/example_dags/tutorial.py
"""
import datetime 
import logging
from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from airflow.utils import dates
from etl_server.models import Models

etl_models = Models()

default_args = {
    'owner': 'Airflow',
    'depends_on_past': False,
    'start_date': dates.days_ago(1),
}

for pipeline in etl_models.all_pipelines():
    dag_id = pipeline['id']
    logging.info('Initializing DAG %s, %r', dag_id, pipeline)
    dag = DAG(dag_id, default_args=default_args, schedule_interval=datetime.timedelta(days=1))
    t1 = BashOperator(task_id=dag_id,
                      bash_command='for x in "1 2 3 4 5 6 7 8 9 10" ; do echo "$x: %s" ; sleep 10 ; done' % pipeline['name'],
                      dag=dag)
    globals()[dag_id] = dag


