#!/bin/bash

echo '';
echo '------------------------------------';
echo '';
echo 'Logging into Bitwarden...';
echo '';
echo '------------------------------------';
bw login
bw sync

echo '';
echo '------------------------------------';
echo '';
echo 'Downloading .env file...';
echo 'Please enter your Bitwarden password when prompted.';
echo '';
echo '------------------------------------';
bw get attachment .env --itemid 064abbb1-e41b-4632-be90-b2270105d4d1

echo '';
echo '------------------------------------';
echo '';
echo 'Downloading NextJS .env file...';
echo 'Please enter your Bitwarden password when prompted.';
echo '';
echo '------------------------------------';
bw get attachment nextjs.env --itemid 064abbb1-e41b-4632-be90-b2270105d4d1 --output ./nextjs/.env
 