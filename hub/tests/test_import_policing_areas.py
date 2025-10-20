import json
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from hub.models import Area, AreaOverlap, AreaType

# Mock CSV data from ONS
MOCK_ONS_CSV = """LAD23CD,LAD23NM,CSP23CD,CSP23NM,PFA23CD,PFA23NM,ObjectId
E06000001,Hartlepool,E22000027,Hartlepool,E23000013,Cleveland,1
E06000002,Middlesbrough,E22000029,Middlesbrough,E23000013,Cleveland,2
E06000047,Durham,E22000001,Durham,E23000008,Durham,3"""


def mock_ons_csv_response(*args, **kwargs):
    """Mock the requests.get call to return our test CSV"""
    response = mock.Mock()
    response.content = MOCK_ONS_CSV.encode("utf-8")
    response.raise_for_status = mock.Mock()
    return response


class ImportPolicingAreasTestCase(TestCase):
    quiet_parameter: bool = False

    def setUp(self):
        # Create test area types
        self.stc_type = AreaType.objects.create(
            code="STC",
            area_type="Single Tier Council",
            name_singular="Single Tier Council",
            name_plural="Single Tier Councils",
            short_name_singular="council",
            short_name_plural="councils",
            description="This includes Unitary Authorities, London Boroughs, and County Councils in England, as well as all councils in Scotland, Wales, and Nothern Ireland.",
        )
        self.dis_type = AreaType.objects.create(
            code="DIS",
            area_type="District Council",
            name_singular="District Council",
            name_plural="District Councils",
            short_name_singular="council",
            short_name_plural="councils",
            description="In “two tier” council areas, District Councils look after local services like rubbish collection, recycling, housing, and planning applications, while a County Council looks after everything else.",
        )

        # Create test local authorities for England
        self.hartlepool = Area.objects.create(
            name="Hartlepool",
            gss="E06000001",
            mapit_id="1",
            area_type=self.stc_type,
            geometry=json.dumps(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
                    },
                }
            ),
        )

        self.middlesbrough = Area.objects.create(
            name="Middlesbrough",
            gss="E06000002",
            mapit_id="2",
            area_type=self.stc_type,
            geometry=json.dumps(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
                    },
                }
            ),
        )

        self.durham = Area.objects.create(
            name="Durham",
            gss="E06000047",
            mapit_id="3",
            area_type=self.stc_type,
            geometry=json.dumps(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]]],
                    },
                }
            ),
        )

        # Create test local authorities for Scotland
        self.glasgow = Area.objects.create(
            name="Glasgow City",
            gss="S12000049",
            mapit_id="4",
            area_type=self.stc_type,
            geometry=json.dumps(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[3, 0], [4, 0], [4, 1], [3, 1], [3, 0]]],
                    },
                }
            ),
        )

        self.edinburgh = Area.objects.create(
            name="City of Edinburgh",
            gss="S12000036",
            mapit_id="5",
            area_type=self.stc_type,
            geometry=json.dumps(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[4, 0], [5, 0], [5, 1], [4, 1], [4, 0]]],
                    },
                }
            ),
        )

        # Create test local authority for Northern Ireland
        self.belfast = Area.objects.create(
            name="Belfast",
            gss="N09000003",
            mapit_id="6",
            area_type=self.stc_type,
            geometry=json.dumps(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[5, 0], [6, 0], [6, 1], [5, 1], [5, 0]]],
                    },
                }
            ),
        )

    @mock.patch("requests.get", side_effect=mock_ons_csv_response)
    def test_import_policing_areas(self, mock_get):
        call_command("import_policing_areas", quiet=self.quiet_parameter)

        # Check that PFA area type was created
        pfa_type = AreaType.objects.get(code="PFA")
        self.assertEqual(pfa_type.area_type, "policing_area")

        # Check that policing areas were created
        policing_areas = Area.objects.filter(area_type=pfa_type)
        self.assertEqual(policing_areas.count(), 4)  # Cleveland, Durham, Scotland, NI

        # Check Cleveland (combines Hartlepool and Middlesbrough)
        cleveland = Area.objects.get(gss="E23000013", area_type=pfa_type)
        self.assertEqual(cleveland.name, "Cleveland")
        self.assertIsNone(cleveland.mapit_id)
        self.assertIsNotNone(cleveland.geometry)

        # Check Durham
        durham_pfa = Area.objects.get(gss="E23000008", area_type=pfa_type)
        self.assertEqual(durham_pfa.name, "Durham")

        # Check Scotland
        scotland = Area.objects.get(gss="S92000003", area_type=pfa_type)
        self.assertEqual(scotland.name, "Scotland")
        self.assertIsNone(scotland.mapit_id)

        # Check Northern Ireland
        ni = Area.objects.get(gss="N92000002", area_type=pfa_type)
        self.assertEqual(ni.name, "Northern Ireland")
        self.assertIsNone(ni.mapit_id)

        # Check AreaOverlap relationships were created
        # Hartlepool -> Cleveland
        overlap = AreaOverlap.objects.get(area_from=self.hartlepool, area_to=cleveland)
        self.assertEqual(overlap.population_overlap, 100)
        self.assertEqual(overlap.area_overlap, 100)

        # Middlesbrough -> Cleveland
        overlap = AreaOverlap.objects.get(
            area_from=self.middlesbrough, area_to=cleveland
        )
        self.assertEqual(overlap.population_overlap, 100)

        # Glasgow -> Scotland
        overlap = AreaOverlap.objects.get(area_from=self.glasgow, area_to=scotland)
        self.assertEqual(overlap.population_overlap, 100)

        # Edinburgh -> Scotland
        overlap = AreaOverlap.objects.get(area_from=self.edinburgh, area_to=scotland)
        self.assertEqual(overlap.population_overlap, 100)

        # Belfast -> Northern Ireland
        overlap = AreaOverlap.objects.get(area_from=self.belfast, area_to=ni)
        self.assertEqual(overlap.population_overlap, 100)

        # Total overlaps should be 5 (2 for Cleveland, 1 for Durham, 2 for Scotland, 1 for NI)
        self.assertEqual(AreaOverlap.objects.count(), 6)


class ImportPolicingAreasTestCaseQuietFlag(ImportPolicingAreasTestCase):
    """
    Do the Import Policing Areas check, but with the quiet flag on
    """

    quiet_parameter: bool = True
