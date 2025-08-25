from datetime import date

import requests
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, Person, PersonData

from .base_importers import BaseImportCommand


class Command(BaseImportCommand):
    help = "Import MP Job titles"

    area_type = "WMC23"

    def handle(self, *args, **options):
        super(Command, self).handle(*args, **options)
        self.import_results()

    def get_area_type(self):
        return AreaType.objects.get(code=self.area_type)

    def create_data_type(self):
        if not self._quiet:
            self.stdout.write("Creating data set and type")

        mp_job_titles_ds, created = DataSet.objects.update_or_create(
            name="job_titles",
            defaults={
                "data_type": "text",
                "description": "Positions such as cabinet and shadow minister roles, spokespeople, and whips.",
                "release_date": str(date.today()),
                "label": "MP positions (job titles)",
                "source": "https://members-api.parliament.uk/",
                "source_label": "Data from UK Parliament.",
                "table": "people__persondata",
                "comparators": DataSet.string_comparators(),
            },
        )
        mp_job_titles_ds.areas_available.add(self.get_area_type())
        self.add_object_to_site(mp_job_titles_ds)

        mp_job_titles, created = DataType.objects.update_or_create(
            data_set=mp_job_titles_ds,
            name="job_titles",
            area_type=self.get_area_type(),
            defaults={"data_type": "text"},
        )

        return mp_job_titles

    def get_results(self):
        mps = PersonData.objects.filter(
            data_type__name="parlid", person__person_type="MP"
        ).select_related("person")

        results = {}
        if not self._quiet:
            self.stdout.write("Fetching MP positions")

        for mp in tqdm(mps.all(), disable=self._quiet):
            if mp.value() == "":  # pragma: no cover
                print(f"problem with {mp.person.name} - no id")
                continue

            response = requests.get(
                f"https://members-api.parliament.uk/api/Members/{mp.value()}/Biography"
            )

            try:
                data = response.json()
                posts = (
                    data["value"]["governmentPosts"] + data["value"]["oppositionPosts"]
                )
                current_posts = [p for p in posts if p.get("endDate") is None]

                for position in current_posts:
                    # One dictionary key per MP, with multiple job titles
                    # concatenated into a single linebreak-separated value.
                    existing_position = results.get(mp.person.id, "")
                    results[mp.person.id] = (
                        f"{existing_position}\n{position['name']}".strip()
                    )

            except requests.RequestException:  # pragma: no cover
                print(
                    f"problem fetching info for {mp.person.name} with id {mp.value()}"
                )

        return results

    def add_results(self, results, data_type):
        if not self._quiet:
            self.stdout.write("Updating MP positions")

        mp_list = []
        for mp_id, job_title in tqdm(results.items(), disable=self._quiet):
            person = Person.objects.get(id=mp_id)
            data, created = PersonData.objects.update_or_create(
                person=person,
                data_type=data_type,
                defaults={"data": job_title},
            )
            mp_list.append(data.id)

        # clear out old job titles, which we assume to be anyone without a current job
        PersonData.objects.filter(data_type=data_type).exclude(pk__in=mp_list).delete()

    def import_results(self):
        data_type = self.create_data_type()
        results = self.get_results()
        self.add_results(results, data_type)
