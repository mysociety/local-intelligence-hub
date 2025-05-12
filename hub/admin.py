from django.contrib import admin

from hub.models import (
    Area,
    AreaAction,
    AreaActionData,
    AreaData,
    DataSet,
    DataType,
    Person,
    PersonData,
    UserProperties,
)


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


class DataSetDataTypeInline(admin.StackedInline):
    model = DataType
    extra = 0


@admin.register(DataSet)
class DataSetAdmin(admin.ModelAdmin):
    list_display = (
        "label",
        "description",
        "source_label",
        "category",
        "order",
        "featured",
        "is_public",
        "visible",
    )
    list_editable = ("order", "featured", "is_public", "visible")
    list_filter = (
        "category",
        "featured",
        "areas_available",
        "is_public",
        "visible",
        "data_type",
    )
    ordering = ("category", "order", "label")
    search_fields = ["name", "label", "description", "source", "source_label"]

    inlines = [
        DataSetDataTypeInline,
    ]

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


@admin.register(AreaData)
class AreaDataAdmin(admin.ModelAdmin):
    list_display = (
        "value",
        "data_type",
        "area",
    )
    list_filter = (
        "data_type__area_type",
        "data_type",
        "area",
    )
    search_fields = (
        "id",
        "data_type__name",
        "data_type__data_set__name",
        "area__name",
    )


@admin.register(PersonData)
class PersonDataAdmin(admin.ModelAdmin):
    list_display = (
        "value",
        "data_type",
        "person",
    )
    list_filter = (
        "data_type",
        "person",
    )
    search_fields = (
        "id",
        "data_type__name",
        "data_type__data_set__name",
        "person__name",
    )


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "area_type",
        "gss",
        "mapit_id",
    )
    list_filter = ("area_type",)
    search_fields = (
        "name",
        "gss",
        "mapit_id",
    )


@admin.register(AreaAction)
class AreaActionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "label",
    )
    search_fields = ("name",)


@admin.register(AreaActionData)
class AreaActionDataAdmin(admin.ModelAdmin):
    list_display = (
        "area",
        "action",
    )
    search_fields = ("area__name",)


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "person_type",
    )
    search_fields = (
        "name",
        "areas__name",
    )
    list_filter = ("person_type",)
