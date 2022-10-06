# Architecture

## Frontend
- client - has the single page application and the client side game logic
    - game 
        - client side game logic simply renders the game state, maybe the game UI
        - Typescript
        - can be build separately by executing `$npm run build` in the folder `web/client/game`
    - spa - single page application that renders the site, asks to start websocket connections, and instantiates the game
        - Typescript + Svelte
        - depends on game
        - right now the game's directory is symlinked to the spa's node_modules folder
            - the package.json dependency uses the `file:./` local package feature
        - can be built separately by executing `$npm run build` in the folder `web/client/spa`

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
2. you need to run `scripts/install_spa_to_server.sh`
    - builds the game client
    - builds the single page application
    - copies the necessary compiled javascript to the /static folder, which is later picked up by django
    - copies the font file that the game needs to render the letters on the held pieces
    - logs into the container to have django run collect static. collect static will pull the files from the /static directory into the /assets directory on the server, which will allow them to be the targets of web requests from the browser
3. you need to run `scripts/install_game_svgs_to_server.sh` to clone the git repo that has the svgs for the shogi pieces
    - also runs the script to change the svg file names to the ones expected by the game application
    - this script does not move the files to where they need to be for django, that is done by `install_spa_to_server.sh`
4. `scripts/install_game_engine_to_server.sh` will copy the game engine python code into the django project's `mai_shogi_site` app, so that it can be imported and used
