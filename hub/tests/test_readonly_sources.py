from django.conf import settings
from django.db.utils import IntegrityError
from django.test import TestCase

from hub import models


class TestReadOnlyDataSource:
    class Meta:
        abstract = True

    def setUp(self) -> None:
        self.organisation = models.Organisation.objects.create(
            name="Test Organisation", slug="test-organisation"
        )

        self.source: models.ExternalDataSource = self.create_test_source()

    # Tests begin

    def test_deduplication(self):
        try:
            self.create_test_source(name="My duplicate source")  # Create duplicate
            self.assertTrue(False)  # Force failure if no exception
        except IntegrityError:
            pass

    def test_source(self):
        self.assertTrue(self.source.healthcheck())

    async def test_fetch_all(self: TestCase):
        # Test this functionality
        records = await self.source.fetch_all()
        # Check
        self.assertGreater(len(records), 0)


class TestTicketTailor(TestReadOnlyDataSource, TestCase):
    def create_test_source(self, name="My test Airtable member list"):
        self.source = models.TicketTailorSource.objects.create(
            name=name,
            organisation=self.organisation,
            api_key=settings.TEST_TICKET_TAILOR_API_KEY,
        )
        return self.source
