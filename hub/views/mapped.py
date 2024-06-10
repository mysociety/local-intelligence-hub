import json
from logging import getLogger

from django.http import HttpRequest, JsonResponse
from django.views.generic import View

from hub import models

logger = getLogger(__name__)


class ExternalDataSourceWebhook(View):
    """
    Handles auto-update and auto-import. Base path not changed
    so previous webhooks were not broken.
    """

    base_path = "webhook/auto_update"

    def get(self, request: HttpRequest, *args, **kwargs):
        external_data_source_id = self.kwargs["external_data_source_id"]
        data = request.GET.dict()
        return self.handle(request, external_data_source_id, data)

    def post(self, request: HttpRequest, *args, **kwargs):
        external_data_source_id = self.kwargs["external_data_source_id"]

        data = None
        try:
            data = json.loads(request.body)
        except json.decoder.JSONDecodeError:
            data = request.POST.dict()

        if not data:
            return JsonResponse({"status": "Could not read the webhook payload"})

        return self.handle(request, external_data_source_id, data)

    def handle(self, request, external_data_source_id: str, data: dict):
        logger.info(f"Webhook received {self.kwargs} {data}")
        # 1. Match the payload to a ExternalDataSource
        external_data_source: models.ExternalDataSource = (
            models.ExternalDataSource.objects.filter(id=external_data_source_id).first()
        )
        if not external_data_source:
            logger.info("Webhook ignored: Data source not found.")
            return JsonResponse({"status": "Data source not found."})
        if (
            not external_data_source.auto_update_enabled
            and not external_data_source.auto_import_enabled
        ):
            logger.info("Webhook ignored: Webhook is not enabled.")
            return JsonResponse({"status": "Webhook is not enabled."})
        # Get member_ids once here, instead of in the handle_ functions
        member_ids = external_data_source.get_member_ids_from_webhook(data)
        if external_data_source.auto_update_enabled:
            external_data_source.handle_update_webhook_view(member_ids)
        if external_data_source.auto_import_enabled:
            external_data_source.handle_import_webhook_view(member_ids)
        return JsonResponse({"status": "ok"})
