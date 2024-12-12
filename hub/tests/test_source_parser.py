from datetime import datetime, timezone

from django.test import TestCase
from asgiref.sync import sync_to_async

from hub.validation import validate_and_format_phone_number
from utils.py import parse_datetime
from hub.models import LocalJSONSource, GenericData


class TestSourceParser(TestCase):
    dates_that_should_work = [
        ["01/06/2024, 09:30", datetime(2024, 6, 1, 9, 30, tzinfo=timezone.utc)],
        ["15/06/2024, 09:30", datetime(2024, 6, 15, 9, 30, tzinfo=timezone.utc)],
        ["15/06/2024, 09:30:00", datetime(2024, 6, 15, 9, 30, 0, tzinfo=timezone.utc)],
        ["2023-12-20 06:00:00", datetime(2023, 12, 20, 6, 0, 0, tzinfo=timezone.utc)],
    ]

    def test_dateparse(self):
        for date in self.dates_that_should_work:
            self.assertEqual(parse_datetime(date[0]), date[1])


class TestPhoneField(TestCase):
    async def test_save_phone_field(self):
        source = await LocalJSONSource.objects.acreate(
            name="test",
            id_field="id",
            phone_field="phone",
            countries=["GB"],
            data=[
                {"id": "bad1", "phone": "123456789"},
                {"id": "good1", "phone": "07123456789"},
                {"id": "good2", "phone": "+447123456789"},
            ],
        )
        await sync_to_async(source.save)()

        # parse the raw data
        await source.import_many(source.data)

        # tests
        data = source.get_import_data()

        bad1 = await data.aget(data="bad1")
        self.assertIsNone(bad1.phone)
        self.assertEqual(bad1.json["phone"], "123456789")

        good1 = await data.aget(data="good1")
        self.assertEqual(good1.phone, "+447123456789")
        self.assertEqual(good1.json["phone"], "07123456789")

        good2 = await data.aget(data="good2")
        self.assertEqual(good2.phone, "+447123456789")
        self.assertEqual(good2.json["phone"], "+447123456789")

    def test_valid_phone_number_for_usa(self):
        phone = "4155552671"
        result = validate_and_format_phone_number(phone, ["US"])
        self.assertEqual(result, "+14155552671")
