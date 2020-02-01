import os
import logging
import json

from flask import Flask, redirect
from flask_cors import CORS

from etl_server.blueprint import make_blueprint

# Create application
app = Flask(__name__, static_folder='./ui/dist/ui/', static_url_path='/')

# CORS support
CORS(app, supports_credentials=True)

configuration = json.load(open('configuration.json'))

@app.route('/')
def main():
    return redirect('/index.html')

app.register_blueprint(
    make_blueprint(db_connection_string=os.environ.get('DATABASE_URL'),
                   configuration=configuration),
    url_prefix='/api/'
)


logging.getLogger().setLevel(logging.INFO)

if __name__=='__main__':
    app.run()


















