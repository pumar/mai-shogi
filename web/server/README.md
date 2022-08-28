# Dev Environment setup
## Docker Compose
- two docker images
    - one runs a postgres db
    - the other runs the django server
- run init_django_project.sh to run the Django project setup command in the container
    - note that the src folder is loaded into the container as a volume, which means that edits on the host machine will be reflected within the container in real-time
- sudo docker-compose up runs the two containers, the Django welcome screen can be seen at the default location of `localhost:8000`
- [installing Docker on Windows via WSL](https://docs.microsoft.com/en-us/windows/wsl/install)
    - you can also use [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/), as this project should meet the requirements for free usage of it


## Acknowledgements
- [shogi pieces svgs](https://github.com/Ka-hu/shogi-pieces)
