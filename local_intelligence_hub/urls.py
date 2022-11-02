"""local_intelligence_hub URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from hub import views

urlpatterns = [
    path("", views.HomePageView.as_view(), name="home"),
    path("explore/", views.ExploreView.as_view(), name="explore"),
    path("filter_areas/", views.FilterAreaView.as_view(), name="filtered_areas"),
    path("area/<str:area_type>/<str:name>", views.AreaView.as_view(), name="area"),
    path("location/", views.AreaSearchView.as_view(), name="area_search"),
    path("style/", views.StyleView.as_view(), name="style"),
    path("status/", views.StatusView.as_view(), name="status"),
    path("admin/", admin.site.urls),  # pragma: no cover
    path("accounts/", include("django.contrib.auth.urls")),
]

if settings.DEBUG:  # pragma: no cover
    import debug_toolbar

    urlpatterns += [
        path("__debug__/", include(debug_toolbar.urls)),
    ]

    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
