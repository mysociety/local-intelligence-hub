from django.test import TestCase
from django.conf import settings

from hub.models import AirtableSource


class TestDataSource(TestCase):
    def test_airtable_source(self):
        source = AirtableSource(
            base_id=settings.TEST_AIRTABLE_BASE_ID,
            table_id=settings.TEST_AIRTABLE_TABLE_NAME,
            api_key=settings.TEST_AIRTABLE_API_KEY,
        )

        self.assertTrue(source.healthcheck())