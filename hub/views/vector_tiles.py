from django.db.models.query import QuerySet
from django.http import HttpResponseForbidden
from django.urls import reverse
from django.views.generic import DetailView

from gqlauth.core.middlewares import UserOrError, get_user_or_error
from vectortiles import VectorLayer
from vectortiles.views import MVTView, TileJSONView

from hub.models import ExternalDataSource, GenericData


class GenericDataVectorLayer(VectorLayer):
    model = GenericData
    geom_field = "point"

    min_zoom = 1

    id = "generic_data"
    vector_tile_layer_name = id

    tile_fields = ("id",)
    layer_fields = tile_fields
    vector_tile_fields = layer_fields

    def __init__(self, *args, **kwargs):
        self.external_data_source_id = kwargs.pop("external_data_source_id", None)
        if self.external_data_source_id is None:
            raise ValueError("external_data_source is required")
        super().__init__(*args, **kwargs)

    def get_queryset(self) -> QuerySet:
        return ExternalDataSource._get_import_data(self.external_data_source_id)


class ExternalDataSourceTileView(MVTView, DetailView):
    model = ExternalDataSource
    layer_classes = [GenericDataVectorLayer]

    def get(self, request, *args, **kwargs):
        try:
            user_or_error: UserOrError = get_user_or_error(request)
            permissions = ExternalDataSource.user_permissions(
                user_or_error.user if user_or_error.user else None,
                self.get_id()
            )
            if not permissions.get("can_display_points", False):
                return HttpResponseForbidden(
                    "You don't have permission to view location data for this data source."
                )
            return super().get(request, *args, **kwargs)
        except Exception:
            return HttpResponseForbidden(
                "You don't have permission to view location data for this data source."
            )

    def get_id(self):
        return self.kwargs.get(self.pk_url_kwarg)

    def get_layer_class_kwargs(self, *args, **kwargs):
        return {"external_data_source_id": self.get_id()}


class ExternalDataSourcePointTileJSONView(TileJSONView, DetailView):
    model = ExternalDataSource
    layer_classes = [GenericDataVectorLayer]

    def get_name(self):
        return self.get_object().name

    def get_attribution(self):
        return self.get_object().organisation.name

    def get_description(self):
        return f"{self.get_name()} is a {self.get_object().crm_type} source."

    def setup(self, *args, **kwargs):
        super().setup(*args, **kwargs)

    def get_id(self):
        return self.kwargs.get(self.pk_url_kwarg)

    def get_object(self):
        return ExternalDataSource.objects.get(pk=self.get_id())

    def get_min_zoom(self, *args, **kwargs):
        return 1

    def get_max_zoom(self, *args, **kwargs):
        return 30

    def get_tile_url(self):
        id = self.get_id()
        """ Base MVTView Url used to generates urls in TileJSON in a.tiles.xxxx/{z}/{x}/{y} format """
        return str(
            reverse("external_data_source_point_tile", args=(id, 0, 0, 0))
        ).replace("0/0/0", "{z}/{x}/{y}")

    def get_layer_class_kwargs(self, *args, **kwargs):
        return {"external_data_source_id": self.get_id()}

    # def get_layers(self):
    #     return [GenericDataVectorLayer(external_data_source=self.get_object())]
