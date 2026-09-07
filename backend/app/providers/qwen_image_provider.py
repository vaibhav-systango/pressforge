"""Primary Qwen-Image renderer with Alibaba-native and generic endpoint support."""

import base64
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.models.user import generate_ulid
from app.providers.cloudinary_provider import cloudinary_provider

logger = logging.getLogger(__name__)


class QwenImageProvider:
    _SIZES = {
        "1:1": "1024*1024",
        "16:9": "1280*720",
        "9:16": "720*1280",
    }

    def is_alibaba_configured(self) -> bool:
        return bool(
            settings.ALIBABA_DASHSCOPE_API_KEY.strip()
            and settings.ALIBABA_WORKSPACE_ID.strip()
        )

    def is_configured(self) -> bool:
        return self.is_alibaba_configured() or bool(settings.QWEN_IMAGE_API_URL.strip())

    def _alibaba_url(self) -> str:
        region_suffixes = {
            "ap-southeast-1": "ap-southeast-1.maas.aliyuncs.com",
            "cn-beijing": "cn-beijing.maas.aliyuncs.com",
        }
        suffix = region_suffixes.get(settings.ALIBABA_REGION)
        if not suffix:
            raise ValueError("Unsupported ALIBABA_REGION; use ap-southeast-1 or cn-beijing")
        return (
            f"https://{settings.ALIBABA_WORKSPACE_ID}.{suffix}"
            "/api/v1/services/aigc/multimodal-generation/generation"
        )

    def _download_image(self, client: httpx.Client, image_url: str) -> tuple[bytes, str]:
        response = client.get(image_url)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "image/png").split(";", 1)[0]
        return response.content, content_type

    def _generate_with_alibaba(
        self,
        *,
        prompt: str,
        aspect_ratio: str,
        seed: int,
        trace_id: str,
        variation: int,
    ) -> tuple[bytes, str]:
        payload = {
            "model": settings.ALIBABA_QWEN_IMAGE_MODEL,
            "input": {
                "messages": [{"role": "user", "content": [{"text": prompt}]}],
            },
            "parameters": {
                "size": self._SIZES.get(aspect_ratio, self._SIZES["1:1"]),
                "n": 1,
                "seed": seed,
                # Pressforge already creates a detailed, reviewed prompt. Keeping
                # it unchanged provides reproducible brand-direction results.
                "prompt_extend": False,
                "watermark": False,
            },
        }
        logger.info(
            "Image render dispatch trace_id=%s variation=%d provider=alibaba_qwen model=%s seed=%d size=%s",
            trace_id,
            variation,
            settings.ALIBABA_QWEN_IMAGE_MODEL,
            seed,
            payload["parameters"]["size"],
        )
        headers = {
            "content-type": "application/json",
            "authorization": f"Bearer {settings.ALIBABA_DASHSCOPE_API_KEY}",
        }
        with httpx.Client(timeout=settings.QWEN_IMAGE_TIMEOUT_SECONDS, follow_redirects=True) as client:
            response = client.post(self._alibaba_url(), headers=headers, json=payload)
            response.raise_for_status()
            body: dict[str, Any] = response.json()
            try:
                image_url = body["output"]["choices"][0]["message"]["content"][0]["image"]
            except (KeyError, IndexError, TypeError) as exc:
                raise ValueError("Alibaba Qwen response contained no image URL") from exc
            return self._download_image(client, image_url)

    def _generate_with_compatible_endpoint(
        self,
        *,
        prompt: str,
        aspect_ratio: str,
        seed: int,
        trace_id: str,
        variation: int,
    ) -> tuple[bytes, str]:
        headers = {"content-type": "application/json"}
        if settings.QWEN_IMAGE_API_KEY:
            headers["authorization"] = f"Bearer {settings.QWEN_IMAGE_API_KEY}"
        payload = {
            "model": settings.QWEN_IMAGE_MODEL,
            "prompt": prompt,
            "size": self._SIZES.get(aspect_ratio, self._SIZES["1:1"]).replace("*", "x"),
            "n": 1,
            "seed": seed,
            "response_format": "b64_json",
        }
        logger.info(
            "Image render dispatch trace_id=%s variation=%d provider=qwen_compatible model=%s seed=%d size=%s",
            trace_id, variation, settings.QWEN_IMAGE_MODEL, seed, payload["size"],
        )
        with httpx.Client(timeout=settings.QWEN_IMAGE_TIMEOUT_SECONDS, follow_redirects=True) as client:
            response = client.post(settings.QWEN_IMAGE_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            body: dict[str, Any] = response.json()
            data = body.get("data") or []
            if not data or not isinstance(data[0], dict):
                raise ValueError("Qwen compatible endpoint returned no image data")
            image = data[0]
            if image.get("b64_json"):
                return base64.b64decode(image["b64_json"], validate=True), "image/png"
            if image.get("url"):
                return self._download_image(client, image["url"])
        raise ValueError("Qwen compatible endpoint response lacks b64_json or url")

    def generate_image(
        self,
        *,
        prompt: str,
        aspect_ratio: str,
        seed: int,
        trace_id: str,
        variation: int,
    ) -> str | None:
        """Render and rehost an image, returning None to trigger Flux fallback."""
        if not self.is_configured():
            logger.info(
                "Qwen image unavailable trace_id=%s variation=%d reason=provider_not_configured",
                trace_id,
                variation,
            )
            return None

        try:
            image_bytes, content_type = (
                self._generate_with_alibaba(
                    prompt=prompt, aspect_ratio=aspect_ratio, seed=seed,
                    trace_id=trace_id, variation=variation,
                )
                if self.is_alibaba_configured()
                else self._generate_with_compatible_endpoint(
                    prompt=prompt, aspect_ratio=aspect_ratio, seed=seed,
                    trace_id=trace_id, variation=variation,
                )
            )

            uploaded = cloudinary_provider.upload_generated_image(
                file_bytes=image_bytes,
                upload_key=generate_ulid(),
                filename="qwen-generated.png",
                content_type=content_type if content_type.startswith("image/") else "image/png",
            )
            result = uploaded.get("secureUrl")
            logger.info(
                "Image render completed trace_id=%s variation=%d provider=%s bytes=%d rehosted=%s",
                trace_id,
                variation,
                "alibaba_qwen" if self.is_alibaba_configured() else "qwen_compatible",
                len(image_bytes),
                bool(result),
            )
            return result
        except Exception as exc:
            logger.warning(
                "Qwen image failed trace_id=%s variation=%d error_type=%s error=%s; falling_back=pollinations_flux",
                trace_id,
                variation,
                type(exc).__name__,
                exc,
            )
            return None


qwen_image_provider = QwenImageProvider()
