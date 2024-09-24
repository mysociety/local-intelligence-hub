from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from hub.models import Area
from utils.mapit import MapIt


def mock_areas_of_type(types, generation=None):
    if "WMC" in types and generation is None:
        return [
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

    return []


class ImportAreasTestCase(TestCase):
    quiet_parameter: bool = False

    @mock.patch.object(MapIt, "areas_of_type")
    @mock.patch.object(MapIt, "area_geometry")
    def test_import(self, mapit_geom, mapit_areas):
        mapit_geom.return_value = {
            "type": "Polygon",
            "coordinates": [[1, 2], [2, 1]],
        }
        mapit_areas.side_effect = mock_areas_of_type

        call_command("import_areas", quiet=self.quiet_parameter)

        expected_calls = [
            mock.call(["WMC"], generation=54),  # pre-2024 constituencies
            mock.call(["WMC"], generation=None),  # 2025 constituencies
            mock.call(
                ["LBO", "UTA", "COI", "LGD", "CTY", "MTD"], generation=None
            ),  # Single Tier councils
            mock.call(["DIS", "NMD"], generation=None),  # District councils
        ]
        self.assertEqual(mapit_areas.call_args_list, expected_calls)

        areas = Area.objects.all()
        self.assertEqual(areas.count(), 2)

        first = areas[0]
        self.assertEqual(first.name, "South Borsetshire")
        self.assertEqual(first.mapit_id, "1")
        self.assertEqual(first.gss, "E10000001")
        self.assertEqual(
            first.geometry,
            '{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[1, 2], [2, 1]]}, "properties": {"PCON13CD": "E10000001", "name": "South Borsetshire", "type": "WMC23"}}',
        )


class ImportAreasTestCaseQuietFlag(ImportAreasTestCase):
    """
    Do the Import Areas check, but with the quiet flag on
    """

    quiet_parameter: bool = True
