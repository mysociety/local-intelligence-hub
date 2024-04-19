from django.apps import AppConfig
import psycopg.errors


class HubConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "hub"

    def ready(self):
        try:
            from hub.models import refresh_tokens_cache
            refresh_tokens_cache()
        except psycopg.errors.UndefinedTable:
            # This is expected when running migrations
            pass
