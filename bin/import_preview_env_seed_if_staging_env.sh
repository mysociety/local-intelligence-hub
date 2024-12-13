#!/bin/bash

if [ "$ENVIRONMENT" = "staging" ]; then
    unzip data/preview_env_seed.zip -d data
    cat data/preview_env_seed.psql | python manage.py dbshell
else
    echo "This command runs only in the staging environment."
fi
