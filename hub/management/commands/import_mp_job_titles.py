from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, DataSet, DataType, Person, PersonData

CONSTITUENCY_CORRECTIONS_DICT = {
    "Beverly and Holderness": "Beverley and Holderness",
    "Brighton Pavilion": "Brighton, Pavilion",
    "Enfield Southgate": "Enfield, Southgate",
    "Lewisham Deptford": "Lewisham, Deptford",
    "Ealing Southall": "Ealing, Southall",
    "Brighton Kemptown": "Brighton, Kemptown",
    "Richmond": "Richmond (Yorks)",
    "Na h-Eileanan an Lar": "Na h-Eileanan an Iar",
}


class Command(BaseCommand):
    help = "Import MP Job titles"

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.import_results()

    def get_df(self):
        df = pd.read_csv("data/mp_job_titles.csv", usecols=["Constituency", "Title"])
        df = df.query(
            "not(Title.str.contains('^ ?(((MP)|(Member of Parliament)) for .*)|(Member of .*Select Committee)$'))"
        ).copy()

        # Clean the constituency data:
        df.Constituency = df.Constituency.str.strip()
        df.Constituency = df.Constituency.apply(
            lambda x: CONSTITUENCY_CORRECTIONS_DICT.get(x, x)
        )
        return df

    def create_data_type(self):
        mp_job_titles_ds, created = DataSet.objects.update_or_create(
            name="job_titles",
            defaults={
                "data_type": "text",
                "description": "MP job titles (on top of being Members of Parliament)",
                "label": "MP Job Titles",
                "source_label": "Green Alliance",
                "source": "https://green-alliance.org.uk/",
                "table": "person__persondata",
            },
        )

        mp_job_titles, created = DataType.objects.update_or_create(
            data_set=mp_job_titles_ds,
            name="job_titles",
            defaults={"data_type": "text"},
        )

        return mp_job_titles

    def get_results(self):
        mps = Person.objects.filter(person_type="MP")
        df = self.get_df()
        results = {}
        print("Matching MPs with titles")
        for index, row in df.iterrows():
            try:
                area = Area.objects.get(name__iexact=row.Constituency)
                results[mps.get(area=area)] = row.Title
            except Area.DoesNotExist:
                print(f"Constituency: {row.Constituency} not found.")
        return results

    def add_results(self, results, data_type):
        print("Adding MP job title data to Django database")
        for mp, job_title in tqdm(results.items(), disable=self._quiet):
            data, created = PersonData.objects.update_or_create(
                person=mp,
                data_type=data_type,
                data=job_title,
            )

    def import_results(self):
        data_type = self.create_data_type()
        results = self.get_results()
        self.add_results(results, data_type)