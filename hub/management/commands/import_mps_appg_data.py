from .base_importers import BaseMPAPPGMembershipImportCommand


class Command(BaseMPAPPGMembershipImportCommand):
    help = "Import Environment APPG membership"

    description = "Membership in APPGs as gathered by mySociety."
    label = "MP APPG memberships"
    source_label = "Data from mySociety."
    source = "https://parliament.uk/"

    source_base = "https://pages.mysociety.org/appg-membership/data/appg_groups_and_memberships/latest/"
    register_source = source_base + "register.parquet"
    categories_source = source_base + "categories.parquet"
    members_source = source_base + "members.parquet"

    # Default category slugs (as a list to support multiple categories)
    category_slugs = ["ENVIRONMENT_CLIMATE_SUSTAINABILITY"]

    # Site-specific category slugs (each value is a list)
    category_slugs_by_site = {
        "lih": [
            "ENVIRONMENT_CLIMATE_SUSTAINABILITY",
            "INFRASTRUCTURE_TRANSPORT_MOBILITY",
            "ENERGY_UTILITIES",
        ],
        "evaw": [
            "HEALTH_MEDICINE_PUBLIC_HEALTH",
            "HUMAN_RIGHTS_EQUALITY_SOCIAL_JUSTICE",
            "SOCIAL_CARE_WELFARE_FAMILY_SUPPORT",
        ],
    }

    def handle(self, *args, **options):
        # Store the site argument to determine which category_slugs to use
        site_arg = options.get("site", "")

        # Set category_slugs based on the site
        self.category_slugs = self.category_slugs_by_site.get(
            site_arg, self.category_slugs
        )

        # Call the parent handle method
        super().handle(*args, **options)
