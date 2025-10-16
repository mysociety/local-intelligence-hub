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
    category_slug = "ENVIRONMENT_CLIMATE_SUSTAINABILITY"
