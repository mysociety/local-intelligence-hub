from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import CEN and NZSG Members"

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.import_results()

    def get_df(self):
        df = pd.read_csv("data/cen_nzsg_members.csv", true_values=['CEN', 'NZSG'])
        df.columns = ['mp_name', 'cen', 'nzsg']
        
        return df

    def create_data_types(self):
        cen_ds, created = DataSet.objects.update_or_create(
            name="cen_member",
            defaults={
                "data_type": "bool",
                "description": "Conservative Environment Network membership",
                "label": "Conservative Environment Network Member",
                "source_label": "CEN, collated by mySociety",
                "source": "https://www.cen.uk.com/our-caucus",
                "table": "person__persondata",
            },
        )
        nzsg_ds, created = DataSet.objects.update_or_create(
            name="nzsg_member",
            defaults={
                "data_type": "bool",
                "description": "Net Zero Scrutiny Group membership",
                "label": "Net Zero Scrutiny Group Member",
                "source_label": "collated by DeSmog",
                "source": "https://www.desmog.com/net-zero-scrutiny-group/",
                "table": "person__persondata",
            },
        )

        cen, created = DataType.objects.update_or_create(
            data_set=cen_ds,
            name="cen_member",
            defaults={"data_type": "bool"},
        )
        nzsg, created = DataType.objects.update_or_create(
            data_set=nzsg_ds,
            name="nzsg_member",
            defaults={"data_type": "bool"},
        )

        return {'cen': cen, 'nzsg': nzsg}

    def get_results(self):
        mps = Person.objects.filter(person_type="MP")
        df = self.get_df()
        results = {}
        print("Name matching MPs")
        for index, row in df.iterrows():
            try:
                mp = mps.get(name__iexact=row.mp_name)

                results[mp] = row[['cen', 'nzsg']].dropna().index.to_list()
            except Person.DoesNotExist:
                print(f"MP: {row.mp_name} not found.")
        return results

    def add_results(self, results, data_types):
        print("Adding MP CEN and NZSG memberships to Django database")
        for mp, result in tqdm(results.items(), disable=self._quiet):
            for data_type in result:
                data, created = PersonData.objects.update_or_create(
                    person=mp,
                    data_type=data_types[data_type],
                    defaults={'data': True},
                )

    def import_results(self):
        data_types = self.create_data_types()
        results = self.get_results()
        self.add_results(results, data_types)