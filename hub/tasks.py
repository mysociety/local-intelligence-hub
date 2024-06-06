from __future__ import annotations

import datetime
import functools
import os

from django.conf import settings
from django.db.models import Count, Q
from django.core import management

from procrastinate.contrib.django import app
from procrastinate.contrib.django.models import ProcrastinateJob
from sentry_sdk import metrics


def telemetry_task(func):
    task_name = func.__name__
    user_cpu_time_metric = f"task.{task_name}.user_cpu_time"
    system_cpu_time_metric = f"task.{task_name}.system_cpu_time"
    elapsed_time_metric = f"task.{task_name}.elapsed_time"
    percentage_failed_metric = f"task.{task_name}.percentage_failed"

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # Get times before task execution
        start_time = datetime.datetime.now(datetime.timezone.utc)
        cpu_start = os.times()

        try:
            result = await func(*args, **kwargs)

            # Get CPU time after task execution
            end_time = datetime.datetime.now(datetime.timezone.utc)
            cpu_end = os.times()

            # Calculate the CPU time used during the task
            user_cpu_time_used = cpu_end.user - cpu_start.user
            system_cpu_time_used = cpu_end.system - cpu_start.system
            elapsed_time = end_time - start_time

            metrics.distribution(key=user_cpu_time_metric, value=user_cpu_time_used)
            metrics.distribution(key=system_cpu_time_metric, value=system_cpu_time_used)
            metrics.distribution(
                key=elapsed_time_metric,
                value=elapsed_time.total_seconds(),
                unit="seconds",
            )

            return result
        finally:
            counts = await ProcrastinateJob.objects.aaggregate(
                total=Count("id"), failed=Count("id", filter=Q(status="failed"))
            )
            percentage_failed = (
                counts["failed"] * 100 / counts["total"] if counts["total"] else 0
            )
            metrics.gauge(
                key=percentage_failed_metric, value=round(percentage_failed, 2)
            )

    return wrapper


@app.task(queue="external_data_sources")
@telemetry_task
async def refresh_one(external_data_source_id: str, member):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_one(
        external_data_source_id=external_data_source_id, member=member
    )


@app.task(queue="external_data_sources", retry=settings.IMPORT_UPDATE_MANY_RETRY_COUNT)
@telemetry_task
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
@telemetry_task
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
@telemetry_task
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
@telemetry_task
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
