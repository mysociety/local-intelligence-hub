from django.conf import settings

import httpx
from benedict import benedict

from utils.cached_fn import async_cached_fn


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
        json = sanitise_string_values(json)
        return benedict(json)

def sanitise_string_values(value):
    # replace \n with ", " in all values of dict
    if isinstance(value, dict):
        sanitised_dict = value.copy()
        for key, value in sanitised_dict.items():
            sanitised_dict[key] = sanitise_string_values(value)
        return sanitised_dict
    elif isinstance(value, str):
        return value.replace("\n", ", ")
    elif isinstance(value, list):
        return [sanitise_string_values(v) for v in value]
    else:
        return value