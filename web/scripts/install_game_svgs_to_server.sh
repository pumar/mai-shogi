#!/usr/bin/env bash
function bail() {
	if [ $? -eq 0 ]; then
		echo success
	else
		echo failed
		exit 1
	fi
}

echo "this script no longer needs to be ran, the svgs are checked into the game client repo"
exit 1
#https://codefather.tech/blog/bash-get-script-directory/
SCRIPT_RELATIVE_DIR=$(dirname "${BASH_SOURCE[0]}")

echo $SCRIPT_RELATIVE_DIR
cd $SCRIPT_RELATIVE_DIR
SCRIPT_FULL_PATH=$(pwd)
echo $SCRIPT_FULL_PATH
cd ..

echo this script may ask for sudo, to make directories in the container

shogiPiecesCommitHash=759e69d6372ebb2350376bd5aeafd0351ab6cf61
shogiPieceGitRepo=https://github.com/Ka-hu/shogi-pieces
targetDir=./server/static/shogi-pieces
if [ ! -d $targetDir ]; then
	echo shogi piece directory $targetDir did not exist, making it
	sudo mkdir $targetDir
	echo clone shogi piece repository...
	echo ==clone $shogiPieceGitRepo to $targetDir==
	sudo git clone --depth 1 $shogiPieceGitRepo $targetDir
	#echo dry run\$:git clone $shogiPieceGitRepo $targetDir
	bail
fi

targetPieceDir="$targetDir/kanji_red_wood"
echo go to dir $targetPieceDir
pushd $targetPieceDir

echo ==convert the svgs to the x format with cmd:\$../shogitool.sh p2x==
echo pieces before:
ls
echo end pieces before

#chmod +x ../shogitool.sh
sudo /usr/bin/env bash ../shogitool.sh p2x

echo pieces after:
ls
echo end pieces after

echo leave dir $targetPieceDir
popd
