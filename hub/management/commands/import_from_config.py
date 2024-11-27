from django.conf import settings

import pandas as pd

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import based on config"

    config_file = settings.BASE_DIR / "conf" / "imports.csv"

    defaults_cols = [
        "label",
        "data_type",
        "category",
        "subcategory",
        "release_date",
        "source_label",
        "source",
        "source_type",
        "data_url",
        "table",
        "default_value",
        "exclude_countries",
        # "comparators",
        "unit_type",
        "unit_distribution",
        "fill_blanks",
    ]

    def add_arguments(self, parser):
        super().add_arguments(parser)

        parser.add_argument(
            "--import_name", action="store", required=True, help="Name of import to run"
        )

    def setup(self, import_name):
        df = pd.read_csv(self.config_file)

        df.loc[df["name"] == import_name]
        row = df.iloc[0]

        self.message = f"Importing {row['label']}"
        self.cons_row = row["constituency_col"]
        self.cons_col = row["constituency_col"]
        self.data_file = settings.BASE_DIR / "data" / row["data_file"]
        self.file_type = row["file_type"]
        self.area_type = row["area_type"]
        self.header_row = row["header_row"]
        self.sheet = row["sheet"]

        if row["uses_gss"]:
            self.uses_gss = True
        else:
            self.uses_gss = False

        try:
            self.cons_col = int(self.cons_col)
            self.cons_row = int(self.cons_row)
        except ValueError:
            pass

        defaults = {}

        for col in self.defaults_cols:
            defaults[col] = row[col]

        self.data_sets = {import_name: {"defaults": defaults, "col": row["data_col"]}}

    def get_dataframe(self):
        if self.file_type == "csv":
            df = pd.read_csv(self.data_file)
        elif self.file_type == "excel":
            kwargs = {}
            if not pd.isna(self.sheet):
                kwargs["sheet_name"] = self.sheet
            if not pd.isna(self.header_row):
                kwargs["header"] = int(self.header_row)
            df = pd.read_excel(self.data_file, **kwargs)
        else:
            self.stderr.write(f"Unknown file type: {self.file_type}")
            return None

        if type(self.get_cons_col()) != int:
            df = df.astype({self.get_cons_col(): "str"})
        return df

    def handle(
        self,
        quiet=False,
        skip_new_areatype_conversion=False,
        import_name=None,
        *args,
        **options,
    ):
        self.setup(import_name)

        super().handle(quiet, skip_new_areatype_conversion, *args, **options)
