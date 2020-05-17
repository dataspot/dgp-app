import logging
import os
import json

from aiohttp import web

from dgp_server.blueprint import DgpServer
from dgp_server.configurations import ConfigHeaderMappings
from dgp_server.log import logger
from dgp.config.log import logger as logger_dgp

from dags.operators.dgp_kind.fileloader import FileLoaderDGP

BASE_PATH = os.environ.get('BASE_PATH', '/var/dgp')
DB_URL = os.environ.get('DATASETS_DATABASE_URL')
CONF_DB_URL = os.environ.get('ETLS_DATABASE_URL')

class HeaderMappings(ConfigHeaderMappings):

    async def fetch(self, request):
        async with request.app['db'].acquire() as conn:
            configurations = []
            async for row in conn.execute('select value from etl_pipeline'):
                value = json.loads(row.value)
                params = value.get('params', {})
                if 'dgpConfig' in params:
                    configurations.append(dict(config=params['dgpConfig']))
            return configurations

class Server(DgpServer):
    def __init__(self, *args):
        super().__init__(*args)
        self.header_mappings = HeaderMappings(self.taxonomy_registry)

    def preload_dgps(self, config, context):
        return [FileLoaderDGP]


app = web.Application()
app.add_subapp('/api/', Server(BASE_PATH, DB_URL, CONF_DB_URL))
logger.setLevel(logging.DEBUG)
logger_dgp.setLevel(logging.DEBUG)

if __name__ == "__main__":
    web.run_app(app, host='127.0.0.1', port=5001, access_log=logger)
 