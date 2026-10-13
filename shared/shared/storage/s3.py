from __future__ import annotations

from typing import BinaryIO

import boto3
from botocore.client import Config

from shared.config import get_settings
from shared.storage.base import DocumentStore


class S3DocumentStore(DocumentStore):
    def __init__(self) -> None:
        settings = get_settings()
        kwargs: dict = {
            "region_name": settings.aws_region,
            "config": Config(signature_version="s3v4"),
        }
        if settings.aws_endpoint_url:
            kwargs["endpoint_url"] = settings.aws_endpoint_url
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            kwargs["aws_access_key_id"] = settings.aws_access_key_id
            kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        self.client = boto3.client("s3", **kwargs)
        self.bucket = settings.s3_bucket
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except Exception:
            try:
                self.client.create_bucket(Bucket=self.bucket)
            except Exception:
                pass

    async def put(self, key: str, data: bytes | BinaryIO, content_type: str = "") -> str:
        body = data if isinstance(data, (bytes, bytearray)) else data.read()
        extra = {"ContentType": content_type} if content_type else {}
        self.client.put_object(Bucket=self.bucket, Key=key, Body=body, **extra)
        return key

    async def get(self, key: str) -> bytes:
        obj = self.client.get_object(Bucket=self.bucket, Key=key)
        return obj["Body"].read()

    async def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)

    async def exists(self, key: str) -> bool:
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except Exception:
            return False

    async def presigned_url(self, key: str, expires_in: int = 3600) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )
