import sys
import os

from etl_server.pipelines.models import Models as PipelineModels
from operators.dgp_kind import operator

etl_models = PipelineModels(os.environ['ETLS_DATABASE_URL'])

if __name__ == '__main__':
    pipeline_id = sys.argv[1]
    print('running dag', pipeline_id)

    for pipeline in etl_models.all_pipelines():
        dag_id = pipeline['id']
        if dag_id != pipeline_id:
            continue
        name = pipeline['name']
        params = pipeline['params']

        operator(name, params)
        break
