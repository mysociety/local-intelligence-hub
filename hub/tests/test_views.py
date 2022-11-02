from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse


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
    fixtures = ["areas.json", "mps.json", "elections.json"]

    def setUp(self):
        u = User.objects.create(username="user@example.com")
        self.client.force_login(u)

    def test_area_page(self):
        url = reverse("area", args=("WMC", "South Borsetshire"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["page_title"], "South Borsetshire")
        self.assertEqual(context["area"].name, "South Borsetshire")

        mp = context["mp"]
        self.assertEqual(mp["person"].name, "James Madeupname")
        self.assertEqual(mp["parlid"], "1")
        self.assertEqual(mp["mp_election_majority"], "1234")
        self.assertEqual(mp["mp_first_elected"].date().isoformat(), "2005-05-05")

    def test_area_page_no_mp(self):
        url = reverse("area", args=("WMC", "Borsetshire East"))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        context = response.context
        self.assertIsNone(context.get("mp"))


class TestAreaSearchPage(TestCase):
    fixtures = ["areas.json", "mps.json"]

    def setUp(self):
        u = User.objects.create(username="user@example.com")
        self.client.force_login(u)

    @patch("utils.mapit.MapIt.postcode_point_to_gss_codes")
    def test_postcode_lookup(self, mapit_areas):
        mapit_areas.return_value = ["E10000001"]

        url = reverse("area_search")
        response = self.client.get(url, {"search": "SE17 3HE"}, follow=True)

        self.assertRedirects(response, "/area/WMC/South%20Borsetshire")
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["area"].name, "South Borsetshire")

    @patch("utils.mapit.session.get")
    def test_bad_postcode(self, mapit_get):
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {"error": "Bad postcode"}

        mapit_get.return_value = mock_response

        url = reverse("area_search")
        response = self.client.get(url, {"search": "SE17 3HE"}, follow=True)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area_search.html")

        context = response.context
        self.assertEqual(str(context["error"]), "Bad postcode")

    def test_area_name_lookup(self):
        url = reverse("area_search")
        response = self.client.get(url, {"search": "South Borsetshire"}, follow=True)

        self.assertRedirects(response, "/area/WMC/South%20Borsetshire")
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["area"].name, "South Borsetshire")

    def test_mp_name_lookup(self):
        url = reverse("area_search")
        response = self.client.get(url, {"search": "James Madeupname"}, follow=True)

        self.assertRedirects(response, "/area/WMC/South%20Borsetshire")
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["area"].name, "South Borsetshire")

    def test_no_match_found(self):
        url = reverse("area_search")
        response = self.client.get(url, {"search": "Lower Locksley"})

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area_search.html")

        context = response.context
        self.assertEqual(context["error"], "Lower Locksley has no matches")

    def test_multiple_matches(self):
        url = reverse("area_search")
        response = self.client.get(url, {"search": "Borsetshire"})

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area_search.html")

        context = response.context
        self.assertEqual(len(context["areas"]), 3)


class TestStatusView(TestCase):
    def test_status_view_is_200(self):
        url = reverse("status")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertRegex(response.content, rb"status: OK")
