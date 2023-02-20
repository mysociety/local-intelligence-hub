from django.core.management.base import BaseCommand

import requests
from tqdm import tqdm

from hub.models import DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import relevant MP votes + support on amendments, etc"

    vote_division_ids = [1116, 1372]
    early_day_motion_ids = [58953, 60083]

    vote_api_url = "https://commonsvotes-api.parliament.uk/data/division/"
    edm_api_url = "https://oralquestionsandmotions-api.parliament.uk/EarlyDayMotion/"

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        # Relevant votes
        if not quiet:
            print("Getting relevant votes from Parliament API")
        votes = self.get_all_relevant_votes()

        if not quiet:
            print("Getting relevant data on EDMs from Parliament API")
        edms = self.get_all_edms()

        self.data_types = self.create_data_types(votes, edms)
        self.import_results(votes, edms)

    def get_votes(self, division_id):
        api_url = self.vote_api_url + str(division_id) + ".json"
        response = requests.get(api_url)
        if response.status_code == 200:
            data = response.json()
            vote_name = data["Title"].split(":")[0]
            aye_members = [str(member["MemberId"]) for member in data["Ayes"]]
            no_members = [str(member["MemberId"]) for member in data["Noes"]]
            abstaining_members = [
                str(member["MemberId"]) for member in data["NoVoteRecorded"]
            ]
            vote_dict = {
                "id": division_id,
                "vote_name": vote_name,
            }
            for member in aye_members:
                vote_dict[member] = "Aye"
            for member in no_members:
                vote_dict[member] = "No"
            for member in abstaining_members:
                vote_dict[member] = "Did not vote"
            return vote_dict
        else:
            print(
                f"Parliament API didn't work - returned code: {str(response.status_code)}"
            )
            return None

    def get_edm(self, edm_id):
        api_url = self.edm_api_url + str(edm_id)
        response = requests.get(api_url)
        if response.status_code == 200:
            data = response.json()["Response"]
            edm_name = data["Title"]
            supporters = [str(member["MemberId"]) for member in data["Sponsors"]]
            edm_dict = {
                "id": edm_id,
                "edm_name": edm_name,
                "supporters": supporters,
            }
            return edm_dict
        else:
            print(
                f"Parliament API didn't work - returned code: {str(response.status_code)}"
            )
            return None

    def get_all_relevant_votes(self):
        votes = []
        for division_id in self.vote_division_ids:
            new_vote_data = self.get_votes(division_id)
            if new_vote_data:
                votes.append(new_vote_data)
        return votes

    def get_all_edms(self):
        edms = []
        for edm_id in self.early_day_motion_ids:
            new_edm_data = self.get_edm(edm_id)
            if new_edm_data:
                edms.append(new_edm_data)
        return edms

    def get_machine_name(self, item):
        item_id = str(item["id"])
        if "edm_name" in item:
            return f"{item_id}_edm"
        else:
            return f"{item_id}_vote"

    def create_data_types(self, votes, edms):
        data_types = {}
        vote_options = [
            {"title": "Aye", "shader": "#89c489"},
            {"title": "No", "shader": "#e18674"},
            {"title": "No vote", "shader": "#fede86"},
        ]
        edm_options = [
            {"title": "Supporter", "shader": "#89c489"},
        ]
        for vote in votes:
            vote_machine_name = self.get_machine_name(vote)
            ds, created = DataSet.objects.update_or_create(
                name=vote_machine_name,
                defaults={
                    "data_type": "string",
                    "description": f"Member votes on {vote['vote_name']}",
                    "label": vote["vote_name"],
                    "source_label": "UK Parliament",
                    "source": "https://parliament.uk/",
                    "table": "person__persondata",
                    "options": vote_options,
                    "subcategory": "vote",
                    "comparators": DataSet.in_comparators(),
                },
            )
            data_type, created = DataType.objects.update_or_create(
                data_set=ds,
                name=vote_machine_name,
                defaults={"data_type": "text"},
            )
            data_types[vote_machine_name] = data_type

            for edm in edms:
                edm_machine_name = self.get_machine_name(edm)
                ds, created = DataSet.objects.update_or_create(
                    name=edm_machine_name,
                    defaults={
                        "data_type": "string",
                        "description": f"Supporters of {edm['edm_name']}",
                        "label": edm["edm_name"],
                        "source_label": "UK Parliament",
                        "source": "https://parliament.uk/",
                        "table": "person__persondata",
                        "options": edm_options,
                        "subcategory": "supporter",
                        "comparators": DataSet.comparators_default(),
                    },
                )
                data_type, created = DataType.objects.update_or_create(
                    data_set=ds,
                    name=edm_machine_name,
                    defaults={"data_type": "text"},
                )
                data_types[edm_machine_name] = data_type
        return data_types

    def import_results(self, votes, edms):
        if not self._quiet:
            print("Adding MP data on relevant votes + EDMS to database")
        for mp in tqdm(Person.objects.filter(person_type="MP"), disable=self._quiet):
            mp_id = mp.external_id
            for vote in votes:
                if mp_id in vote:
                    vote_machine_name = self.get_machine_name(vote)
                    person_data, created = PersonData.objects.update_or_create(
                        person=mp,
                        data_type=self.data_types[vote_machine_name],
                        data=vote[mp_id],
                    )
            for edm in edms:
                edm_machine_name = self.get_machine_name(edm)
                if mp_id in edm["supporters"]:
                    data = "Supporter"
                    person_data, created = PersonData.objects.update_or_create(
                        person=mp,
                        data_type=self.data_types[edm_machine_name],
                        data=data,
                    )
