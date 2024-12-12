from datetime import datetime, timezone

from django.test import TestCase

from utils.py import parse_datetime

from hub.validation import validate_and_format_phone_number


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
    def test_invalid_phone_number(self):
        phone = "123456789"
        result = validate_and_format_phone_number(phone, "GB")
        self.assertIsNone(result)

    def test_valid_phone_number_without_country_code(self):
        phone = "07123456789"
        result = validate_and_format_phone_number(phone, "GB")
        self.assertEqual(result, "+447123456789")

    def test_valid_phone_number_with_country_code(self):
        phone = "+447123456789"
        result = validate_and_format_phone_number(phone, ["GB"])
        self.assertEqual(result, "+447123456789")

    def test_valid_phone_number_for_usa(self):
        phone = "4155552671"
        result = validate_and_format_phone_number(phone, ["US"])
        self.assertEqual(result, "+14155552671")
