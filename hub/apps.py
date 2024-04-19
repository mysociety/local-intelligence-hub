from django.apps import AppConfig


class HubConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "hub"

    def ready(self):
        from hub.models import refresh_tokens_cache
        refresh_tokens_cache()