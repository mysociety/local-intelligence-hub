from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.views import View


class PostcodeView(View):
    def get(self, request: HttpRequest) -> HttpResponse:

        context = {
            "page_title": "Postcode to Constituency Tool",
            "meta_description": "Add the new 2024 constituencies to your postcode data.",
        }

        return render(request, "hub/tools/postcode.html", context)
