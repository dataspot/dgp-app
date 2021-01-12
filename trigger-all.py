import os
import sys
import time
import json

from datapackage import Package
from etl_server.pipelines.controllers import Controllers as PipelineControllers
from etl_server.users.models import Models as UserModels

if __name__ == '__main__':
    etl_pipelines = PipelineControllers({}, os.environ['ETLS_DATABASE_URL'])

    pipelines = etl_pipelines.query_pipelines()
    json.dump(pipelines, open('pipelines-backup.json', 'w'))
    pipelines = pipelines['result']
    kind = None
    if len(sys.argv) > 1:
        kind = sys.argv[1]

    time.sleep(30)
    for pipeline in pipelines:
        pipeline_id = pipeline['id']
        pipeline_kind = pipeline['kind']
        if kind is None or pipeline_kind == kind:
            ret = etl_pipelines.start_pipeline(pipeline_id)
            print(pipeline_id, ret)
            time.sleep(10)
