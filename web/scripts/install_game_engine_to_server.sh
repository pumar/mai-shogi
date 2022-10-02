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

gameDir=../game
destDir=./server/mai_shogi_site/game
echo ==copy the python game engine from \($gameDir\) to the server folder \($destDir\)==
if [ ! -d $destDir ]; then
	echo destination dir \($destDir\) doesn\'t exist, making it
	mkdir $destDir
fi
bail

cp -r $gameDir/* $destDir
bail


