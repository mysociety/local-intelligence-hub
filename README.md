# Local Intelligence Hub

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/mysociety/local-intelligence-hub?devcontainer_path=.devcontainer%2Fauto-quick-setup%2Fdevcontainer.json)

An online tool that helps public affairs and community organising teams to collaborate and coordinate action at the national and local level, using data on elected representatives, local populations, public opinion, and more.

The [original static prototype](https://github.com/mysociety/local-intelligence-hub/commit/4fab6ff08401d4e4c29615ab07ff4f6c4f4e6050) for the Hub was built as part of mySociety’s August 2022 prototyping week exploring how The Climate Coalition might we give climate campaign organisations and communities better access to the data they need to enable local and national action on climate.

The first version of the Local Intelligence Hub launched as a collaboration between mySociety, The Climate Coalition, and Green Alliance, in early 2024.

A second version of the Hub (containing data on violence against women and girls rather than climate or nature) was developed in collaboration with the End Violence Against Women coalition, in late 2025.

## Development install

You will need [Docker](https://docs.docker.com/desktop/) installed.

Clone the repository:

    git clone git@github.com:mysociety/local-intelligence-hub.git
    cd local-intelligence-hub

Then create an `.env` file, using the example:

    cp .env-example .env

Edit the `.env` file making sure to:

- Pick a new `SECRET_KEY`.
- Set `ALLOWED_HOSTS` to a comma-separated list of all domains your local version of the site will serve – eg: `ALLOWED_HOSTS=lih.127.0.0.1.nip.io,evaw.127.0.0.1.nip.io` for two separate “cobrands” of the site.
- Set a `MAPIT_API_KEY` (you can get one from https://mapit.mysociety.org/account/signup/).

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

## Multi Site setup

This uses [Django’s “sites” framework](https://docs.djangoproject.com/en/5.2/ref/contrib/sites/) to enable sharing the same data between multiple, differently branded front ends. You will need to add one “site” in the Django admin, for each front end you require.

As explained above, whether you want to host one site or many, you will need to explicitly define each domain in a comma-separated list in the `ALLOWED_HOSTS` variable in your `.env` file. Some examples:

```
ALLOWED_HOSTS=localhost
ALLOWED_HOSTS=site1.127.0.0.1.nip.io
ALLOWED_HOSTS=site1.127.0.0.1.nip.io,site2.127.0.0.1.nip.io
```

If you’re upgrading from a version of the codebase before the Multi Site behaviour was added, after starting your site, you can run the `add_everything_to_site` management command to associate all existing users, datasets, and more with a given site by name, eg:

```
script/manage add_everything_to_site --site default
```

Further sites can be added via the Django admin.

All the views will default to looking for templates in `hub/templates/$site_name/` first and then `hub/templates/`. To replicate this behaviour in a template include you will need to `{% load 'siteinclude' %}` at the top of the template, and then use the `{% site_include %}` tag.
