import json
from django.test import TestCase
from utils.mapbox import GeocodingQuery, batch_address_to_geojson as batch_address_to_geojson_mapbox
from utils.google_maps import GeocodingQuery, batch_geocode_address as batch_address_to_geojson_google
from utils.postcodesIO import get_bulk_postcode_geo, get_bulk_postcode_geo_from_coords
from django.contrib.gis.geos import Point


class TestGeocoding(TestCase):
    async def test_bulk_geocoding_postcodes(self):
        queries = [
            "G1 1AB",
            "G1 1AD"
        ]
            
        results = await get_bulk_postcode_geo(queries)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].postcode, "G1 1AB")

    async def test_get_bulk_postcode_geo_from_coords(self):
        queries = [
            Point(-0.127758, 51.507351),
            Point(-2.2426, 53.4808),
        ]
        results = await get_bulk_postcode_geo_from_coords(queries)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].postcode, "WC2N 5DU")

    def test_bulk_geocoding_addresses_mapbox(self):
        queries = [
            GeocodingQuery(query="Pelican House, 144 Cambridge Heath Road, London"),
            GeocodingQuery(query="Chiapas", country="MX"),
            GeocodingQuery(query="Moravian Church, Priory Road, N8 7HD"),
        ]
        results = batch_address_to_geojson_mapbox(queries)
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0].features[0].geometry.type, "Point")

    def test_bulk_geocoding_addresses_google(self):
        queries = [
            GeocodingQuery(query="Pelican House, 144 Cambridge Heath Road, London"),
            GeocodingQuery(query="Chiapas", country="MX"),
            GeocodingQuery(query="Moravian Church, Priory Road, N8 7HD"),
        ]
        results = batch_address_to_geojson_google(queries)
        self.assertEqual(len(results), 3)
        self.assertIsInstance(results[0].geometry.location.lat, float)