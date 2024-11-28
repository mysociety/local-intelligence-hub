#!/bin/bash

echo '';
echo '------------------------------------';
echo '';
echo 'Linting Mapped...';
echo '';
echo '------------------------------------';
black . && isort . && flake8
cd nextjs && npm run lint-fix

echo '';
echo '------------------------------------';
echo '';
echo 'Linting complete!';
echo '';
echo '------------------------------------';
