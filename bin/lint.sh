#!/bin/bash

echo '';
echo '------------------------------------';
echo '';
echo 'Linting Mapped...';
echo '';
echo '------------------------------------';
black . && isort . && flake8

echo '';
echo '------------------------------------';
echo '';
echo 'Linting complete!';
echo '';
echo '------------------------------------';
