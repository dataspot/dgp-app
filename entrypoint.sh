#!/bin/sh
set -e

cd /app
airflow initdb
airflow scheduler &
airflow webserver -w 1 &

gunicorn -w 4 -t 180 --bind 127.0.0.1:5001 --worker-class aiohttp.GunicornWebWorker server_dgp:app &
gunicorn -w 4 -t 180 --bind 0.0.0.0:5000 server:app
