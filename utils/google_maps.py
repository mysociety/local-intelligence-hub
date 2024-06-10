from typing import Optional, List
from django.conf import settings
from benedict import benedict
import httpx
from utils.py import batch_and_aggregate, ensure_list
from dataclasses import dataclass
from django.core.cache import caches
import logging
import hashlib
import googlemaps
import country_converter as coco
from django.contrib.gis.geos import Point

logger = logging.getLogger(__name__)

db_cache = caches["db"]

gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)

# docs: https://docs.google.com/api/search/geocoding/

# for use by dataloaders which need to give a single arg
@dataclass
class GeocodingQuery:
    query: str = None
    country: str | list[str] = "GB"

def ensure_cctld(iso3166: str | list[str]):
    return ensure_list(coco.convert(names=ensure_list(iso3166), to="ccTLD"))

def google_forward_geocode_payload(query: str | GeocodingQuery, country: str | list[str] = "GB"):
    if isinstance(query, GeocodingQuery):
        return {
            "address": query.query,
            "region": ",".join(ensure_cctld(query.country)),
        }
    else:
        return {
            "address": query,
            "region": ",".join(ensure_cctld(country)),
        }
    
def google_geocode_cache_key(query: GeocodingQuery):
    hash = hashlib.md5(query.query.encode('utf-8')).hexdigest()
    return f"google:geocode:{hash}:{query.country}"

def geocode_address(query: GeocodingQuery):
    cached = db_cache.get(google_geocode_cache_key(query), None)
    if cached: 
        return cached
    
    get_query_args = google_forward_geocode_payload(query)

    response: list[GoogleGeocodingResponse] = gmaps.geocode(**get_query_args)
    db_cache.set(google_geocode_cache_key(query), response, None)
    if response and len(response) > 0:
        res: GoogleGeocodingResponse = benedict(response[0])
        return res

def batch_geocode_address(queries: list[GeocodingQuery]):
    data: list[GoogleGeocodingResponse] = []

    for index, query in enumerate(queries):
        # TODO: check db cache
        cached = db_cache.get(google_geocode_cache_key(query), None)
        if cached: 
            data.append(cached)
        else:
            new_val = geocode_address(query)
            data.append(new_val)

    return data

# Generated

@dataclass
class AddressComponent:
    long_name: Optional[str] = None
    short_name: Optional[str] = None
    types: Optional[List[str]] = None


@dataclass
class Location:
    lat: Optional[float] = None
    lng: Optional[float] = None


@dataclass
class Viewport:
    northeast: Optional[Location] = None
    southwest: Optional[Location] = None


@dataclass
class Geometry:
    location: Optional[Location] = None
    location_type: Optional[str] = None
    viewport: Optional[Viewport] = None


@dataclass
class PlusCode:
    compound_code: Optional[str] = None
    global_code: Optional[str] = None


@dataclass
class GoogleGeocodingResponse:
    address_components: Optional[List[AddressComponent]] = None
    formatted_address: Optional[str] = None
    geometry: Optional[Geometry] = None
    place_id: Optional[str] = None
    plus_code: Optional[PlusCode] = None
    types: Optional[List[str]] = None
