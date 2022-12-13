import json

from crowdsourcer.models import PublicAuthority, QuestionGroup
from django.core.management.base import BaseCommand
from utils import mapit


class Command(BaseCommand):
    help = "set up authorities and question groups"

    groups = [
        "Scottish Councils",
        "Single Tier",
        "Welsh",
        "Other",
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def get_group(self, props):
        group = "Other"

        if props["country"] == "S":
            group = "Scottish Councils"
        elif props["country"] == "W":
            group = "Welsh"
        elif props["type"] in ["LBO", "UA"]:
            group = "Single Tier"

        g = QuestionGroup.objects.get(description=group)
        return g

    def handle(self, quiet: bool = False, *args, **options):
        for group in self.groups:
            g, c = QuestionGroup.objects.get_or_create(description=group)

        mapit_client = mapit.MapIt()
        areas = mapit_client.areas_of_type(["CTY", "LBO", "NMD", "MD", "UA", "NID"])

        if not quiet:
            print("Importing Areas")
        for area in areas:
            a, created = PublicAuthority.objects.get_or_create(
                unique_id=area["codes"]["gss"],
                name=area["name"],
                questiongroup=self.get_group(area),
            )
