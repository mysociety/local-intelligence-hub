from django.contrib.gis.geos import Point
from django.test import TestCase

from utils import google_maps, mapbox
from utils.google_maps import batch_geocode_address as batch_address_to_geojson_google
from utils.mapbox import batch_address_to_geojson as batch_address_to_geojson_mapbox
from utils.postcodesIO import get_bulk_postcode_geo, get_bulk_postcode_geo_from_coords


class TestGeocoding(TestCase):
    async def test_bulk_geocoding_postcodes(self):
        queries = ["G1 1AB", "G1 1AD"]

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
            mapbox.GeocodingQuery(query="Chiapas", country="MX"),
            mapbox.GeocodingQuery(query="Moravian Church, Priory Road, N8 7HD"),
            mapbox.GeocodingQuery(
                query="Pelican House, 144 Cambridge Heath Road, London"
            ),
        ]
        results = batch_address_to_geojson_mapbox(queries)
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0].features[0].geometry.type, "Point")

    def test_bulk_geocoding_addresses_google(self):
        queries = [
            google_maps.GeocodingQuery(
                query="Pelican House, 144 Cambridge Heath Road, London"
            ),
            google_maps.GeocodingQuery(query="Chiapas", country="MX"),
            google_maps.GeocodingQuery(query="Moravian Church, Priory Road, N8 7HD"),
        ]
        results = batch_address_to_geojson_google(queries)
        self.assertEqual(len(results), 3)
        self.assertIsInstance(results[0].geometry.location.lat, float)
