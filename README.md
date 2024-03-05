# Local Intelligence Hub: MEEP Version

A fork of MySociety's Local Intelligence Hub to be used as a backend for Common Knowledge's MEEP.

## Development install

You will need [Docker](https://docs.docker.com/desktop/) installed.

To run the front-end, you will need [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) installed.

Clone the repository:

    git clone git@github.com:commonknowledge/meep-intelligence-hub.git
    cd local-intelligence-hub

Create and edit a .env file using `.env-example` file and then
update `SECRET_KEY` and `MAPIT_API_KEY`. You can get the latter from https://mapit.mysociety.org/account/signup/

For the front-end, create and edit a .env file using `nextjs/.env.example` (save it as `nextjs/.env`).

Follow the below steps to start up the back-end. After data import, there is an extra step for MEEP
where the created user needs to be verified in the back-end - see the "Logging In" section.

Start up the front end with: `cd nextjs; npm run dev`.

### Running Docker manually (recommended)

Start the Docker environment:

    docker-compose up

Docker-compose will automatically install dependencies and start the development web server at <https://localhost:8000> when the container is started.

(If Python complains about missing libraries, chances are the Python requirements have changed since your Docker image was last built. You can rebuild it with, eg: `docker-compose build web`.)

### Running Docker via Visual Studio Code (VS Code)

1. Install the Remote-Container extension.
2. In the VS Code Command pallette run `Remote-Containers: Install devcontainer CLI`
3. Then in the repo directory, run `devcontainer open`

This will setup the docker containers and provide a Bash prompt into the containers. 

The same config files means this repo also works in codespaces.

And you can run the development web server at <https://localhost:8000>, inside the container, with:

    script/server

### Data import

If you’re running Docker manually (recommended) you will need to enter a Bash shell inside the container, in order to run any of the data import commands:

    docker-compose exec web bash

If you’re running Docker via Visual Studio Code, instead, you’ll want to run the commands via the built-in terminal.

You will likely want to create a Django superuser, by running this inside the container:

    script/createsuperuser

The superuser will be created with the details specified in the `DJANGO_SUPERUSER_*` environment variables. [Read more about how Docker handles environment variables](https://docs.docker.com/compose/envvars-precedence/).

You will also want to import data. For convenience, there is a script that will automatically run all the `import_*` commands from `hub/management/commands`, one after the other, which you can run from inside the container:

    script/import-all-data

You could alternatively run commands individually (again, from inside the container), eg:

    ./manage.py import_areas
    ./manage.py import_mps

### Logging In

The superuser will not initially work on the front-end as it is not verified, which is required by the GraphQL Auth library
we are using. To fix this, simply go to the back-end and update the User Status for it, ensuring "Verified" is checked.

### Running the tests

First start the Docker environment:

    docker-compose up

Then run the tests from inside or outside the docker container:

    script/test

The first time you run `script/test`, it will ask whether you want the tests to run natively or inside the docker container. Type `docker` to run them inside the docker container. Your preference will be saved to `.env` for future runs.

### Linting and formatting code

You can run the linting and formatting suite from inside or outside the docker container:

    script/lint
