import json
from collections import defaultdict

from django.contrib.gis.geos import GEOSGeometry
from django.contrib.sites.models import Site
from django.core.management.base import CommandError

import pandas as pd
import requests
from shapely.geometry import MultiPolygon, Polygon, shape
from shapely.ops import unary_union
from tqdm import tqdm

from hub.models import Area, AreaOverlap, AreaType

from .base_importers import BaseImportCommand

# ONS CSV mapping local authorities to police force areas
# https://www.data.gov.uk/dataset/127ef219-1540-4c81-a907-eca118d7fa06/lad-to-community-safety-partnership-to-pfa-december-2023-lookup-in-ew
ONS_LAD_TO_PFA_URL = "https://hub.arcgis.com/api/v3/datasets/a90c5fce795e4df7af9f40d41f479405_0/downloads/data?format=csv&spatialRefId=4326&where=1%3D1"


class Command(BaseImportCommand):
    help = (
        "Import policing areas (PCC areas for England/Wales, countries for Scotland/NI)"
    )

    _site_name = None

    # the importers standardise from & to and
    name_map = {"Devon & Cornwall": "Devon and Cornwall"}

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

        parser.add_argument(
            "--diagnostics",
            action="store_true",
            help="Print out extra diagnostics - very verbose",
        )

        parser.add_argument(
            "-s",
            "--site",
            action="store",
            help="Name of site to add dataset to",
        )

        parser.add_argument(
            "--all_sites",
            action="store_true",
            help="Add dataset to all sites",
        )

    def get_site(self):
        if self._site_name:
            try:
                site = Site.objects.get(name=self._site_name)
                self.site = site
            except Site.DoesNotExist:
                raise CommandError(f"No such site: {self._site_name}", returncode=1)
        elif self._all_sites:
            self.all_sites = Site.objects.all()

    def handle(self, quiet: bool = False, diagnostics: bool = False, *args, **options):
        self._site_name = options.get("site")
        self._all_sites = options.get("all_sites")
        self.get_site()

        # Create or get the PFA area type
        area_type, created = AreaType.objects.get_or_create(
            code="PFA",
            defaults={
                "area_type": "policing_area",
                "name_singular": "Policing Area",
                "name_plural": "Policing Areas",
                "short_name_singular": "policing area",
                "short_name_plural": "policing areas",
                "description": "Police Force Areas (England & Wales) and countries (Scotland & NI)",
            },
        )

        self.add_object_to_site(area_type)

        if diagnostics or not quiet:
            print("Fetching LA to PFA mapping from ONS...")

        # Fetch the ONS mapping CSV
        response = requests.get(ONS_LAD_TO_PFA_URL)
        response.raise_for_status()
        df = pd.read_csv(pd.io.common.BytesIO(response.content))

        # Update GSS codes for post-2023 boundary changes.
        df = df.replace("E08000019", "E08000039")  # Sheffield
        df = df.replace("E08000016", "E08000038")  # Barnsley

        # Group local authorities by PFA
        pfa_to_lads = defaultdict(list)
        for _, row in df.iterrows():
            pfa_code = row["PFA23CD"]
            pfa_name = self.name_map.get(row["PFA23NM"], row["PFA23NM"])
            lad_code = row["LAD23CD"]
            pfa_to_lads[pfa_code].append(
                {"lad_code": lad_code, "pfa_name": pfa_name, "pfa_code": pfa_code}
            )

        if diagnostics or not quiet:
            print(f"Found {len(pfa_to_lads)} policing areas in England & Wales")

        # Add Scotland - all Scottish local authorities
        scottish_las = Area.objects.filter(
            gss__startswith="S", area_type__code__in=["STC", "DIS"]
        )
        if scottish_las.exists():
            pfa_to_lads["S92000003"] = [
                {"area": la, "pfa_name": "Scotland", "pfa_code": "S92000003"}
                for la in scottish_las
            ]
            if diagnostics:
                print(f"Found {scottish_las.count()} Scottish local authorities")

        # Add Northern Ireland - all NI local authorities
        ni_las = Area.objects.filter(
            gss__startswith="N", area_type__code__in=["STC", "DIS"]
        )
        if ni_las.exists():
            pfa_to_lads["N92000002"] = [
                {
                    "area": la,
                    "pfa_name": "Northern Ireland",
                    "pfa_code": "N92000002",
                }
                for la in ni_las
            ]
            if diagnostics:
                print(f"Found {ni_las.count()} Northern Irish local authorities")

        if diagnostics or not quiet:
            print(
                f"Importing {len(pfa_to_lads)} policing areas (England, Wales, Scotland, NI)..."
            )

        disable = quiet or diagnostics
        for pfa_code, lad_list in tqdm(list(pfa_to_lads.items()), disable=disable):
            pfa_name = lad_list[0]["pfa_name"]

            if diagnostics:
                print(f"\nProcessing {pfa_name} ({pfa_code})")
                print(f"  Contains {len(lad_list)} local authorities")

            # Get all constituent local authority areas
            geometries = []
            la_areas = []

            for lad in lad_list:
                # For Scotland/NI, we already have the Area object
                if "area" in lad:
                    la_area = lad["area"]
                else:
                    # For England/Wales, look up by GSS code
                    lad_code = lad["lad_code"]
                    try:
                        la_area = Area.objects.get(
                            gss=lad_code, area_type__code__in=["STC", "DIS"]
                        )
                    except Area.DoesNotExist:
                        print(f"  Could not find LA with GSS {lad_code}")
                        continue

                la_areas.append(la_area)

                # Extract geometry
                if la_area.geometry:
                    geojson = json.loads(la_area.geometry)
                    # Extract the geometry part from the Feature
                    if geojson.get("type") == "Feature":
                        geom = shape(geojson["geometry"])
                    else:
                        geom = shape(geojson)
                    geometries.append(geom)
                else:
                    print(f"  LA {la_area.name} has no geometry")

            if not geometries:
                print(f"  No geometries found for {pfa_name}, skipping")
                continue

            # Union all the geometries (handles overlaps automatically)
            if diagnostics:
                print(f"  Merging {len(geometries)} geometries")

            unified_geom = unary_union(geometries)

            # Remove all interior holes, keeping only exterior boundary.
            # (City of London is the only exception here, we fix that later.)
            if unified_geom.geom_type == "Polygon":
                # Single polygon - keep only exterior ring
                unified_geom = Polygon(unified_geom.exterior)
            elif unified_geom.geom_type == "MultiPolygon":
                # Multiple polygons - remove holes from each
                unified_geom = MultiPolygon(
                    [Polygon(poly.exterior) for poly in unified_geom.geoms]
                )

            # Special case: Punch a City of London hole in the Metropolitan Police area
            if pfa_code == "E23000001":
                try:
                    city_of_london = Area.objects.get(
                        gss="E09000001", area_type__code__in=["STC", "DIS"]
                    )
                    if city_of_london.geometry:
                        col_geojson = json.loads(city_of_london.geometry)
                        if col_geojson.get("type") == "Feature":
                            col_geom = shape(col_geojson["geometry"])
                        else:
                            col_geom = shape(col_geojson)
                        # Subtract City of London from Metropolitan Police
                        unified_geom = unified_geom.difference(col_geom)
                        if diagnostics:
                            print(
                                "  Punched City of London hole in Metropolitan Police"
                            )
                except Area.DoesNotExist:
                    print("  Warning: Could not find City of London to punch hole")

            # Convert back to GeoJSON
            geojson = {
                "type": "Feature",
                "geometry": json.loads(GEOSGeometry(unified_geom.wkt).geojson),
                "properties": {
                    "PCON13CD": pfa_code,
                    "name": pfa_name,
                    "type": "PFA",
                },
            }

            # Create the policing area
            policing_area, created = Area.objects.update_or_create(
                gss=pfa_code,
                area_type=area_type,
                defaults={
                    "name": pfa_name,
                    "mapit_id": None,
                    "geometry": json.dumps(geojson),
                },
            )

            if diagnostics:
                print(
                    f"  {'Created' if created else 'Updated'} policing area: {policing_area.name}"
                )

            # Create AreaOverlap relationships: LA -> policing area
            for la_area in la_areas:
                AreaOverlap.objects.update_or_create(
                    area_from=la_area,
                    area_to=policing_area,
                    defaults={
                        "population_overlap": 100,  # LA is fully within the policing area
                        "area_overlap": 100,
                    },
                )

            if diagnostics:
                print(f"  Created {len(la_areas)} AreaOverlap relationships")

        if diagnostics or not quiet:
            print("Policing areas import complete")
