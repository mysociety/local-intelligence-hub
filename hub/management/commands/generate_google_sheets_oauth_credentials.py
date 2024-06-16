import json

from django.conf import settings
from django.core.management.base import BaseCommand

import google.oauth2.credentials
import google_auth_oauthlib.flow

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SAMPLE_SPREADSHEET_ID = "1MEDFli9uakvmf_wGghJZtZg2AvF2xybGtiaG7OX1mmg"
SAMPLE_RANGE_NAME = "Sheet1"

CREDENTIALS_FILE = settings.BASE_DIR / "google_credentials.json"


class Command(BaseCommand):
    help = "Generate Google Sheets oauth link / oauth token"

    def add_arguments(self, parser):
        parser.add_argument(
            "-u",
            "--url",
            type=str,
            help="Pass URL redirected to after granting consent to receive a token.",
        )

    def handle(self, *args, **options):
        flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
            CREDENTIALS_FILE, scopes=SCOPES
        )

        flow.redirect_uri = "https://localhost:3000"

        authorization_response = options.get("url")
        if authorization_response:
            from rich import inspect

            inspect(flow.client_config)
            token = flow.fetch_token(authorization_response=authorization_response)
            inspect(token)
            complete_token = {
                "access_token": token["access_token"],
                "refresh_token": token["refresh_token"],
                "client_id": flow.client_config["client_id"],
                "client_secret": flow.client_config["client_secret"],
                "scopes": token["scope"],
            }
            print(f"Token: {json.dumps(complete_token)}")
            return

        authorization_url, state = flow.authorization_url(
            access_type="offline", include_granted_scopes="true", prompt="consent"
        )

        print(f"URL: {authorization_url}")
