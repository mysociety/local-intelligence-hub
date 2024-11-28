#!/bin/bash

SCRIPT_PATH=$(realpath "$0")
BIN_DIR=$(dirname $SCRIPT_PATH)

if [ ! -f "$BIN_DIR/../.ck_setup_complete" ]; then
    echo "CK setup is complete, running..."
    
    "$BIN_DIR/ck_setup.sh"
else
    echo "CK setup is complete, not re-running."
fi