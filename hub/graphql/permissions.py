
from django.contrib.auth.models import AbstractBaseUser
from hub import models

def check_user_can_view_source(
    user: AbstractBaseUser | str, source_id: str
):
    external_data_source = models.ExternalDataSource.objects.get(pk=source_id)
    permissions = models.ExternalDataSource.user_permissions(user, external_data_source)
    if not permissions.get("can_display_points") or not permissions.get(
        "can_display_details"
    ):
        raise ValueError(
            f"User {user} does not have permission to external data source: {source_id}"
        )