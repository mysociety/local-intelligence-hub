#!/bin/bash

if [ "$ENVIRONMENT" != "production" ]; then
    curl https://uploads.commonknowledge.coop/data/areas.psql.zip -o data/areas.psql.zip
    unzip data/areas.psql.zip -d data
    cat data/areas.psql | python manage.py dbshell
else
    echo "This command cannot run in production environments."
fi
