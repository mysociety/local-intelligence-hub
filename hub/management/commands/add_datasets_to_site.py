from django.contrib.sites.models import Site

import pandas as pd

from hub.import_utils import BaseTransactionCommand
from hub.models import DataSet


class Command(BaseTransactionCommand):
    help = "Add all DataSets, AreaTypes and Users to a site"

    commit = False

    def add_arguments(self, parser):
        parser.add_argument(
            "--site",
            action="store",
            help="Name of site to add to things",
        )
        parser.add_argument(
            "--list",
            action="store",
            help="File of datasets to add with one dataset name per line",
        )
        parser.add_argument("--commit", action="store_true", help="commit things")

    def handle(self, *args, **options):
        if options["commit"]:
            self.commit = True

        if not self.commit:
            self.stdout.write("call with --commit to save updates")

        file = options["list"]
        df = pd.read_csv(file)

        site_name = options["site"]
        try:
            site = Site.objects.get(name=site_name)
        except Site.DoesNotExist:
            self.stderr.write(f"No such site: {site_name}")
            return

        count = 0
        with self.get_atomic_context(self.commit):
            for _, row in df.iterrows():
                try:
                    ds = DataSet.objects.get(name=row[0])
                except DataSet.DoesNotExist:
                    self.stderr.write(f"No such dataset: {row[0]}")
                    continue

                ds.sites.add(site)
                count += 1

            self.stdout.write(f"added {site.name} to {count} datasets")
