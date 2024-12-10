# Local Intelligence Hub

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/mysociety/local-intelligence-hub?devcontainer_path=.devcontainer%2Fauto-quick-setup%2Fdevcontainer.json)

A Beta version of a tool to help The Climate Coalition with better access
to data needed to enable local and national action on climate.

The [original static prototype](https://github.com/mysociety/local-intelligence-hub/commit/4fab6ff08401d4e4c29615ab07ff4f6c4f4e6050) was built as part of mySociety’s August 2022 prototyping week exploring how The Climate Coalition might we give climate campaign organisations and communities better access to the data they need to enable local and national action on climate.
## Development install

You will need [Docker](https://docs.docker.com/desktop/) installed.

Clone the repository:

    git clone git@github.com:mysociety/local-intelligence-hub.git
    cd local-intelligence-hub

Create and edit a .env file using `.env-example` file and then
update `SECRET_KEY` and `MAPIT_API_KEY`. You can get the latter from https://mapit.mysociety.org/account/signup/

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

Finally, you will want to log in to `/admin` and make a selection of datasets “Public”, so they appear to logged-out users, on the site.

### Running the tests

First start the Docker environment:

    docker-compose up

Then run the tests from inside or outside the docker container:

    script/test

The first time you run `script/test`, it will ask whether you want the tests to run natively or inside the docker container. Type `docker` to run them inside the docker container. Your preference will be saved to `.env` for future runs.

By default, `script/test` runs all the tests. If you want to run a single TestCase, you can, eg:

    script/test hub.tests.test_import_areas.ImportAreasTestCase

### Linting and formatting code

You can run the linting and formatting suite from inside or outside the docker container:

    script/lint
