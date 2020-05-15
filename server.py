import os
import logging
import json
import requests

from flask import Flask, redirect, send_file, Response, stream_with_context, request, abort
from flask_cors import CORS
from flask_session import Session

os.environ['ALLOWED_SERVICES'] = 'etl-server:etl_server'

from etl_server.pipelines.blueprint import make_blueprint as pipelines_blueprint
from etl_server.users.blueprint import make_blueprint as users_blueprint
from etl_server.files.blueprint import make_blueprint as files_blueprint
from etl_server.permissions import check_permission, Permissions
from auth import make_blueprint as auth_blueprint

# Configuration
configuration = json.load(open('dags/configuration.json'))

# Create application
app = Flask(__name__, static_folder='./ui/dist/ui/', static_url_path='/')

# CORS support
CORS(app, supports_credentials=True)

# Session
session = Session()
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = '/tmp/sessions'
app.config['SECRET_KEY'] = '-'
session.init_app(app)

# Routes
def proxy(base_url, prefix):
    @check_permission([Permissions.workbench])
    def func(*args, **kwargs):
        if request.full_path.startswith(prefix):
            url = base_url + request.full_path
            print(request.method, url)
            if request.method == 'GET':
                req = requests.get(url, stream=True)
                return Response(stream_with_context(req.iter_content(chunk_size=10)), content_type=req.headers['content-type'])
            elif request.method == 'POST':
                req = requests.post(url, json=request.json, headers=request.headers)
            elif request.method == 'OPTIONS':
                req = requests.options(url)
            return Response(req.content, content_type=req.headers['content-type'])
        abort(400)
    return func

def dgp_proxy(app, route, methods=['GET']):
    app.add_url_rule(route, 
                     route[1:].replace('/', '_'),
                     proxy('http://localhost:5001', '/api'),
                     methods=methods)


dgp_proxy(app, '/api/events/<path:subpath>')
dgp_proxy(app, '/api/config', methods=['POST'])

@app.route('/api/config', methods=['OPTIONS'])
def options():
    return {}

app.register_blueprint(
    pipelines_blueprint(db_connection_string=os.environ.get('ETLS_DATABASE_URL'),
                        configuration=configuration),
    url_prefix='/api/'
)
app.register_blueprint(
    users_blueprint(db_connection_string=os.environ.get('ETLS_DATABASE_URL')),
    url_prefix='/api/'
)
app.register_blueprint(
    files_blueprint(
        bucket_name=os.environ.get('BUCKET_NAME'),
        endpoint_url=os.environ.get('S3_ENDPOINT_URL'),
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
        aws_region=os.environ.get('AWS_REGION'),
    ),
    url_prefix='/api/'
)
app.register_blueprint(
    auth_blueprint(os.environ.get('EXTERNAL_ADDRESS')),
    url_prefix='/auth/'
)


@app.route('/')
@app.route('/logout')
@app.route('/pipelines')
@app.route('/dashboard')
@app.route('/users')
@app.route('/files')
@app.route('/dgp/<path:subpath>')
@app.route('/status/<path:subpath>')
@app.route('/edit/<path:subpath>')
def main(subpath=None):
    return send_file('ui/dist/ui/index.html')

if __name__=='__main__':
    app.run()
else:
    gunicorn_error_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers.extend(gunicorn_error_logger.handlers)
    app.logger.setLevel(logging.DEBUG)
    app.logger.error('DGP-APP STARTING')
