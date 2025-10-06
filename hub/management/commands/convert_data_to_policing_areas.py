from hub.models import DataSet, DataType
from hub.transformers import CouncilToPFADataTypeConverter

from .base_importers import BaseImportCommand


class Command(BaseImportCommand):
    help = "Convert local authority data to policing area level"

    datasets_to_convert = [
        {"name": "council_population_count", "method": "sum"},
        {"name": "constituency_imd", "method": "average"},
        {"name": "persuasion_jul_2024_onshore_wind", "method": "average"},
        {"name": "persuasion_jul_2024_net_zero_speed", "method": "average"},
        {"name": "persuasion_jul_2024_borrowing", "method": "average"},
        {"name": "persuasion_jul_2024_taxes", "method": "average"},
        {"name": "persuasion_jul_2024_immigration", "method": "average"},
        {"name": "persuasion_jul_2024_eu", "method": "average"},
        {"name": "persuasion_jul_2024_housebuilding", "method": "average"},
        {"name": "persuasion_jul_2024_welfare", "method": "average"},
    ]

    def convert(self):
        converter = CouncilToPFADataTypeConverter()

        for ds_config in self.datasets_to_convert:
            ds_name = ds_config["name"]
            method = ds_config["method"]

            try:
                ds = DataSet.objects.get(name=ds_name)
                if not self._quiet:
                    self.stdout.write(
                        f"Converting dataset: {ds.label} (method={method})"
                    )

                data_types = DataType.objects.filter(
                    data_set=ds, area_type__code__in=["DIS", "STC"]
                )

                for dt in data_types:
                    if not self._quiet:
                        self.stdout.write(
                            f"  Converting {dt.name} ({dt.area_type.code})"
                        )
                    converter.convert_datatype_to_new_geography(
                        dt, quiet=self._quiet, method=method
                    )

            except DataSet.DoesNotExist:
                self.stdout.write(f"Dataset not found: {ds_name}")

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.convert()
