import httpx

def address_to_geojson(query: str):
    response = httpx.get("https://nominatim.openstreetmap.org/search", 
                         params={
                            "format": "geocodejson",
                            "limit": 1,
                            "street": query,
                            "extratags": 1,
                            "namedetails": 1,
                            "addressdetails": 1
                        })
    if response.status_code != httpx.codes.OK:
        return None
    data = response.json()
    if data["features"] and len(data["features"]) > 0:
        return data["features"][0]
    return None