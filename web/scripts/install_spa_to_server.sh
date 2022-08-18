#!/usr/bin/env bash

#https://codefather.tech/blog/bash-get-script-directory/
SCRIPT_RELATIVE_DIR=$(dirname "${BASH_SOURCE[0]}")

echo $SCRIPT_RELATIVE_DIR
cd $SCRIPT_RELATIVE_DIR
SCRIPT_FULL_PATH=$(pwd)
echo $SCRIPT_FULL_PATH
cd ..

echo build game library
pushd client/game
npm run build
popd

echo build svelte
pushd client/spa
npm run build
popd

echo copy spa to django
cp client/spa/dist/* server/static/

echo "login to container, collect static (may ask for sudo)"
sudo docker exec -it server-web-1 python manage.py collectstatic
