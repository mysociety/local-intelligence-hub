from datetime import datetime, timezone

from django.test import TestCase

from hub.models import LocalJSONSource
from hub.validation import validate_and_format_phone_number


class TestSourceParser(TestCase):
    async def test_date_field(self):
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

        source = await LocalJSONSource.objects.acreate(
            name="date_test",
            id_field="id",
            start_time_field="date",
            data=[
                {
                    "id": d["id"],
                    "date": d["date"],
                }
                for d in fixture
            ],
        )

        # generate GenericData records
        await source.import_many(source.data)

        # test that the GenericData records have valid dates
        data = source.get_import_data()

        for e in fixture:
            d = await data.aget(data=e["id"])
            self.assertEqual(d.start_time, e["expected"])


class TestPhoneField(TestCase):
    async def test_phone_field(self):
        fixture = [
            {"id": "bad1", "phone": "123456789", "expected": None},
            {"id": "good1", "phone": "07123456789", "expected": "+447123456789"},
            {"id": "good2", "phone": "+447123456789", "expected": "+447123456789"},
        ]

        source = await LocalJSONSource.objects.acreate(
            name="phone_test",
            id_field="id",
            phone_field="phone",
            countries=["GB"],
            data=[
                {
                    "id": e["id"],
                    "phone": e["phone"],
                }
                for e in fixture
            ],
        )

        # generate GenericData records
        await source.import_many(source.data)

        # test that the GenericData records have valid, formatted phone field
        data = source.get_import_data()

        for e in fixture:
            d = await data.aget(data=e["id"])
            self.assertEqual(d.phone, e["expected"])
            self.assertEqual(d.json["phone"], e["phone"])

    def test_valid_phone_number_for_usa(self):
        phone = "4155552671"
        result = validate_and_format_phone_number(phone, ["US"])
        self.assertEqual(result, "+14155552671")
