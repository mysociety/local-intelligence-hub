from os import listdir
from os.path import isfile, join

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run all of the import scripts"

    def get_scripts(self, *args, **options):
        path = "hub/management/commands"
        files = [f for f in listdir(path) if isfile(join(path, f))]
        # Remove .py suffix, and search for generate_ and import_ scripts
        scripts = [
            f[:-3]
            for f in files
            if ("generate_" in f or f[:7] == "import_") and f != "generate_csv"
        ]
        generators = []
        importers = []
        for script in scripts:
            if "generate_" in script:
                generators.append(script)
            else:
                importers.append(script)

        return {"generators": generators, "importers": importers}

    def add_arguments(self, parser):
        parser.add_argument(
            "-g",
            "--generate",
            action="store_true",
            help="Run 'generate_' scripts as well as 'import_' scripts",
        )

    def run_generator_scripts(self, generators, *args, **options):
        total = str(len(generators))
        failed_generators = {}
        for i, generator in enumerate(generators):
            print(f"Running command: {generator} ({str(i+1)}/{total})")
            try:
                call_command(generator)
            except Exception as e:
                print(f"Error raised: {e}")
                print("Moving to next generator...")
                failed_generators[generator] = e
            print("\n")

        print("Failed generators:")
        for generator, e in failed_generators.items():
            print(f"    {generator}: {e}")

    def run_importer_scripts(self, imports, *args, **options):
        total = str(len(imports))
        i = 1
        failed_imports = {}
        priority_imports = ["import_areas", "import_mps", "import_mps_election_results"]
        for importer in priority_imports:
            imports.remove(importer)
            print(f"Running command: {importer} ({str(i)}/{total})")
            try:
                call_command(importer)
            except Exception as e:
                print(f"Error raised: {e}")
                print("Moving to next importer...")
                failed_imports[importer] = e
            print("\n")
            i += 1
        if failed_imports != {}:
            print("One of the priority importers failed. Please fix, and try again")
            exit()
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

    def handle(self, generate=False, *args, **options):
        scripts = self.get_scripts()
        if generate:
            self.run_generator_scripts(generators=scripts["generators"])
        self.run_importer_scripts(imports=scripts["importers"])
