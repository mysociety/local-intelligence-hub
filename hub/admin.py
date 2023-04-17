from django.contrib import admin

from hub.models import DataSet, UserProperties


@admin.register(UserProperties)
class UserPropertiesAdmin(admin.ModelAdmin):
    search_fields = ["user__username", "full_name", "organisation_name"]
    list_filter = [
        "user__is_active",
        "email_confirmed",
        "account_confirmed",
        "last_seen",
    ]
    list_display = [
        "user",
        "full_name",
        "organisation_name",
        "email_confirmed",
        "account_confirmed",
        "user_is_active",
        "last_seen",
    ]

    @admin.display(description="Is Active")
    def user_is_active(self, obj):
        return obj.user.is_active


@admin.register(DataSet)
class DataSetAdmin(admin.ModelAdmin):
    list_display = ("__str__", "description", "category", "order", "featured")
    list_editable = ("order", "featured")
    list_filter = ("category", "featured", "data_type")
    ordering = ("order", "name")
    search_fields = ["name", "description", "source"]

    def has_module_permission(self, request):
        if request.user.is_superuser or request.user.has_perm("hub.order_and_feature"):
            return True

        return False

    def has_change_permission(self, request, obj=None):
        has_perm = super().has_change_permission(request, obj)

        if (
            not has_perm
            and request.user.is_superuser
            or request.user.has_perm("hub.order_and_feature")
        ):
            return True

        return has_perm

    def get_readonly_fields(self, request, obj):
        fields = ()

        if not request.user.has_perm("hub.dataset_change") and request.user.has_perm(
            "hub.order_and_feature"
        ):
            fields = (
                "label",
                "data_type",
                "is_range",
                "description",
                "category",
                "name",
                "source",
                "source_label",
                "data_url",
                "source_type",
                "is_upload",
            )

        return fields
