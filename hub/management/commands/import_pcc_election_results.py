from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import (
    Area,
    AreaData,
    AreaType,
    DataSet,
    DataType,
    Person,
    PersonArea,
    PersonData,
)

from .base_importers import BaseImportCommand, party_shades, standardise_party_name


class Command(BaseImportCommand):
    help = "Import Police & Crime Commissioners"

    area_type = "PFA"
    source_file = (
        settings.BASE_DIR / "data" / "dc-candidates-pcc-election-results-2024-05-02.csv"
    )
    source_file_release_date = "2024-05-02"

    def handle(self, *args, **options):
        super(Command, self).handle(*args, **options)

        self.df = pd.read_csv(self.source_file)
        self.elected_df = self.df[self.df["elected"] == "t"].copy()
        self.area_map = self.get_area_map()

        self.import_pccs()
        self.import_election_results()
        self.import_turnout()

    def get_area_map(self):
        """Create a mapping from post_label variants to PFA area GSS codes"""
        areas = Area.objects.filter(area_type__code=self.area_type).all()
        area_lookup = {}

        for area in areas:
            # Try to match on area name
            area_lookup[area.name] = area.gss
            # Also try with " Constabulary" suffix
            area_lookup[f"{area.name} Constabulary"] = area.gss
            # And with " Police" suffix
            area_lookup[f"{area.name} Police"] = area.gss

        return area_lookup

    def import_pccs(self):
        if not self._quiet:
            self.stdout.write("Importing PCCs")

        # Create data types for PCC data
        area_type = AreaType.objects.get(code=self.area_type)

        party_ds, _ = DataSet.objects.update_or_create(
            name="pcc_party",
            defaults={
                "label": "PCC party",
                "description": "Political party of the Police & Crime Commissioner",
                "category": "pcc",
                "data_type": "text",
                "release_date": self.source_file_release_date,
                "source": "https://democracyclub.org.uk/",
                "source_label": "Data from Democracy Club.",
                "table": "person__persondata",
                "is_public": True,
                "is_filterable": True,
                "is_shadable": False,
                "comparators": DataSet.comparators_default(),
            },
        )
        party_ds.areas_available.add(area_type)
        self.add_object_to_site(party_ds)

        party_dt, _ = DataType.objects.update_or_create(
            data_set=party_ds,
            name="pcc_party",
            area_type=area_type,
            defaults={
                "data_type": "text",
                "label": "PCC Party",
            },
        )

        # Create dataset for election date
        elected_ds, _ = DataSet.objects.update_or_create(
            name="pcc_last_elected",
            defaults={
                "label": "Date PCC last elected",
                "description": "Date the Police & Crime Commissioner was elected",
                "category": "pcc",
                "data_type": "date",
                "release_date": self.source_file_release_date,
                "source": "https://democracyclub.org.uk/",
                "source_label": "Data from Democracy Club.",
                "table": "person__persondata",
                "is_public": True,
                "is_filterable": True,
                "is_shadable": False,
                "comparators": DataSet.year_comparators(),
            },
        )
        elected_ds.areas_available.add(area_type)
        self.add_object_to_site(elected_ds)

        elected_dt, _ = DataType.objects.update_or_create(
            data_set=elected_ds,
            name="pcc_last_elected",
            area_type=area_type,
            defaults={
                "data_type": "date",
                "label": "Date PCC last elected",
            },
        )

        for _, row in tqdm(
            self.elected_df.iterrows(), disable=self._quiet, total=len(self.elected_df)
        ):
            post_label = row["post_label"]
            area_gss = self.area_map.get(post_label)

            if not area_gss:
                if not self._quiet:
                    self.stdout.write(f"Could not find area for: {post_label}")
                continue

            area = Area.objects.get(gss=area_gss, area_type__code=self.area_type)

            # Create or update the PCC person
            person, created = Person.objects.update_or_create(
                external_id=row["person_id"],
                id_type="democracy_club",
                defaults={
                    "person_type": "PCC",
                    "name": row["person_name"],
                },
            )

            # Link person to area
            PersonArea.objects.update_or_create(
                person=person,
                area=area,
                defaults={
                    "person_type": "PCC",
                    "start_date": row["election_date"],
                },
            )

            # Store party data
            PersonData.objects.update_or_create(
                person=person,
                data_type=party_dt,
                defaults={"data": standardise_party_name(row["party_name"])},
            )

            # Store election date
            PersonData.objects.update_or_create(
                person=person,
                data_type=elected_dt,
                defaults={"data": row["election_date"]},
            )

        if not self._quiet:
            self.stdout.write(f"Imported {len(self.elected_df)} PCCs")

    def import_election_results(self):
        if not self._quiet:
            self.stdout.write("Importing PCC election results")

        area_type = AreaType.objects.get(code=self.area_type)

        elected_votes = {}
        for _, row in self.elected_df.iterrows():
            post_label = row["post_label"]
            area_gss = self.area_map.get(post_label)
            if area_gss:
                elected_votes[area_gss] = row["votes_cast"]

        # Create majority dataset
        majority_ds, _ = DataSet.objects.update_or_create(
            name="pcc_election_majority",
            defaults={
                "label": "PCC majority",
                "description": "Majority at last PCC election",
                "category": "pcc",
                "data_type": "integer",
                "release_date": self.source_file_release_date,
                "source": "https://democracyclub.org.uk/",
                "source_label": "Data from Democracy Club.",
                "table": "person__persondata",
                "comparators": DataSet.numerical_comparators()[::-1],
                "is_public": True,
                "is_filterable": True,
                "is_shadable": False,
                "unit_type": "raw",
                "unit_distribution": "other",
            },
        )
        majority_ds.areas_available.add(area_type)
        self.add_object_to_site(majority_ds)

        majority_dt, _ = DataType.objects.update_or_create(
            data_set=majority_ds,
            name="pcc_election_majority",
            area_type=area_type,
            defaults={
                "data_type": "integer",
                "label": "PCC majority",
            },
        )

        # Calculate and store majorities for elected PCCs
        for _, row in tqdm(
            self.elected_df.iterrows(), disable=self._quiet, total=len(self.elected_df)
        ):
            post_label = row["post_label"]
            area_gss = self.area_map.get(post_label)

            if not area_gss:
                continue

            # Find the second place candidate
            area_results = self.df[self.df["post_label"] == post_label].sort_values(
                "votes_cast", ascending=False
            )
            if len(area_results) >= 2:
                winner_votes = area_results.iloc[0]["votes_cast"]
                runner_up_votes = area_results.iloc[1]["votes_cast"]
                majority = winner_votes - runner_up_votes

                person = Person.objects.get(
                    external_id=row["person_id"],
                    id_type="democracy_club",
                )

                PersonData.objects.update_or_create(
                    person=person,
                    data_type=majority_dt,
                    defaults={"int": majority},
                )

        # Update statistics
        majority_dt.update_average()
        majority_dt.update_max_min()

        # Create DataSet for second placed party
        second_party_ds, _ = DataSet.objects.update_or_create(
            name="pcc_second_party",
            defaults={
                "label": "Second placed party at most recent PCC election",
                "description": "The party who came second in this policing area's most recent PCC election",
                "category": "opinion",
                "data_type": "text",
                "release_date": self.source_file_release_date,
                "source": "https://democracyclub.org.uk/",
                "source_label": "Data from Democracy Club.",
                "table": "areadata",
                "options": [
                    {"title": party, "shader": shade}
                    for party, shade in party_shades.items()
                ],
                "is_public": True,
                "is_filterable": True,
                "comparators": DataSet.in_comparators(),
            },
        )
        second_party_ds.areas_available.add(area_type)
        self.add_object_to_site(second_party_ds)

        second_party_dt, _ = DataType.objects.update_or_create(
            data_set=second_party_ds,
            name="pcc_second_party",
            area_type=area_type,
            defaults={"data_type": "text"},
        )

        # Create a DataSet for election results (stored as JSON)
        results_ds, _ = DataSet.objects.update_or_create(
            name="pcc_election_results",
            defaults={
                "label": "PCC election results",
                "description": "The results of the 2024 PCC election in this policing area",
                "category": "opinion",
                "data_type": "json",
                "release_date": self.source_file_release_date,
                "source": "https://democracyclub.org.uk/",
                "source_label": "Data from Democracy Club.",
                "table": "areadata",
                "is_public": True,
                "is_filterable": False,
            },
        )
        results_ds.areas_available.add(area_type)
        self.add_object_to_site(results_ds)

        results_dt, _ = DataType.objects.update_or_create(
            data_set=results_ds,
            name="pcc_election_results",
            area_type=area_type,
            defaults={"data_type": "json"},
        )

        # Import vote data for each area as JSON
        for post_label in tqdm(self.df["post_label"].unique(), disable=self._quiet):
            area_gss = self.area_map.get(post_label)
            if not area_gss:
                continue

            area = Area.objects.get(gss=area_gss, area_type__code=self.area_type)
            area_results = self.df[self.df["post_label"] == post_label].sort_values(
                "votes_cast", ascending=False
            )

            # Build JSON structure with election date and results
            json_data = {
                "date": area_results.iloc[0]["election_date"],
                "results": [
                    {"party": row["party_name"], "votes": int(row["votes_cast"])}
                    for _, row in area_results.iterrows()
                ],
            }

            AreaData.objects.update_or_create(
                area=area,
                data_type=results_dt,
                defaults={"json": json_data},
            )

            # Store second placed party
            if len(area_results) >= 2:
                second_party_name = area_results.iloc[1]["party_name"]
                AreaData.objects.update_or_create(
                    area=area,
                    data_type=second_party_dt,
                    defaults={"data": second_party_name},
                )

    def import_turnout(self):
        if not self._quiet:
            self.stdout.write("Importing PCC election turnout")

        area_type = AreaType.objects.get(code=self.area_type)

        # Get unique areas with turnout data
        turnout_df = self.df[self.df["turnout_percentage"].notna()].drop_duplicates(
            subset=["post_label"]
        )

        # Create turnout dataset
        turnout_ds, _ = DataSet.objects.update_or_create(
            name="pcc_election_turnout",
            defaults={
                "label": "PCC election turnout",
                "description": "Turnout percentage at the 2024 PCC election",
                "category": "opinion",
                "data_type": "percent",
                "release_date": self.source_file_release_date,
                "source": "https://democracyclub.org.uk/",
                "source_label": "Data from Democracy Club.",
                "table": "areadata",
                "comparators": DataSet.numerical_comparators(),
                "is_public": True,
                "is_filterable": True,
                "is_shadable": True,
                "unit_type": "percentage",
                "unit_distribution": "other",
            },
        )
        turnout_ds.areas_available.add(area_type)
        self.add_object_to_site(turnout_ds)

        turnout_dt, _ = DataType.objects.update_or_create(
            data_set=turnout_ds,
            name="pcc_turnout",
            area_type=area_type,
            defaults={
                "data_type": "percent",
                "label": "Turnout %",
            },
        )

        for _, row in tqdm(
            turnout_df.iterrows(), disable=self._quiet, total=len(turnout_df)
        ):
            post_label = row["post_label"]
            area_gss = self.area_map.get(post_label)

            if not area_gss:
                continue

            area = Area.objects.get(gss=area_gss, area_type__code=self.area_type)

            AreaData.objects.update_or_create(
                area=area,
                data_type=turnout_dt,
                defaults={"float": float(row["turnout_percentage"])},
            )

        if not self._quiet:
            self.stdout.write(f"Imported turnout for {len(turnout_df)} areas")

        # Update statistics
        turnout_dt.update_average()
        turnout_dt.update_max_min()
