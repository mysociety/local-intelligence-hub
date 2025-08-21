from collections import defaultdict

from django.contrib.sites.models import Site

from hub.import_utils import BaseTransactionCommand
from hub.models import AreaType, DataSet, UserProperties


class Command(BaseTransactionCommand):
    help = "Add all DataSets, AreaTypes and Users to a site"

    commit = False

    def add_arguments(self, parser):
        parser.add_argument(
            "--site",
            action="store",
            help="Name of site to add to things",
        )
        parser.add_argument("--commit", action="store_true", help="commit things")

    def handle(self, *args, **options):
        if options["commit"]:
            self.commit = True

        if not self.commit:
            self.stdout.write("call with --commit to save updates")

        site_name = options["site"]
        try:
            site = Site.objects.get(name=site_name)
        except Site.DoesNotExist:
            self.stderr.write(f"No such site: {site_name}")
            return

        counts = defaultdict(int)
        with self.get_atomic_context(self.commit):
            for up in UserProperties.objects.all():
                counts["users"] += 1
                up.sites.add(site)

            for at in AreaType.objects.all():
                counts["area types"] += 1
                at.sites.add(site)

            for ds in DataSet.objects.all():
                counts["data sets"] += 1
                ds.sites.add(site)

            for key, count in counts.items():
                self.stdout.write(f"add {site.name} to {count} {key}")
