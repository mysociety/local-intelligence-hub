from datetime import datetime, timezone

from django.core.management.base import BaseCommand

import requests

from hub.models import DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import UK Members of Parliament"

    def handle(self, *args, **options):
        self.import_results()

    def get_results(self):
        mps = Person.objects.filter(person_type="MP")

        results = {}
        for mp in mps.all():
            if mp.external_id == "":
                print(f"problem with {mp.name} - no id")
                continue

            response = requests.get(
                f"https://members-api.parliament.uk/api/Members/{mp.external_id}/LatestElectionResult"
            )
            try:
                data = response.json()
                results[mp.id] = {
                    "majority": data["value"]["majority"],
                    "last_elected": data["value"]["electionDate"],
                }
            except requests.RequestException:
                print(
                    f"problem fetching election result for {mp.name} with id {mp.external_id}"
                )

            response = requests.get(
                f"https://members-api.parliament.uk/api/Members/{mp.external_id}"
            )
            try:
                data = response.json()
                results[mp.id]["first_elected"] = data["value"][
                    "latestHouseMembership"
                ]["membershipStartDate"]
            except requests.RequestException:
                print(f"problem fetching info for {mp.name} with id {mp.external_id}")

        return results

    def create_data_types(self):
        majority, created = DataType.objects.get_or_create(
            name="mp_election_majority",
            data_type="number",
            description="Majority at last election",
            source="https://members-api.parliament.uk/",
        )

        last_elected, created = DataType.objects.get_or_create(
            name="mp_last_elected",
            data_type="date",
            description="Date of last election for an MP",
            source="https://members-api.parliament.uk/",
        )

        first_elected, created = DataType.objects.get_or_create(
            name="mp_first_elected",
            data_type="date",
            description="Date an MP was first elected to current position",
            source="https://members-api.parliament.uk/",
        )

        return {
            "majority": majority,
            "first_elected": first_elected,
            "last_elected": last_elected,
        }

    def add_results(self, results, data_types):
        for mp_id, result in results.items():
            person = Person.objects.get(id=mp_id)

            for key, data_type in data_types.items():
                if data_type.data_type == "date":
                    date = datetime.fromisoformat(result[key])
                    # parliament API does not add timezones to things that are dates so
                    # we need to add them
                    if date.tzinfo is None:
                        date = date.replace(tzinfo=timezone.utc)
                    data, created = PersonData.objects.get_or_create(
                        person=person,
                        data_type=data_type,
                        data="",
                        date=date,
                    )
                else:
                    data, created = PersonData.objects.get_or_create(
                        person=person, data_type=data_type, data=result[key]
                    )

    def import_results(self):
        results = self.get_results()
        data_types = self.create_data_types()
        self.add_results(results, data_types)
