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

handler404 = views.NotFoundPageView.as_view()

urlpatterns = [
    path("", views.HomePageView.as_view(), name="home"),
    path("explore/", views.ExploreView.as_view(), name="explore"),
    path(
        "explore/datasets.json",
        views.ExploreDatasetsJSON.as_view(),
        name="explore_datasets_json",
    ),
    path(
        "exploregeometry.json",
        views.ExploreGeometryJSON.as_view(),
        name="exploregeometry_json",
    ),
    path("explore.json", views.ExploreJSON.as_view(), name="explore_json"),
    path("explore.csv", views.ExploreCSV.as_view(), name="explore_csv"),
    path("area/<str:area_type>/<str:name>", views.AreaView.as_view(), name="area"),
    path(
        "area/<str:area_type>/<str:name>/<str:category>",
        views.AreaCategoryView.as_view(),
        name="area_category",
    ),
    path(
        "data_set/<int:data_set>/favourite",
        views.FavouriteDataSetView.as_view(),
        name="favourite_dataset",
    ),
    path(
        "data_set/<int:data_set>/unfavourite",
        views.UnFavouriteDataSetView.as_view(),
        name="unfavourite_dataset",
    ),
    path("sources/", views.SourcesView.as_view(), name="sources"),
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
