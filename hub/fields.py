from __future__ import annotations

import base64

from django.conf import settings
from django.db import models
from django.db.backends.base.base import BaseDatabaseWrapper

from cryptography.fernet import Fernet


class EncryptedCharField(models.CharField):
    def from_db_value(
        self,
        value: str | None,
        expression: EncryptedCharField,
        connection: BaseDatabaseWrapper,
    ) -> str | None:
        if value is None:
            return None
        if value == "":
            return ""
        return self._get_fernet().decrypt(value.encode()).decode()

    def get_prep_value(self, value: str | None) -> str | None:
        if value is None:
            return None
        return self._get_fernet().encrypt(value.encode()).decode()

    def _get_fernet(self) -> Fernet:
        return Fernet(base64.b64encode(settings.ENCRYPTION_SECRET_KEY.encode()[:32]))


class EncryptedTextField(models.TextField):
    def from_db_value(
        self,
        value: str | None,
        expression: EncryptedTextField,
        connection: BaseDatabaseWrapper,
    ) -> str | None:
        if value is None:
            return None
        if value == "":
            return ""
        return self._get_fernet().decrypt(value.encode()).decode()

    def get_prep_value(self, value: str | None) -> str | None:
        if value is None:
            return None
        return self._get_fernet().encrypt(value.encode()).decode()

    def _get_fernet(self) -> Fernet:
        return Fernet(base64.b64encode(settings.ENCRYPTION_SECRET_KEY.encode()[:32]))


class EncryptedBinaryField(models.BinaryField):
    def from_db_value(
        self,
        value: memoryview | None,
        expression: EncryptedBinaryField,
        connection: BaseDatabaseWrapper,
    ) -> bytes | None:
        if value is None:
            return None
        return self._get_fernet().decrypt(value.tobytes())

    def get_prep_value(self, value: bytes | None) -> memoryview | None:
        if value is None:
            return None
        return memoryview(self._get_fernet().encrypt(value))

    def _get_fernet(self) -> Fernet:
        return Fernet(base64.b64encode(settings.SECRET_KEY.encode()[:32]))
