from django.core.management import BaseCommand

from hub.models import DataSet


class Command(BaseCommand):
    help = "updates date and numeric datasets with no comparator default"

    def handle(self, *args, **kwargs):
        DataSet.objects.filter(data_type="year").exclude(
            default_value__isnull=True
        ).update(
            comparators=DataSet.year_comparators(),
            default_value=2019,  # last election year
        )
        DataSet.objects.filter(data_type="percent").exclude(
            default_value__isnull=True
        ).update(
            comparators=DataSet.numerical_comparators(),
            default_value=50,  # right down the middle
        )
        DataSet.objects.filter(data_type__in=["float", "integer"]).exclude(
            default_value__isnull=True
        ).update(
            comparators=DataSet.numerical_comparators(),
            default_value=10,  # prevents weird null errors
        )
