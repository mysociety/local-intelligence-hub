from datetime import datetime

from django.conf import settings
from django.test import TestCase, override_settings, Client
from django.urls import reverse
from django.core.management import call_command
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
import json

from asgiref.sync import sync_to_async

from hub import models
from hub.graphql.schema import schema


class Setup:
    def setUp(self) -> None:
        self.client = Client()
        # Create user
        self.user = models.User.objects.create_user(username='testuser', password='12345')
        # Create org for user
        self.org = models.Organisation.objects.create(name='testorg', slug='testorg')
        self.membership = models.Membership.objects.create(user=self.user, organisation=self.org, role='owner')
        # Create source
        self.source = models.ExternalDataSource.objects.create(
            name='testsource',
            organisation=self.org
        )
        # Some dummy data
        ds = models.DataSet.objects.create(
            name='xyz',
            external_data_source=self.source
        )
        dt = models.DataType.objects.create(
            name='xyz',
            data_set=ds
        )
        self.generic_data = models.GenericData.objects.create(
            data="xyz",
            email="xyz@bbc.com",
            json={
                "some": "thing"
            },
            point='POINT(0 0)',
            postcode_data = {
                "european_electoral_region": "XXX"
            },
            data_type=dt
        )
        # Make a dummy region
        area_type = models.AreaType.objects.create(
            name="2018 European Electoral Regions",
            code="EER",
            area_type="European Electoral Region",
            description="European Electoral Region boundaries, as at December 2018",
        )
        models.Area.objects.create(
            mapit_id="XXX",
            gss="XXX",
            name="Fake area",
            polygon=MultiPolygon([GEOSGeometry("POLYGON((-1 -1, -1 1, 1 1, 1 -1, -1 -1))")]),
            point=GEOSGeometry("POINT(0 0)"),
            area_type=area_type,
        )
        # Create report
        self.report = models.MapReport.objects.create(
            name='testreport',
            organisation=self.org,
            layers=[
                models.MapReport.MapLayer(
                    id='testlayer',
                    name='testlayer',
                    source=str(self.source.id),
                    visible=True
                )
            ]
        )


@override_settings(
  ALLOWED_HOSTS=["testserver"],
  # DEBUG=True,
  # HIDE_DEBUG_TOOLBAR=True
)
class TestOwnSources(Setup, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client.login(username="testuser", password="12345")
        res = self.client.get(
            reverse("graphql"),
            data={
                "variables": {
                    "username": "testuser",
                    "password": "12345"
                },
                "query": """
            mutation Login($username: String!, $password: String!) {
              tokenAuth(username: $username, password: $password) {
                errors
                success
                token {
                  token
                }
              }
            }
            """
          }
        )
        print(res, res.status_code)
        self.assertEqual(res.status_code, 200)
        self.token = res.json["tokenAuth"]["token"]["token"]

    def test_permissions_calculator(self):
        permissions = models.ExternalDataSource.user_permissions(self.user.id, self.source)
        self.assertDictEqual(permissions, {
            "can_display_points": True,
            "can_display_details": True
        })

    # Test graphQL query for aggregates
    def test_aggregate_data_count(self):
        query = """
            query MapReportLayerGeoJSONPoint($sourceId: String!) {
              sharedDataSource(sourceId: $sourceId) {
                id
                importedDataCountByRegion {
                  gss
                  count
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "sourceId": self.source.id
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )
        result = res.json
    
        self.assertIsNone(result.errors)
        self.assertEqual(len(result.data["sharedDataSource"]["importedDataCountByRegion"]), 2)

    # Test graphQL query for geojson point
    def test_generic_data_visibility(self):
        query = """
            query MapReportLayerGeoJSONPoint($genericDataId: String!) {
              importedDataGeojsonPoint(genericDataId: $genericDataId) {
                id
                geometry {
                  coordinates
                }
                properties {
                  id
                  email
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "genericDataId": self.generic_data.id
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )
        result = res.json
    
        self.assertIsNone(result.errors)
        self.assertDictEqual(result.data["importedDataGeojsonPoint"], {
            "id": str(self.generic_data.id),
            "geometry": {"coordinates": [0, 0]},
            "properties": {
                "id": str(self.generic_data.id),
                "email": "xyz@bbc.com"
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )

    # Test tileserver query for vector tiles
    def test_vector_tiles_visibility(self):
        res = self.client.get(reverse('external_data_source_point_tile', kwargs={'pk': self.source.id, 'z': 0, 'x': 0, 'y': 0}))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/vnd.mapbox-vector-tile')
        self.assertIsNotNone(res.content)
        

@override_settings(
  ALLOWED_HOSTS=["testserver"],
  # DEBUG=True,
  # HIDE_DEBUG_TOOLBAR=True
)
class TestFullSharing(Setup, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.other_user = models.User.objects.create_user(username='otheruser', password='12345')
        self.other_org = models.Organisation.objects.create(name='otherorg', slug='otherorg')
        self.sharing = models.SharingPermission.objects.create(
            external_data_source=self.source,
            organisation=self.other_org,
            visibility_record_coordinates=True,
            visibility_record_details=True
        )
        self.client.login(username="otheruser", password="12345")
        res = self.client.get(
            reverse("graphql"),
            data={
                "variables": {
                    "username": "otheruser",
                    "password": "12345"
                },
                "query": """
            mutation Login($username: String!, $password: String!) {
              tokenAuth(username: $username, password: $password) {
                errors
                success
                token {
                  token
                }
              }
            }
            """
          }
        )
        self.token = res.json["data"]["tokenAuth"]["token"]["token"]

    def test_permissions_calculator(self):
        permissions = models.ExternalDataSource.user_permissions(self.other_user.id, self.source)
        self.assertDictEqual(permissions, {
            "can_display_points": True,
            "can_display_details": True
        })

    def test_aggregate_data_count(self):
        query = """
            query MapReportLayerGeoJSONPoint($sourceId: String!) {
              sharedDataSource(sourceId: $sourceId) {
                id
                importedDataCountByRegion {
                  gss
                  count
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "sourceId": self.source.id
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )
        result = res.json
    
        self.assertIsNone(result.errors)
        self.assertEqual(len(result.data["sharedDataSource"]["importedDataCountByRegion"]), 2)

    def test_generic_data_visibility(self):
        query = """
            query MapReportLayerGeoJSONPoint($genericDataId: String!) {
              importedDataGeojsonPoint(genericDataId: $genericDataId) {
                id
                geometry {
                  coordinates
                }
                properties {
                  id
                  email
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "genericDataId": self.generic_data.id
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )
        result = res.json
    
        self.assertIsNone(result.errors)
        self.assertDictEqual(result.data["importedDataGeojsonPoint"], {
            "id": str(self.generic_data.id),
            "geometry": {"coordinates": [0, 0]},
            "properties": {
                "id": str(self.generic_data.id),
                "email": "xyz@bbc.com"
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )

    def test_vector_tiles_visibility(self):
        res = self.client.get(reverse('external_data_source_point_tile', kwargs={'pk': self.source.id, 'z': 0, 'x': 0, 'y': 0}))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/vnd.mapbox-vector-tile')
        self.assertIsNotNone(res.content)


@override_settings(
  ALLOWED_HOSTS=["testserver"],
  # DEBUG=True,
  # HIDE_DEBUG_TOOLBAR=True
)
class TestLocationOnlySharing(Setup, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.other_user = models.User.objects.create_user(username='otheruser', password='12345')
        self.other_org = models.Organisation.objects.create(name='otherorg', slug='otherorg')
        self.sharing = models.SharingPermission.objects.create(
            external_data_source=self.source,
            organisation=self.other_org,
            visibility_record_coordinates=True,
            visibility_record_details=False
        )
        self.client.login(username="otheruser", password="12345")
        res = self.client.get(
            reverse("graphql"),
            data={
                "variables": {
                    "username": "otheruser",
                    "password": "12345"
                },
                "query": """
            mutation Login($username: String!, $password: String!) {
              tokenAuth(username: $username, password: $password) {
                errors
                success
                token {
                  token
                }
              }
            }
            """
          }
        )
        self.token = res.json["data"]["tokenAuth"]["token"]["token"]


    def test_permissions_calculator(self):
        permissions = models.ExternalDataSource.user_permissions(self.other_user.id, self.source)
        self.assertDictEqual(permissions, {
            "can_display_points": True,
            "can_display_details": False
        })


    def test_aggregate_data_count(self):
        query = """
            query MapReportLayerGeoJSONPoint($sourceId: String!) {
              sharedDataSource(sourceId: $sourceId) {
                id
                importedDataCountByRegion {
                  gss
                  count
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "sourceId": self.source.id
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )
        result = res.json
    
        self.assertIsNone(result.errors)
        self.assertEqual(len(result.data["sharedDataSource"]["importedDataCountByRegion"]), 2)


    def test_vector_tiles_visibility(self):
        res = self.client.get(reverse('external_data_source_point_tile', kwargs={'pk': self.source.id, 'z': 0, 'x': 0, 'y': 0}))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/vnd.mapbox-vector-tile')
        self.assertIsNotNone(res.content)


    def test_generic_data_visibility(self):
        query = """
            query MapReportLayerGeoJSONPoint($genericDataId: String!) {
              importedDataGeojsonPoint(genericDataId: $genericDataId) {
                id
                geometry {
                  coordinates
                }
                properties {
                  id
                  email
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "genericDataId": self.generic_data.id
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )
        result = res.json
    
        self.assertIsNotNone(result.errors)


@override_settings(
  ALLOWED_HOSTS=["testserver"],
  # DEBUG=True,
  # HIDE_DEBUG_TOOLBAR=True
)
class TestAggregateOnlySharing(Setup, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.other_user = models.User.objects.create_user(username='otheruser', password='12345')
        self.other_org = models.Organisation.objects.create(name='otherorg', slug='otherorg')
        self.sharing = models.SharingPermission.objects.create(
            external_data_source=self.source,
            organisation=self.other_org,
            visibility_record_coordinates=False,
            visibility_record_details=False
        )
        self.client.login(username="otheruser", password="12345")
        res = self.client.get(
            reverse("graphql"),
            data={
                "variables": {
                    "username": "otheruser",
                    "password": "12345"
                },
                "query": """
            mutation Login($username: String!, $password: String!) {
              tokenAuth(username: $username, password: $password) {
                errors
                success
                token {
                  token
                }
              }
            }
            """
          }
        )
        self.token = res.json["data"]["tokenAuth"]["token"]["token"]

    def test_permissions_calculator(self):
        permissions = models.ExternalDataSource.user_permissions(self.other_user.id, self.source)
        self.assertDictEqual(permissions, {
            "can_display_points": False,
            "can_display_details": False
        })

    def test_aggregate_data_count(self):
        query = """
            query MapReportLayerGeoJSONPoint($sourceId: String!) {
              sharedDataSource(sourceId: $sourceId) {
                id
                importedDataCountByRegion {
                  gss
                  count
                }
              }
            }
        """

        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "sourceId": self.source.id
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )
        result = res.json
    
        self.assertIsNone(result.errors)
        self.assertEqual(len(result.data["sharedDataSource"]["importedDataCountByRegion"]), 2)


    def test_vector_tiles_visibility(self):
        res = self.client.get(reverse('external_data_source_point_tile', kwargs={'pk': self.source.id, 'z': 0, 'x': 0, 'y': 0}), follow=True)
        self.assertNotEqual(res.status_code, 200)
        self.assertNotEqual(res['Content-Type'], 'application/vnd.mapbox-vector-tile')
        self.assertIsNone(res.content)


    def test_generic_data_visibility(self):
        query = """
            query MapReportLayerGeoJSONPoint($genericDataId: String!) {
              importedDataGeojsonPoint(genericDataId: $genericDataId) {
                id
                geometry {
                  coordinates
                }
                properties {
                  id
                  email
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "genericDataId": self.generic_data.id
            },
        })
        result = res.json
    
        self.assertIsNotNone(result.errors)


@override_settings(
  ALLOWED_HOSTS=["testserver"],
  # DEBUG=True,
  # HIDE_DEBUG_TOOLBAR=True
)
class TestNoSharing(Setup, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.other_user = models.User.objects.create_user(username='otheruser', password='12345')
        self.other_org = models.Organisation.objects.create(name='otherorg', slug='otherorg')
        self.client.login(username="otheruser", password="12345")
        res = self.client.get(
            reverse("graphql"),
            data={
                "variables": {
                    "username": "otheruser",
                    "password": "12345"
                },
                "query": """
            mutation Login($username: String!, $password: String!) {
              tokenAuth(username: $username, password: $password) {
                errors
                success
                token {
                  token
                }
              }
            }
            """
          }
        )
        self.token = res.json["data"]["tokenAuth"]["token"]["token"]

    def test_permissions_calculator(self):
        permissions = models.ExternalDataSource.user_permissions(self.other_user.id, self.source)
        self.assertDictEqual(permissions, {
            "can_display_points": False,
            "can_display_details": False
        })


    def test_aggregate_data_count(self):
        query = """
            query MapReportLayerGeoJSONPoint($sourceId: String!) {
              sharedDataSource(sourceId: $sourceId) {
                id
                importedDataCountByRegion {
                  gss
                  count
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "sourceId": self.source.id
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )
        result = res.json
    
        self.assertIsNotNone(result.errors)
        self.assertIsNone(result.data)


    def test_vector_tiles_visibility(self):
        res = self.client.get(reverse('external_data_source_point_tile', kwargs={'pk': self.source.id, 'z': 0, 'x': 0, 'y': 0}))
        self.assertNotEqual(res.status_code, 200)
        self.assertNotEqual(res['Content-Type'], 'application/vnd.mapbox-vector-tile')
        self.assertIsNone(res.content)


    def test_generic_data_visibility(self):
        query = """
            query MapReportLayerGeoJSONPoint($genericDataId: String!) {
              importedDataGeojsonPoint(genericDataId: $genericDataId) {
                id
                geometry {
                  coordinates
                }
                properties {
                  id
                  email
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "genericDataId": self.generic_data.id
            }
          },
          headers={
            "Authorization": f"JWT {self.token}"
          }
        )
        result = res.json
    
        self.assertIsNotNone(result.errors)


@override_settings(
  ALLOWED_HOSTS=["testserver"],
  # DEBUG=True,
  # HIDE_DEBUG_TOOLBAR=True
)
class TestLoggedOutUserForUnsharedSource(Setup, TestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_permissions_calculator(self):
        permissions = models.ExternalDataSource.user_permissions(None, self.source)
        self.assertDictEqual(permissions, {
            "can_display_points": False,
            "can_display_details": False
        })


    def test_aggregate_data_count(self):
        query = """
            query MapReportLayerGeoJSONPoint($sourceId: String!) {
              sharedDataSource(sourceId: $sourceId) {
                id
                importedDataCountByRegion {
                  gss
                  count
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "sourceId": self.source.id
            }
          }
        )
        result = res.json
    
        self.assertIsNotNone(result.errors)
        self.assertIsNone(result.data)


    def test_vector_tiles_visibility(self):
        res = self.client.get(reverse('external_data_source_point_tile', kwargs={'pk': self.source.id, 'z': 0, 'x': 0, 'y': 0}))
        self.assertNotEqual(res.status_code, 200)
        self.assertNotEqual(res['Content-Type'], 'application/vnd.mapbox-vector-tile')
        self.assertIsNone(res.content)


    def test_generic_data_visibility(self):
        query = """
            query MapReportLayerGeoJSONPoint($genericDataId: String!) {
              importedDataGeojsonPoint(genericDataId: $genericDataId) {
                id
                geometry {
                  coordinates
                }
                properties {
                  id
                  email
                }
              }
            }
        """
    
        res = self.client.get(
          reverse("graphql"),
          data={
            "query": query,
            "variables": {
                "genericDataId": self.generic_data.id
            }
          }
        )
        result = res.json
    
        self.assertIsNotNone(result.errors)

# TODO: class TestLoggedOutUserForSharedSource