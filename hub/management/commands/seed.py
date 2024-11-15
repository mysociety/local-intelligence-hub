import logging
import uuid

from django.conf import settings
from django.core.management.base import BaseCommand

from asgiref.sync import async_to_sync

from hub.models import AirtableSource, HubHomepage, MapReport, Organisation, User

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        # Create an org for the first user
        user = User.objects.filter(username=settings.DJANGO_SUPERUSER_USERNAME).first()
        if not user:
            user = User.objects.create_superuser(
                settings.DJANGO_SUPERUSER_USERNAME,
                settings.DJANGO_SUPERUSER_EMAIL,
                settings.DJANGO_SUPERUSER_PASSWORD,
            )

        logger.info(
            "Created a user with credentials: "
            f"{settings.DJANGO_SUPERUSER_USERNAME} / {settings.DJANGO_SUPERUSER_PASSWORD}"
        )

        org = Organisation.get_or_create_for_user(user)

        # Import custom data source
        custom_data_source: AirtableSource
        custom_data_source, _ = AirtableSource.objects.get_or_create(
            base_id=settings.SEED_AIRTABLE_DATASOURCE_BASE_ID,
            table_id=settings.SEED_AIRTABLE_DATASOURCE_TABLE_NAME,
            defaults={
                "api_key": settings.SEED_AIRTABLE_DATASOURCE_API_KEY,
                "name": "Seed Custom Data",
                "data_type": AirtableSource.DataSourceType.OTHER,
                "organisation": org,
                "geography_column_type": AirtableSource.GeographyTypes.PARLIAMENTARY_CONSTITUENCY_2024,
                "geography_column": "Constituency",
                "title_field": "Element",
                "auto_update_enabled": False,
                "auto_import_enabled": False,
                "update_mapping": [],
            },
        )
        logger.info(f"Created an AirTable data source: {custom_data_source}")
        custom_data = list(async_to_sync(custom_data_source.fetch_all)())
        async_to_sync(custom_data_source.import_many)(custom_data)
        logger.info(f"Imported {len(custom_data)} custom data items from AirTable")

        # Import member list
        members_source: AirtableSource
        members_source, _ = AirtableSource.objects.get_or_create(
            base_id=settings.SEED_AIRTABLE_MEMBERLIST_BASE_ID,
            table_id=settings.SEED_AIRTABLE_MEMBERLIST_TABLE_NAME,
            defaults={
                "api_key": settings.SEED_AIRTABLE_MEMBERLIST_API_KEY,
                "name": "Seed Member List",
                "data_type": AirtableSource.DataSourceType.MEMBER,
                "organisation": org,
                "geography_column_type": AirtableSource.GeographyTypes.POSTCODE,
                "geography_column": "Postcode",
                "postcode_field": "Postcode",
                "full_name_field": "Name",
                "auto_update_enabled": False,
                "auto_import_enabled": False,
                "update_mapping": [
                    {
                        "source": "postcodes.io",
                        "source_path": "parliamentary_constituency_2024",
                        "destination_column": "Constituency",
                    },
                    {
                        "source": str(custom_data_source.id),
                        "source_path": "Element",
                        "destination_column": "Element",
                    },
                ],
            },
        )
        logger.info(f"Created an AirTable data source: {members_source}")
        members = list(async_to_sync(members_source.fetch_all)())
        async_to_sync(members_source.import_many)(members)
        logger.info(f"Imported {len(members)} members from AirTable")
        async_to_sync(members_source.refresh_many)(members)
        logger.info(f"Updated {len(members)} members in AirTable")

        # Import event list
        events_source: AirtableSource
        events_source, _ = AirtableSource.objects.get_or_create(
            base_id=settings.SEED_AIRTABLE_EVENTS_BASE_ID,
            table_id=settings.SEED_AIRTABLE_EVENTS_TABLE_NAME,
            defaults={
                "api_key": settings.SEED_AIRTABLE_EVENTS_API_KEY,
                "name": "Seed Events",
                "data_type": AirtableSource.DataSourceType.EVENT,
                "organisation": org,
                "geography_column_type": AirtableSource.GeographyTypes.ADDRESS,
                "geography_column": "Address",
                "title_field": "Name",
                "start_time_field": "Start time",
                "auto_update_enabled": False,
                "auto_import_enabled": False,
                "can_display_points_publicly": True,
                "can_display_details_publicly": True,
                "update_mapping": [],
            },
        )
        logger.info(f"Created an AirTable data source: {events_source}")
        events = list(async_to_sync(events_source.fetch_all)())
        async_to_sync(events_source.import_many)(events)
        logger.info(f"Imported {len(events)} members from AirTable")

        # Create a Map Report for the data source
        map_report, _ = MapReport.objects.get_or_create(
            organisation=org,
            name="Test map report",
            slug="test-map-report",
            defaults={
                "layers": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": members_source.name,
                        "source": str(members_source.id),
                        "visible": True,
                    }
                ],
                "display_options": {
                    "showMPs": True,
                    "showStreetDetails": False,
                    "analyticalAreaType": "parliamentary_constituency_2024",
                    "showLastElectionData": True,
                },
            },
        )

        logger.info(f"Created a Map Report: {map_report}")

        # Create a hub for the org
        hub = HubHomepage.objects.filter(
            title="hub.localhost", organisation=org
        ).first()
        if not hub:
            logger.info("Creating a hub...")
            hub = HubHomepage.create_for_user(
                user=user, hostname="hub.localhost", org=org
            )
            hub.puck_json_content = {
                "root": {
                    "props": {
                        "slug": "testdomainorg",
                        "title": "testdomain.org",
                        "search_description": "",
                    }
                },
                "zones": {
                    "GridRow-c5896794-5c2d-427f-ba8a-8ad726b4f7c3:Col-1": [
                        {
                            "type": "Card",
                            "props": {
                                "id": "Card-c1249b7e-5de6-42a5-aa7d-115cb433d1cd",
                                "link": "/map",
                                "type": "action",
                                "title": "View the map",
                                "behaviour": "link",
                                "linkLabel": "Learn more",
                                "description": "It's right here!",
                                "dialogDescription": "",
                            },
                        }
                    ],
                    "GridRow-c5896794-5c2d-427f-ba8a-8ad726b4f7c3:Col-2": [],
                    "GridRow-c5896794-5c2d-427f-ba8a-8ad726b4f7c3:Col-3": [],
                    "GridRow-c5896794-5c2d-427f-ba8a-8ad726b4f7c3:Col-4": [],
                },
                "content": [
                    {
                        "type": "Hero",
                        "props": {
                            "id": "Hero-71f52de9-e01f-485d-bd51-fd0c5da123d6",
                            "title": "Heading",
                            "prompt": "Something",
                            "description": "Description",
                        },
                    },
                    {
                        "type": "GridRow",
                        "props": {
                            "id": "GridRow-c5896794-5c2d-427f-ba8a-8ad726b4f7c3",
                            "columns": "4-columns",
                        },
                    },
                ],
            }
            hub.layers = [
                MapReport.MapLayer(
                    id=str(events_source.id),
                    name="Seed events",
                    source=str(events_source.id),
                ),
                # TODO: add some event source
            ]
            hub.save()

        logger.info("Created a hub at http://hub.localhost:3000")
