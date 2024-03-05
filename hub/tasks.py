from __future__ import annotations

from django.db import transaction

from procrastinate.contrib.django import app


@app.task(queue="index")
@transaction.atomic
async def update_one(config_id: str, member_id: str):
    from hub.models import ExternalDataSourceUpdateConfig
    config = ExternalDataSourceUpdateConfig.objects.get(pk=config_id)
    if config.enabled:
        await config.update_one(member_id=member_id)


@app.task(queue="index")
async def update_many(config_id: str, member_ids: list[str]):
    from hub.models import ExternalDataSourceUpdateConfig
    config = ExternalDataSourceUpdateConfig.objects.get(pk=config_id)
    if config.enabled:
        await config.update_many(member_ids=member_ids)


@app.task(queue="index")
async def update_all(config_id: str):
    from hub.models import ExternalDataSourceUpdateConfig
    config = ExternalDataSourceUpdateConfig.objects.get(pk=config_id)
    if config.enabled:
        await config.update_all()

# Refresh webhooks once a day
@app.periodic(cron="0 3 * * *")
@app.task(queue="index")
async def refresh_webhook(config_id: str):
    from hub.models import ExternalDataSourceUpdateConfig
    config = ExternalDataSourceUpdateConfig.objects.get(pk=config_id)
    if config.enabled and config.data_source.automated_webhooks:
        await config.refresh_webhook()