from django.core.management.base import BaseCommand

import pandas as pd

from hub.models import DataSet, DataType, Person, PersonData, CommonData

party_lookup = {
    'Conservative': 'Conservative Party',
    'Labour': 'Labour Party',
    'Liberal Democrat': 'Liberal Democrats',
    'Labour (Co-op)': 'Labour Co-operative',
    'Independent': 'independent politician',
    'Alliance': 'Alliance Party of Northern Ireland',
    'Green Party': 'Green Party of England and Wales',
    'Speaker': 'Speaker of the House of Commons',
    'Social Democratic & Labour Party': 'Social Democratic and Labour Party'
}

class Command(BaseCommand):
    help = "Import data on what APPGs an MP is part of"

    source_url = ""
    data_url = "" # TODO

    def handle(self, *args, **options):
        self.import_results()
    
    def calculate_mp(self, name, party):
        try:
            mp = party.get(person__name__icontains=name).person
        except PersonData.DoesNotExist:
            mp = None
        return mp
    
    def add_mps(self, df):
        df.party = df.party.apply(lambda x: party_lookup[x] if x in party_lookup else x)

        # Build a dictionary mapping the MPs in the table to MP Person objects (rather than
        # calculating it for every row, so that repetition doesn't get calculated multiple
        # times).
        party_data_type = DataType.objects.get(name="party")

        party_qs_dict = {}
        mp_info_to_object_dict = {}
        mps = []

        for index, row in df.iterrows():
            if row['party'] not in party_qs_dict:
                party_qs_dict[row['party']] = PersonData.objects.filter(data_type=party_data_type).filter(data=row['party'])
            party = party_qs_dict[row['party']]
            if (row['name'], row['party']) not in mp_info_to_object_dict:
                mp_info_to_object_dict[(row['name'], row['party'])] = self.calculate_mp(row['name'], party)
            mp = mp_info_to_object_dict[(row['name'], row['party'])]
            mps.append(mp)

        df['mp'] = pd.Series(mps)
        return df
    
    def get_appg_names(self, df):
        appg_titles_df = pd.read_csv("data/appg_descriptions.csv")
        appg_lookup = dict(zip(appg_titles_df.appg_slug, appg_titles_df.title))
        df.appg_slug = df.appg_slug.map(appg_lookup)
        return df.rename(columns={"appg_slug": "appg"})

    def create_data_types(self):
        appg_ds, created = DataSet.objects.update_or_create(
            name="appgs",
            defaults={
                "data_type": "json",
                "description": "APPGs and their purpose as published on the parliament website",
                "source": "https://parliament.uk/",
                "data_url": "", # TODO fill in all the metadata
            },
        )

        appg, created = DataType.objects.update_or_create(
            data_set=appg_ds,
            name="appg",
            defaults={"data_type": "json"}, # TODO: Fill in all the metadata
        )

        appg_membership_ds, created = DataSet.objects.update_or_create(
            name="mp_appg_memberships",
            defaults={
                "data_type": "json",
                "description": "Membership in APPGs as published on the parliament website",
                "source": "https://parliament.uk/",
                "table": "person__persondata",

            },
        )

        appg_membership, created = DataType.objects.update_or_create(
            data_set=appg_membership_ds,
            name="appg_memberships",
            defaults={"data_type": "json"},
        )

        return {'appg': appg, 'appg_membership': appg_membership}

    """def create_appgs(self, data_types):
        df = pd.read_csv("data/appg_descriptions.csv")
        for index, row in df.iterrows():
            appg_json = {key: row[key] for key in ["appg_slug", "title"]}
            .objects.update_or_create(
                data_type=data_types["appg"],
                defaults={"json": appg_json},
            )
        return CommonData.objects.filter(data_type=data_types["appg"])"""

    def get_results(self):
        mps = Person.objects.filter(person_type="MP")
        df = pd.read_csv("data/appg_officers.csv")
        df = self.add_mps(df)
        df = self.get_appg_names(df)
        results = {}
        for mp in mps.all():
            mp_df = df[df.mp == mp]
            appgs_list = [{'appg': appg, 'role': role} for appg, role in zip(mp_df.appg, mp_df.role)]
            results[mp.name] = appgs_list
        return results



    def add_results(self, results, data_types):
        # First, create the APPGs in the db
        #appgs = self.create_appgs(data_types)
        for mp_name, result_list in results.items():
            person = Person.objects.get(name=mp_name)
            for result in result_list:
                data = PersonData.objects.create(
                    person=person,
                    data_type=data_types["appg_membership"],
                    json=result,
                )

    def import_results(self):
        data_types = self.create_data_types()
        # Remove all existing objects in db, as update_or_create can't be used
        # due to the many-to-one relationship
        PersonData.objects.filter(data_type=data_types["appg_membership"]).delete()
        results = self.get_results()
        self.add_results(results, data_types)
