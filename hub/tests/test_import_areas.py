from django.test import TestCase
from django.core.management import call_command

from unittest.mock import patch
from hub.models import Area


class ImportAreasTestCase(TestCase):
    @patch("utils.mapit.session")
    def test_import(self, mapit_session):
        mapit_session.get.return_value.json.return_value = {
            "1": {
                "id": 1,
                "codes": {"gss": "E10000001", "unit_id": "1"},
                "name": "South Borsetshire",
                "country": "E",
                "type": "WMC",
            },
            "4": {
                "id": 4,
                "codes": {"gss": "E10000004", "unit_id": "4"},
                "name": "North Borsetshire",
                "country": "E",
                "type": "WMC",
            },
        }
        call_command("import_areas")

        areas = Area.objects.all()
        self.assertEqual(areas.count(), 2)

        first = areas[0]
        self.assertEqual(first.name, "South Borsetshire")
        self.assertEqual(first.mapit_id, "1")
        self.assertEqual(first.gss, "E10000001")
