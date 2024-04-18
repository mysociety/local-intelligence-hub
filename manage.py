#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "local_intelligence_hub.settings")

    # Telemetry
    from opentelemetry import trace
    from opentelemetry.instrumentation.django import DjangoInstrumentor
    from opentelemetry.propagate import set_global_textmap
    from opentelemetry.sdk.trace import TracerProvider
    from sentry_sdk.integrations.opentelemetry import (
        SentryPropagator,
        SentrySpanProcessor,
    )

    DjangoInstrumentor().instrument(is_sql_commentor_enabled=True)
    provider = TracerProvider()
    provider.add_span_processor(SentrySpanProcessor())
    trace.set_tracer_provider(provider)
    set_global_textmap(SentryPropagator())

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
