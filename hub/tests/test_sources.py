from datetime import datetime
from random import randint
from typing import List

from django.conf import settings
from django.test import TestCase

from asgiref.sync import sync_to_async

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

        self.custom_data_layer: models.AirtableSource = (
            models.AirtableSource.objects.create(
                name="Mayoral regions custom data layer",
                data_type=models.AirtableSource.DataSourceType.OTHER,
                organisation=self.organisation,
                base_id=settings.TEST_AIRTABLE_CUSTOMDATALAYER_BASE_ID,
                table_id=settings.TEST_AIRTABLE_CUSTOMDATALAYER_TABLE_NAME,
                api_key=settings.TEST_AIRTABLE_CUSTOMDATALAYER_API_KEY,
                geography_column="council district",
                geography_column_type=models.AirtableSource.PostcodesIOGeographyTypes.COUNCIL,
            )
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

    def create_many_test_records(
        self, records: List[models.ExternalDataSource.CUDRecord]
    ):
        records = self.source.create_many(records)
        self.records_to_delete += [(record["id"], self.source) for record in records]
        return records

    def create_custom_layer_airtable_records(self, records: any):
        records = self.custom_data_layer.table.batch_create(records)
        self.records_to_delete += [
            (record["id"], self.custom_data_layer) for record in records
        ]
        return records

    # Tests begin

    def test_source(self):
        self.assertTrue(self.source.healthcheck())

    async def test_webhooks(self):
        self.source.teardown_webhooks()
        try:
            self.source.webhook_healthcheck()
            self.fail()
        except ValueError as e:
            self.assertTrue("Not enough webhooks" in str(e))
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

    async def test_fetch_one(self):
        record = self.create_test_record(
            models.ExternalDataSource.CUDRecord(
                email=f"eh{randint(0, 1000)}sp@gmail.com",
                postcode="EH99 1SP",
                data=(
                    {
                        "addr1": "98 Canongate",
                        "city": "Edinburgh",
                        "state": "Midlothian",
                        "country": "GB",
                    }
                    if isinstance(self.source, models.MailchimpSource)
                    else {}
                ),
            )
        )
        # Test this functionality
        record = await self.source.fetch_one(self.source.get_record_id(record))
        # Check
        self.assertEqual(
            self.source.get_record_field(record, self.source.geography_column),
            "EH99 1SP",
        )

    async def test_fetch_many(self):
        now = str(datetime.now().timestamp())
        records = self.create_many_test_records(
            [
                models.ExternalDataSource.CUDRecord(
                    postcode=now + "11111", email=now + "11111@gmail.com", data={}
                ),
                models.ExternalDataSource.CUDRecord(
                    postcode=now + "22222", email=now + "22222@gmail.com", data={}
                ),
            ]
        )
        # Test this functionality
        records = await self.source.fetch_many([record["id"] for record in records])
        # Check
        assert len(records) == 2
        # Check the email field instead of postcode, because Mailchimp doesn't set
        # the postcode without a full address, which is not present in this test
        for record in records:
            self.assertTrue(
                self.source.get_record_field(
                    record, self.source.email_field
                ).startswith(now)
            )

    async def test_refresh_one(self):
        record = self.create_test_record(
            models.ExternalDataSource.CUDRecord(
                email=f"eh{randint(0, 1000)}sp@gmail.com",
                postcode="EH99 1SP",
                data=(
                    {
                        "addr1": "98 Canongate",
                        "city": "Edinburgh",
                        "state": "Midlothian",
                        "country": "GB",
                    }
                    if isinstance(self.source, models.MailchimpSource)
                    else {}
                ),
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

    async def test_pivot_table(self):
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
        records = await self.custom_data_layer.fetch_all()
        # Check that the import is storing it all
        await self.custom_data_layer.import_many(
            [self.custom_data_layer.get_record_id(record) for record in records]
        )
        # Add a test record
        record = self.create_test_record(
            models.ExternalDataSource.CUDRecord(
                email=f"NE{randint(0, 1000)}DD@gmail.com",
                postcode="NE12 6DD",
                data=(
                    {
                        "addr1": "Hadrian Court",
                        "city": "Newcastle upon Tyne",
                        "state": "Tyne and Wear",
                        "country": "GB",
                    }
                    if isinstance(self.source, models.MailchimpSource)
                    else {}
                ),
            )
        )
        mapped_member = await self.source.map_one(
            record,
            loaders=await self.source.get_loaders(),
            mapping=[
                models.UpdateMapping(
                    source=str(self.custom_data_layer.id),
                    source_path="mayoral region",
                    destination_column="mayoral region",
                )
            ],
        )
        self.assertEqual(
            mapped_member["update_fields"]["mayoral region"],
            "North East Mayoral Combined Authority",
        )

    async def test_refresh_many(self):
        records = self.create_many_test_records(
            [
                models.ExternalDataSource.CUDRecord(
                    postcode="G11 5RD",
                    email=f"gg{randint(0, 1000)}rardd@gmail.com",
                    data=(
                        {
                            "addr1": "Byres Rd",
                            "city": "Glasgow",
                            "state": "Glasgow",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
                models.ExternalDataSource.CUDRecord(
                    postcode="G42 8PH",
                    email=f"ag{randint(0, 1000)}rwefw@gmail.com",
                    data=(
                        {
                            "addr1": "506 Victoria Rd",
                            "city": "Glasgow",
                            "state": "Glasgow",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
            ]
        )
        # Test this functionality
        await self.source.refresh_many(records)
        # Check
        records = await self.source.fetch_many([record["id"] for record in records])
        assert len(records) == 2
        for record in records:
            if (
                self.source.get_record_field(record, self.source.geography_column)
                == "G11 5RD"
            ):
                self.assertEqual(
                    self.source.get_record_field(record, "constituency"), "Glasgow West"
                )
            elif (
                self.source.get_record_field(record, self.source.geography_column)
                == "G42 8PH"
            ):
                self.assertEqual(
                    self.source.get_record_field(record, "constituency"),
                    "Glasgow South",
                )
            else:
                self.fail()

    async def test_analytics(self):
        """
        This is testing the ability to get analytics from the data source
        """
        # Add some test data
        self.create_many_test_records(
            [
                models.ExternalDataSource.CUDRecord(
                    postcode="E5 0AA",
                    email=f"E{randint(0, 1000)}AA@gmail.com",
                    data=(
                        {
                            "addr1": "Millfields Rd",
                            "city": "London",
                            "state": "London",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
                models.ExternalDataSource.CUDRecord(
                    postcode="E10 6EF",
                    email=f"E{randint(0, 1000)}EF@gmail.com",
                    data=(
                        {
                            "addr1": "123 Colchester Rd",
                            "city": "London",
                            "state": "London",
                            "country": "GB",
                        }
                        if isinstance(self.source, models.MailchimpSource)
                        else {}
                    ),
                ),
            ]
        )
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

    async def test_enrichment_electoral_commission(self):
        """
        This is testing the ability to enrich data from the data source
        using a third party source
        """
        # Add a test record
        record = self.create_test_record(
            models.ExternalDataSource.CUDRecord(
                email=f"NE{randint(0, 1000)}DD@gmail.com",
                postcode="DH1 1AE",
                data={},
            )
        )
        mapped_member = await self.source.map_one(
            record,
            loaders=await self.source.get_loaders(),
            mapping=[
                models.UpdateMapping(
                    source="electoral_commission_postcode_lookup",
                    source_path="electoral_services.name",
                    destination_column="electoral service",
                )
            ],
        )
        self.assertEqual(
            mapped_member["update_fields"]["electoral service"],
            "Durham County Council",
        )


class TestMailchimpSource(TestExternalDataSource, TestCase):
    def create_test_source(self):
        self.source = models.MailchimpSource.objects.create(
            name="My test Mailchimp member list",
            data_type=models.MailchimpSource.DataSourceType.MEMBER,
            organisation=self.organisation,
            api_key=settings.TEST_MAILCHIMP_MEMBERLIST_API_KEY,
            list_id=settings.TEST_MAILCHIMP_MEMBERLIST_AUDIENCE_ID,
            email_field="email_address",
            geography_column="ADDRESS.zip",
            geography_column_type=models.MailchimpSource.PostcodesIOGeographyTypes.POSTCODE,
            auto_update_enabled=True,
            update_mapping=[
                {
                    "source": "postcodes.io",
                    "source_path": "parliamentary_constituency_2025",
                    # 10 characters and uppercase for Mailchimp custom fields
                    "destination_column": "CONSTITUEN",
                },
                {
                    "source": str(self.custom_data_layer.id),
                    "source_path": "mayoral region",
                    "destination_column": "mayoral region",
                },
            ],
        )
        return self.source
