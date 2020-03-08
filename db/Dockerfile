FROM postgres:12

COPY 10-create-dbs.sql /docker-entrypoint-initdb.d/
COPY 20-readonly-user.sh /docker-entrypoint-initdb.d/

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
