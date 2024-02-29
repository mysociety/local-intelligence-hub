from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from hub.models import Area
from utils.mapit import MapIt


class ImportAreasTestCase(TestCase):
    quiet_parameter: bool = False

    @mock.patch.object(MapIt, "areas_of_type")
    @mock.patch.object(MapIt, "area_geometry")
    def test_import(self, mapit_geom, mapit_areas):
        mapit_geom.return_value = {
            "type": "Polygon",
            "coordinates": [[1, 2], [2, 1]],
        }
        mapit_areas.return_value = [
            {
                "id": 1,
                "codes": {"gss": "E10000001", "unit_id": "1"},
                "name": "South Borsetshire",
                "country": "E",
                "type": "WMC",
            },
            {
                "id": 4,
                "codes": {"gss": "E10000004", "unit_id": "4"},
                "name": "North Borsetshire",
                "country": "E",
                "type": "WMC",
            },
        ]
        call_command("import_areas", quiet=self.quiet_parameter)

        areas = Area.objects.all()
        self.assertEqual(areas.count(), 2)

        first = areas[0]
        self.assertEqual(first.name, "South Borsetshire")
        self.assertEqual(first.mapit_id, "1")
        self.assertEqual(first.gss, "E10000001")
        self.assertEqual(
            first.geometry,
            '{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[1, 2], [2, 1]]}, "properties": {"PCON13CD": "E10000001", "name": "South Borsetshire", "type": "WMC"}}',
        )


class ImportAreasTestCaseQuietFlag(ImportAreasTestCase):
    """
    Do the Import Areas check, but with the quiet flag on
    """

    quiet_parameter: bool = True
