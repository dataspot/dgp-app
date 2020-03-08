#!/bin/bash
set -e

POSTGRES="psql --username ${POSTGRES_USER} datasets"

echo "Creating readonly database role"

$POSTGRES <<-EOSQL
CREATE USER readonly WITH PASSWORD 'readonly';
GRANT CONNECT ON DATABASE datasets TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;
EOSQL
