from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType


class Command(BaseCommand):
    help = "Import data about ethnicity"

    source_url = (
        "https://commonslibrary.parliament.uk/constituency-statistics-ethnicity/"
    )
    data_url = "https://data.parliament.uk/resources/constituencystatistics/PowerBIData/Census%202021/ethnicity_2021census.xlsx"

    message = "Importing constituency ethnicity data"
    defaults = {
        "label": "Ethnicity",
        "description": "Ethnicity as of the 2021 census (England and Wales)",
        "data_type": "percent",
        "category": "place",
        "release_date": "2021",
        "source_label": "Data From House of Commons Library",
        "is_range": True,
        "source": source_url,
        "source_type": "xlxs",
        "data_url": data_url,
        "table": "areadata",
        "exclude_countries": ["Scotland", "Northern Ireland"],
        "comparators": DataSet.numerical_comparators(),
        "default_value": 10,
        "is_shadable": False,
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        self.data_types = self.create_data_types(df)
        self.delete_data()
        self.import_data(df)

    def create_data_types(self, df):
        if not self._quiet:
            self.stdout.write("Creating dataset + types")
        data_set, created = DataSet.objects.update_or_create(
            name="consituency_ethnicity", defaults=self.defaults
        )
        data_types = []
        for col in tqdm(df.columns, disable=self._quiet):
            if col != "gss":
                data_type, created = DataType.objects.update_or_create(
                    data_set=data_set,
                    name=f"eth_{self.machine_readable_names[col]}",
                    defaults={
                        "data_type": "percent",
                        "label": col,
                        "description": f"Percentage of population who identified their ethnic group as f{col}",
                    },
                )
                data_types.append(data_type)
        return data_types

    def import_data(self, df):
        if not self._quiet:
            self.stdout.write("Importing ethnicity data")
        for index, row in tqdm(df.iterrows(), disable=self._quiet):
            try:
                area = Area.objects.get(gss=row.gss)
            except Area.DoesNotExist:
                self.stdout.write(f"Failed to find area with code {row.gss}")
                continue
            for data_type in self.data_types:
                AreaData.objects.create(
                    data_type=data_type,
                    area=area,
                    data=row[self.machine_readable_backwards[data_type.name[4:]]],
                )
        for col in df.columns:
            if col != "gss":
                average = df[col].mean()
                data_type = DataType.objects.get(
                    name=f"eth_{self.machine_readable_names[col]}"
                )
                data_type.average = average
                data_type.save()

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types).delete()

    def get_dataframe(self):
        df = pd.read_excel(
            self.data_url,
            sheet_name="eth_con",
            usecols=["ONSConstID", "ethnic_groups", "Con_pc"],
        )
        ethnic_groups = df.ethnic_groups.drop_duplicates().to_list()
        self.machine_readable_names = {
            group: group.lower().replace(" or ", " ").replace(" ", "_").replace(",", "")
            for group in ethnic_groups
        }
        self.machine_readable_backwards = {
            value: key for key, value in self.machine_readable_names.items()
        }

        df.columns = ["gss", "var", "val"]
        df.val = df.val * 100
        df = df.set_index("gss").pivot(columns=["var"], values="val").reset_index()

        return df
