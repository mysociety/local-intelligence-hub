from __future__ import annotations

from django.conf import settings

from procrastinate.contrib.django import app

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import ConsoleSpanExporter, SimpleSpanProcessor

import functools
import os
from opentelemetry.trace import Status, StatusCode

# Setting up the tracer provider:
trace.set_tracer_provider(TracerProvider())

# Adding a SimpleSpanProcessor and ConsoleSpanExporter to the tracer provider:
tracer_provider = trace.get_tracer_provider()
tracer_provider.add_span_processor(
    SimpleSpanProcessor(ConsoleSpanExporter())
)

# Acquiring a tracer
tracer = trace.get_tracer(__name__)

from opentelemetry.trace import Status, StatusCode

def telemetry_task(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # Get CPU time before task execution
        cpu_start = os.times()

        with tracer.start_as_current_span(f"Task: {func.__name__}") as span:
            try:
                result = await func(*args, **kwargs)
                
                # Get CPU time after task execution
                cpu_end = os.times()
                
                # Calculate the CPU time used during the task
                user_cpu_time_used = cpu_end.user - cpu_start.user
                system_cpu_time_used = cpu_end.system - cpu_start.system

                # Set attributes for OpenTelemetry
                span.set_attribute("task.status", "succeeded")
                span.set_attribute("cpu.user_time", user_cpu_time_used)
                span.set_attribute("cpu.system_time", system_cpu_time_used)
                span.set_status(Status(StatusCode.OK))
                
                return result
            except Exception as e:
                span.set_attribute("task.status", "failed")
                span.record_exception(e)
                span.set_status(Status(StatusCode.ERROR, str(e)))
                raise e
    return wrapper

@app.task(queue="index")
@telemetry_task
async def refresh_one(external_data_source_id: str, member_id: str):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_one(
        external_data_source_id=external_data_source_id, member_id=member_id
    )


@app.task(queue="index", retry=settings.IMPORT_UPDATE_MANY_RETRY_COUNT)
@telemetry_task
async def refresh_many(
    external_data_source_id: str, member_ids: list[str], request_id: str = None
):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_many(
        external_data_source_id=external_data_source_id,
        member_ids=member_ids,
        request_id=request_id,
    )


@app.task(queue="index")
@telemetry_task
async def refresh_all(external_data_source_id: str, request_id: str = None):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_all(
        external_data_source_id=external_data_source_id, request_id=request_id
    )


# Refresh webhooks once a day
@app.periodic(cron="0 3 * * *")
@app.task(queue="index")
async def refresh_webhooks(external_data_source_id: str, timestamp=None):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_refresh_webhooks(
        external_data_source_id=external_data_source_id
    )


@app.task(queue="index", retry=settings.IMPORT_UPDATE_MANY_RETRY_COUNT)
@telemetry_task
async def import_many(
    external_data_source_id: str, member_ids: list[str], request_id: str = None
):
    from hub.models import ExternalDataSource

    await ExternalDataSource.deferred_import_many(
        external_data_source_id=external_data_source_id,
        member_ids=member_ids,
        request_id=request_id,
    )


@app.task(queue="index")
@telemetry_task
async def import_all(external_data_source_id: str, request_id: str = None, requested_at: str = None):
    from hub.models import ExternalDataSource
    import datetime

    # Convert the requested_at ISO string to a datetime object
    requested_time = datetime.datetime.fromisoformat(requested_at)
    start_time = datetime.datetime.now(datetime.timezone.utc)

    # Calculate the difference
    initial_delay = start_time - requested_time

    with tracer.start_as_current_span("Task: import_all") as span:
        span.set_attribute("task.requested_at", requested_time)
        span.set_attribute("task.start_time", start_time)
        span.set_attribute("task.initial_delay_seconds", initial_delay.total_seconds())

        await ExternalDataSource.deferred_import_all(
            external_data_source_id=external_data_source_id, request_id=request_id
        )

        span.set_attribute("task.status", "completed")