import requests
from django.test import TestCase
from django.core.management import call_command

from unittest.mock import MagicMock, patch
from hub.models import Person, PersonData


class ImportMPsTestCase(TestCase):
    fixtures = ["areas.json"]

    @patch("hub.management.commands.import_mps.requests")
    def test_import(self, request_mock):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": {
                "bindings": [
                    {
                        "gss_code": {"value": "E10000001"},
                        "personLabel": {"value": "James Madeupname"},
                        "partyLabel": {"value": "Borsetshire Independence"},
                        "parlid": {"value": 1},
                        "twfyid": {"value": 26},
                    },
                    {
                        "gss_code": {"value": "E10000002"},
                        "personLabel": {"value": "Angela Madeupname"},
                        "partyLabel": {"value": "Borsetshire Unionist"},
                        "parlid": {"value": 2},
                        "twfyid": {"value": 27},
                    },
                ]
            }
        }
        request_mock.get.return_value = mock_response
        call_command("import_mps")

        mps = Person.objects.all()
        self.assertEqual(mps.count(), 2)

        first = mps[0]
        self.assertEqual(first.name, "James Madeupname")
        self.assertEqual(first.external_id, "1")

        all_data = PersonData.objects.filter(person=first)
        self.assertEqual(all_data.count(), 3)

        data = all_data.filter(data_type__name="twfyid").first()
        self.assertEqual(data.data, "26")

        data = all_data.filter(data_type__name="party").first()
        self.assertEqual(data.data, "Borsetshire Independence")


class ImportMPElectionResultsTestCase(TestCase):
    fixtures = ["areas.json", "mps.json"]

    @patch("hub.management.commands.import_mps_election_results.requests")
    def test_import(self, request_mock):
        mock_response = MagicMock()
        mock_response.status_code = 200

        # helpfully we can use the same return for both calls as the returns
        # look similar but don't have overlapping keys
        mock_response.json.return_value = {
            "value": {
                "majority": 100,
                "electionDate": "2019-12-12T00:00:00",
                "latestHouseMembership": {"membershipStartDate": "2015-05-05T00:00:00"},
            }
        }
        request_mock.get.return_value = mock_response
        call_command("import_mps_election_results")

        mp = Person.objects.get(id=1)

        keys = {
            "mp_election_majority": "100",
            "mp_last_elected": "2019-12-12",
            "mp_first_elected": "2015-05-05",
        }

        for key, value in keys.items():
            data = PersonData.objects.get(person=mp, data_type__name=key)
            if data.data_type.data_type == "date":
                self.assertEqual(data.value().date().isoformat(), value)
            else:
                self.assertEqual(data.value(), value)
