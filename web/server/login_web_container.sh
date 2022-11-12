#!/usr/bin/env bash
containerArg=$1
if [ "$containerArg" == "web" ]; then
	targetContainer="server-web-1"
fi
if [ "$containerArg" == "redis" ]; then
	targetContainer="redis-cache"
fi
if [ "$containerArg" == "db" ]; then
	targetContainer="database"
fi

if [ -n "$targetContainer" ]; then
	sudo docker exec -it $targetContainer /bin/bash
else
	echo "must specify a target container, valid options are: 'web' 'redis' 'db'"
fi
