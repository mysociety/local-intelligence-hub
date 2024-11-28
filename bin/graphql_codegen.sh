#!/bin/bash


echo '';
echo '------------------------------------';
echo '';
echo "Waiting up to 1 minute for Django to be up...";
echo '';
echo '------------------------------------';

# Wait 60 seconds for Django to be running
timeout 60 bash -c 'until printf "" 2>>/dev/null >>/dev/tcp/$0/$1; do sleep 1; done' 127.0.0.1 8000

if [[ $? -ne 0 ]]; then
    echo "Timed out waiting for Django."
fi

SCRIPT_PATH=$(realpath "$0")
BIN_DIR=$(dirname $SCRIPT_PATH)
NEXTJS_DIR="$BIN_DIR/../nextjs"

cd $NEXTJS_DIR

npm run graphql:watch
