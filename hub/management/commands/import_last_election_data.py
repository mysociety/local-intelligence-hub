import re
from datetime import date

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils.text import slugify

import numpy as np
import pandas as pd
import requests
from dateutil import parser
from tqdm import tqdm

from hub.models import Area, AreaData, AreaType, DataSet, DataType

from .base_importers import party_shades


class Command(BaseCommand):
    help = "Import data from the last election"
    source_url = "https://commonslibrary.parliament.uk/tag/elections-data/"

    # https://researchbriefings.files.parliament.uk/documents/CBP-10009/HoC-GE2024-results-by-constituency.csv
    # https://commonslibrary.parliament.uk/research-briefings/cbp-8749/
    # https://researchbriefings.files.parliament.uk/documents/CBP-8749/HoC-GE2019-results-by-constituency-csv.csv
    general_election_source_file = (
        settings.BASE_DIR / "data" / "2024_general_election.csv"
    )

    by_election_api_url = "https://lda.data.parliament.uk/electionresults.json?_sort=-election.date&_pageSize=40"

    area_type = "WMC23"

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
        "Reform UK": "ruk",
        "SNP": "snp",
    }

    party_translate_up_dict = {
        "lab": "Labour Party",
        "snp": "Scottish National Party",
        "ld": "Liberal Democrats",
        "ind": "Independents",
        "alliance": "Alliance Party of Northern Ireland",
        "sdlp": "Social Democratic and Labour Party",
        "pc": "Plaid Cymru",
        "sf": "Sinn Féin",
        "spk": "Speaker of the House of Commons",
        "brexit": "Reform UK",
        "ruk": "Reform UK",
        "other": "Other",
        "dup": "Democratic Unionist Party",
        "uup": "Ulster Unionist Party",
        "con": "Conservative Party",
        "green": "Green Party",
        "pbpa": "People Before Profit Alliance",
    }

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.delete_data()
        df = self.get_last_election_df()
        if df.empty is not True:
            self.data_types = self.create_data_types()
            self.import_results(df)

    def get_area_type(self):
        return AreaType.objects.get(code=self.area_type)

    def get_general_election_data(self):

        df = pd.read_csv(
            self.general_election_source_file,
        )
        df.columns = df.columns.str.lower()
        df.columns = [slugify(col).replace("-", "_") for col in df.columns]
        df["date"] = "2024-04-04"
        df["spk"] = df.of_which_other_winner
        df["other"] = df.all_other_candidates - df.spk
        df = df.drop(
            columns=[
                "of_which_other_winner",
                "ons_region_id",
                "constituency_name",
                "county_name",
                "region_name",
                "country_name",
                "constituency_type",
                "declaration_time",
                "member_first_name",
                "member_surname",
                "member_gender",
                "result",
                "electorate",
                "valid_votes",
                "invalid_votes",
                "majority",
                "all_other_candidates",
            ]
        )
        df = df.set_index("ons_id")
        return df

    def get_by_elections_data(self):
        response = requests.get(self.by_election_api_url)

        by_election_data = {}

        if response.status_code == 200:
            elections = response.json()
            election_ids = []
            for election in elections["result"]["items"]:
                desc = election["election"]["label"]["_value"]
                if desc == "2024 General Election" or desc == "02-May-2024 By-election":
                    break
                election_id = election["_about"]
                election_id = election_id.replace(
                    "http://data.parliament.uk/resources/", ""
                )
                election_ids.append(election_id)

            for election_id in election_ids:
                uri = (
                    f"https://lda.data.parliament.uk/electionresults/{election_id}.json"
                )
                election_response = requests.get(uri)
                if election_response.status_code == 200:
                    election_data = election_response.json()
                    election_data = election_data["result"]["primaryTopic"]
                    label = election_data["election"]["label"]["_value"]
                    election_date = re.match(r"(\d+-\w+-\d+) .*", label)
                    election_date = election_date.group(1)
                    election_date = parser.parse(election_date)
                    cons = election_data["constituency"]["label"]["_value"]
                    a = Area.get_by_name(cons)

                    result = {
                        "date": election_date.date().isoformat(),
                        # "uri": uri,
                        # "label": election_data["election"]["label"]["_value"],
                        # "Constituency": a.gss,
                        # "Constituency name": cons,
                    }

                    for candidate in election_data["candidate"]:
                        party = candidate["party"]["_value"].lower()
                        party_name = self.party_translate_up_dict.get(party, "other")

                        # consolidate the minor parties
                        if party_name == "other":
                            count = result.get("other", 0)
                            count = count + candidate["numberOfVotes"]
                            result["other"] = count
                        else:
                            result[party] = candidate["numberOfVotes"]

                    sorted_results = sorted(
                        election_data["candidate"],
                        key=lambda c: c["numberOfVotes"],
                        reverse=True,
                    )
                    result["first_party"] = self.party_translate_up_dict.get(
                        sorted_results[0]["party"]["_value"].lower(),
                        sorted_results[0]["party"]["_value"].lower(),
                    )
                    result["second_party"] = self.party_translate_up_dict.get(
                        sorted_results[1]["party"]["_value"].lower(),
                        sorted_results[1]["party"]["_value"].lower(),
                    )

                    by_election_data[a.gss] = result

        df = pd.DataFrame.from_dict(by_election_data, orient="index")

        return df

    def get_last_election_df(self):
        if self.general_election_source_file.exists() is False:
            return None
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
                "release_date": str(date.today()),
                "source_label": "Data from UK Parliament.",
                "source": "https://parliament.uk/",
                "table": "areadata",
                "options": [
                    {"title": party, "shader": shade}
                    for party, shade in party_shades.items()
                ],
                "is_filterable": True,
                "comparators": DataSet.in_comparators(),
            },
        )
        second_party_ds.areas_available.add(self.get_area_type())

        second_party, created = DataType.objects.update_or_create(
            data_set=second_party_ds,
            name="second_party",
            area_type=self.get_area_type(),
            defaults={"data_type": "text"},
        )

        last_election_ds, created = DataSet.objects.update_or_create(
            name="last_election",
            defaults={
                "data_type": "json",
                "description": "The results of the last parliamentary election held in this constituency",
                "label": "Results of last election",
                "release_date": str(date.today()),
                "source_label": "Data from UK Parliament.",
                "source": "https://parliament.uk/",
                "category": "opinion",
                "table": "areadata",
                "is_filterable": False,
            },
        )

        last_election_ds.areas_available.add(self.get_area_type())

        last_election, created = DataType.objects.update_or_create(
            data_set=last_election_ds,
            name="last_election",
            area_type=self.get_area_type(),
            defaults={"data_type": "json"},
        )

        return {"second_party": second_party, "last_election": last_election}

    def import_results(self, df):
        if not self._quiet:
            print("Adding 'second party' data to database")
        for gss, party in tqdm(df.second_party.items(), disable=self._quiet):
            area = Area.get_by_gss(gss, area_type=self.area_type)
            if area is not None:
                data, created = AreaData.objects.update_or_create(
                    area=area, data_type=self.data_types["second_party"], data=party
                )
            else:
                print(
                    f"Area with GSS code: {str(gss)} doesn't exist for area type {self.area_type}."
                )
        if not self._quiet:
            print("Adding 'last election' data to database")
        for gss, dataset in tqdm(df.iterrows(), disable=self._quiet):
            try:
                area = Area.get_by_gss(gss, area_type=self.area_type)
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
