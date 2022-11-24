from datetime import datetime, timezone

from django.test import TestCase

from hub.models import Area, AreaData, DataSet, DataType, Person


class TestDataSet(TestCase):
    def test_string_rep(self):
        dataset = DataSet.objects.create(name="dataset_name")

        self.assertEqual(str(dataset), "dataset_name")

        dataset.label = "Dataset Label"
        dataset.save()

        self.assertEqual(str(dataset), "Dataset Label")

    def test_source_name(self):
        dataset = DataSet.objects.create(name="dataset_name")

        self.assertEqual(dataset.source_name, "unknown")

        dataset.data_url = "http://example.org/data/data.csv"
        dataset.save()

        self.assertEqual(dataset.source_name, "example.org")

        dataset.source = "http://example.com/some/data"
        dataset.save()

        self.assertEqual(dataset.source_name, "example.com")

        dataset.source_label = "Example dot org"
        dataset.save()

        self.assertEqual(dataset.source_name, "Example dot org")

    def test_source_url(self):
        dataset = DataSet.objects.create(
            name="dataset_name", data_url="http://example.org/data/data.csv"
        )

        self.assertEqual(dataset.source_url, "http://example.org/data/data.csv")

        dataset.source = "http://example.com/some/data"
        dataset.save()

        self.assertEqual(dataset.source_url, "http://example.com/some/data")


class TestDataType(TestCase):
    def setUp(self):
        self.dataset = DataSet.objects.create(
            name="dataset_name",
        )

    def test_string_rep(self):
        datatype = DataType.objects.create(
            data_set=self.dataset,
            name="datatype_name",
        )

        self.assertEqual(str(datatype), "datatype_name")

        datatype.label = "DataType Label"
        datatype.save()

        self.assertEqual(str(datatype), "DataType Label")

    def test_type_properties(self):
        datatype = DataType.objects.create(
            data_set=self.dataset, name="datatype_name", data_type="text"
        )

        self.assertFalse(datatype.is_number)
        self.assertFalse(datatype.is_percentage)
        self.assertFalse(datatype.is_float)
        self.assertFalse(datatype.is_date)

        datatype.data_type = "integer"
        datatype.save()

        self.assertTrue(datatype.is_number)
        self.assertFalse(datatype.is_percentage)
        self.assertFalse(datatype.is_float)
        self.assertFalse(datatype.is_date)

        datatype.data_type = "float"
        datatype.save()

        self.assertTrue(datatype.is_number)
        self.assertFalse(datatype.is_percentage)
        self.assertTrue(datatype.is_float)
        self.assertFalse(datatype.is_date)

        datatype.data_type = "percent"
        datatype.save()

        self.assertTrue(datatype.is_number)
        self.assertTrue(datatype.is_percentage)
        self.assertTrue(datatype.is_float)
        self.assertFalse(datatype.is_date)

        datatype.data_type = "date"
        datatype.save()

        self.assertFalse(datatype.is_number)
        self.assertFalse(datatype.is_percentage)
        self.assertFalse(datatype.is_float)
        self.assertTrue(datatype.is_date)


class TestCommonData(TestCase):
    fixtures = ["areas.json"]

    def setUp(self):
        self.area = Area.objects.get(gss="E10000001")

        self.dataset = DataSet.objects.create(
            name="dataset_name",
        )

        self.datatype = DataType.objects.create(
            data_set=self.dataset, name="datatype_name", data_type="text"
        )

    def test_value(self):
        data = AreaData.objects.create(
            area=self.area, data_type=self.datatype, data="1"
        )

        self.assertEqual(data.value(), "1")

        self.datatype.data_type = "integer"
        self.datatype.save()

        self.assertEqual(data.value(), 1)

        data.data = 1.1
        data.save()

        self.assertEqual(data.value(), 1)

        self.datatype.data_type = "float"
        self.datatype.save()

        self.assertEqual(data.value(), 1.1)

        data.data = "text"
        data.save()

        self.assertEqual(data.value(), "text")

        self.datatype.data_type = "date"
        self.datatype.save()

        self.assertEqual(data.value(), None)

        the_date = datetime.fromisoformat("2022-10-11")
        the_date = the_date.replace(tzinfo=timezone.utc)

        data.date = the_date
        data.save()

        self.assertEqual(data.value().date().isoformat(), "2022-10-11")


class TestPerson(TestCase):
    fixtures = ["areas.json"]

    def setUp(self):
        self.area = Area.objects.get(gss="E10000001")

    def test_string_rep(self):
        p = Person.objects.create(area=self.area, name="A Person")

        self.assertEqual(str(p), "A Person")

    def test_url(self):
        p = Person.objects.create(area=self.area, name="A Person")

        self.assertEqual(p.get_absolute_url(), "/area/WMC/South Borsetshire")