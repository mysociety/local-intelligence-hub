from django.apps import AppConfig
from django.db.utils import ProgrammingError


class HubConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "hub"

    def ready(self):
        try:
            from hub.models import refresh_tokens_cache

            refresh_tokens_cache()
        except ProgrammingError:
            # This is expected when running migrations
            pass
