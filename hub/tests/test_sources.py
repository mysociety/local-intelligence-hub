from datetime import datetime
from typing import TypedDict, List

from django.conf import settings
from django.test import TestCase

from asgiref.sync import async_to_sync, sync_to_async

from hub import models


class TestExternalDataSource:
    class Meta:
        abstract = True

    # Implemented by specific source tests
    # def create_test_source(self):
    #     raise NotImplementedError()

    def setUp(self) -> None:
        self.records_to_delete: list[tuple[str, models.ExternalDataSource]] = []

        self.organisation = models.Organisation.objects.create(
            name="Test Organisation", slug="test-organisation"
        )

        self.custom_data_layer: models.AirtableSource = models.AirtableSource.objects.create(
            name="Mayoral regions custom data layer",
            data_type=models.AirtableSource.DataSourceType.OTHER,
            organisation=self.organisation,
            base_id=settings.TEST_AIRTABLE_CUSTOMDATALAYER_BASE_ID,
            table_id=settings.TEST_AIRTABLE_CUSTOMDATALAYER_TABLE_NAME,
            api_key=settings.TEST_AIRTABLE_CUSTOMDATALAYER_API_KEY,
            geography_column="council district",
            geography_column_type=models.AirtableSource.PostcodesIOGeographyTypes.COUNCIL,
        )

        self.source: models.ExternalDataSource = self.create_test_source()

        self.source.teardown_webhooks()

    def tearDown(self) -> None:
        for record_id, source in self.records_to_delete:
            source.delete_one(record_id)
        self.source.teardown_webhooks()
        return super().tearDown()

    def create_test_record(self, record: models.ExternalDataSource.CUDRecord):
        record = self.source.create_one(record)
        self.records_to_delete.append((record["id"], self.source))
        return record

    def create_many_test_records(self, records: List[models.ExternalDataSource.CUDRecord]):
        records = self.source.create_many(records)
        self.records_to_delete += [(record["id"], self.source) for record in records]
        return records

    def create_custom_layer_airtable_records(self, records: any):
        records = self.custom_data_layer.table.batch_create(records)
        self.records_to_delete += [(record["id"], self.custom_data_layer) for record in records]
        return records

    # Tests begin

    def test_source(self):
        self.assertTrue(self.source.healthcheck())

    async def test_webhooks(self):
        self.source.teardown_webhooks()
        self.assertFalse(self.source.webhook_healthcheck())
        self.source.setup_webhooks()
        self.assertTrue(self.source.webhook_healthcheck())

    async def test_import_async(self):
        self.create_custom_layer_airtable_records(
            [
                {
                    "council district": "County Durham",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
                {
                    "council district": "Northumberland",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
            ]
        )
        await self.custom_data_layer.import_all()
        enrichment_df = await sync_to_async(
            self.custom_data_layer.get_imported_dataframe
        )()
        self.assertGreaterEqual(len(enrichment_df.index), 2)

    def test_import_all(self):
        # Confirm the database is empty
        original_count = self.custom_data_layer.get_import_data().count()
        self.assertEqual(original_count, 0)
        # Add some test data
        self.create_custom_layer_airtable_records(
            [
                {
                    "council district": "County Durham",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
                {
                    "council district": "Northumberland",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
            ]
        )
        self.assertGreaterEqual(
            len(list(async_to_sync(self.custom_data_layer.fetch_all)())), 2
        )
        # Check that the import is storing it all
        fetch_count = len(list(async_to_sync(self.custom_data_layer.fetch_all)()))
        async_to_sync(self.custom_data_layer.import_all)()
        import_data = self.custom_data_layer.get_import_data()
        import_count = len(import_data)
        self.assertEqual(import_count, fetch_count)
        # assert that 'council district' and 'mayoral region' keys are in the JSON object
        self.assertIn("council district", import_data[0].json)
        self.assertIn("mayoral region", import_data[0].json)
        self.assertIn(
            import_data[0].json["council district"],
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
            import_data[0].json["mayoral region"],
            ["North East Mayoral Combined Authority"],
        )
        df = self.custom_data_layer.get_imported_dataframe()
        # assert len(df.index) == import_count
        self.assertIn("council district", list(df.columns.values))
        self.assertIn("mayoral region", list(df.columns.values))
        self.assertEqual(len(df.index), import_count)

    async def test_fetch_one(self):
        record = self.create_test_record(
            models.ExternalDataSource.CUDRecord(
              email="eh991sp@gmail.com",
              postcode="EH99 1SP",
              data={}
            )
        )
        # Test this functionality
        record = await self.source.fetch_one(self.source.get_record_id(record))
        # Check
        self.assertEqual(self.source.get_record_field(record, "Postcode"), "EH99 1SP")

    async def test_fetch_many(self):
        date = str(datetime.now().isoformat())
        records = self.create_many_test_records(
            [
                models.ExternalDataSource.CUDRecord(
                  postcode=date + "11111", email="1111111111@gmail.com", data={}
                ),
                models.ExternalDataSource.CUDRecord(
                  postcode=date + "22222", email="2222222222@gmail.com", data={}
                ),
            ]
        )
        # Test this functionality
        records = await self.source.fetch_many([record["id"] for record in records])
        # Check
        assert len(records) == 2
        for record in records:
            self.assertTrue(
                self.source.get_record_field(record, "Postcode").startswith(date)
            )

    async def test_refresh_one(self):
        record = self.create_test_record(
            models.ExternalDataSource.CUDRecord(
              email="eh991sp@gmail.com",
              postcode="EH99 1SP",
              data={}
            )
        )
        # Test this functionality
        await self.source.refresh_one(record)
        # Check
        record = await self.source.fetch_one(self.source.get_record_id(record))
        self.assertEqual(
            self.source.get_record_field(record, "constituency"),
            "Edinburgh East and Musselburgh",
        )

    def test_pivot_table(self):
        """
        This is testing the ability for self.source to be updated using data from self.custom_data_layer
        i.e. to test the pivot table functionality
        that brings custom campaign data back into the CRM, based on geography
        """
        # Add some test data
        self.create_custom_layer_airtable_records(
            [
                {
                    "council district": "County Durham",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
                {
                    "council district": "Northumberland",
                    "mayoral region": "North East Mayoral Combined Authority",
                },
            ]
        )
        # Check that the import is storing it all
        async_to_sync(self.custom_data_layer.import_all)()
        # Add a test record
        record = self.create_test_record(
            models.ExternalDataSource.CUDRecord(
              email="NE126DD@gmail.com",
              postcode="NE12 6DD",
              data={}
            )
        )
        mapped_member = async_to_sync(self.source.map_one)(
            record, loaders=async_to_sync(self.source.get_loaders)()
        )
        self.assertEqual(
            mapped_member["update_fields"]["mayoral region"],
            "North East Mayoral Combined Authority",
        )

    async def test_refresh_many(self):
        records = self.create_many_test_records(
            [
                models.ExternalDataSource.CUDRecord(
                  postcode="G11 5RD", email="gg111155rardd@gmail.com", data={}
                ),
                models.ExternalDataSource.CUDRecord(
                  postcode="G42 8PH", email="ag342423423rwefw@gmail.com", data={}
                ),
            ]
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

    def test_analytics(self):
        """
        This is testing the ability to get analytics from the data source
        """
        # Add some test data
        self.create_many_test_records(
            [
                models.ExternalDataSource.CUDRecord(
                  postcode="E5 0AA", email="E50AA@gmail.com", data={}
                ),
                models.ExternalDataSource.CUDRecord(
                  postcode="E10 6EF", email="E106EF@gmail.com", data={}
                ),
            ]
        )
        # import
        async_to_sync(self.source.import_all)()
        # check analytics
        analytics = self.source.imported_data_count_by_constituency()
        constituencies_in_report = list(map(lambda a: a["label"], analytics))
        self.assertGreaterEqual(len(analytics), 2)
        self.assertIn("Hackney North and Stoke Newington", constituencies_in_report)
        self.assertIn("Leyton and Wanstead", constituencies_in_report)
        for a in analytics:
            if a["label"] == "Hackney North and Stoke Newington":
                self.assertGreaterEqual(a["count"], 1)
            elif a["label"] == "Leyton and Wanstead":
                self.assertGreaterEqual(a["count"], 1)


class TestAirtableSource(TestExternalDataSource, TestCase):
    def create_test_source(self):
        self.source = models.AirtableSource.objects.create(
            name="My test Airtable member list",
            data_type=models.AirtableSource.DataSourceType.MEMBER,
            organisation=self.organisation,
            base_id=settings.TEST_AIRTABLE_MEMBERLIST_BASE_ID,
            table_id=settings.TEST_AIRTABLE_MEMBERLIST_TABLE_NAME,
            api_key=settings.TEST_AIRTABLE_MEMBERLIST_API_KEY,
            geography_column="Postcode",
            geography_column_type=models.AirtableSource.PostcodesIOGeographyTypes.POSTCODE,
            postcode_field="Postcode",
            email_field="Email",
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
        return self.source
    

class TestMailchimpSource(TestExternalDataSource, TestCase):
    def create_test_source(self):
        self.source = models.MailchimpSource.objects.create(
            name="My test Mailchimp member list",
            data_type=models.MailchimpSource.DataSourceType.MEMBER,
            organisation=self.organisation,
            api_key=settings.TEST_MAILCHIMP_MEMBERLIST_API_KEY,
            list_id=settings.TEST_MAILCHIMP_MEMBERLIST_AUDIENCE_ID,
            geography_column="Postcode",
            geography_column_type=models.MailchimpSource.PostcodesIOGeographyTypes.POSTCODE,
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
        return self.source