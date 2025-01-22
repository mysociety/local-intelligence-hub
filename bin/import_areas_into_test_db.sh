#!/bin/bash

if [ "$ENVIRONMENT" != "production" ]; then
    unzip -o data/areas_minimal.psql.zip -d data
    PGPASSWORD=password psql -U postgres -h db test_postgres < data/areas_minimal.psql
else
    echo "This command cannot run in production environments."
fi
