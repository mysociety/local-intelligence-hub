#!/bin/bash

if [ "$ENVIRONMENT" = "staging" ]; then
    unzip data/areas.psql.zip -d data
    cat data/areas.psql | python manage.py dbshell
else
    echo "This command runs only in the staging environment."
fi
