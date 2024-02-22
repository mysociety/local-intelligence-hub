from hub.models import Area
from rest_framework import permissions, serializers, viewsets


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ['id', 'mapit_id', 'gss', 'name']


class PublicAreaViewSet(viewsets.ModelViewSet):
    """
    Example API endpoint for Areas
    """
    queryset = Area.objects.all().order_by('id')
    serializer_class = AreaSerializer
    permission_classes = []


class PrivateAreaViewSet(viewsets.ModelViewSet):
    """
    Example API endpoint for Areas
    """
    queryset = Area.objects.all().order_by('id')
    serializer_class = AreaSerializer
    permission_classes = [permissions.IsAuthenticated]
