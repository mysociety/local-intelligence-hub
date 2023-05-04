import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):

    help = "Import Cost of Living polling data"
    message = "Importing Cost of Living polling data"

    use_gss = True
    cons_row = "gss_code"
    file_url = "https://docs.google.com/spreadsheets/d/1LjUu3Hswu9NP9OD4q47ti4F9peSqVzHB/export?gid=1764597391&format=csv"
    defaults = {
        "data_type": "percent",
        "category": "opinion",
        "subcategory": "cost_of_living",
        "source_label": "Survation 2023 MRP polling for 38Degrees",
        "source": "https://home.38degrees.org.uk/2023/03/08/the-true-cost-of-this-crisis/",
        "source_type": "google sheet",
        "table": "areadata",
        "data_url": "https://docs.google.com/spreadsheets/d/1LjUu3Hswu9NP9OD4q47ti4F9peSqVzHB/",
        "default_value": 50,
        "is_filterable": True,
        "is_shadable": True,
        "exclude_countries": ["Northern Ireland"],
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {}
    labels = {
        "not_able_to_afford_mortgage_rent": "Worried about not being able to afford their mortgage or rent in the next year",
        "not_able_to_pay_energy_bills": "Worried about not being able to pay their energy bills in the next year",
        "worried_foodbank": "Worried about having to use a foodbank in the next year",
        "conservatives_dont_understand_impact": "Think that Rishi Sunak and the Conservative Government do not understand the impact the cost of living crisis is having on people",
        "missed_bill_payment": "Have missed a bill payment in the last six months",
        "missed_rent_payment": "Have missed a rent payment in the last six months",
        "missed_credit_payment": "Have missed a credit payment in the last six months",
        "cant_afford_heating": "Have not been able to afford to turn the heating on at home when they have felt cold in the past month",
        "mental_health_cost_of_living": "Mental health has been impacted by the cost of living crisis",
    }

    def add_data_sets(self, df):
        for col in df.columns:
            if col != "gss_code":
                self.data_sets[col] = {
                    "defaults": self.defaults.copy(),
                    "col": col,
                }
                self.data_sets[col]["defaults"]["label"] = self.labels[col]

        super().add_data_sets()

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()

    def get_dataframe(self):
        df = pd.read_csv(self.file_url, usecols=[1, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        df.columns = [
            "gss_code",
            "not_able_to_afford_mortgage_rent",
            "not_able_to_pay_energy_bills",
            "worried_foodbank",
            "conservatives_dont_understand_impact",
            "missed_bill_payment",
            "missed_rent_payment",
            "missed_credit_payment",
            "cant_afford_heating",
            "mental_health_cost_of_living",
        ]
        return df
