from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from hub.models import DataSet, UserDataSets


class Test404Page(TestCase):
    def testRequireLoginOver404(self):
        url = "/page_does_not_exist"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 302)

    def test404page(self):
        u = User.objects.create(username="user@example.com")
        self.client.force_login(u)
        url = "/page_does_not_exist"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)
        self.assertTemplateUsed(response, "404.html")


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


class TestExploreDatasetsPage(TestCase):
    fixtures = [
        "areas.json",
        "mps.json",
        "elections.json",
        "area_data.json",
        "mp_memberships.json",
    ]
    output_csv = str.encode(
        "constituency_name,mp_appg_membership\r\nSouth Borsetshire,MadeUpAPPG2; MadeUpAPPG\r\n"
    )

    def setUp(self):
        u = User.objects.create(username="user@example.com")
        self.client.force_login(u)

    def test_explore_datasets_json_page(self):
        url = reverse("explore_datasets_json")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_explore_view_with_many_to_one(self):
        url = f"{reverse('explore_csv')}?mp_appg_membership__exact=MadeUpAPPG"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            self.output_csv,
        )

    def test_explore_view_extra_column(self):
        output_csv = str.encode(
            "constituency_name,mp_appg_membership,wind_support\r\nSouth Borsetshire,MadeUpAPPG2; MadeUpAPPG,70.0\r\n"
        )

        url = f"{reverse('explore_csv')}?mp_appg_membership__exact=MadeUpAPPG&columns=wind_support"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )

    def test_explore_view_multiple_extra_columns(self):
        output_csv = str.encode(
            "constituency_name,mp_appg_membership,wind_support,fuel_poverty\r\nSouth Borsetshire,MadeUpAPPG2; MadeUpAPPG,70.0,12.4321\r\n"
        )

        url = f"{reverse('explore_csv')}?mp_appg_membership__exact=MadeUpAPPG&columns=wind_support,fuel_poverty"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )

    def test_explore_view_extra_columns_multiset(self):
        output_csv = str.encode(
            "constituency_name,mp_appg_membership,wind_support,ages_0-9\r\nSouth Borsetshire,MadeUpAPPG2; MadeUpAPPG,70.0,10.1234\r\n"
        )

        url = f"{reverse('explore_csv')}?mp_appg_membership__exact=MadeUpAPPG&columns=wind_support,ages_0-9"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content,
            output_csv,
        )


class TestExploreFilteringPage(TestCase):
    fixtures = ["areas.json", "mps.json", "elections.json", "area_data.json"]

    def setUp(self):
        self.u = User.objects.create(username="user@example.com")
        self.client.force_login(self.u)

    def test_explore_json_page_year_lt(self):
        url = reverse("explore_json")
        response = self.client.get(url + "?mp_last_elected__year__lt=2019")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "South Borsetshire")
        self.assertContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_json_page_year_gte(self):
        url = reverse("explore_json")
        response = self.client.get(url + "?mp_last_elected__year__gte=2019")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "South Borsetshire")
        self.assertNotContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_json_page_year(self):
        url = reverse("explore_json")
        response = self.client.get(url + "?mp_last_elected__year=2015")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "South Borsetshire")
        self.assertNotContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_csv_page_year_lt(self):
        url = reverse("explore_csv")
        response = self.client.get(url + "?mp_last_elected__year__lt=2019")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "South Borsetshire")
        self.assertContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_csv_page_year_gte(self):
        url = reverse("explore_csv")
        response = self.client.get(url + "?mp_last_elected__year__gte=2019")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "South Borsetshire")
        self.assertNotContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")

    def test_explore_csv_page_year(self):
        url = reverse("explore_csv")
        response = self.client.get(url + "?mp_last_elected__year=2015")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "South Borsetshire")
        self.assertNotContains(response, "Borsetshire West")
        self.assertNotContains(response, "Borsetshire East")


class TestAreaPage(TestCase):
    fixtures = ["areas.json", "mps.json", "elections.json", "area_data.json"]

    def setUp(self):
        self.u = User.objects.create(username="user@example.com")
        self.client.force_login(self.u)

    def test_area_page(self):
        DataSet.objects.update(featured=True)
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
        self.assertEqual(mp["mp_election_majority"], 1234)
        self.assertEqual(mp["mp_first_elected"].date().isoformat(), "2005-05-05")

        places = context["categories"]["place"]
        self.assertEqual(len(places), 2)

        ages = places[0]
        self.assertEqual(len(ages["data"]), 2)
        self.assertEqual(ages["data"][0].value(), 10.1234)

        fuel_poverty = places[1]
        self.assertEqual(fuel_poverty["data"].value(), 12.4321)

        opinion = context["categories"]["opinion"]
        self.assertEqual(len(opinion), 1)

        support = opinion[0]
        self.assertEqual(len(support["data"]), 2)
        self.assertEqual(support["data"][0].value(), 75)

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

    @patch("utils.mapit.MapIt.wgs84_point_to_gss_codes")
    def test_latlon_lookup(self, mapit_areas):
        mapit_areas.return_value = ["E10000001"]

        url = reverse("area_search")
        response = self.client.get(url, {"lat": "0.11", "lon": "0.12"}, follow=True)

        self.assertRedirects(response, "/area/WMC/South%20Borsetshire")
        self.assertTemplateUsed(response, "hub/area.html")

        context = response.context
        self.assertEqual(context["area"].name, "South Borsetshire")

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
        self.assertIn("can’t find", context["error"])
        self.assertIn("Lower Locksley", context["error"])

    def test_multiple_matches(self):
        url = reverse("area_search")
        response = self.client.get(url, {"search": "Borsetshire"})

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "hub/area_search.html")

        context = response.context
        self.assertEqual(len(context["areas"]), 3)


class testUserFavouriteViews(TestCase):
    fixtures = ["areas.json", "mps.json", "elections.json", "area_data.json"]

    def setUp(self):
        self.u = User.objects.create(username="user@example.com")
        self.client.force_login(self.u)

    def test_favouriting(self):
        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        ds = DataSet.objects.get(name="constituency_fuel_poverty")

        url = reverse("favourite_dataset", args=(ds.pk,))
        response = self.client.post(url, HTTP_REFERER="/area/WMC/Borsetshire")

        self.assertEqual(response.status_code, 302)

        count = UserDataSets.objects.count()
        self.assertEqual(count, 1)

        self.assertTrue(UserDataSets.objects.filter(data_set=ds, user=self.u).exists())

    def test_ajax_favouriting(self):
        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        ds = DataSet.objects.get(name="constituency_fuel_poverty")

        url = reverse("favourite_dataset", args=(ds.pk,))
        response = self.client.post(url, HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 200)

        count = UserDataSets.objects.count()
        self.assertEqual(count, 1)

        self.assertTrue(UserDataSets.objects.filter(data_set=ds, user=self.u).exists())
        fav = UserDataSets.objects.get(data_set=ds, user=self.u)
        self.assertEqual(response.json(), {"pk": fav.pk})

    def test_unfavouriting(self):
        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        ds = DataSet.objects.get(name="constituency_fuel_poverty")
        UserDataSets.objects.create(data_set=ds, user=self.u)

        url = reverse("unfavourite_dataset", args=(ds.pk,))
        response = self.client.post(url, HTTP_REFERER="/area/WMC/Borsetshire")

        self.assertEqual(response.status_code, 302)

        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        self.assertFalse(UserDataSets.objects.filter(data_set=ds, user=self.u).exists())

    def test_ajax_unfavouriting(self):
        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        ds = DataSet.objects.get(name="constituency_fuel_poverty")
        UserDataSets.objects.create(data_set=ds, user=self.u)

        url = reverse("unfavourite_dataset", args=(ds.pk,))
        response = self.client.post(url, HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 200)

        count = UserDataSets.objects.count()
        self.assertEqual(count, 0)

        self.assertEqual(response.json(), {"deleted": True})


class TestStatusView(TestCase):
    def test_status_view_is_200(self):
        url = reverse("status")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["database"], "ok")
        self.assertEqual(response.json()["areas"], 0)
        self.assertEqual(response.json()["datasets"], 0)
