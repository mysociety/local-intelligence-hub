from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User


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

    def test_area_page(self):
        url = reverse("area")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area.html")
