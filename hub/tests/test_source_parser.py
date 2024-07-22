from datetime import datetime, timezone

from django.test import TestCase

from utils.py import parse_datetime


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
