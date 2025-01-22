#!/bin/bash

if [ "$ENVIRONMENT" = "staging" ]; then
    unzip data/areas_minimal.psql.zip -d data
    cat data/areas_minimal.psql | python manage.py dbshell
else
    echo "This command runs only in the staging environment."
fi
