from django.core.management.base import BaseCommand

from utils import mapit
from hub.models import Area


class Command(BaseCommand):
    help = "Import basic area information from MaPit"

    def handle(self, *args, **options):
        mapit_client = mapit.MapIt()
        areas = mapit_client.areas_of_type(["WMC"])
        for area in areas:
            a = Area.objects.get_or_create(
                mapit_id=area["id"],
                gss=area["codes"]["gss"],
                name=area["name"],
                area_type="WMC",
            )
