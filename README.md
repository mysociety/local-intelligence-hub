# Local Intelligence Hub: MEEP Version

A fork of MySociety's Local Intelligence Hub to be used as a backend for Common Knowledge's MEEP.

## Developer Setup

### Requirements

1. [Docker desktop](https://www.docker.com/products/docker-desktop/)
2. [VSCode](https://code.visualstudio.com/) with the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension installed
3. (Optional) [BitWarden CLI](https://bitwarden.com/help/cli/)

### Instructions

1. Create your `.env` file. There are two methods: one using BitWarden web, and one using the BitWarden CLI.

Using BitWarden web:
- Download the ".env" attachment from the "Mapped Development .env" item in BitWarden, and place it in this folder.

With the BitWarden CLI:
- Run the following commands:

```bash
bw login
bw get attachment .env --itemid 064abbb1-e41b-4632-be90-b2270105d4d1
```

2. Open the project folder in VSCode. You will receive a notification in the bottom left to open the project in
   a Dev Container. If not, press `Cmd+Shift+P` to open the command palette, and type "reopen in container" to find
   the "Dev Containers: Reopen in Container" option.

3. Wait for the Dev Containers to set up. This will take less than 10 minutes.

4. Make sure the Python Debugger extension is installed by opening the "Extensions" panel on the left hand side and
   searching for "ms-python.debugpy".

5. In the "Run and Debug" section of the VSCode left-hand navigation, run the "Run Mapped!" configuration to start the Mapped
   application.

6. Visit http://localhost:3000 in your browser to access Mapped.

### Feature Showcase

1. Log in to the Mapped [front end](localhost:3000/login). The username and password are `admin` and `password`.
2. There are 3 available data sources: "Seed Member List", "Seed Custom Data", and "Seed Events".
3. The "Seed Member List" data source has a mapping that populates the Constituency and Element fields in the AirTable.
4. There is a map report called "Test map report" displaying constituencies and MPs.
5. The hub is available at [hub.localhost:3000](http://hub.localhost:3000).
6. The hub has some minimal content on the homepage, and a working pledge map.
7. You can edit the hub through the Mapped dashboard (i.e. [localhost:3000/hub/editor](http://localhost:3000/hub/editor)).

You can log in to the [Django](http://127.0.0.1:8000/admin) and [Wagtail](http://127.0.0.1:8000/cms) admin systems. The
username and password are `admin` and `password`.

### Running the tests

In the dev container terminal, run `./bin/test.sh`

### Linting and formatting code

In the dev container terminal, run `./bin/lint.sh`

## GraphQL docs

### Inserting foreign key references via `{ set: ID! }`

E.g. when adding a source to an org

```graphql
mutation Mutation {e
  createAirtableSource(data:{
    apiKey: "...",
    baseId:"...",
    tableId:"...",
    organisation: { set:5 }
  }) {
    id
  }
}
```

## Useful Commands
If you are pulling a branch and the back-end isn't running, you probably need to run these commands:

```bash
poetry install
```

```bash
python manage.py migrate
```

```bash
cd nextjs
npm i
```