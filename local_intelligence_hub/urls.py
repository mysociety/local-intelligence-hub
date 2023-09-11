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
from django.urls import include, path, re_path
from django.views.generic.base import RedirectView

from hub.views import accounts, area, core, explore

handler404 = core.NotFoundPageView.as_view()

urlpatterns = [
    path("", core.HomePageView.as_view(), name="home"),
    path("explore/", explore.ExploreView.as_view(), name="explore"),
    path(
        "explore/datasets.json",
        explore.ExploreDatasetsJSON.as_view(),
        name="explore_datasets_json",
    ),
    path(
        "exploregeometry.json",
        explore.ExploreGeometryJSON.as_view(),
        name="exploregeometry_json",
    ),
    path("explore.json", explore.ExploreJSON.as_view(), name="explore_json"),
    path("explore.csv", explore.ExploreCSV.as_view(), name="explore_csv"),
    path("area/<str:area_type>/<str:name>", area.AreaView.as_view(), name="area"),
    path(
        "data_set/<int:data_set>/favourite",
        area.FavouriteDataSetView.as_view(),
        name="favourite_dataset",
    ),
    path(
        "data_set/<int:data_set>/unfavourite",
        area.UnFavouriteDataSetView.as_view(),
        name="unfavourite_dataset",
    ),
    path("sources/", core.SourcesView.as_view(), name="sources"),
    path("privacy/", core.PrivacyView.as_view(), name="privacy"),
    path("terms/", core.TermsView.as_view(), name="terms"),
    path("about/", core.AboutView.as_view(), name="about"),
    path("contact/", core.ContactView.as_view(), name="contact"),
    path("location/", area.AreaSearchView.as_view(), name="area_search"),
    path("style/", core.StyleView.as_view(), name="style"),
    path("status/", core.StatusView.as_view(), name="status"),
    path("signup/", accounts.SignupView.as_view(), name="signup"),
    path(
        "confirmation_sent/",
        accounts.ConfirmationSentView.as_view(),
        name="confirmation_sent",
    ),
    path(
        "bad_token/",
        accounts.BadTokenView.as_view(),
        name="bad_token",
    ),
    path("activate_accounts/", RedirectView.as_view(url="/accounts/", permanent=False)),
    path(
        "accounts/",
        accounts.AccountsView.as_view(),
        name="accounts",
    ),
    path(
        "accounts.csv",
        accounts.AccountsCSV.as_view(),
        name="accounts_csv",
    ),
    re_path(
        "activate/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,40})/",
        accounts.ConfirmEmailView.as_view(),
        name="confirm_email",
    ),
    path("admin/", admin.site.urls),  # pragma: no cover
    path("accounts/login/", accounts.LIHLoginView.as_view(), name="login"),
    path("accounts/", include("django.contrib.auth.urls")),
]

if settings.DEBUG:  # pragma: no cover
    import debug_toolbar

    urlpatterns += [
        path("__debug__/", include(debug_toolbar.urls)),
    ]

    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
