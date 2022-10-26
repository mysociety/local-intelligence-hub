import json
from django.core.management.base import BaseCommand

from time import sleep
from utils import mapit
from hub.models import Area


class Command(BaseCommand):
    help = "Import basic area information from MaPit"

    def handle(self, *args, **options):
        mapit_client = mapit.MapIt()
        areas = mapit_client.areas_of_type(["WMC"])
        for area in areas:
            try:
                geom = mapit_client.area_geometry(area["id"])
                geom = {
                    "type": "Feature",
                    "geometry": geom,
                    "properties": {
                        "PCON13CD": area["codes"]["gss"],
                        "name": area["name"],
                        "type": "WMC",
                    },
                }
                geom = json.dumps(geom)
            except:
                geom = None

            a, created = Area.objects.get_or_create(
                mapit_id=area["id"],
                gss=area["codes"]["gss"],
                name=area["name"],
                area_type="WMC",
            )

            a.geometry = geom
            a.save()
