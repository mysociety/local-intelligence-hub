import os
import subprocess
from unittest import skipIf

from django.contrib.gis.geos import Point
from django.test import TestCase

from utils.postcodesIO import get_postcode_geo
from utils.postgis_geocoder import _get_bulk_postcode_geo_from_coords

ignore_geocoding_tests = os.getenv("RUN_GEOCODING_TESTS") != "1"


@skipIf(ignore_geocoding_tests, "It messes up data for other tests.")
class TestAreaCodeGeocoding(TestCase):
    @classmethod
    def setUpTestData(cls):
        subprocess.call("bin/import_areas_into_test_db.sh")

    def test_get_bulk_postcode_geo_from_coords(self):
        coordinates = [
            Point(x=-0.1, y=51.5),
            Point(x=-4.244741, y=55.858026),
        ]
        results = _get_bulk_postcode_geo_from_coords(coordinates)

        self.assertEqual(results[0].latitude, 51.5)
        self.assertEqual(results[0].longitude, -0.1)

        self.assertEqual(results[0].admin_district, "Southwark Borough Council")
        self.assertEqual(results[0].codes.admin_district, "E09000028")

        self.assertEqual(results[0].admin_ward, "Borough & Bankside")
        self.assertEqual(results[0].codes.admin_ward, "E05011095")

        self.assertEqual(
            results[0].parliamentary_constituency, "Bermondsey and Old Southwark"
        )
        self.assertEqual(results[0].codes.parliamentary_constituency, "E14001085")

        self.assertEqual(
            results[0].parliamentary_constituency_2024, "Bermondsey and Old Southwark"
        )
        self.assertEqual(results[0].codes.parliamentary_constituency_2024, "E14001085")

        self.assertEqual(results[0].european_electoral_region, "London")
        self.assertEqual(results[0].codes.european_electoral_region, "E15000007")

        self.assertEqual(results[1].latitude, 55.858026)
        self.assertEqual(results[1].longitude, -4.244741)

        self.assertEqual(results[1].admin_district, "Glasgow City Council")
        self.assertEqual(results[1].codes.admin_district, "S12000049")

        self.assertEqual(results[1].admin_ward, "Anderston/City/Yorkhill")
        self.assertEqual(results[1].codes.admin_ward, "S13002976")

        self.assertEqual(results[1].parliamentary_constituency, "Glasgow East")
        self.assertEqual(results[1].codes.parliamentary_constituency, "S14000084")

        self.assertEqual(results[1].parliamentary_constituency_2024, "Glasgow East")
        self.assertEqual(results[1].codes.parliamentary_constituency_2024, "S14000084")

        self.assertEqual(results[1].european_electoral_region, "Scotland")
        self.assertEqual(results[1].codes.european_electoral_region, "S15000001")

    async def test_enrich_postcodes_io_result(self):
        result = await get_postcode_geo("EC1A 1BB")
        # Make sure the base result is correct
        self.assertEqual(result.codes.admin_ward, "E05013702")
        # Ensure output areas are added
        # self.assertEqual(result.codes.output_area, "E00013578")
