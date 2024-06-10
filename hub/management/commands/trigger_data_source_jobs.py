import logging
import uuid
from datetime import datetime, timezone

from django.core.management.base import BaseCommand

from asgiref.sync import async_to_sync

from hub.models import ExternalDataSource

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Trigger import and update jobs for an external data source"

    def add_arguments(self, parser):
        parser.add_argument("id", type=str)
        parser.add_argument("-o", "--only", type=str)

    def handle(self, *args, **options):
        async_to_sync(self.async_handle)(*args, **options)

    async def async_handle(self, *args, **options):
        source: ExternalDataSource = await ExternalDataSource.objects.aget(
            id=options["id"]
        )
        only = options.get("only")
        requested_at = datetime.now(timezone.utc).isoformat()
        if not only:
            await source.schedule_import_all(requested_at=requested_at, request_id=str(uuid.uuid4()))
            await source.schedule_refresh_all(request_id=str(uuid.uuid4()))
        elif only == "import":
            await source.schedule_import_all(requested_at=requested_at, request_id=str(uuid.uuid4()))
        else:
            await source.schedule_refresh_all(request_id=str(uuid.uuid4()))
