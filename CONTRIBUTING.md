
# Running the tests

In the dev container terminal, run `./bin/test.sh`

# Linting and formatting code

In the dev container terminal, run `./bin/lint.sh`

# GraphQL docs

## Inserting foreign key references via `{ set: ID! }`

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

# Useful Commands
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

# Troubleshooting
## Bitwarden
If the Bitwarden CLI isn't working for you, you can download the `.env` files manually, using BitWarden web:
- Download the ".env" attachment from the "Mapped Development .env" item in BitWarden, and place it in this folder.
- Download the "nextjs.env" attachment from the same BitWarden item, and place it in the `nextjs` folder. Rename it to `.env`.