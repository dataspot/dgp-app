FROM python:3.7-alpine

WORKDIR /app

RUN apk --update --no-cache add libpq postgresql-dev libffi libffi-dev build-base ca-certificates bash \
    && pip install --upgrade gunicorn cython numpy 'pandas<1.0.0' \
    && adduser -D -h /app etl \ 
    && update-ca-certificates

ADD requirements.txt .
RUN pip install -r requirements.txt

ADD . .
RUN pip install -e .

ENV AIRFLOW__CORE__EXECUTOR=LocalExecutor
ENV AIRFLOW__CORE__DAGS_FOLDER=/app/dags
ENV AIRFLOW__CORE__LOAD_EXAMPLES=False

EXPOSE 5000
USER etl

ENTRYPOINT [ "/app/entrypoint.sh" ]