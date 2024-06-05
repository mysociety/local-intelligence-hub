from __future__ import annotations

from django.conf import settings
from django.core import management

from procrastinate.contrib.django import app


@app.task(queue="external_data_sources")
async def refresh_one(external_data_source_id: str, member):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_one(
        external_data_source_id=external_data_source_id, member=member
    )


@app.task(queue="external_data_sources", retry=settings.IMPORT_UPDATE_MANY_RETRY_COUNT)
async def refresh_many(
    external_data_source_id: str, members: list, request_id: str = None
):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_many(
        external_data_source_id=external_data_source_id,
        members=members,
        request_id=request_id,
    )


@app.task(queue="external_data_sources")
async def refresh_all(external_data_source_id: str, request_id: str = None):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_all(
        external_data_source_id=external_data_source_id, request_id=request_id
    )


# Refresh webhooks once a day
@app.periodic(cron="0 3 * * *")
@app.task(queue="external_data_sources")
async def refresh_webhooks(external_data_source_id: str, timestamp=None):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_webhooks(
        external_data_source_id=external_data_source_id
    )


@app.task(queue="external_data_sources", retry=settings.IMPORT_UPDATE_MANY_RETRY_COUNT)
async def import_many(
    external_data_source_id: str, members: list, request_id: str = None
):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_import_many(
        external_data_source_id=external_data_source_id,
        members=members,
        request_id=request_id,
    )


@app.task(queue="external_data_sources")
async def import_all(external_data_source_id: str, request_id: str = None):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_import_all(
        external_data_source_id=external_data_source_id, request_id=request_id
    )


# cron that calls the `import_2024_ppcs` command every hour
@app.periodic(cron="0 * * * *")
@app.task(queue="built_in_data")
def import_2024_ppcs(timestamp=None):
    management.call_command("import_2024_ppcs")
