from utils.findthatpostcode import get_example_postcode_from_area_gss
from utils.postcodesIO import get_postcode_geo


async def get_postcode_data_for_gss(gss: str):
    postcode = await get_example_postcode_from_area_gss(gss)
    postcode_data = await get_postcode_geo(postcode)
    return postcode_data
