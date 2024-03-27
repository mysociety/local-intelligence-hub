from django.conf import settings
from django.core.management.base import BaseCommand

import mailchimp_marketing as MailchimpMarketing
from mailchimp_marketing.api_client import ApiClientError


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        try:
            client = MailchimpMarketing.Client()
            client.set_config(
                {
                    "api_key": settings.MAILCHIMP_MYSOC_KEY,
                    "server": settings.MAILCHIMP_MYSOC_SERVER_PREFIX,
                }
            )
            response = client.ping.get()
            print(response)
        except ApiClientError as error:
            print(error)
