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
echo "==build game client (GameRunner)=="
npm run build
bail
echo "==convert svgs to json-serialized threejs objects (copied to game_assets)=="
npm run build_svg_baker
bail
echo "run the svg baker, to serialize the svgs as threejs objects"
npm run build_game_assets
bail
echo "==copy board texture to game_assets=="
cp game_raw_assets/boards/tile_wood1.png game_assets
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
	mkdir -p $spaDest
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

echo "==copy game assets to django"
gameAssetsDest=server/static/game_assets
if [ ! -d $gameAssetsDest ]; then
	echo "game assets destination directory ($gameAssetsDest) doesn't exist, making it"
	mkdir $gameAssetsDest
fi
cp -r client/game/game_assets/* $gameAssetsDest
bail

fontSource=client/game/fonts
fontDest=server/static/
echo ==copy fonts from \($fontSource\) to django \($fontDest\)==
cp -r $fontSource $fontDest

CONTAINER_NAME=server-web-1
echo ==update container static files==
echo need sudo to login to $CONTAINER_NAME to run collectstatic
sudo docker exec -it $CONTAINER_NAME python3 manage.py collectstatic
echo ==make and do django db schema migrations==
sudo docker exec -it $CONTAINER_NAME python3 manage.py makemigrations
sudo docker exec -it $CONTAINER_NAME python3 manage.py migrate
