from datetime import date
import duckdb
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, PersonData

from .base_importers import BaseImportCommand


class Command(BaseImportCommand):
    help = "Import Environment APPG membership"

    source_base = "https://pages.mysociety.org/appg-membership/data/appg_groups_and_memberships/latest/"
    register_source = source_base + "register.parquet"
    categories_source = source_base + "categories.parquet"
    members_source = source_base + "members.parquet"

    def create_data_type(self, appgs):
        appgs.sort(key=lambda x: x.replace("'", ""))
        options = [dict(title=appg, shader="#DCDCDC") for appg in appgs]

        appg_membership_ds, created = DataSet.objects.update_or_create(
            name="mp_appg_memberships",
            defaults={
                "data_type": "text",
                "description": "Membership in APPGs as gathered by mySociety.",
                "release_date": str(date.today()),
                "label": "MP APPG memberships",
                "source_label": "Data from mySociety.",
                "source": "https://parliament.uk/",
                "table": "people__persondata",
                "options": options,
                "is_shadable": False,
                "comparators": DataSet.in_comparators(),
            },
        )
        self.add_object_to_site(appg_membership_ds)

        for at in AreaType.objects.filter(code__in=["WMC", "WMC23"]):
            appg_membership_ds.areas_available.add(at)

        appg_membership, created = DataType.objects.update_or_create(
            data_set=appg_membership_ds,
            name="mp_appg_memberships",
            defaults={"data_type": "text"},
        )

        return appg_membership

    def add_results(self, results, data_type):
        self.stdout.write("Adding APPG data to Django database")
        for mp, result in tqdm(results, disable=self._quiet):
            data, created = PersonData.objects.update_or_create(
                person=mp,
                data_type=data_type,
                data=result,
            )

    def get_results(self):
        con = duckdb.connect(":default:")

        con.sql(
            f"CREATE OR REPLACE VIEW tbl_register as (select * from '{self.register_source}')"
        )
        con.sql(
            f"CREATE OR REPLACE VIEW tbl_categories as (select * from '{self.categories_source}')"
        )
        con.sql(
            f"CREATE OR REPLACE VIEW tbl_members as (select * from '{self.members_source}')"
        )

        results = con.sql(
            """
            SELECT
                tbl_members.name, tbl_members.twfy_id, tbl_register.title
            FROM tbl_members
            JOIN tbl_categories ON tbl_members.appg = tbl_categories.appg_slug
            JOIN tbl_register ON tbl_members.appg = tbl_register.slug
            WHERE
                member_type = 'mp' AND
                category_slug = 'ENVIRONMENT_CLIMATE_SUSTAINABILITY'
        """
        )

        twfy_ids = PersonData.objects.filter(data_type__data_set__name="twfyid")
        data = []
        appgs = set()
        for r in results.fetchall():
            if r[1] is None:
                self.stderr.write(f"No id found for {r[0]}")
                continue
            try:
                mp = twfy_ids.filter(data=r[1][25:]).first().person
            except AttributeError:
                self.stderr.write(f"Failed to match MP {r[0]} ({r[1]})")
                continue
            data.append((mp, r[2]))
            appgs.add(r[2])

        return data, list(appgs)

    def handle(self, *args, **options):
        super(Command, self).handle(*args, **options)
        results, appgs = self.get_results()
        data_type = self.create_data_type(appgs)
        self.add_results(results, data_type)
