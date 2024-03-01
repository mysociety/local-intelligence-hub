from django.test import TestCase
from django.conf import settings

from hub.models import AirtableSource, ExternalDataSourceUpdateConfig


class TestDataSource(TestCase):
    def test_airtable_source(self):
        source = AirtableSource(
            base_id=settings.TEST_AIRTABLE_BASE_ID,
            table_id=settings.TEST_AIRTABLE_TABLE_NAME,
            api_key=settings.TEST_AIRTABLE_API_KEY,
        )

        self.assertTrue(source.healthcheck())

    def test_airtable_update_one(self):
        source = AirtableSource(
            base_id=settings.TEST_AIRTABLE_BASE_ID,
            table_id=settings.TEST_AIRTABLE_TABLE_NAME,
            api_key=settings.TEST_AIRTABLE_API_KEY,
        )

        config = ExternalDataSourceUpdateConfig(
            data_source=source,
            postcode_column="Postcode", 
            mapping={
                "constituency": {
                    "source": "postcodes.io",
                    "path": "parliamentary_constituency_2025",
                }
            }
        )
        
        record = source.table.create({ "Postcode": "EH99 1SP" })

        source.update_one(
            record['id'],
            config
        )

        record = source.fetch_one(record['id'])

        self.assertEqual(
            record['fields']['constituency'],
            "Edinburgh East and Musselburgh"
        )