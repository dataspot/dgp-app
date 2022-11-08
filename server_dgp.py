import logging
import os
import json

from aiohttp import web

from dgp_server.blueprint import DgpServer
from dgp_server.configurations import ConfigHeaderMappings, ConfigColumnTypes
from dgp_server.log import logger
from dgp.taxonomies.registry import TaxonomyRegistry, Taxonomy
from dgp.config.log import logger as logger_dgp

from etl_server.loaders.fileloader import FileLoaderDGP

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

class ColumnTypes(ConfigColumnTypes):

    def __init__(self, taxonomy_registry: TaxonomyRegistry):
        self.taxonomy_registry = taxonomy_registry

    async def refresh(self, request):
        await self.internal_refresh(request.app)

    async def internal_refresh(self, app):
        async with app['db'].acquire() as conn:
            column_types = {}
            async for row in conn.execute('select value from etl_taxonomies'):
                value = json.loads(row.value)
                column_types[value['id']] = value
            txn: Taxonomy = None
            for tid, txn in self.taxonomy_registry.index.items():
                if tid in column_types:
                    txn.column_types = column_types[tid]['column_types']
                    txn.title = column_types[tid]['title']
                else:
                    key = tid
                    value = dict(
                        id=key, 
                        title=txn.title,
                        column_types=txn.column_types
                    )
                    value = json.dumps(value)
                    await conn.execute('insert into etl_taxonomies(key, value) values (%s, %s) ON CONFLICT DO NOTHING',
                                        key, value)



class Server(DgpServer):
    def __init__(self, *args):
        super().__init__(*args)
        self.header_mappings = HeaderMappings(self.taxonomy_registry)
        self.column_type_refresher = ColumnTypes(self.taxonomy_registry)
        self.on_startup.append(self.refresh_taxonomies)

    def preload_dgps(self, config, context):
        return [FileLoaderDGP]

    async def refresh_taxonomies(self, app):
        try:
            await self.column_type_refresher.internal_refresh(app)
        except Exception as e:
            logger.exception('Failed to refresh taxonomies', e)
        


app = web.Application()
app.add_subapp('/api/', Server(BASE_PATH, DB_URL, CONF_DB_URL))
logger.setLevel(logging.DEBUG)
logger_dgp.setLevel(logging.DEBUG)

if __name__ == "__main__":
    web.run_app(app, host='127.0.0.1', port=5001, access_log=logger)
 