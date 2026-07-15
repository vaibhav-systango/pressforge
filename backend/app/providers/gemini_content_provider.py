import json
import logging
import random
import urllib.parse
from typing import Any

import httpx

from app.core.config import settings
from app.core.constants.content_constants import ContentErrorCodes
from app.models.user import generate_ulid
from app.providers.cloudinary_provider import cloudinary_provider

logger = logging.getLogger(__name__)

VARIATION_NAMES = ("Variation A", "Variation B", "Variation C")

_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "variations": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "caption": {
                        "type": "STRING",
                        "description": "Instagram caption with hook, body, CTA",
                    },
                    "hashtags": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                        "description": "Instagram hashtags without leading #",
                    },
                    "imageBrief": {
                        "type": "STRING",
                        "description": "Detailed visual brief for an AI image generator",
                    },
                    "liCaption": {
                        "type": "STRING",
                        "description": "LinkedIn professional caption",
                    },
                    "liHashtags": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                        "description": "LinkedIn hashtags without leading #",
                    },
                    "liImageBrief": {
                        "type": "STRING",
                        "description": "LinkedIn-oriented image brief",
                    },
                },
                "required": [
                    "caption",
                    "hashtags",
                    "imageBrief",
                    "liCaption",
                    "liHashtags",
                    "liImageBrief",
                ],
            },
        }
    },
    "required": ["variations"],
}


class GeminiContentProvider:
    def _ensure_configured(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise ValueError(ContentErrorCodes.GEMINI_NOT_CONFIGURED)

    def _build_prompt(
        self,
        *,
        prompt: str,
        goal: str | None,
        cta: str | None,
        visual_style: str | None,
        platforms: list[str],
        reference_urls: list[str],
        reference_text: str | None,
        brand_name: str | None,
        tone: str | None,
        keywords: list[str],
        target_audience: str | None,
        brand_voice: str | None,
        description: str | None,
    ) -> str:
        platforms_label = ", ".join(platforms) if platforms else "instagram"
        keyword_list = ", ".join(keywords) if keywords else "(none)"
        refs = "\n".join(f"- {url}" for url in reference_urls) if reference_urls else "(none)"

        return f"""
You are an expert social media content creator for Pressforge.
Create exactly 3 distinct post variations tailored for the selected platforms.

Content brief / prompt: "{prompt}"
Campaign goal: "{goal or "Brand Awareness"}"
Call to action: "{cta or "Learn more"}"
Visual style: "{visual_style or "Photorealistic"}"
Target platforms: "{platforms_label}"

Brand name: "{brand_name or "Our Brand"}"
Brand tone: "{tone or "Professional"}"
Brand voice notes: "{brand_voice or ""}"
Brand description: "{description or ""}"
Target audience: "{target_audience or "General audience"}"
Brand keywords to incorporate into hashtags when relevant: "{keyword_list}"

Reference URLs:
{refs}

Reference text / notes:
"{reference_text or ""}"

Rules:
- Return exactly 3 variations with different angles (punchy, thoughtful, engagement-led).
- Instagram captions (caption) should feel platform-native; include the CTA naturally.
- LinkedIn captions (liCaption) should be more professional and paragraph-friendly.
- hashtags and liHashtags must be strings WITHOUT the # prefix.
- Include brand keywords as hashtags when they fit (TitleCase without spaces, e.g. OrganicCotton).
- imageBrief and liImageBrief must be hyper-detailed standalone prompts for an AI image generator matching visual style "{visual_style or "Photorealistic"}".
- Do not mention that you are an AI.
""".strip()

    def _call_gemini(self, prompt_instructions: str) -> dict[str, Any]:
        self._ensure_configured()
        model = settings.GEMINI_MODEL
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt_instructions}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": _RESPONSE_SCHEMA,
            },
        }
        try:
            with httpx.Client(timeout=90.0) as client:
                response = client.post(
                    url,
                    params={"key": settings.GEMINI_API_KEY},
                    json=payload,
                )
                response.raise_for_status()
                body = response.json()
        except Exception as exc:
            logger.error("Gemini API call failed: %s", exc)
            raise ValueError(ContentErrorCodes.GENERATION_FAILED) from exc

        try:
            text = body["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            logger.error("Failed to parse Gemini response: %s | body=%s", exc, body)
            raise ValueError(ContentErrorCodes.GENERATION_FAILED) from exc

    def build_pollinations_url(self, prompt: str, aspect_ratio: str = "1:1") -> str:
        sizes = {
            "1:1": (1024, 1024),
            "16:9": (1280, 720),
            "9:16": (720, 1280),
        }
        width, height = sizes.get(aspect_ratio, sizes["1:1"])
        encoded = urllib.parse.quote(prompt[:800])
        params = urllib.parse.urlencode(
            {
                "width": width,
                "height": height,
                "nologo": "true",
                "model": "flux",
                "seed": random.randint(0, 999_999),
            }
        )
        return f"https://image.pollinations.ai/prompt/{encoded}?{params}"

    def _rehost_image(self, pollinations_url: str) -> str | None:
        try:
            with httpx.Client(timeout=120.0, follow_redirects=True) as client:
                image_response = client.get(pollinations_url)
                image_response.raise_for_status()
                content_type = image_response.headers.get("content-type", "image/png")
                if "image" not in content_type:
                    content_type = "image/png"
                file_bytes = image_response.content
        except Exception as exc:
            logger.warning("Failed to download Pollinations image: %s", exc)
            return None

        try:
            uploaded = cloudinary_provider.upload_generated_image(
                file_bytes=file_bytes,
                upload_key=generate_ulid(),
                filename="generated.png",
                content_type=content_type.split(";")[0].strip(),
            )
            return uploaded.get("secureUrl")
        except Exception as exc:
            logger.warning("Failed to rehost generated image to Cloudinary: %s", exc)
            return None

    def generate_variations(
        self,
        *,
        prompt: str,
        goal: str | None = None,
        cta: str | None = None,
        visual_style: str | None = None,
        platforms: list[str] | None = None,
        reference_urls: list[str] | None = None,
        reference_text: str | None = None,
        brand_name: str | None = None,
        tone: str | None = None,
        keywords: list[str] | None = None,
        target_audience: str | None = None,
        brand_voice: str | None = None,
        description: str | None = None,
        aspect_ratio: str = "1:1",
    ) -> dict[str, Any]:
        instructions = self._build_prompt(
            prompt=prompt,
            goal=goal,
            cta=cta,
            visual_style=visual_style,
            platforms=platforms or ["instagram"],
            reference_urls=reference_urls or [],
            reference_text=reference_text,
            brand_name=brand_name,
            tone=tone,
            keywords=keywords or [],
            target_audience=target_audience,
            brand_voice=brand_voice,
            description=description,
        )
        raw = self._call_gemini(instructions)
        raw_variations = raw.get("variations") or []
        if not isinstance(raw_variations, list) or len(raw_variations) == 0:
            raise ValueError(ContentErrorCodes.GENERATION_FAILED)

        # Pad / trim to exactly 3 for the UI variation picker
        while len(raw_variations) < 3:
            raw_variations.append(raw_variations[-1])
        raw_variations = raw_variations[:3]

        image_url: str | None = None
        image_warning: str | None = None
        first_brief = (raw_variations[0].get("imageBrief") or "").strip()
        if first_brief:
            try:
                pollinations_url = self.build_pollinations_url(first_brief, aspect_ratio)
                image_url = self._rehost_image(pollinations_url) or pollinations_url
            except Exception as exc:
                logger.warning("Image generation failed: %s", exc)
                image_warning = str(exc)
        else:
            image_warning = "No image brief returned from model."

        variations = []
        for index, item in enumerate(raw_variations):
            hashtags = item.get("hashtags") or []
            li_hashtags = item.get("liHashtags") or []
            if not isinstance(hashtags, list):
                hashtags = []
            if not isinstance(li_hashtags, list):
                li_hashtags = []
            variations.append(
                {
                    "id": f"var-{index + 1}",
                    "name": VARIATION_NAMES[index],
                    "caption": item.get("caption") or "",
                    "hashtags": [str(tag).lstrip("#") for tag in hashtags],
                    "imageBrief": item.get("imageBrief") or "",
                    "liCaption": item.get("liCaption") or "",
                    "liHashtags": [str(tag).lstrip("#") for tag in li_hashtags],
                    "liImageBrief": item.get("liImageBrief") or "",
                    "imageUrl": image_url,
                }
            )

        return {
            "variations": variations,
            "prompt": prompt,
            "imageWarning": image_warning,
        }


gemini_content_provider = GeminiContentProvider()
