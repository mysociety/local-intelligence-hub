from hub.models import DataType
from hub.transformers import WMCToDISDataTypeConverter, WMCToSTCDataTypeConverter

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Convert various council"
    message = "Importing Hope Not Hate polling data"

    types_to_convert = [
        "persuasion_jul_2024_onshore_wind_support",
        "persuasion_jul_2024_onshore_wind_neither",
        "persuasion_jul_2024_onshore_wind_oppose",
        "persuasion_jul_2024_net_zero_speed_faster",
        "persuasion_jul_2024_net_zero_speed_neither",
        "persuasion_jul_2024_net_zero_speed_slower",
        "persuasion_jul_2024_borrowing_comfortable",
        "persuasion_jul_2024_borrowing_neither",
        "persuasion_jul_2024_borrowing_not_comfortable",
        "persuasion_jul_2024_taxes_comfortable",
        "persuasion_jul_2024_taxes_neither",
        "persuasion_jul_2024_taxes_not_comfortable",
        "persuasion_jul_2024_immigration_enriched",
        "persuasion_jul_2024_immigration_neither",
        "persuasion_jul_2024_immigration_undermined",
        "persuasion_jul_2024_eu_closer",
        "persuasion_jul_2024_eu_neither",
        "persuasion_jul_2024_eu_not_closer",
        "persuasion_jul_2024_housebuilding_support",
        "persuasion_jul_2024_housebuilding_neither",
        "persuasion_jul_2024_housebuilding_oppose",
        "persuasion_jul_2024_welfare_expanded",
        "persuasion_jul_2024_welfare_neither",
        "persuasion_jul_2024_welfare_reduced",
    ]

    def convert(self):
        data_types = {}
        for dt_name in self.types_to_convert:
            dt = DataType.objects.get(name=dt_name, area_type__code="WMC23")
            dt.unit_distribution = "people_in_area"
            dt.save()
            data_types[dt_name] = dt

        dis_converter = WMCToDISDataTypeConverter()
        stc_converter = WMCToSTCDataTypeConverter()
        for data_type in data_types.values():
            if not self._quiet:
                self.stdout.write(f"Converting {data_type.name} to council data")
            dis_converter.convert_datatype_to_new_geography(
                data_type, quiet=self._quiet
            )
            stc_converter.convert_datatype_to_new_geography(
                data_type, quiet=self._quiet
            )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.convert()
