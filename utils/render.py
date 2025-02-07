from django.conf import settings

import httpx


def get_render_client():
    return httpx.Client(
        base_url="https://api.render.com/",
        headers=(
            {
                "Authorization": f"Bearer {settings.RENDER_API_TOKEN}",
                "Accept": "application/json",
            }
        ),
    )
