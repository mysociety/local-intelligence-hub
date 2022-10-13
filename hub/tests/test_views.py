from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User

from hub.models import Area


class TestLoginEnforced(TestCase):
    def test_login_required(self):
        url = reverse("home")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 302)


class TestPageRenders(TestCase):
    def setUp(self):
        u = User.objects.create(username="user@example.com")
        self.client.force_login(u)

    def test_home_page(self):
        url = reverse("home")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/home.html")

    def test_explore_page(self):
        url = reverse("explore")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/explore.html")

    def test_filter_page(self):
        url = reverse("filtered_areas")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)


class TestAreaPage(TestCase):
    def setUp(self):
        u = User.objects.create(username="user@example.com")
        self.client.force_login(u)

        a = Area.objects.create(
            mapit_id=1, gss="E10000001", name="South Borsetshire", area_type="WMC"
        )

    def test_area_page(self):
        url = reverse("area", args=("WMC", "South Borsetshire"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["page_title"], "South Borsetshire")
        self.assertEqual(context["area"].name, "South Borsetshire")


class TestStatusView(TestCase):
    def test_status_view_is_200(self):
        url = reverse("status")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertRegex(response.content, rb"status: OK")
