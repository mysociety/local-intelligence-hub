# Local Intelligence Hub

A Beta verion of a tool to help The Climate Coalition with better access
to data needed to enable local and national action on climate.

# Contract Countdown


The [original static prototype](https://github.com/mysociety/local-intelligence-hub/commit/4fab6ff08401d4e4c29615ab07ff4f6c4f4e6050) was built as part of mySociety’s August 2022 prototyping week exploring how The Climate Coalition might we give climate campaign organisations and communities better access to the data they need to enable local and national action on climate.

## Development install

You will need [Docker](https://docs.docker.com/desktop/) installed.

Clone the repository:

    git clone git@github.com:mysociety/local-intelligence-hub.git
    cd local-intellegence-hub

Create and edit a .env file using `.env-example` file and then
update `SECRET_KEY` and `MAPIT_API_KEY`. You can get the latter from (https://mapit.mysociety.org/account/signup/)

Start the Docker environment:

    docker-compose up

(If Python complains about missing libraries, chances are the Python requirements have changed since your Docker image was last built. You can rebuild it with, eg: `docker-compose build web`.)

Alternatively, for VScode users:

1. Install the Remote-Container extension.
2. In VScode Command pallette run `Remote-Containers: Install devcontainer CLI`
3. Then in the repo dir, run `devcontainer open`.

This will setup the docker containers and provide a BASH prompt into the containers. 

The same config files means this repo also works in codespaces.

You'll then need to run:

`script/dev-populate`

and then

`script/server`

For the dev server. 


### Data import

You will then need to update the data by running the following
management commands in the docker web container:

* `./manage.py import_areas` - this will take some time to run
* `./manage.py import_mps`

You can then view it at (http://localhost:8000/)

You can create the first Django user by entering a bash shell inside the `web` container, and then running the `createsuperuser` script through the Django shell:

    docker-compose exec web bash
    script/createsuperuser

The superuser will be created with the details specified in the `DJANGO_SUPERUSER_*` environment variables. [Read more about how Docker handles environment variables](https://docs.docker.com/compose/envvars-precedence/).
