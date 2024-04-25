from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import (
    ConsoleMetricExporter,
    PeriodicExportingMetricReader,
)

metric_reader = PeriodicExportingMetricReader(ConsoleMetricExporter())
provider = MeterProvider(metric_readers=[metric_reader])

# Sets the global default meter provider
metrics.set_meter_provider(provider)

# Creates a meter from the global meter provider
jobs_meter = metrics.get_meter("meep.jobs")


import_rows_requested = jobs_meter.create_histogram(
    name="meep.jobs.import.rows_requested",
    description="measures the number of rows to import"
)

update_rows_requested = jobs_meter.create_histogram(
    name="meep.jobs.update.rows_requested",
    description="measures the number of rows to update"
)

import_time_taken = jobs_meter.create_histogram(
    name="meep.jobs.import.time_taken",
    description="measures the duration of the import"
)

update_time_taken = jobs_meter.create_histogram(
    name="meep.jobs.update.time_taken",
    description="measures the duration of the update"
)