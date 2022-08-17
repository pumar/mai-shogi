# Architecture

## Frontend
- client - has the single page application and the client side game logic
    - game 
        - client side game logic simply renders the game state, maybe the game UI
        - Typescript
        - build by executing `$npm run build` in the folder `web/client/game`
    - spa - single page application that renders the site, asks to start websocket connections, and instantiates the game
        - Typescript + Svelte
        - depends on game
        - right now the game's directory is symlinked to the spa's node_modules folder
            - the package.json dependency uses the `file:./` local package feature
        - build by executing `$npm run build` in the folder `web/client/spa`
    - game and spa have their own package.json files, are build separately
        - I want to make some scripts that can build both
    - will need a script to print the compiled spa+game application to the backend folder structure

## Backend
- Server: Django + Python
    - `web/server`
    - in a container
        - container is built by docker compose
        - in the `/web/server` directory run `$sudo docker-compose up`, depending on your docker compose version the command may be `$sudo docker compose up`
- Database: Postgres
    - in a container
    - built by docker compose at the same time that the web server is
    - data should be stored between sessions in the `web/server/data` folder
- Game Engine: Python

## Installation
1. you need to build and run the images with docker compose
2. you need to run `scripts/install_spa_to_server.sh` to copy the spa and game code into the django static files folder
3. you then need to log into the docker container with login_web_container.sh, and run `$python manage.py collectstatic`
    1. collect static will pull the files from the /static directory into the /assets directory on the server, which will allow them to be the targets of web requests from the browser
    2. if some css or javascript file is missing and there errors on the webpage, it may be because collectstatic needs ran again
    3. also, you can log into the web docker container and look around in the filesystem to make sure that the files are there

