from django.test import TestCase
from utils.mapbox import GeocodingQuery, batch_address_to_geojson
from utils.postcodesIO import get_bulk_postcode_geo


class TestGeocoding(TestCase):
    async def test_bulk_geocoding_postcodes(self):
        queries = [
            "G1 1AB",
            "G1 1AD"
        ]
            
        results = await get_bulk_postcode_geo(queries)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].postcode, "G1 1AB")

    def test_bulk_geocoding_addresses(self):
        queries = [
            GeocodingQuery(query="Pelican House, 144 Cambridge Heath Road, London"),
            GeocodingQuery(query="Chiapas", country="MX"),
            GeocodingQuery(query="Rojava", country="SY"),
        ]
        results = batch_address_to_geojson(queries)
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0].features[0].geometry.type, "Point")