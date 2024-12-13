#!/bin/bash

if [ "$ENVIRONMENT" = "staging" ]; then
    cat data/preview_env_seed.psql | python manage.py dbshell
else
    echo "This command runs only in the staging environment."
fi
