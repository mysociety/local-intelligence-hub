from collections import defaultdict

from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
import requests
from tqdm import tqdm

from hub.models import AreaData


class Command(BaseCommand):
    message = "generating combined police data csv"
    out_file = settings.BASE_DIR / "data" / "combined_police_data.csv"

    rape_out = settings.BASE_DIR / "data" / "evaw_e_w_rape_data.ods"
    scotland_out = settings.BASE_DIR / "data" / "evaw_scotland_police_stats.xlsx"

    e_and_w_rape_stats = "https://assets.publishing.service.gov.uk/media/68079f158c1316be7978e6d4/prc-rape-incidents-2016-2024.ods"
    # this is https://assets.publishing.service.gov.uk/media/687f9242f2ecaeb756d0e1f6/prc-pfa-mar2013-onwards-tables-240725.ods
    # which is then uploaded to google sheets and then downloaded as excel as the pandas ods reader falls over when it tries to read it
    e_and_w_all_stats = "data/prc-pfa-mar2013-onwards-tables-231025.xlsx"
    scotland_stats = "https://www.gov.scot/binaries/content/documents/govscot/publications/statistics/2025/06/recorded-crime-scotland-2024-25/documents/recorded-crime-in-scotland-2024-25-tables/recorded-crime-in-scotland-2024-25-tables/govscot%3Adocument/Recorded%2BCrime%2Bin%2BScotland%2B2024-25%2Btables.xlsx"

    tqdm.pandas()

    force_map = {
        "Metropolitan Police[Note 6]": "Metropolitan Police",
        "Metropolitan Police [Note 6]": "Metropolitan Police",
        "City of London": "London, City of",
        "Devon & Cornwall": "Devon and Cornwall",
        "Devon and Cornwall ": "Devon and Cornwall",
    }

    skip_names = ["England and Wales", "British Transport Police"]

    year_columns = {
        2020: {
            "scotland": 5,
            "england_sheet": "2019_20",
            "england_match": "2019/20",
        },
        2021: {
            "scotland": 6,
            "england_sheet": "2020_21",
            "england_match": "2020/21",
        },
        2022: {
            "scotland": 7,
            "england_sheet": "2021_22",
            "england_match": "2021/22",
        },
        2023: {
            "scotland": 8,
            "england_sheet": "2022_23",
            "england_match": "2022/23",
        },
        2024: {
            "scotland": 9,
            "england_sheet": "2023_24",
            "england_match": "2023/24",
        },
        2025: {
            "scotland": 10,
            "england_sheet": "2024_25",
            "england_match": "2024/25",
        },
    }

    def get_data(self):
        response = requests.get(self.e_and_w_rape_stats)
        with open(self.rape_out, "wb") as f:
            f.write(response.content)

        response = requests.get(self.scotland_stats)
        with open(self.scotland_out, "wb") as f:
            f.write(response.content)

    def get_dataframe(self):
        df = pd.read_excel(self.e_and_w_all_stats, sheet_name="2024_25")

        df = df[
            (df["Offence Description"] == "Sexual assault on a female aged 13 and over")
            | (df["Offence Description"] == "Sexual assault on a female child under 13")
        ]

        return df

    def create_force_entry(self, data, force):
        force_name = self.force_map.get(force, force)
        if force_name not in data:
            data[force_name] = {"force": force_name}

    def process_data(self):
        if not self._quiet:
            self.stdout.write("processing stats")

        force_data = {}
        for year, conf in self.year_columns.items():
            df = pd.read_excel(self.e_and_w_all_stats, sheet_name=conf["england_sheet"])

            df = df[
                (
                    df["Offence Description"]
                    == "Sexual assault on a female aged 13 and over"
                )
                | (
                    df["Offence Description"]
                    == "Sexual assault on a female child under 13"
                )
            ]

            data = defaultdict(int)

            for _, row in df.iterrows():
                data[row["Force Name"]] += row["Number of Offences"]

            for force, count in data.items():
                force_name = self.force_map.get(force, force)
                if force_name in self.skip_names:
                    continue
                population = AreaData.objects.get(
                    area__area_type__code="PFA",
                    area__name=force_name,
                    data_type__name="council_population_count",
                )
                ratio = population.value() / 100000
                per_100k = 0
                if ratio > 0:
                    per_100k = count / ratio
                self.create_force_entry(force_data, force_name)
                force_data[force_name][f"assaults in {year}"] = count
                force_data[force_name][f"assaults per 100k in {year}"] = per_100k

            df = pd.read_excel(self.rape_out, sheet_name="Table_1")
            df = df[df.iloc[:, 0] == conf["england_match"]]
            for _, row in df.iterrows():
                force_name = self.force_map.get(row.iloc[1], row.iloc[1])
                if force_name in self.skip_names:
                    continue
                if type(row.iloc[2]) is not int:
                    continue
                force_data[force_name][f"rapes in {year}"] = row.iloc[2]

            df = pd.read_excel(self.rape_out, sheet_name="Table_2")
            df = df[df.iloc[:, 0] == conf["england_match"]]
            for _, row in df.iterrows():
                force_name = self.force_map.get(row.iloc[1], row.iloc[1])
                if force_name in self.skip_names:
                    continue
                if type(row.iloc[2]) is not float:
                    continue
                force_data[force_name][f"rapes per 100k in {year}"] = row.iloc[2]

            df = pd.read_excel(self.scotland_out, sheet_name="Table_A5")
            df = df[
                (df.iloc[:, 0] == "   Sexual assault of female (16+)")
                | (df.iloc[:, 0] == "   Sexual assault of female under 16")
            ]

            count = 0
            for _, row in df.iterrows():
                count += row.iloc[conf["scotland"]]

            self.create_force_entry(force_data, "Scotland")
            force_data["Scotland"][f"assaults in {year}"] = count
            force_data["Scotland"][f"assaults per 100k in {year}"] = count / 54.66

            df = pd.read_excel(self.scotland_out, sheet_name="Table_A5")
            df = df[
                (df.iloc[:, 0] == "   Rape and attempted rape of female (16+)")
                | (df.iloc[:, 0] == "   Rape and attempted rape of female under 16")
            ]

            count = 0
            for _, row in df.iterrows():
                count += row.iloc[conf["scotland"]]

            force_data["Scotland"][f"rapes in {year}"] = count
            # number derived from dividing council count from hub by 100k
            force_data["Scotland"][f"rapes per 100k in {year}"] = count / 54.66

        all_data = []
        for data in force_data.values():
            all_data.append(data)

        df = pd.DataFrame(all_data)
        return df

    def save_data(self, df):
        df.to_csv(self.out_file, index=False)

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )
        parser.add_argument(
            "-i", "--ignore", action="store_true", help="Ignore existing data file"
        )

    def _setup(self, *args, **kwargs):
        pass

    def handle(self, quiet=False, ignore=False, *args, **options):
        self._quiet = quiet

        if not self._quiet:
            self.stdout.write(self.message)
        self._ignore = ignore
        self._setup(*args, **options)
        # self.get_data()
        out_df = self.process_data()
        self.save_data(out_df)
