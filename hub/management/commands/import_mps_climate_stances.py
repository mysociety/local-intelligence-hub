from django.conf import settings
from django.utils.html import strip_tags

import pandas as pd
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, Person, PersonData

from .base_importers import BaseImportCommand


class Command(BaseImportCommand):
    help = "Import relevant MP climate stances from TWFY votes"

    policy_ids = [
        6741,
        6766,
        6928,
        6888,
        20002,
        6699,
        6704,
        1030,
        6693,
        6887,
    ]

    policy_json = "https://votes.theyworkforyou.com/policies.json"
    orgs = "https://votes.theyworkforyou.com/static/data/organization.parquet"
    periods = (
        "https://votes.theyworkforyou.com/static/data/policy_comparison_period.parquet"
    )
    positions = (
        "https://votes.theyworkforyou.com/static/data/policy_calc_to_load.parquet"
    )

    def add_arguments(self, parser):
        super(Command, self).add_arguments(parser)

        parser.add_argument(
            "--local_files",
            action="store_true",
            help="use local copy of all files, defaults to remote",
        )

    def set_data_locations(self):
        if self.local:
            self.policy_json = settings.BASE_DIR / "data" / "policies.json"
            self.orgs = settings.BASE_DIR / "data" / "organization.parquet"
            self.periods = (
                settings.BASE_DIR / "data" / "policy_comparison_period.parquet"
            )
            self.positions = settings.BASE_DIR / "data" / "policy_calc_to_load.parquet"

    def handle(self, local=False, *args, **options):
        super(Command, self).handle(*args, **options)
        self.local = local
        self.set_data_locations()

        if not self._quiet:
            self.stdout.write("loading MP stance data from TWFY votes")
        policies = pd.read_json(self.policy_json)
        policies = policies.loc[policies["id"].isin(self.policy_ids)]
        policy_map = {}
        for _, row in policies.iterrows():
            policy_map[row["id"]] = row

        p = pd.read_parquet(self.positions)
        p = p.loc[p["policy_id"].isin(self.policy_ids)]
        p = p.loc[p["is_target"] == 1]

        if not self._quiet:
            self.stdout.write("processing policy stance data")
        policies = self.get_all_relevant_policies(p)

        self.data_types = self.create_data_types(policy_map)
        self.delete_data()
        self.import_results(policies)

    def get_policy(self, policy_id, positions):
        p = positions.loc[positions["policy_id"] == policy_id]
        mp_scores = {}
        for _, row in p.iterrows():
            mp_scores[row["person_id"]] = self.get_verbose_score(row["distance_score"])

        return mp_scores

    def get_all_relevant_policies(self, positions):
        policies = {}
        for policy_id in tqdm(self.policy_ids, disable=self._quiet):
            data = self.get_policy(policy_id, positions)
            if data:
                policies[policy_id] = data
        return policies

    def get_machine_name(self, item):
        item_id = str(item["id"])
        return f"policy_{item_id}"

    def get_verbose_score(self, score):
        description = "No position"

        if score >= 0 and score <= 0.05:
            description = "Consistently voted for"
        elif score > 0.05 and score <= 0.15:
            description = "Almost always voted for"
        elif score > 0.15 and score <= 0.4:
            description = "Generally voted for"
        elif score > 0.4 and score <= 0.6:
            description = "Voted a mixture of for and against"
        elif score > 0.6 and score <= 0.85:
            description = "Generally voted against"
        elif score > 0.85 and score <= 0.95:
            description = "Almost always voted against"
        elif score > 0.95 and score <= 1:
            description = "Consistently voted against"

        return description

    def create_data_types(self, policies):
        data_types = {}
        vote_options = [
            {"title": "Consistently voted for", "shader": "green-500"},
            {"title": "Almost always voted for", "shader": "green-400"},
            {"title": "Generally voted for", "shader": "green-300"},
            {"title": "Voted a mixture of for and against", "shader": "yellow-500"},
            {"title": "Generally voted against", "shader": "orange-300"},
            {"title": "Almost always voted against", "shader": "orange-400"},
            {"title": "Consistently voted against", "shader": "orange-500"},
            {"title": "No position", "shader": "gray-500"},
            {"title": "Not in office", "shader": "gray-300"},
        ]

        for id, policy in policies.items():
            vote_machine_name = self.get_machine_name(policy)
            ds, created = DataSet.objects.update_or_create(
                name=vote_machine_name,
                defaults={
                    "data_type": "string",
                    "description": policy["policy_description"],
                    "label": strip_tags(
                        f"MP stance on {policy['context_description']}"
                    ),
                    "source_label": "Data from TheyWorkForYou.",
                    "source": "https://theyworkforyou.com/",
                    "table": "people__persondata",
                    "options": vote_options,
                    "subcategory": "stance",
                    "comparators": DataSet.in_comparators(),
                    "is_public": True,
                },
            )

            for at in AreaType.objects.filter(code__in=["WMC23"]):
                ds.areas_available.add(at)

            self.add_object_to_site(ds)

            data_type, created = DataType.objects.update_or_create(
                data_set=ds,
                name=vote_machine_name,
                defaults={"data_type": "string"},
            )
            data_types[vote_machine_name] = data_type

        return data_types

    def import_results(self, policies):
        if not self._quiet:
            self.stdout.write("Adding MP data on policy positions to database")

        for mp in tqdm(Person.objects.filter(person_type="MP"), disable=self._quiet):
            mp_id = int(mp.external_id)
            for policy_id, policy in policies.items():
                if mp_id in policy:
                    vote_machine_name = self.get_machine_name({"id": policy_id})
                    person_data, created = PersonData.objects.update_or_create(
                        person=mp,
                        data_type=self.data_types[vote_machine_name],
                        data=policy[mp_id],
                    )

    def delete_data(self):
        PersonData.objects.filter(data_type__in=self.data_types.values()).delete()
