import os
import sys

from dags.operators.dgp_kind import operator
from etl_server.pipelines.models import Models

models = Models(os.environ['ETLS_DATABASE_URL'])

if __name__ == '__main__':
    for pipeline in models.query()['result']:
        if pipeline['key'] == sys.argv[1]:
            v = pipeline['value']
            operator(v['name'], v['params'])
            break
