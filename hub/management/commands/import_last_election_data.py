from django.conf import settings
from django.core.management.base import BaseCommand

import numpy as np
import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType


class Command(BaseCommand):
    help = "Import data from the last election"

    # https://commonslibrary.parliament.uk/research-briefings/cbp-8749/
    # https://researchbriefings.files.parliament.uk/documents/CBP-8749/HoC-GE2019-results-by-constituency-csv.csv
    general_election_source_file = (
        settings.BASE_DIR / "data" / "2019_general_election.csv"
    )
    # https://commonslibrary.parliament.uk/research-briefings/cbp-9225/
    # https://researchbriefings.files.parliament.uk/documents/CBP-9225/Data-file.xlsx
    by_election_source_file = settings.BASE_DIR / "data" / "byelections.xlsx"

    party_translate_down_dict = {
        "Conservative": "con",
        "Labour": "lab",
        "Green": "green",
        "Liberal Democrats": "ld",
        "Liberal Democrat": "ld",
        "Social Democratic": "sdlp",
        "Conservative Party": "con",
        "Labour Party": "lab",
        "Green Party": "green",
        "Reform UK": "brexit",
        "SNP": "snp",
    }

    party_translate_up_dict = {
        "lab": "Labour Party",
        "snp": "Scottish National Party",
        "ld": "Liberal Democrats",
        "ind": "independent politician",
        "alliance": "Alliance Party of Northern Ireland",
        "sdlp": "Social Democratic and Labour Party",
        "pc": "Plaid Cymru",
        "sf": "Sinn Féin",
        "spk": "Speaker of the House of Commons",
        "brexit": "Reform UK",
        "other": "Other",
        "dup": "Democratic Unionist Party",
        "uup": "Ulster Unionist Party",
        "con": "Conservative Party",
        "green": "Green Party of England and Wales",
        "pbpa": "People Before Profit Alliance",
    }

    party_options = [
        {"title": "Alba Party", "shader": "#005EB8"},
        {"title": "Alliance Party of Northern Ireland", "shader": "#F6CB2F"},
        {"title": "Conservative Party", "shader": "#0087DC"},
        {"title": "Democratic Unionist Party", "shader": "#D46A4C"},
        {"title": "Green Party of England and Wales", "shader": "#6AB023"},
        {"title": "Labour Co-operative", "shader": "#E4003B"},
        {"title": "Labour Party", "shader": "#E4003B"},
        {"title": "Liberal Democrats", "shader": "#FAA61A"},
        {"title": "Plaid Cymru", "shader": "#005B54"},
        {"title": "Scottish National Party", "shader": "#FDF38E"},
        {"title": "Sinn Féin", "shader": "#326760"},
        {"title": "Social Democratic and Labour Party", "shader": "#2AA82C"},
        {"title": "Speaker of the House of Commons", "shader": "#DCDCDC"},
        {"title": "independent politician", "shader": "#DCDCDC"},
    ]

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.delete_data()
        df = self.get_last_election_df()
        self.data_types = self.create_data_types()
        self.import_results(df)

    def get_general_election_data(self):
        df = pd.read_csv(
            self.general_election_source_file,
            usecols=[
                "ons_id",
                "first_party",
                "second_party",
                "con",
                "lab",
                "ld",
                "brexit",
                "green",
                "snp",
                "pc",
                "dup",
                "sf",
                "sdlp",
                "uup",
                "alliance",
                "other",
                "other_winner",
            ],
        )
        df["date"] = "2019-12-12"
        df["spk"] = df.other_winner
        df.other = df.other - df.spk
        df = df.drop(columns="other_winner")
        df = df.set_index("ons_id")
        return df

    def get_by_elections_data(self):
        gss_lookup = {
            row["Constituency name"].lower(): row["ONS_id"]
            for index, row in pd.read_excel(
                self.by_election_source_file,
                skiprows=1,
                usecols=["ONS_id", "Constituency name"],
            ).iterrows()
        }
        df = pd.read_excel(
            self.by_election_source_file,
            sheet_name=1,
            skiprows=1,
            usecols=["Party", "Constituency", "Date of By-election", "Votes_by"],
        )
        df["Constituency"] = df["Constituency"].apply(
            lambda name: gss_lookup[name.lower()]
        )
        df.columns = ["party", "gss", "date", "votes"]
        first_second_parties = []
        for gss, data in df.groupby("gss"):
            votes = sorted(data.votes.tolist())
            first = votes.pop()  # NOQA
            second = votes.pop()  # NOQA
            first_party = data.query("votes == @first").iloc[0, 0]
            second_party = data.query("votes == @second").iloc[0, 0]
            first_second_parties.append([gss, first_party, second_party])
        first_second_parties_df = pd.DataFrame(
            first_second_parties, columns=["gss", "first_party", "second_party"]
        ).set_index("gss")
        df.party = df.party.apply(
            lambda x: self.party_translate_down_dict.get(x, "other")
        )
        df = (
            df.groupby(["gss", "date"], group_keys=True)
            .apply(
                lambda x: x.groupby("party", group_keys=False).sum(numeric_only=True).T
            )
            .fillna(0)
            .reset_index()
            .drop(columns="level_2")
        )
        df = df.set_index("gss")
        df.date = df.date.astype(str)
        df = df.join(first_second_parties_df)
        return df

    def get_last_election_df(self):
        df = self.get_general_election_data()
        be_df = self.get_by_elections_data()
        # Remove the election results from the general election df, where there has been a by-election since
        cols = df.columns.to_list()[1:]
        df.loc[be_df.index, cols] = np.nan
        # Patch in the by-election results where null values have been found
        df = df.combine_first(be_df)
        df = df.fillna(0)
        cols = [col for col in df.columns if "party" not in col and "date" not in col]
        df[cols] = df[cols].astype(int)
        df.second_party = df.second_party.apply(
            lambda party: self.party_translate_up_dict.get(party.lower(), party)
        )
        df = df.rename(
            columns=lambda party: self.party_translate_up_dict.get(party.lower(), party)
        )
        return df

    def create_data_types(self):
        second_party_ds, created = DataSet.objects.update_or_create(
            name="second_party",
            defaults={
                "data_type": "text",
                "description": "The parliamentary party who came second in this constituency’s most recent election or by-election",
                "label": "Second placed party at most recent election",
                "category": "opinion",
                "source_label": "UK Parliament",
                "source": "https://parliament.uk/",
                "table": "areadata",
                "options": self.party_options,
                "is_filterable": True,
                "comparators": DataSet.in_comparators(),
            },
        )

        second_party, created = DataType.objects.update_or_create(
            data_set=second_party_ds,
            name="second_party",
            defaults={"data_type": "text"},
        )

        last_election_ds, created = DataSet.objects.update_or_create(
            name="last_election",
            defaults={
                "data_type": "json",
                "description": "The results of the last parliamentary election held in this constituency",
                "label": "Results of last election",
                "source_label": "UK Parliament",
                "source": "https://parliament.uk/",
                "category": "opinion",
                "table": "areadata",
                "is_filterable": False,
            },
        )

        last_election, created = DataType.objects.update_or_create(
            data_set=last_election_ds,
            name="last_election",
            defaults={"data_type": "json"},
        )

        return {"second_party": second_party, "last_election": last_election}

    def import_results(self, df):
        if not self._quiet:
            print("Adding 'second party' data to database")
        for gss, party in tqdm(df.second_party.items(), disable=self._quiet):
            try:
                area = Area.objects.get(gss=gss)
                data, created = AreaData.objects.update_or_create(
                    area=area, data_type=self.data_types["second_party"], data=party
                )
            except Area.DoesNotExist:
                print(f"Area with GSS code: {str(gss)} doesn't exist.")
        if not self._quiet:
            print("Adding 'last election' data to database")
        for gss, dataset in tqdm(df.iterrows(), disable=self._quiet):
            try:
                area = Area.objects.get(gss=gss)
                json_data = {
                    "date": dataset.date,
                    "results": [
                        {"party": k, "votes": v}
                        for k, v in dataset.drop(
                            ["first_party", "second_party", "date"]
                        )
                        .to_dict()
                        .items()
                    ],
                }
                data, created = AreaData.objects.update_or_create(
                    area=area,
                    data_type=self.data_types["last_election"],
                    json=json_data,
                )
            except Area.DoesNotExist:
                print(f"Area with GSS code: {str(gss)} doesn't exist.")

    def delete_data(self):
        AreaData.objects.filter(data_type__name="second_party").delete()
        AreaData.objects.filter(data_type__name="last_election").delete()
