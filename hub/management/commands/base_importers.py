from datetime import date
from time import sleep
from typing import Optional

from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand, CommandError

import duckdb
import pandas as pd
import requests
from tqdm import tqdm

from hub.models import Area, AreaData, AreaType, DataSet, DataType, PersonData
from hub.transformers import DataTypeConverter
from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
    RateLimitException,
)

party_shades = {
    "Alba Party": "#005EB8",
    "Alliance Party of Northern Ireland": "#F6CB2F",
    "Conservative Party": "#0087DC",
    "Democratic Unionist Party": "#D46A4C",
    "Green Party": "#6AB023",
    "Labour Co-operative": "#E4003B",
    "Labour Party": "#E4003B",
    "Liberal Democrats": "#FAA61A",
    "Plaid Cymru": "#005B54",
    "Scottish National Party": "#FDF38E",
    "Sinn Féin": "#326760",
    "Social Democratic and Labour Party": "#2AA82C",
    "Reclaim": "#101122",
    "Reform UK": "#3DBBE2",
    "No overall control": "#EEE",
    "Independents": "#DCDCDC",
}

TWFY_CONSTITUENCIES_DATA_URL = (
    "https://raw.githubusercontent.com/mysociety/parlparse/master/members/people.json"
)
# common constituency name mismatches
HARD_CODED_CONSTITUENCY_LOOKUP = {
    "Cotswolds The": "The Cotswolds",
    "Basildon South and East Thurrock": "South Basildon and East Thurrock",
    "Na h-Eileanan An Iar (Western Isles)": "Na h-Eileanan an Iar",
    "Ynys M¶n": "Ynys Môn",
    "Ynys Mon": "Ynys Môn",
    "Montgomeryshire and Glyndwr": "Montgomeryshire and Glyndŵr",
}


class MultipleAreaTypesMixin:
    def handle(self, *args, **options):
        for area_type in self.area_types:
            self.area_type = area_type
            super(MultipleAreaTypesMixin, self).handle(*args, **options)


class BaseImportCommand(BaseCommand):
    site = None
    all_sites = None

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

        parser.add_argument(
            "-s",
            "--site",
            action="store",
            help="Name of site to add dataset to",
        )

        parser.add_argument(
            "--site_list",
            action="store",
            help="comma separated list of sites to add dataset to",
        )

        parser.add_argument(
            "--all_sites",
            action="store_true",
            help="Add dataset to all sites",
        )

    def get_site(self):
        if self.all_sites is False and self._site_name is None:
            raise CommandError("either all_sites or site name required", returncode=1)

        if self._site_name:
            try:
                site = Site.objects.get(name=self._site_name)
                self.site = site
            except Site.DoesNotExist:
                raise CommandError(f"No such site: {self._site_name}", returncode=1)
        elif self._site_list:
            sites = self._site_list.split(",")
            self.all_sites = Site.objects.filter(name__in=sites)
        elif self._all_sites:
            self.all_sites = Site.objects.all()

    def add_object_to_site(self, obj):
        if hasattr(obj, "sites") is False:
            self.stderr(
                self.styles.ERROR(f"{type(obj)} does not have sites, can't add a site")
            )
            return

        if self.site:
            obj.sites.add(self.site)
        elif self.all_sites:
            for site in self.all_sites:
                obj.sites.add(site)

    def handle(
        self,
        all_sites: bool = False,
        quiet: bool = False,
        site: str = "",
        site_list: str = "",
        *args,
        **options,
    ):
        self._quiet = quiet
        self._all_sites = all_sites
        self._site_list = site_list
        self._site_name = site
        self.get_site()


class BaseAreaImportCommand(BaseImportCommand):
    area_type = "WMC"
    uses_gss = False
    skip_delete = False
    skip_countries = []

    def __init__(self):
        super().__init__()

        self.cons_map = HARD_CODED_CONSTITUENCY_LOOKUP
        self.data_types = {}

    def add_arguments(self, parser):
        super(BaseAreaImportCommand, self).add_arguments(parser)
        parser.add_argument(
            "--skip_new_areatype_conversion",
            action="store_true",
            help="do not auto convert to new constituency data",
        )

    def add_to_dict(self, df):
        names = df.area.tolist()
        # Add a version of the main name, without any commas
        names.append(names[0].replace(",", ""))
        # The first name listed is the ideal form
        name = names.pop(0)
        return {alt_name.replace(",", ""): name for alt_name in names}

    def build_constituency_name_lookup(self, old_cons=False):
        # Grab the TWFY data, and ignore any constituencies that no longer exist
        # We're only interested in the names, so keep them, and explode the column.
        # Then group by (arbitrary) index, and build the dictionary from these groups

        cons_filter = "end_date.isna()"
        if old_cons:
            cons_filter = "end_date == '2024-07-03'"

        response = requests.get(TWFY_CONSTITUENCIES_DATA_URL)
        df = pd.DataFrame.from_records(response.json()["posts"])
        df = df.query(cons_filter)["area"].reset_index()
        df = (
            df["area"]
            .map(lambda a: [a["name"]] + [o for o in a.get("other_names", [])])
            .reset_index()
        )
        df = df.explode("area", ignore_index=True)

        # Start with hard-coded lookup
        names_lookup_dict = HARD_CODED_CONSTITUENCY_LOOKUP.copy()
        for i, names_df in df.groupby("index"):
            new_dict = self.add_to_dict(names_df)
            if new_dict:
                names_lookup_dict.update(new_dict)

        return names_lookup_dict

    def get_label(self, config):
        return config["defaults"]["label"]

    def delete_data(self):
        if self.skip_delete:
            return

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
            data_set_name = name
            if config["defaults"].get("data_set_name"):
                data_set_name = config["defaults"]["data_set_name"]
                del config["defaults"]["data_set_name"]

            data_set_label = label
            if config["defaults"].get("data_set_label"):
                data_set_label = config["defaults"]["data_set_label"]
                del config["defaults"]["data_set_label"]

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
                name=data_set_name,
                defaults={
                    **config["defaults"],
                    "label": data_set_label,
                },
            )
            data_set.areas_available.add(self.get_area_type())
            self.add_object_to_site(data_set)

            type_defaults = {}
            if config["defaults"].get("order"):
                type_defaults["order"] = config["defaults"]["order"]
            data_type, created = DataType.objects.update_or_create(
                data_set=data_set,
                name=name,
                area_type=self.get_area_type(),
                defaults={
                    "data_type": config["defaults"]["data_type"],
                    "label": label,
                    **type_defaults,
                },
            )

            self.data_types[name] = data_type

    def _fill_empty_entries(self):
        for data_type in self.data_types.values():
            datum_example = AreaData.objects.filter(data_type=data_type).first()
            if (
                data_type.data_type
                in [
                    "integer",
                    "float",
                    "percent",
                    "boolean",
                ]
                and data_type.data_set.table == "areadata"
                and data_type.data_set.fill_blanks
                and datum_example is not None
            ):
                value = 0
                if datum_example.float:
                    key = "float"
                elif datum_example.int:
                    key = "int"
                elif datum_example.is_boolean:
                    key = "bool"
                    value = False
                else:
                    key = "data"
                defaults = {key: value}
                areas_with_values = [
                    areadata.area.name
                    for areadata in AreaData.objects.filter(data_type=data_type)
                ]
                # If some countries are set to be excluded, their values should not be filled in
                excluded_countries = (
                    data_type.data_set.exclude_countries + self.skip_countries
                )
                if excluded_countries != []:
                    for country in excluded_countries:
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

    def get_df(self) -> Optional[pd.DataFrame]:
        raise NotImplementedError()

    def process_data(self, df: pd.DataFrame):
        raise NotImplementedError()

    def handle(self, *args, **kwargs):
        super(BaseAreaImportCommand, self).handle(*args, **kwargs)
        df = self.get_df()
        if df is None or df.empty:
            if not self._quiet:
                self.stdout.write(f"missing data for {self.message} ({self.area_type})")
            return
        self.add_data_sets(df)
        self.delete_data()
        self.process_data(df)
        self.update_averages()
        self.update_max_min()
        self.convert_to_new_con()


class BaseImportFromDataFrameCommand(BaseAreaImportCommand):
    uses_gss = True

    def get_row_data(self, row, conf):
        return row[conf["col"]]

    def get_person_from_row(self, row, area):
        raise NotImplementedError()

    def add_data(self, dt, area, defaults, row):
        if dt.data_set.table == "areadata":
            data, created = AreaData.objects.update_or_create(
                data_type=dt,
                area=area,
                defaults=defaults,
            )
        elif dt.data_set.table == "people__persondata":
            person = self.get_person_from_row(row, area)
            data, created = PersonData.objects.update_or_create(
                data_type=dt,
                person=person,
                defaults=defaults,
            )

        return data, created

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write(self.message)

        areas_to_skip = None
        if self.skip_countries:
            areas_to_skip = list(
                AreaData.objects.filter(
                    data_type__name="country",
                    data__in=self.skip_countries,
                    area__area_type__code=self.area_type,
                ).values_list("area_id", flat=True)
            )

        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            if type(self.cons_row) is int:
                cons = row.iloc[self.cons_row]
            else:
                cons = row[self.cons_row]

            if not pd.isna(cons):
                if self.uses_gss:
                    area = Area.get_by_gss(cons, area_type=self.area_type)
                else:
                    cons = cons.replace(" & ", " and ")
                    cons = self.cons_map.get(cons, cons)
                    area = Area.get_by_name(cons, area_type=self.area_type)

            if area is None:
                if self.uses_gss:
                    self.stdout.write(f"Failed to find area with code {cons}")
                else:
                    self.stdout.write(f"no matching area for {cons}")
                continue

            if areas_to_skip and area.pk in areas_to_skip:
                continue

            try:
                for name, conf in self.data_sets.items():
                    if self.data_types[name].data_type in ["json", "url"]:
                        defaults = {"json": self.get_row_data(row, conf)}
                    elif self.data_types[name].data_type == "boolean":
                        defaults = {"bool": self.get_row_data(row, conf)}
                    else:
                        defaults = {"data": self.get_row_data(row, conf)}

                    area_data, created = self.add_data(
                        self.data_types[name], area, defaults, row
                    )

            except Exception as e:
                print(f"issue with {cons}: {e}")
                break

    def get_dataframe(self) -> Optional[pd.DataFrame]:
        raise NotImplementedError()

    def get_df(self):
        return self.get_dataframe()

    def handle(
        self,
        skip_new_areatype_conversion=False,
        *args,
        **options,
    ):
        if not hasattr(self, "do_not_convert"):
            self.do_not_convert = skip_new_areatype_conversion
        super(BaseImportFromDataFrameCommand, self).handle(*args, **options)


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

    def process_data(self, df: pd.DataFrame):
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

    def handle(self, *args, **kwargs):
        super(BaseConstituencyGroupListImportCommand, self).handle(*args, **kwargs)


class BaseConstituencyCountImportCommand(BaseAreaImportCommand):
    do_not_convert = True

    def set_data_type(self):
        self.data_type = list(self.data_types.values())[0]

    def get_df(self):
        if not self.data_file.exists():
            return None

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
        if not hasattr(self, "data_type"):
            self.set_data_type()

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

    def handle(self, *args, **options):
        super(BaseConstituencyCountImportCommand, self).handle(*args, **options)


class BaseMPAPPGMembershipImportCommand(BaseImportCommand):
    source_base = "https://pages.mysociety.org/appg-membership/data/appg_groups_and_memberships/latest/"
    register_source = source_base + "register.parquet"
    categories_source = source_base + "categories.parquet"
    members_source = source_base + "members.parquet"

    def create_data_type(self, appgs):
        appgs.sort(key=lambda x: x.replace("'", ""))
        options = [dict(title=appg, shader="#DCDCDC") for appg in appgs]

        appg_membership_ds, created = DataSet.objects.update_or_create(
            name="mp_appg_memberships",
            defaults={
                "data_type": "text",
                "description": self.description,
                "release_date": str(date.today()),
                "label": self.label,
                "source_label": self.source_label,
                "source": self.source,
                "table": "people__persondata",
                "options": options,
                "is_shadable": False,
                "comparators": DataSet.in_comparators(),
            },
        )
        self.add_object_to_site(appg_membership_ds)

        for at in AreaType.objects.filter(code__in=["WMC23"]):
            appg_membership_ds.areas_available.add(at)

        appg_membership, created = DataType.objects.update_or_create(
            data_set=appg_membership_ds,
            name="mp_appg_memberships",
            defaults={"data_type": "text"},
        )

        return appg_membership

    def add_results(self, results, data_type):
        self.stdout.write("Adding APPG data to Django database")
        for mp, result in tqdm(results, disable=self._quiet):
            data, created = PersonData.objects.update_or_create(
                person=mp,
                data_type=data_type,
                data=result,
            )

    def get_results(self):
        con = duckdb.connect(":default:")

        con.sql(
            f"CREATE OR REPLACE VIEW tbl_register as (select * from '{self.register_source}')"
        )
        con.sql(
            f"CREATE OR REPLACE VIEW tbl_categories as (select * from '{self.categories_source}')"
        )
        con.sql(
            f"CREATE OR REPLACE VIEW tbl_members as (select * from '{self.members_source}')"
        )

        results = con.sql(
            f"""
            SELECT
                tbl_members.name, tbl_members.twfy_id, tbl_register.title
            FROM tbl_members
            JOIN tbl_categories ON tbl_members.appg = tbl_categories.appg_slug
            JOIN tbl_register ON tbl_members.appg = tbl_register.slug
            WHERE
                member_type = 'mp' AND
                category_slug = '{self.category_slug}'
        """
        )

        twfy_ids = PersonData.objects.filter(data_type__data_set__name="twfyid")
        data = []
        appgs = set()
        for r in results.fetchall():
            if r[1] is None:
                self.stderr.write(f"No id found for {r[0]}")
                continue
            try:
                mp = twfy_ids.filter(data=r[1][25:]).first().person
            except AttributeError:
                self.stderr.write(f"Failed to match MP {r[0]} ({r[1]})")
                continue
            data.append((mp, r[2]))
            appgs.add(r[2])

        return data, list(appgs)

    def handle(self, *args, **options):
        super(BaseMPAPPGMembershipImportCommand, self).handle(*args, **options)
        results, appgs = self.get_results()
        data_type = self.create_data_type(appgs)
        self.add_results(results, data_type)
