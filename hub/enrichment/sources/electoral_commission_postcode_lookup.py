from django.conf import settings

import httpx
from benedict import benedict

from utils.cached_fn import async_cached_fn
from utils.py import transform_dict_values_recursive


def standardise_postcode(postcode: str):
    return postcode.replace(" ", "")


def create_key(postcode: str):
    postcode = standardise_postcode(postcode)
    return f"electoral_commission_postcode_lookup:{postcode}"


@async_cached_fn(key=create_key, timeout_seconds=60 * 60 * 24, cache_type="db")
async def electoral_commision_postcode_lookup(postcode: str):
    postcode = standardise_postcode(postcode)
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.electoralcommission.org.uk/api/v1/postcode/{postcode}/?token={settings.ELECTORAL_COMMISSION_API_KEY}"
        )
        json = response.json()
        json = transform_dict_values_recursive(
            json, lambda v: v.replace("\n", ", ") if isinstance(v, str) else v
        )
        return benedict(json)
