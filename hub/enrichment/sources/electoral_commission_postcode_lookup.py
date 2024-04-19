import httpx
from django.conf import settings
from utils.cached_fn import cached_fn

# @cached_fn(
#         key=lambda postcode: f"electoral_commission_postcode_lookup:{postcode}",
#         timeout_seconds=60 * 60 * 24,
#         cache_type="db"
# )
def electoral_commision_postcode_lookup(postcode: str):
    postcode = postcode.replace(" ", "")
    response = httpx.get(f"https://api.electoralcommission.org.uk/api/v1/postcode/{postcode}/?token={settings.ELECTORAL_COMMISSION_API_KEY}")
    json = response.json()
    print(json)
    return json