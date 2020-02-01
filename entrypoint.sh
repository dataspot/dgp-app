#!/bin/sh
cd /app
airflow initdb
airflow scheduler &
airflow webserver &
gunicorn --bind 0.0.0.0:5000 server:app
