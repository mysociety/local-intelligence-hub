from django.core.management.base import BaseCommand

from hub.models import DataSet

constituency_change_annotations_lookup = {
    "power_postcodes_count": {
        "unit_type": "point",
        "unit_distribution": "point",
    },
    "constituency_age_distribution": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "constituency_fuel_poverty": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "brexit_votes": {"unit_type": "percentage", "unit_distribution": "people_in_area"},
    "constituency_cafod_activists_count": {
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    },
    "constituency_cafod_parishes_count": {
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    },
    "constituency_cafod_schools_count": {
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    },
    "constituency_child_poverty": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "christian_aid_group_count": {
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    },
    "not_able_to_afford_mortgage_rent": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "not_able_to_pay_energy_bills": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "worried_foodbank": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "conservatives_dont_understand_impact": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "missed_bill_payment": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "missed_rent_payment": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "missed_credit_payment": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "cant_afford_heating": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "mental_health_cost_of_living": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "efpc_constituency_fuel_poverty": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "constituency_foe_groups_count": {
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    },
    "constituency_foe_activists_count": {
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    },
    "constituency_foe_supporters_count": {
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    },
    "constituency_foodbank_count": {
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    },
    "constituency_gbgw_2022_event_count": {
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    },
    "hnh_mrp_24-3": {"unit_type": "percentage", "unit_distribution": "people_in_area"},
    "hnh_mrp_29": {"unit_type": "percentage", "unit_distribution": "people_in_area"},
    "hnh_mrp_37-1": {"unit_type": "percentage", "unit_distribution": "people_in_area"},
    "hnh_mrp_41-1": {"unit_type": "percentage", "unit_distribution": "people_in_area"},
    "hnh_mrp_25": {"unit_type": "percentage", "unit_distribution": "people_in_area"},
    "constituency_imd": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "constituency_nt_properties_count": {
        "unit_type": "point",
        "unit_distribution": "point",
    },
    "constituency_onshore_windfarm_count": {
        "unit_type": "point",
        "unit_distribution": "point",
    },
    "constituency_nz_support": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "constituency_nz_neutral": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "constituency_nz_oppose": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "constituency_cc_high": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "would-change-party": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "less-favourable-conservative-weaken-climate": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "prefer-conservative-leader-invest-renewables": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "support-offshore-wind": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "support-onshore-wind": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "support-solar": {"unit_type": "percentage", "unit_distribution": "people_in_area"},
    "support-tidal": {"unit_type": "percentage", "unit_distribution": "people_in_area"},
    "support-wave": {"unit_type": "percentage", "unit_distribution": "people_in_area"},
    "support-nuclear": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "support-local-renewable": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "believe-gov-renewable-invest-increase": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "believe-gov-renewable-should-invest": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "believe-block-onshore-wind": {
        "unit_type": "percentage",
        "unit_distribution": "people_in_area",
    },
    "save_the_children_shops_count": {
        "unit_type": "point",
        "unit_distribution": "point",
    },
    "tearfund_churches": {"unit_type": "point", "unit_distribution": "point"},
    "constituency_wi_group_count": {
        "unit_type": "point",
        "unit_distribution": "point",
    },
    "constituency_wwf_supporters_count": {
        "unit_type": "raw",
        "unit_distribution": "people_in_area",
    },
}


class Command(BaseCommand):
    help = "update dataset unit annotations"

    def handle(self, *args, **options):
        for name, annotations in constituency_change_annotations_lookup.items():
            try:
                dataset = DataSet.objects.get(name=name)
            except DataSet.DoesNotExist:
                print(f"Dataset with name: {name} does not exist, skipping.")
                continue
            dataset.unit_type = annotations["unit_type"]
            dataset.unit_distribution = annotations["unit_distribution"]
            dataset.save()
