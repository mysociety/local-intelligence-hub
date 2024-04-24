from time import sleep

from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, AreaType, DataSet, DataType
from hub.transformers import DataTypeConverter
from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
    RateLimitException,
)


class MultipleAreaTypesMixin:
    def handle(self, *args, **options):
        for area_type in self.area_types:
            self.area_type = area_type
            super(MultipleAreaTypesMixin, self).handle(*args, **options)


class BaseAreaImportCommand(BaseCommand):
    area_type = "WMC"
    uses_gss = False

    def __init__(self):
        super().__init__()

        self.data_types = {}

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

        parser.add_argument(
            "--skip_new_areatype_conversion",
            action="store_true",
            help="do not auto convert to new constituency data",
        )

    def get_label(self, config):
        return config["defaults"]["label"]

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(
                data_type=data_type, area__area_type__code=self.area_type
            ).delete()

    def get_area_type(self):
        return AreaType.objects.get(code=self.area_type)

    def get_cons_col(self):
        if hasattr(self, "cons_col_map"):
            return self.cons_col_map[self.area_type]

        return self.cons_col

    def add_data_sets(self, df=None):
        for name, config in self.data_sets.items():
            label = self.get_label(config)

            if config["defaults"].get("is_filterable", None) is None:
                if config["defaults"].get("table", None) is None:
                    self.stdout.write(
                        self.style.ERROR(f"dataset {name} does not have a table set")
                    )
                    exit()

            if config["defaults"]["data_type"] not in ["percent", "integer", "float"]:
                if config["defaults"].get("is_filterable", None) is None:
                    self.stdout.write(
                        self.style.NOTICE(
                            f"dataset {name} does not have filterable set"
                        )
                    )

            if config["defaults"].get("comparators", None) is None and not config[
                "defaults"
            ].pop("no_comparators", False):
                self.stdout.write(
                    self.style.NOTICE(f"dataset {name} does not have comparators set")
                )

            data_set, created = DataSet.objects.update_or_create(
                name=name,
                defaults={
                    "label": label,
                    **config["defaults"],
                },
            )
            data_set.areas_available.add(self.get_area_type())

            data_type, created = DataType.objects.update_or_create(
                data_set=data_set,
                name=name,
                area_type=self.get_area_type(),
                defaults={
                    "data_type": config["defaults"]["data_type"],
                    "label": label,
                },
            )

            self.data_types[name] = data_type

    def _fill_empty_entries(self):
        for data_type in self.data_types.values():
            if (
                data_type.data_type
                in [
                    "integer",
                    "float",
                    "percent",
                ]
                and data_type.data_set.table == "areadata"
                and data_type.data_set.fill_blanks
            ):
                datum_example = AreaData.objects.filter(data_type=data_type).first()
                if datum_example.float:
                    key = "float"
                elif datum_example.int:
                    key = "int"
                else:
                    key = "data"
                defaults = {key: 0}
                areas_with_values = [
                    areadata.area.name
                    for areadata in AreaData.objects.filter(data_type=data_type)
                ]
                # If some countries are set to be excluded, their values should not be filled in
                if data_type.data_set.exclude_countries != []:
                    for country in data_type.data_set.exclude_countries:
                        areas_with_values.extend(
                            [
                                areadata.area.name
                                for areadata in AreaData.objects.filter(
                                    data_type__name="country"
                                ).filter(data=country)
                            ]
                        )

                areas_without_values = Area.objects.exclude(
                    name__in=areas_with_values
                ).filter(area_type__code=self.area_type)
                for area in areas_without_values:
                    data, created = AreaData.objects.update_or_create(
                        area=area, data_type=data_type, defaults=defaults
                    )

    def update_averages(self):
        self._fill_empty_entries()
        for data_type in self.data_types.values():
            data_type.update_average()

    def update_max_min(self):
        for data_type in self.data_types.values():
            data_type.update_max_min()

    def convert_to_new_con(self):
        if self.do_not_convert or self.area_type == "WMC23":
            return

        if not self._quiet:
            self.stdout.write("Converting to WMC23 constituency data")

        converter = DataTypeConverter()
        for data_type in self.data_types.values():
            if (
                data_type.area_type == converter.old_area_type
                and data_type.data_set.unit_distribution == "people_in_area"
                and data_type.data_set.unit_type == "percentage"
            ):
                converter.convert_datatype_to_new_geography(
                    data_type, delete_old=True, quiet=self._quiet
                )

    def handle(self, quiet=False, *args, **kwargs):
        self._quiet = quiet
        self.add_data_sets()
        self.delete_data()
        self.process_data()
        self.update_averages()
        self.update_max_min()
        self.convert_to_new_con()


class BaseImportFromDataFrameCommand(BaseAreaImportCommand):
    uses_gss = True

    def get_row_data(self, row, conf):
        return row[conf["col"]]

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write(self.message)

        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            cons = row[self.cons_row]

            if not pd.isna(cons):
                if self.uses_gss:
                    area = Area.get_by_gss(cons, area_type=self.area_type)
                else:
                    cons = cons.replace(" & ", " and ")
                    area = Area.get_by_name(cons, area_type=self.area_type)

            if area is None:
                if self.uses_gss:
                    self.stdout.write(f"Failed to find area with code {cons}")
                else:
                    self.stdout.write(f"no matching area for {cons}")
                continue

            try:
                for name, conf in self.data_sets.items():
                    if self.data_types[name].data_type in ["json", "url"]:
                        defaults = {"json": self.get_row_data(row, conf)}
                    else:
                        defaults = {"data": self.get_row_data(row, conf)}

                    area_data, created = AreaData.objects.get_or_create(
                        data_type=self.data_types[name],
                        area=area,
                        defaults=defaults,
                    )
            except Exception as e:
                print(f"issue with {cons}: {e}")
                break

    def handle(self, quiet=False, skip_new_areatype_conversion=False, *args, **options):
        self._quiet = quiet
        if not hasattr(self, "do_not_convert"):
            self.do_not_convert = skip_new_areatype_conversion
        df = self.get_dataframe()
        self.add_data_sets(df)
        self.delete_data()
        self.process_data(df)
        self.update_averages()
        self.update_max_min()
        self.convert_to_new_con()


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
                area.int = 1
            else:
                area.int = area.value() + 1
            area.save()

        return True

    def process_lat_long(self, lat=None, lon=None, row_name=None):
        success = self._process_lat_long(lat=lat, lon=lon, row_name=row_name)
        # retry once if it fails so we can catch rate limit errors
        if success is False:
            self._process_lat_long(lat=lat, lon=lon, row_name=row_name)


class BaseConstituencyGroupListImportCommand(BaseAreaImportCommand):
    do_not_convert = True

    def process_data(self):
        df = self.get_df()

        if not self._quiet:
            self.stdout.write(f"{self.message} ({self.area_type})")

        group_by = "constituency"
        if self.uses_gss:
            group_by = "gss"
        if hasattr(self, "area_types"):
            group_by = self.cons_col_map[self.area_type]

        for lookup, data in tqdm(df.groupby(group_by)):
            try:
                area = Area.objects.filter(area_type__code=self.area_type)
                if self.uses_gss:
                    area = area.get(gss=lookup)
                else:
                    area = area.get(name=lookup)
            except Area.DoesNotExist:
                self.stderr.write(f"no area found for {lookup} and {self.area_type}")
                continue

            json = []
            for index, row in data.iterrows():
                json.append(self.get_group_json(row))

            json_data, created = AreaData.objects.update_or_create(
                data_type=self.data_types[self.group_data_type],
                area=area,
                json=json,
            )
            try:
                count_data, created = AreaData.objects.update_or_create(
                    data_type=self.data_types[self.count_data_type],
                    area=area,
                    data=len(data),
                )
            except AttributeError:
                pass

    def handle(self, quiet=False, *args, **kwargs):
        self._quiet = quiet
        self.add_data_sets()
        self.delete_data()
        self.process_data()
        self.update_averages()
        self.update_max_min()


class BaseConstituencyCountImportCommand(BaseAreaImportCommand):
    do_not_convert = True

    def set_data_type(self):
        self.data_type = list(self.data_types.values())[0]

    def get_dataframe(self):
        df = pd.read_csv(self.data_file)
        df = df.astype({self.get_cons_col(): "str"})
        return df

    def _get_areas_from_row(self, row):
        value = row[self.get_cons_col()]
        if self.uses_gss:
            areas = Area.objects.filter(gss__in=value.split(","))
        else:
            areas = Area.objects.filter(name__iexact=value)

        return list(areas)

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write(f"{self.message} ({self.area_type})")

        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            areas = self._get_areas_from_row(row)
            for area in areas:
                area, created = AreaData.objects.get_or_create(
                    data_type=self.data_type,
                    area=area,
                )
                if created:
                    area.int = 1
                else:
                    area.int = area.value() + 1
                area.save()

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        self.add_data_sets(df)
        self.set_data_type()
        self.delete_data()
        self.process_data(df)
        self.update_averages()
        self.update_max_min()
