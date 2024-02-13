from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from hub.models import Area


class StaticViewSitemap(Sitemap):
    def items(self):
        return [
            "about",
            "contact",
            "explore",
            "future_constituencies",
            "privacy",
            "sources",
            "terms",
        ]

    def location(self, item):
        return reverse(item)


class AreaSiteMap(Sitemap):
    def items(self):
        return Area.objects.all()


hub_sitemap = {
    "static": StaticViewSitemap,
    "area": AreaSiteMap,
}
