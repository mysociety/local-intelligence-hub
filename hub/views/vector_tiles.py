from hub.models import GenericData

# in a vector_layers.py file
from vectortiles import VectorLayer
from vectortiles.views import MVTView, TileJSONView
from django.urls import reverse

class GenericDataVectorLayer(VectorLayer):
    # TODO:
    model = GenericData
    geom_field = "point"
    vector_tile_layer_name = "features"
    vector_tile_fields = ("data",)
    min_zoom = 11

class GenericDataTileView(MVTView):
    layer_classes = [GenericDataVectorLayer]

    def get_queryset(self, *args, **kwargs):
        print(self.request, self, args, kwargs)
        return super().get_queryset()
    
class FeatureTileJSONView(TileJSONView):
    """Simple model TileJSON View"""

    name = "Member data"
    attribution = "@Mapped campaign data"
    description = "Locations of members"
    layer_classes = [GenericDataVectorLayer]

    def get_tile_url(self):
        """ Base MVTView Url used to generates urls in TileJSON in a.tiles.xxxx/{z}/{x}/{y} format """
        return str(reverse("generic_data_tile_view", args=(0, 0, 0))).replace("0/0/0", "{z}/{x}/{y}")