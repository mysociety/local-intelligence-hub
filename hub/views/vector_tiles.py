from typing import Any
from django.db.models.base import Model as Model
from django.db.models.query import QuerySet
from hub.models import GenericData, ExternalDataSource
from gqlauth.core.middlewares import get_user_or_error, UserOrError

from vectortiles import VectorLayer
from vectortiles.views import MVTView
from django.urls import reverse
from django.views.generic import DetailView, ListView
from vectortiles.views import BaseVectorTileView, TileJSONView

from django.http import HttpResponseForbidden

class GenericDataVectorLayer(VectorLayer):
    model = GenericData
    geom_field = 'point'

    min_zoom = 10

    id = 'generic_data'
    vector_tile_layer_name = id

    tile_fields = ('id', )
    layer_fields = tile_fields
    vector_tile_fields = layer_fields

    def __init__(self, *args, **kwargs):
        self.external_data_source: ExternalDataSource = kwargs.pop('external_data_source', None)
        if self.external_data_source is None:
            raise ValueError('external_data_source is required')
        super().__init__(*args, **kwargs)

    def get_queryset(self) -> QuerySet:
        return self.external_data_source.get_import_data()


class ExternalDataSourceTileView(MVTView, DetailView):
    model = ExternalDataSource
    layer_classes = [GenericDataVectorLayer]

    def get(self, request, *args, **kwargs):
        user_or_error: UserOrError = get_user_or_error(request)
        permissions = ExternalDataSource.user_permissions(user_or_error.user, self.get_object())
        if not permissions.get("can_display_points", False):
            return HttpResponseForbidden("You don't have permission to view location data for this data source.")
        return super().get(request, *args, **kwargs)

    def get_id(self):
        return self.get_object().id
    
    def get_layer_class_kwargs(self, *args, **kwargs):
        return { 'external_data_source': self.get_object() }


class ExternalDataSourcePointTileJSONView(TileJSONView, DetailView):
    model = ExternalDataSource
    name = "My feature dataset"
    attribution = "@IGN - BD Topo 12/2022"
    description = "My dataset"
    layer_classes = [GenericDataVectorLayer]

    def setup(self, *args, **kwargs):
        self.pk = kwargs.get('pk', None)
        super().setup(*args, **kwargs)

    def get_id(self):
        return self.pk
    
    def get_object(self):
        return ExternalDataSource.objects.get(pk=self.pk)

    def get_min_zoom(self, *args, **kwargs):
        return 10

    def get_max_zoom(self, *args, **kwargs):
        return 30

    def get_tile_url(self):
        id = self.get_id()
        """ Base MVTView Url used to generates urls in TileJSON in a.tiles.xxxx/{z}/{x}/{y} format """
        return str(reverse("external_data_source_point_tile", args=(id, 0, 0, 0))).replace("0/0/0", "{z}/{x}/{y}")
    
    def get_layer_class_kwargs(self, *args, **kwargs):
        return { 'external_data_source': self.get_object() }
    
    # def get_layers(self):
    #     return [GenericDataVectorLayer(external_data_source=self.get_object())]