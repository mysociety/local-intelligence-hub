from django.core.management import call_command
from django.core.management.base import BaseCommand

council_updates = [
    "import_areas",
    "import_area_countries",
    "import_council_type",
    "import_council_carbon_neutral_data",
    "import_council_data",
    "import_council_emergency_declaration",
    "import_council_emission_cluster",
    "import_council_emissions_totals",
    "import_council_has_plan",
    "import_council_imd_data",
    "import_council_mrp_data",
    "import_council_rural_classification",
    "import_council_scorecards_score",
    "import_foodbank_count",
    "import_gbgw_events",
    "import_gbgw_events_23",
    "import_nt_property_locations",
    "import_onshore_windfarms",
    "import_rspb_nature_reserves",
    "import_ruc_data",
    "import_save_the_children_shop_count",
    "import_tearfund_churches",
    "import_wi_group_locations",
    "import_wildlife_trust_reserves",
]


class Command(BaseCommand):
    help = "Run frequently update imports"

    def get_scripts(self, *args, **options):
        importers = []
        for script in council_updates:
            importers.append(script)

        return importers

    def run_importer_scripts(self, imports, *args, **options):
        total = str(len(imports))
        i = 1
        failed_imports = {}
        for importer in imports:
            print(f"Running command: {importer} ({str(i)}/{total})")
            try:
                call_command(importer)
            except Exception as e:
                print(f"Error raised: {e}")
                print("Moving to next importer...")
                failed_imports[importer] = e
            print("\n")
            i += 1

        print("Failed importers:")
        for importer, e in failed_imports.items():
            print(f"    {importer}: {e}")

    def handle(self, *args, **options):
        scripts = self.get_scripts()
        self.run_importer_scripts(imports=scripts)
