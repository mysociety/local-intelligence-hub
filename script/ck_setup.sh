#!/bin/bash

echo "Running Common Knowledge initial setup script"

if [ ! -f ".env" ]; then
  echo -e "\e[31m.env file not found. Get this from BitWarden, then rebuild the dev container.\e[0m"
  exit 1
fi

echo -n "> Installing Python dependencies..."
python -m venv .venv
poetry install
source .venv/bin/activate
echo "Done"

echo "> Setting up database..."
python manage.py migrate
python manage.py createcachetable
echo "Done"
echo "> Populating database..."
python manage.py seed
echo "> Importing LIH data..."
python manage.py import_regions
python manage.py import_areas
python manage.py import_mps
echo "> Downloading 2024 GE results CSV"
curl 'https://researchbriefings.files.parliament.uk/documents/CBP-10009/HoC-GE2024-results-by-constituency.csv' \
  -H 'cache-control: no-cache' \
  -H 'referer: https://commonslibrary.parliament.uk/' \
  -H 'user-agent: Mozilla/5.0' \
  -4 -L --tlsv1.3 \
  -o data/2024_general_election.csv
python manage.py import_last_election_data

echo -n "> Installing JavaScript dependencies..."
cd nextjs
npm i
echo "Done"
