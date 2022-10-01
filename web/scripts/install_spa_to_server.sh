#!/usr/bin/env bash

function bail() {
	if [ $? -eq 0 ]; then
		echo success
	else
		echo failed
		exit 1
	fi
}

#https://codefather.tech/blog/bash-get-script-directory/
SCRIPT_RELATIVE_DIR=$(dirname "${BASH_SOURCE[0]}")

echo $SCRIPT_RELATIVE_DIR
cd $SCRIPT_RELATIVE_DIR
SCRIPT_FULL_PATH=$(pwd)
echo $SCRIPT_FULL_PATH
cd ..

echo ==build game client==
pushd client/game
npm run build
bail
popd

echo ==build svelte==
pushd client/spa
npm run build
bail
popd

echo ==copy spa to django==
spaDest=server/static/spa_dist
if [ ! -d $spaDest ]; then
	echo spa destination directory \($spaDest\) does not exist, making it
	 mkdir $spaDest
fi
cp client/spa/dist/* $spaDest
bail


echo ==copy game client to django==
gameClientDest=server/static/game_client_dist
if [ ! -d $gameClientDest ]; then
	echo game client destination directory \($gameClientDest\) does not exist, making it
	mkdir $gameClientDest
fi
cp -r client/game/dist/* $gameClientDest
bail

CONTAINER_NAME=server-web-1
echo ==update container static files==
echo need sudo to login to $CONTAINER_NAME to run collectstatic
sudo docker exec -it $CONTAINER_NAME python manage.py collectstatic
