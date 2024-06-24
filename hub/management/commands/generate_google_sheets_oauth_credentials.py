import json
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand

import google_auth_oauthlib.flow

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

CREDENTIALS = settings.GOOGLE_SHEETS_CLIENT_CONFIG


class Command(BaseCommand):
    help = "Generate Google Sheets oauth link / oauth token"

    def add_arguments(self, parser):
        parser.add_argument(
            "-u",
            "--auth-success-url",
            type=str,
            help="Pass URL redirected to after granting consent to receive a token.",
        )

    def handle(self, *args, **options):
        flow = google_auth_oauthlib.flow.Flow.from_client_config(
            client_config=CREDENTIALS, scopes=SCOPES
        )

        flow.redirect_uri = (
            "https://localhost:3000/data-sources/create/connect/editablegooglesheets"
        )

        authorization_response = options.get("auth_success_url")
        if authorization_response:
            token = flow.fetch_token(authorization_response=authorization_response)
            complete_token = {
                "access_token": token["access_token"],
                "refresh_token": token["refresh_token"],
                "client_id": flow.client_config["client_id"],
                "client_secret": flow.client_config["client_secret"],
                "scopes": token["scope"],
                "expiry": datetime.fromtimestamp(token["expires_at"]).isoformat(),
            }
            print(f"Token: {json.dumps(complete_token)}")
            return

        authorization_url, state = flow.authorization_url(
            access_type="offline", include_granted_scopes="true", prompt="consent"
        )

        print(f"URL: {authorization_url}")
