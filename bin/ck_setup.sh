#!/bin/bash
echo '';
echo '------------------------------------';
echo '';
echo 'Setting up Mapped on your machine...';
echo '';
echo '------------------------------------';

if [ ! -f ".env" ]; then
  echo -e "\e[31m.env file not found. Get this from BitWarden, then rebuild the dev container.\e[0m"
  exit 1
fi

echo '';
echo '------------------------------------';
echo '';
echo 'Setting up Python environment...';
echo '';
echo '------------------------------------';
python -m venv .venv
poetry install
source .venv/bin/activate
echo "Done"

echo '';
echo '------------------------------------';
echo '';
echo 'Setting up database...';
echo '';
echo '------------------------------------';
python manage.py migrate
python manage.py createcachetable
echo "Done"

echo '';
echo '------------------------------------';
echo '';
echo 'Seeding database...';
echo '';
echo '------------------------------------';
python manage.py seed

echo '';
echo '------------------------------------';
echo '';
echo 'Downloading LIH data...';
echo '';
echo '------------------------------------';
python manage.py import_wards
python manage.py import_areas
python manage.py import_regions
python manage.py import_mps

echo '';
echo '------------------------------------';
echo '';
echo "> Downloading 2024 GE results CSV"
echo '';
echo '------------------------------------';
curl 'https://researchbriefings.files.parliament.uk/documents/CBP-10009/HoC-GE2024-results-by-constituency.csv' \
  -H 'cache-control: no-cache' \
  -H 'referer: https://commonslibrary.parliament.uk/' \
  -H 'user-agent: Mozilla/5.0' \
  -4 -L --tlsv1.3 \
  -o data/2024_general_election.csv
python manage.py import_last_election_data

echo '';
echo '------------------------------------';
echo '';
echo -n "> Installing JavaScript dependencies..."
echo '';
echo '------------------------------------';
cd nextjs
npm i

touch /app/.ck_setup_complete

echo '';
echo '------------------------------------';
echo '';
echo 'Setup complete!';
echo '';
echo '------------------------------------';
