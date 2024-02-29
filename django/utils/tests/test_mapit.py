from unittest.mock import patch

from django.test import TestCase

from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
)


class TestMapitResponses(TestCase):
    @patch("utils.mapit.session")
    def test_caching(self, mapit_session):
        mapit_session.get.return_value.json.return_value = {
            "11111": {
                "id": 11111,
                "codes": {"gss": "E14000111", "unit_id": "11111"},
                "name": "Borsetshire Council",
                "country": "E",
                "type": "CTY",
            }
        }
        mapit = MapIt()
        actual = mapit.wgs84_point_to_gss_codes(-0.132814, 51.501351)
        self.assertEqual(actual, ["E14000111"])

        mapit_session.get.return_value.json.return_value = {
            "11111": {
                "id": 11111,
                "codes": {"gss": "E14000112", "unit_id": "11111"},
                "name": "Borsetshire Council",
                "country": "E",
                "type": "CTY",
            }
        }
        actual = mapit.wgs84_point_to_gss_codes(-0.132814, 51.501351)
        self.assertEqual(actual, ["E14000111"])

        mapit = MapIt(disable_cache=True)
        actual = mapit.wgs84_point_to_gss_codes(-0.132814, 51.501351)
        self.assertEqual(actual, ["E14000112"])

    @patch("utils.mapit.session")
    def test_postcode_point_to_gss_codes(self, mapit_session):
        mapit_session.get.return_value.json.return_value = {
            "areas": {
                "11111": {
                    "id": 11111,
                    "codes": {"gss": "E14000111", "unit_id": "11111"},
                    "name": "Borsetshire Council",
                    "country": "E",
                    "type": "CTY",
                }
            }
        }
        mapit = MapIt(disable_cache=True)
        actual = mapit.postcode_point_to_gss_codes("BO11AA")
        self.assertEqual(actual, ["E14000111"])

    @patch("utils.mapit.session")
    def test_wgs84_point_to_gss_codes(self, mapit_session):
        mapit_session.get.return_value.json.return_value = {
            "11111": {
                "id": 11111,
                "codes": {"gss": "E14000111", "unit_id": "11111"},
                "name": "Borsetshire Council",
                "country": "E",
                "type": "CTY",
            }
        }
        mapit = MapIt(disable_cache=True)
        actual = mapit.wgs84_point_to_gss_codes(-0.132814, 51.501351)
        self.assertEqual(actual, ["E14000111"])

    @patch("utils.mapit.session")
    def test_invalid_postcode(self, mapit_session):
        mapit_session.get.return_value.json.return_value = {
            "code": 400,
            "error": "Postcode invalid",
        }
        mapit_session.get.return_value.status_code = 400
        mapit = MapIt(disable_cache=True)
        with self.assertRaisesMessage(BadRequestException, "Postcode invalid"):
            mapit.postcode_point_to_gss_codes(
                "BO11AB"
            )  # different value to avoid cache

    @patch("utils.mapit.session")
    def test_unknown_postcode(self, mapit_session):
        mapit_session.get.return_value.json.return_value = {
            "code": 404,
            "error": "Postcode not found",
        }
        mapit_session.get.return_value.status_code = 404
        mapit = MapIt(disable_cache=True)
        with self.assertRaisesMessage(NotFoundException, "Postcode not found"):
            mapit.postcode_point_to_gss_codes(
                "BO11AC"
            )  # different value to avoid cache

    @patch("utils.mapit.session")
    def test_gss_code_to_mapit_id(self, mapit_session):
        mapit_session.get.return_value.json.return_value = {
            "id": 2650,
            "type": "UTA",
            "all_names": {"O": ["Ordnance Survey", "Aberdeen City"]},
            "name": "Aberdeen City Council",
            "country_name": "Scotland",
            "generation_high": 40,
            "generation_low": 1,
            "codes": {
                "unit_id": "30421",
                "local-authority-canonical": "ABE",
                "ons": "00QA",
                "gss": "S12000033",
            },
            "country": "S",
            "parent_area": None,
            "type_name": "Unitary Authority",
        }
        mapit = MapIt(disable_cache=True)
        actual = mapit.gss_code_to_mapit_id("S12000033")
        self.assertEqual(actual, 2650)

    @patch("utils.mapit.session")
    def test_mapit_id_to_touches(self, mapit_session):
        mapit_session.get.return_value.json.return_value = {
            "151155": {
                "name": "East Garioch",
                "id": 151155,
                "country": "S",
                "type": "UTW",
                "codes": {"unit_id": "27271", "gss": "S13002859"},
                "generation_low": 31,
                "type_name": "Unitary Authority ward (UTW)",
                "parent_area": 2648,
                "country_name": "Scotland",
                "all_names": {},
                "generation_high": 40,
            },
            "151152": {
                "name": "Mid Formartine",
                "id": 151152,
                "country": "S",
                "type": "UTW",
                "codes": {"unit_id": "43274", "gss": "S13002855"},
                "generation_low": 31,
                "type_name": "Unitary Authority ward (UTW)",
                "parent_area": 2648,
                "country_name": "Scotland",
                "all_names": {},
                "generation_high": 40,
            },
        }
        mapit = MapIt(disable_cache=True)
        actual = mapit.mapit_id_to_touches(2650)
        self.assertCountEqual(actual, ["S13002855", "S13002859"])

    @patch("utils.mapit.session")
    def test_mapit_areas_of_type(self, mapit_session):
        areas = {
            "1": {
                "id": 1,
                "codes": {"gss": "E10000001", "unit_id": "1"},
                "name": "South Borsetshire",
                "country": "E",
                "type": "WMC",
            },
            "3": {
                "id": 3,
                "codes": {"gss": "E10000003", "unit_id": "3"},
                "name": "North Borsetshire",
                "country": "E",
                "type": "WMC",
            },
        }
        mapit_session.get.return_value.json.return_value = areas
        mapit = MapIt(disable_cache=True)
        actual = mapit.areas_of_type(["WMC"])
        expected = [
            {
                "id": 1,
                "codes": {"gss": "E10000001", "unit_id": "1"},
                "name": "South Borsetshire",
                "country": "E",
                "type": "WMC",
            },
            {
                "id": 3,
                "codes": {"gss": "E10000003", "unit_id": "3"},
                "name": "North Borsetshire",
                "country": "E",
                "type": "WMC",
            },
        ]
        self.assertEqual(actual, expected)

    @patch("utils.mapit.session")
    def test_403_error(self, mapit_session):
        mapit_session.get.return_value.status_code = 403
        mapit = MapIt(disable_cache=True)
        with self.assertRaises(ForbiddenException):
            mapit.mapit_id_to_touches(2430)

    @patch("utils.mapit.session")
    def test_500_error(self, mapit_session):
        mapit_session.get.return_value.status_code = 500
        mapit = MapIt(disable_cache=True)
        with self.assertRaises(InternalServerErrorException):
            mapit.mapit_id_to_touches(2440)
