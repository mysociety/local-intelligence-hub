import json
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
            GeocodingQuery(query="The Drive Methodist Church, Sevenoaks TV13 3AF, Sevenoaks, Kent, TN13 3AF"),
            GeocodingQuery(query="Didcot Civic Hall, Britwell Road, Didcot, Oxfordshire, OX11 7JN"),
            GeocodingQuery(query="Lostwithiel Community Centre, Pleyber Christ Way Lostwithiel, PL22 0HA"),
            GeocodingQuery(query="Chacewater Village Hall"),
            GeocodingQuery(query="Maltings Arts Theatre, St Albans"),
            GeocodingQuery(query="Eyam Parish Church"),
            GeocodingQuery(query="Moravian Church, Priory Road, N8 7HD"),
        ]
        results = batch_address_to_geojson(queries)
        self.assertEqual(len(results), 10)
        self.assertEqual(results[0].features[0].geometry.type, "Point")
        self.assertEqual(results[5].features[0].geometry.type, "Point")