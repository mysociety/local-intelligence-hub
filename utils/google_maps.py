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
    
def google_geocode_cache_key(query: str | GeocodingQuery, country: str | list[str] = "GB"):
    if isinstance(query, GeocodingQuery):
        hash = hashlib.md5(query.query.encode('utf-8')).hexdigest()
        return f"google:geocode:{hash}:{query.country}"
    else:
        hash = hashlib.md5(query.encode('utf-8')).hexdigest()
        return f"google:geocode:{hash}:{country}"

def address_to_point(query: str | GeocodingQuery, country: str | list[str] = "GB"):
    cached = db_cache.get(google_geocode_cache_key(query), None)
    if cached: 
        return cached
    
    get_query_args = google_forward_geocode_payload(query, country)

    response: GoogleGeocodingResponse = gmaps.geocode(**get_query_args)
    db_cache.set(google_geocode_cache_key(query), response, None)
    if response:
        location = response.results[0].geometry.location
        return Point(x=location.lng, y=location.lat, srid=4326)

@batch_and_aggregate(100)
def batch_address_to_point(queries: list[GeocodingQuery]):
    data: list[GoogleGeocodingResponse] = []

    for index, query in enumerate(queries):
        # TODO: check db cache
        cached = db_cache.get(google_geocode_cache_key(query), None)
        if cached: 
            data.append(cached)
        else:
            new_val = address_to_point(query)
            data.append(new_val)

    return data

# Generated

@dataclass
class AddressComponent:
    longname: Optional[str] = None
    shortname: Optional[str] = None
    types: Optional[List[str]] = None


@dataclass
class Location:
    lat: Optional[float] = None
    lng: Optional[float] = None


@dataclass
class Bounds:
    northeast: Optional[Location] = None
    southwest: Optional[Location] = None


@dataclass
class Geometry:
    bounds: Optional[Bounds] = None
    location: Optional[Location] = None
    locationtype: Optional[str] = None
    viewport: Optional[Bounds] = None


@dataclass
class Result:
    addresscomponents: Optional[List[AddressComponent]] = None
    formattedaddress: Optional[str] = None
    geometry: Optional[Geometry] = None
    placeid: Optional[str] = None
    types: Optional[List[str]] = None


@dataclass
class GoogleGeocodingResponse:
    results: Optional[List[Result]] = None
    status: Optional[str] = None
