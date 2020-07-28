import os
import time

from datapackage import Package
from etl_server.pipelines.controllers import Controllers as PipelineControllers
from etl_server.users.models import Models as UserModels

etl_pipelines = PipelineControllers({}, os.environ['ETLS_DATABASE_URL'])

pipelines = etl_pipelines.query_pipelines()
pipeline_ids = [x['id'] for x in pipelines['result']]

time.sleep(30)
for pipeline_id in pipeline_ids:
    ret = etl_pipelines.start_pipeline(pipeline_id)
    print(pipeline_id, ret)
    time.sleep(180)
