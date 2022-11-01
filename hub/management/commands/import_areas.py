import json

from django.core.management.base import BaseCommand

from hub.models import Area
from utils import mapit


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
            except mapit.NotFoundException:  # pragma: no cover
                print(f"could not find mapit area for {area['name']}")
                geom = None

            a, created = Area.objects.get_or_create(
                mapit_id=area["id"],
                gss=area["codes"]["gss"],
                name=area["name"],
                area_type="WMC",
            )

            a.geometry = geom
            a.save()
