from django.contrib import admin

from hub.models import DataSet


@admin.register(DataSet)
class DataSetAdmin(admin.ModelAdmin):
    list_display = ("__str__", "description", "category", "order", "featured")
    list_editable = ("order", "featured")
    list_filter = ("category", "featured")
    ordering = ("order", "name")

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
            )

        return fields
