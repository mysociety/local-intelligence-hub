import json
import subprocess
from datetime import datetime, timezone

from django.test import TestCase

from asgiref.sync import async_to_sync

from hub.models import Area, LocalJSONSource
from hub.validation import validate_and_format_phone_number
from utils import mapit_types


class TestDateFieldParer(TestCase):
    fixture = [
        {
            "id": "1",
            "date": "01/06/2024, 09:30",
            "expected": datetime(2024, 6, 1, 9, 30, tzinfo=timezone.utc),
        },
        {
            "id": "2",
            "date": "15/06/2024, 09:30",
            "expected": datetime(2024, 6, 15, 9, 30, tzinfo=timezone.utc),
        },
        {
            "id": "3",
            "date": "15/06/2024, 09:30:00",
            "expected": datetime(2024, 6, 15, 9, 30, 0, tzinfo=timezone.utc),
        },
        {
            "id": "4",
            "date": "2023-12-20 06:00:00",
            "expected": datetime(2023, 12, 20, 6, 0, 0, tzinfo=timezone.utc),
        },
    ]

    @classmethod
    def setUpTestData(cls):
        cls.source = LocalJSONSource.objects.create(
            name="date_test",
            id_field="id",
            start_time_field="date",
            data=[
                {
                    "id": d["id"],
                    "date": d["date"],
                }
                for d in cls.fixture
            ],
        )

        # generate GenericData records
        async_to_sync(cls.source.import_many)(cls.source.data)

        # test that the GenericData records have valid dates
        cls.data = cls.source.get_import_data()

    def test_date_field(self):
        for e in self.fixture:
            d = self.data.get(data=e["id"])
            self.assertEqual(d.start_time, e["expected"])


class TestPhoneFieldParser(TestCase):
    fixture = [
        {"id": "bad1", "phone": "123456789", "expected": None},
        {"id": "good1", "phone": "07123456789", "expected": "+447123456789"},
        {"id": "good2", "phone": "+447123456789", "expected": "+447123456789"},
    ]

    @classmethod
    def setUpTestData(cls):
        cls.source = LocalJSONSource.objects.create(
            name="phone_test",
            id_field="id",
            phone_field="phone",
            countries=["GB"],
            data=[
                {
                    "id": e["id"],
                    "phone": e["phone"],
                }
                for e in cls.fixture
            ],
        )

        # generate GenericData records
        async_to_sync(cls.source.import_many)(cls.source.data)

        # test that the GenericData records have valid, formatted phone field
        cls.data = cls.source.get_import_data()

    def test_phone_field(self):
        for e in self.fixture:
            d = self.data.get(data=e["id"])
            self.assertEqual(d.phone, e["expected"])
            self.assertEqual(d.json["phone"], e["phone"])

    def test_valid_phone_number_for_usa(self):
        phone = "4155552671"
        result = validate_and_format_phone_number(phone, ["US"])
        self.assertEqual(result, "+14155552671")


class TestMultiLevelGeocoding(TestCase):
    fixture = geocoding_cases

    @classmethod
    def setUpTestData(cls):
        subprocess.call("bin/import_areas_seed.sh")

        for d in cls.fixture:
            if d["expected_area_gss"] is not None:
                area = Area.objects.filter(gss=d["expected_area_gss"]).first()
                if area is None:
                    print(f"Area not found, skipping: {d['expected_area_gss']}")
                    # remove the area from the test data so tests can run
                    index_of_data = next(
                        i for i, item in enumerate(cls.fixture) if item["id"] == d["id"]
                    )
                    cls.fixture.pop(index_of_data)

        cls.source = LocalJSONSource.objects.create(
            name="geo_test",
            id_field="id",
            data=cls.fixture.copy(),
            geocoding_config=[
                {"field": "council", "lih_area_type__code": ["STC", "DIS"]},
                {"field": "ward", "lih_area_type__code": "WD23"},
            ],
        )

        # generate GenericData records
        async_to_sync(cls.source.import_many)(cls.source.data)

        # test that the GenericData records have valid, formatted phone field
        cls.data = cls.source.get_import_data()

    def test_geocoding_test_rig_is_valid(self):
        self.assertGreaterEqual(Area.objects.count(), 9000)
        self.assertGreaterEqual(
            Area.objects.filter(polygon__isnull=False).count(), 9000
        )
        self.assertGreaterEqual(Area.objects.filter(area_type__code="DIS").count(), 164)
        self.assertGreaterEqual(Area.objects.filter(area_type__code="STC").count(), 218)
        self.assertGreaterEqual(
            Area.objects.filter(area_type__code="WD23").count(), 8000
        )
        for d in self.data:
            try:
                if d.json["expected_area_gss"] is not None:
                    area = Area.objects.get(gss=d.json["expected_area_gss"])
                    self.assertIsNotNone(area)
            except Area.DoesNotExist:
                pass

    def test_geocoding_matches(self):
        success_count = 0
        for d in self.data:
            try:
                try:
                    if d.json["ward"] is None:
                        self.assertIsNone(d.postcode_data, "None shouldn't geocode.")
                        continue
                    elif d.json["expected_area_gss"] is None:
                        self.assertIsNone(
                            d.postcode_data, "Expect MapIt to have failed."
                        )
                        continue
                    elif d.json["expected_area_gss"] is not None:
                        self.assertEqual(
                            d.geocode_data["data"]["area_fields"][
                                d.json["expected_area_type_code"]
                            ],
                            d.json["expected_area_gss"],
                        )
                except KeyError:
                    raise AssertionError("Expected geocoding data was missing.")
                self.assertIsNotNone(d.postcode_data)
                success_count += 1
                print("Geocoding success rate:", success_count / len(self.data))
            except AssertionError as e:
                print(e)
                print("Geocoding failed:", d.id, json.dumps(d.json, indent=4))
                print("--Geocode data:", d.id, json.dumps(d.geocode_data, indent=4))
                print("--Postcode data:", d.id, json.dumps(d.postcode_data, indent=4))
                raise

    def test_by_mapit_types(self):
        """
        Geocoding should work identically on more granular mapit_types
        """

        self.source.geocoding_config = [
            {
                "field": "council",
                "mapit_type": mapit_types.MAPIT_COUNCIL_TYPES,
            },
            {"field": "ward", "mapit_type": mapit_types.MAPIT_WARD_TYPES},
        ]
        self.source.save()

        # re-generate GenericData records
        async_to_sync(self.source.import_many)(self.source.data)

        # test that the GenericData records have valid, formatted phone field
        self.data = self.source.get_import_data()

        success_count = 0
        for d in self.data:
            try:
                try:
                    if d.json["ward"] is None:
                        self.assertIsNone(d.postcode_data, "None shouldn't geocode.")
                        continue
                    elif d.json["expected_area_gss"] is None:
                        self.assertIsNone(
                            d.postcode_data, "Expect MapIt to have failed."
                        )
                        continue
                    elif d.json["expected_area_gss"] is not None:
                        self.assertEqual(
                            d.geocode_data["data"]["area_fields"][
                                d.json["expected_area_type_code"]
                            ],
                            d.json["expected_area_gss"],
                        )
                except KeyError:
                    raise AssertionError("Expected geocoding data was missing.")
                self.assertIsNotNone(d.postcode_data)
                success_count += 1
                print("Geocoding success rate:", success_count / len(self.data))
            except AssertionError as e:
                print(e)
                print("Geocoding failed:", d.id, json.dumps(d.json, indent=4))
                print("--Geocode data:", d.id, json.dumps(d.geocode_data, indent=4))
                print("--Postcode data:", d.id, json.dumps(d.postcode_data, indent=4))
                raise


geocoding_cases = [
    # Name matching; cases that historically didn't work
    {
        "id": "1",
        "council": "Barnsley",
        "ward": "St Helens",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05000993",
    },
    {
        "id": "2",
        "council": "North Lincolnshire",
        "ward": "Brigg & Wolds",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05015081",
    },
    {
        "id": "3",
        "council": "Test Valley",
        "ward": "Andover Downlands",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05012085",
    },
    {
        "id": "4",
        "council": "North Warwickshire",
        "ward": "Baddesley and Grendon",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05007461",
    },
    # Name rewriting required
    {
        "id": "5",
        "council": "Herefordshire, County of",
        "ward": "Credenhill",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05012957",
    },
    # GSS code matching
    {
        "id": "999",
        "council": "E08000016",
        "ward": "E05000993",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05000993",
    },
    # Misc
    # Gwynedd		Brithdir and Llanfachreth, Ganllwyd, Llanelltyd
    # is Brithdir and Llanfachreth/Ganllwyd/Llanelltyd in MapIt
    # https://mapit.mysociety.org/area/165898.html
    {
        "id": "6",
        "council": "Gwynedd",
        "ward": "Brithdir and Llanfachreth, Ganllwyd, Llanelltyd",
        "expected_area_type_code": "WD23",  # TODO: actually it's a UTE, which
        "expected_area_gss": "W05001514",
    },
    # Isle of Anglesey		Canolbarth Mon
    # https://mapit.mysociety.org/area/144265.html
    {
        "id": "7",
        "council": "Isle of Anglesey",
        "ward": "Canolbarth Mon",
        "expected_area_type_code": "WD23",  # TODO: actually a UTE
        "expected_area_gss": "W05001496",
    },
    # Denbighshire		Rhyl T┼À Newydd
    # Weird character in the name, probably needs trigram matching or something
    # https://mapit.mysociety.org/area/166232.html
    {
        "id": "8",
        "council": "Denbighshire",
        "ward": "Rhyl T┼À Newydd",
        "expected_area_type_code": "WD23",  # TODO: actually a UTE
        "expected_area_gss": "W05001354",
    },
    # Swansea		B├┤n-y-maen
    # Similarly, weird stuff in name
    # Maybe it's a problem with the encoding?
    # https://mapit.mysociety.org/area/165830.html  — Bon-y-maen
    {
        "id": "9",
        "council": "Swansea",
        "ward": "B├┤n-y-maen",
        "expected_area_type_code": "WD23",  # TODO: actually a UTE
        "expected_area_gss": "W05001040",
    },
    # Gwynedd		Pendraw'r Llan
    # Ought to be Pen draw Llyn
    # https://mapit.mysociety.org/area/166296.html
    {
        "id": "10",
        "council": "Gwynedd",
        "ward": "Pendraw'r Llan",
        "expected_area_type_code": "WD23",  # TODO: actually a UTE
        "expected_area_gss": "W05001556",
    },
    # Gwynedd		Tre-garth a Mynydd Llandyg├íi
    # https://mapit.mysociety.org/area/12219.html
    # Tregarth & Mynydd Llandygai
    {
        "id": "542",
        "council": "Gwynedd",
        "ward": "Tre-garth a Mynydd Llandyg├íi",
        "expected_area_type_code": "WD23",  # TODO: actually a UTE
        "expected_area_gss": "W05001563",
    },
    # A bunch of wards with the same name, should all point to different things
    {
        "id": "11",
        "council": "Sandwell",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05001260",
    },
    {
        "id": "12",
        "council": "Nuneaton and Bedworth",  # E07000219
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": None,  # "E05007474", # Another one not in MapIt!
    },
    {
        "id": "13",
        "council": "Redditch",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": None,  # "E05007868",
        # TODO: this one is not findable in MapIt! https://findthatpostcode.uk/areas/E05007868.html
        # Sometimes they really just don't exist... https://mapit.mysociety.org/area/E05007868.html
    },
    {
        "id": "14",
        "council": "Shropshire",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05008136",
        # TODO: https://findthatpostcode.uk/areas/E05008136.html
    },
    {
        "id": "15",
        "council": "Swale",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05009544",
    },
    {
        "id": "16",
        "council": "Leicester",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05010458",
    },
    {
        "id": "17",
        "council": "Cotswold",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05010696",
    },
    {
        "id": "18",
        "council": "Lincoln",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05010784",
    },
    {
        "id": "19",
        "council": "Cambridge",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05013050",
    },
    {
        "id": "20",
        "council": "Buckinghamshire",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05013120",  # old "E05002674",
    },
    {
        "id": "21",
        "council": "Merton",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05013810",
    },
    {
        "id": "22",
        "council": "Reading",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05013864",
        # https://findthatpostcode.uk/areas/E05013864.html
    },
    {
        "id": "23",
        "council": "Barking and Dagenham",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05014053",
    },
    {
        "id": "24",
        "council": "Rushcliffe",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05014965",  # old"E05009708",
    },
    {
        "id": "25",
        "council": "Derby",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05015507",
    },
    {
        "id": "26",
        "council": "Dumfries and Galloway",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "S13002884",  # old:"S13002537",
    },
    # Nones
    {
        "id": "27",
        "council": None,
        "ward": None,
        "expected_area_type_code": None,
        "expected_area_gss": None,
    },
    #
    # More geocoding fails
    {
        "id": "28",
        "council": "Wychavon",
        "ward": "Bretforton & Offenham",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05015444",
    },
    # East HertfordshireBuntingford
    {
        "id": "29",
        "council": "East Hertfordshire",
        "ward": "Buntingford",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05015362",
    },
    # Neath Port TalbotCadoxton
    {
        "id": "30",
        "council": "Neath Port Talbot",
        "ward": "Cadoxton",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "W05001689",
    },
    # Great YarmouthCentral and Northgate
    {
        "id": "31",
        "council": "Great Yarmouth",
        "ward": "Central and Northgate",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05005788",
    },
    # CarmarthenshirePontyberem
    {
        "id": "32",
        "council": "Carmarthenshire",
        "ward": "Pontyberem",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "W05001219",
    },
]