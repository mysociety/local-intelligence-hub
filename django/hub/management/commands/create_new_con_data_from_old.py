from django.core.management.base import BaseCommand

from hub.models import DataSet, DataType
from hub.transformers import DataTypeConverter


class Command(BaseCommand):
    help = "Create new constituency data from old constituency data"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def process_datasets(self):
        converter = DataTypeConverter()

        sets = DataSet.objects.filter(
            unit_type="percentage",
            unit_distribution="people_in_area",
            category__in=["place", "opinion", "movement"],
        )

        for ds in sets:
            print(ds.label, ds.unit_type)
            for dt in DataType.objects.filter(
                data_set=ds, area_type=converter.old_area_type
            ):
                converter.convert_datatype_to_new_geography(dt)

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.process_datasets()
