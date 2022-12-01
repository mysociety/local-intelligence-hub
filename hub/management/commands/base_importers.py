from time import sleep

from django.core.management.base import BaseCommand
from django.db.models import Avg, IntegerField
from django.db.models.functions import Cast, Coalesce

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType
from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
    RateLimitException,
)


class BaseAreaImportCommand(BaseCommand):
    data_types = {}
    cast_field = IntegerField

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def get_label(self, config):
        return config["defaults"]["label"]

    def delete_data(self):
        pass

    def add_data_sets(self, df=None):
        for name, config in self.data_sets.items():
            label = self.get_label(config)

            data_set, created = DataSet.objects.update_or_create(
                name=name,
                defaults={
                    "label": label,
                    "description": label,
                    **config["defaults"],
                },
            )

            data_type, created = DataType.objects.update_or_create(
                data_set=data_set,
                name=name,
                defaults={
                    "data_type": config["defaults"]["data_type"],
                    "label": label,
                    "description": label,
                },
            )

            self.data_types[name] = data_type

    def update_averages(self):
        for data_type in self.data_types.values():
            average = (
                AreaData.objects.filter(data_type=data_type)
                .annotate(
                    cast_data=Cast(
                        Coalesce("int", "float"), output_field=self.cast_field()
                    )
                )
                .all()
                .aggregate(Avg("cast_data"))
            )

            data_type.average = average["cast_data__avg"]
            data_type.save()


class BaseImportFromDataFrameCommand(BaseAreaImportCommand):
    uses_gss = True

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write(self.message)

        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            cons = row[self.cons_row]

            if not pd.isna(cons):
                if self.uses_gss:
                    areas = Area.objects.filter(gss=cons)
                else:
                    areas = Area.objects.filter(name=cons)

                areas = list(areas)

            if len(areas) == 0:
                if self.uses_gss:
                    self.stdout.write(f"Failed to find area with code {cons}")
                else:
                    self.stdout.write(f"no matching area for {cons}")
                continue

            for area in areas:
                try:
                    for name, conf in self.data_sets.items():
                        area_data, created = AreaData.objects.get_or_create(
                            data_type=self.data_types[name],
                            area=area,
                            defaults={"data": row[conf["col"]]},
                        )
                except Exception as e:
                    print(f"issue with {cons}: {e}")
                    break

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        self.add_data_sets(df)
        self.delete_data()
        self.process_data(df)
        self.update_averages()


class BaseLatLongImportCommand(BaseAreaImportCommand):
    def _process_lat_long(self, lat=None, lon=None, row_name=None):
        if not pd.isna(lat) and not pd.isna(lon):
            try:
                mapit = MapIt()
                gss_codes = mapit.wgs84_point_to_gss_codes(lon, lat)

                areas = Area.objects.filter(gss__in=gss_codes)
                areas = list(areas)
            except (
                NotFoundException,
                BadRequestException,
                InternalServerErrorException,
                ForbiddenException,
            ) as error:
                print(f"Error fetching row {row_name} with {lat}, {lon}: {error}")
                return None
            except RateLimitException as error:
                print(f"Mapit Error - {error}, waiting for a minute")
                sleep(60)
                return False
        else:
            print(f"missing lat or lon for row {row_name}")
            return None

        for area in areas:
            area, created = AreaData.objects.get_or_create(
                data_type=self.data_type,
                area=area,
            )
            if created:
                area.data = 1
            else:
                area.data = area.value() + 1
            area.save()

        return True

    def process_lat_long(self, lat=None, lon=None, row_name=None):
        success = self._process_lat_long(lat=lat, lon=lon, row_name=row_name)
        # retry once if it fails so we can catch rate limit errors
        if success is False:
            self._process_lat_long(lat=lat, lon=lon, row_name=row_name)
