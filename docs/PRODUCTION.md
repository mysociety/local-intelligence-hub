# Production Actions Reference

## Importing Areas in Production

Run this Render job:

```bash
curl --request POST 'https://api.render.com/v1/services/srv-.../jobs' \
    --header 'Authorization: Bearer API_KEY' \
    --header 'Content-Type: application/json' \
    --data-raw '{
        "startCommand": "python manage.py import_areas -a"
    }'
```

Ensuring that the `srv-...` portion matches the production server ID,
and the `Authorization` header contains your Render API Key.
