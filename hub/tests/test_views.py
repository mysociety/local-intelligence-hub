from django.test import TestCase, Client
from django.urls import reverse


class TestPageRenders(TestCase):
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
