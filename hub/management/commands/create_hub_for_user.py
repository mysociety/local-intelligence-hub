from typing import Optional
from django.core.management.base import BaseCommand

from hub.models import DataSet, DataType, HubHomepage, Organisation
from hub.transformers import DataTypeConverter


class Command(BaseCommand):
    help = "Create new constituency data from old constituency data"

    def add_arguments(self, parser):
        # Add a django argument to pass -u to handle fn
        parser.add_argument("user_id", type=int)
        parser.add_argument("hostname", type=str)
        parser.add_argument("-p", "--port", type=int, default=80)
        parser.add_argument("-o", "--org_id", type=str)

    def handle(self, *args, **options):
        if ":" in options["hostname"]:
            hostname = options["hostname"].split(":")[0]
            port = options["hostname"].split(":")[1]
        else:
            hostname = options["hostname"]
            port = options["port"]

        hub = HubHomepage.create_for_user(
            options["user_id"],
            hostname,
            port,
            options.get("org_id"),
        )
        self.stdout.write(self.style.SUCCESS(f"Hub created at {hub.full_url}"))
