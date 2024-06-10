import json
from django.test import TestCase
from utils.mapbox import GeocodingQuery, batch_address_to_geojson as batch_address_to_geojson_mapbox
from utils.google_maps import GeocodingQuery, batch_address_to_geojson as batch_address_to_geojson_google
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

    def test_bulk_geocoding_addresses_mapbox(self):
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
        results = batch_address_to_geojson_mapbox(queries)
        self.assertEqual(len(results), 9)
        self.assertEqual(results[0].features[0].geometry.type, "Point")
        self.assertEqual(results[5].features[0].geometry.type, "Point")

    def test_bulk_geocoding_addresses_google(self):
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
        results = batch_address_to_geojson_google(queries)
        print(json.dumps(results, indent=2))
        self.assertEqual(len(results), 9)
        self.assertEqual(results[0].results[0].geometry, "Point")
        self.assertEqual(results[5].results[0].geometry, "Point")