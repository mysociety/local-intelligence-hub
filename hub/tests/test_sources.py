from datetime import datetime

from django.conf import settings
from django.test import TestCase

from asgiref.sync import sync_to_async

from hub.models import AirtableSource, Organisation


class TestAirtableSource(TestCase):
    # Test prep

    def setUp(self) -> None:
        self.records_to_delete: list[tuple[str, AirtableSource]] = []

        self.organisation = Organisation.objects.create(
            name="Test Organisation", slug="test-organisation"
        )

        self.custom_data_layer: AirtableSource = AirtableSource.objects.create(
            name="Mayoral regions custom data layer",
            data_type=AirtableSource.DataSourceType.OTHER,
            organisation=self.organisation,
            base_id=settings.TEST_AIRTABLE_CUSTOMDATALAYER_BASE_ID,
            table_id=settings.TEST_AIRTABLE_CUSTOMDATALAYER_TABLE_NAME,
            api_key=settings.TEST_AIRTABLE_CUSTOMDATALAYER_API_KEY,
            geography_column="council district",
            geography_column_type=AirtableSource.GeographyTypes.COUNCIL,
        )

        self.source: AirtableSource = AirtableSource.objects.create(
            name="My test Airtable member list",
            data_type=AirtableSource.DataSourceType.MEMBER,
            organisation=self.organisation,
            base_id=settings.TEST_AIRTABLE_MEMBERLIST_BASE_ID,
            table_id=settings.TEST_AIRTABLE_MEMBERLIST_TABLE_NAME,
            api_key=settings.TEST_AIRTABLE_MEMBERLIST_API_KEY,
            geography_column="Postcode",
            geography_column_type=AirtableSource.GeographyTypes.POSTCODE,
            auto_update_enabled=True,
            update_mapping=[
                {
                    "source": "postcodes.io",
                    "source_path": "parliamentary_constituency_2025",
                    "destination_column": "constituency",
                },
                {
                    "source": str(self.custom_data_layer.id),
                    "source_path": "mayoral region",
                    "destination_column": "mayoral region",
                },
            ],
        )

        self.source.teardown_webhooks()

    def tearDown(self) -> None:
        for record_id, source in self.records_to_delete:
            source.table.delete(record_id)
        self.source.teardown_webhooks()
        return super().tearDown()

    def create_test_record(self, record, source=None):
        source = source or self.source
        record = source.table.create(record)
        self.records_to_delete.append((record["id"], source))
        return record

    def create_many_test_records(self, records, source=None):
        source = source or self.source
        records = source.table.batch_create(records)
        self.records_to_delete += [(record["id"], source) for record in records]
        return records

    # Tests begin

    def test_airtable_source(self):
        self.assertTrue(self.source.healthcheck())

    async def test_airtable_webhooks(self):
        self.source.teardown_webhooks()
        self.assertFalse(self.source.webhook_healthcheck())
        self.source.setup_webhooks()
        self.assertTrue(self.source.webhook_healthcheck())

    async def test_import_async(self):
        self.create_many_test_records(
            [
                {
                    "council district": "County Durham",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
                {
                    "council district": "Northumberland",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
            ],
            source=self.custom_data_layer,
        )
        records = await self.custom_data_layer.fetch_all()
        await self.custom_data_layer.import_many(
            [self.custom_data_layer.get_record_id(record) for record in records]
        )
        enrichment_df = await sync_to_async(
            self.custom_data_layer.get_imported_dataframe
        )()
        self.assertGreaterEqual(len(enrichment_df.index), 2)

    async def test_import_many(self):
        # Confirm the database is empty
        original_count = await self.custom_data_layer.get_import_data().acount()
        self.assertEqual(original_count, 0)
        # Add some test data
        self.create_many_test_records(
            [
                {
                    "council district": "County Durham",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
                {
                    "council district": "Northumberland",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
            ],
            source=self.custom_data_layer,
        )
        records = list(await self.custom_data_layer.fetch_all())
        fetch_count = len(records)
        self.assertGreaterEqual(fetch_count, 2)
        # Check that the import is storing it all
        await self.custom_data_layer.import_many(
            [self.custom_data_layer.get_record_id(record) for record in records]
        )
        import_data = self.custom_data_layer.get_import_data()
        import_count = await import_data.acount()
        self.assertEqual(import_count, fetch_count)
        # assert that 'council district' and 'mayoral region' keys are in the JSON object
        first_record = await import_data.afirst()
        self.assertIn("council district", first_record.json)
        self.assertIn("mayoral region", first_record.json)
        self.assertIn(
            first_record.json["council district"],
            [
                "Newcastle upon Tyne",
                "North Tyneside",
                "South Tyneside",
                "Gateshead",
                "County Durham",
                "Sunderland",
                "Northumberland",
            ],
        )
        self.assertIn(
            first_record.json["mayoral region"],
            ["North East Mayoral Combined Authority"],
        )
        df = await sync_to_async(self.custom_data_layer.get_imported_dataframe)()
        # assert len(df.index) == import_count
        self.assertIn("council district", list(df.columns.values))
        self.assertIn("mayoral region", list(df.columns.values))
        self.assertEqual(len(df.index), import_count)

    async def test_airtable_fetch_one(self):
        record = self.create_test_record({"Postcode": "EH99 1SP"})
        # Test this functionality
        record = await self.source.fetch_one(self.source.get_record_id(record))
        # Check
        self.assertEqual(self.source.get_record_field(record, "Postcode"), "EH99 1SP")

    async def test_airtable_fetch_many(self):
        date = str(datetime.now().isoformat())
        records = self.create_many_test_records(
            [{"Postcode": date + "11111"}, {"Postcode": date + "22222"}]
        )
        # Test this functionality
        records = await self.source.fetch_many([record["id"] for record in records])
        # Check
        assert len(records) == 2
        for record in records:
            self.assertTrue(
                self.source.get_record_field(record, "Postcode").startswith(date)
            )

    async def test_airtable_refresh_one(self):
        record = self.create_test_record({"Postcode": "EH99 1SP"})
        # Test this functionality
        await self.source.refresh_one(record)
        # Check
        record = await self.source.fetch_one(self.source.get_record_id(record))
        self.assertEqual(
            self.source.get_record_field(record, "constituency"),
            "Edinburgh East and Musselburgh",
        )

    async def test_pivot_table(self):
        """
        This is testing the ability for self.source to be updated using data from self.custom_data_layer
        i.e. to test the pivot table functionality
        that brings custom campaign data back into the CRM, based on geography
        """
        # Add some test data
        self.create_many_test_records(
            [
                {
                    "council district": "County Durham",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
                {
                    "council district": "Northumberland",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
            ],
            source=self.custom_data_layer,
        )
        records = await self.custom_data_layer.fetch_all()
        # Check that the import is storing it all
        await self.custom_data_layer.import_many(
            [self.custom_data_layer.get_record_id(record) for record in records]
        )
        # Add a test record
        record = self.create_test_record({"Postcode": "NE12 6DD"})
        mapped_member = await self.source.map_one(
            record, loaders=await self.source.get_loaders()
        )
        self.assertEqual(
            mapped_member["update_fields"]["mayoral region"],
            "North East Mayoral Combined Authority",
        )

    async def test_airtable_refresh_many(self):
        records = self.create_many_test_records(
            [{"Postcode": "G11 5RD"}, {"Postcode": "G42 8PH"}]
        )
        # Test this functionality
        await self.source.refresh_many(records)
        # Check
        records = await self.source.fetch_many([record["id"] for record in records])
        assert len(records) == 2
        for record in records:
            if self.source.get_record_field(record, "Postcode") == "G11 5RD":
                self.assertEqual(record["fields"]["constituency"], "Glasgow West")
            elif self.source.get_record_field(record, "Postcode") == "G42 8PH":
                self.assertEqual(record["fields"]["constituency"], "Glasgow South")

    def test_airtable_filter(self):
        date = str(datetime.now().isoformat())
        self.create_many_test_records(
            [{"Postcode": date + "11111"}, {"Postcode": date + "22222"}]
        )
        # Test this functionality
        records = self.source.filter({"Postcode": date + "11111"})
        # Check
        assert len(records) == 1
        self.assertEqual(
            self.source.get_record_field(records[0], "Postcode"), date + "11111"
        )

    async def test_analytics(self):
        """
        This is testing the ability to get analytics from the data source
        """
        # Add some test data
        self.create_many_test_records([{"Postcode": "E5 0AA"}, {"Postcode": "E10 6EF"}])
        # import
        records = await self.source.fetch_all()
        await self.source.import_many(
            [self.source.get_record_id(record) for record in records]
        )
        # check analytics
        analytics = self.source.imported_data_count_by_constituency()
        # convert query set to list (is there a better way?)
        analytics = await sync_to_async(list)(analytics)
        self.assertGreaterEqual(len(analytics), 2)
        constituencies_in_report = [a["label"] for a in analytics]

        self.assertIn("Hackney North and Stoke Newington", constituencies_in_report)
        self.assertIn("Leyton and Wanstead", constituencies_in_report)
        for a in analytics:
            if a["label"] == "Hackney North and Stoke Newington":
                self.assertGreaterEqual(a["count"], 1)
            elif a["label"] == "Leyton and Wanstead":
                self.assertGreaterEqual(a["count"], 1)
