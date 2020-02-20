import os

from aiohttp import web

from dgp_server.blueprint import DgpServer
from dgp_server.log import logger

BASE_PATH = os.environ.get('BASE_PATH', '/var/dgp')
DB_URL = os.environ.get('DATABASE_URL')

app = web.Application()
app.add_subapp('/api/', DgpServer(BASE_PATH, DB_URL))

if __name__ == "__main__":
    web.run_app(app, host='127.0.0.1', port=8000, access_log=logger)
 