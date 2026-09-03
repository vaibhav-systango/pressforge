import json
import logging
import random
import time
import urllib.parse
from typing import Any

import httpx

from app.core.config import settings
from app.core.constants.content_constants import ContentErrorCodes
from app.models.user import generate_ulid
from app.providers.cloudinary_provider import cloudinary_provider

logger = logging.getLogger(__name__)

VARIATION_NAMES = ("Variation A", "Variation B", "Variation C")
_RETRYABLE_STATUS_CODES = frozenset({429, 500, 503})
_MAX_ATTEMPTS_PER_MODEL = 3

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
        rules: list[str] | None = None,
    ) -> str:
        platforms_label = ", ".join(platforms) if platforms else "instagram"
        keyword_list = ", ".join(keywords) if keywords else "(none)"
        refs = "\n".join(f"- {url}" for url in reference_urls) if reference_urls else "(none)"
        brand_rules = "\n".join(f"- {rule}" for rule in (rules or []) if rule) or "(none)"

        # Build a rich workspace identity block that Gemini uses as the #1 source of truth
        workspace_identity = (
            f"Brand name: {brand_name or 'Our Brand'}\n"
            f"Industry / niche: {description or '(see brand voice below)'}\n"
            f"Brand tone: {tone or 'Professional'}\n"
            f"Target audience: {target_audience or 'General audience'}\n"
            f"Brand voice & visual style guidelines (PRIMARY SOURCE): {brand_voice or '(none - use visual style field)'}\n"
            f"Brand keywords: {keyword_list}\n"
            f"Requested visual style override: {visual_style or '(use brand guidelines above)'}\n"
        )

        return f"""
You are an expert social media content strategist and AI image prompt engineer for Pressforge.
Your single most important job is to produce PERFECT imageBrief and liImageBrief values that
will generate stunning, on-brand visuals when sent directly to an AI image generator (Flux/Pollinations).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKSPACE BRAND IDENTITY  ← PRIMARY SOURCE OF TRUTH (99% weight)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{workspace_identity}

Brand rules (MUST follow — override everything else):
{brand_rules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT REQUEST  ← SECONDARY (topic direction only, 1% weight)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Content brief / topic prompt: "{prompt or '(none — generate a topic that fits the workspace brand perfectly)'}"
Campaign goal: "{goal or 'Brand Awareness'}"
Call to action: "{cta or 'Save this post'}"
Target platforms: "{platforms_label}"
Reference URLs: {refs}
Reference notes: "{reference_text or ''}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI IMAGE GENERATOR HARD CONSTRAINTS  ← READ THIS FIRST — NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The imageBrief is sent to Pollinations.ai (Flux model). This generator has CRITICAL limitations:

  ✗ CANNOT generate photorealistic human beings — results are always distorted, blurry,
    anatomically wrong, or completely rejected. This includes children, adults, and any human body part.
  ✗ Prompting for "child model", "person wearing clothing", "kid in outfit" will ALWAYS produce
    terrible, unusable output — regardless of how detailed the prompt is.
  ✗ CANNOT render fine text, logos, or UI overlays reliably.
  ✓ CAN generate stunning: product flat-lays, styled clothing on surfaces, fabric close-ups,
    studio product shots, still-life arrangements, atmospheric scenes, fireworks, food, décor.

THEREFORE — even if the brand voice says "show a child model" — YOU MUST NOT include
human subjects in the imageBrief. Instead, achieve the brand's intent through the techniques below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE BRIEF RULES  ← CRITICAL — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The imageBrief field MUST be a complete, self-contained AI image generation prompt (80-150 words).
Read the brand voice and visual style above carefully — then choose the correct template below.

──────────────────────────────────────────
TEMPLATE A — PHOTOREALISTIC / LIFESTYLE / PRODUCT / EVENT BRANDS
Use when the brand voice mentions: festive, celebration, food, fashion, beauty, travel, fireworks,
photography, luxury, organic, warm, nature, cultural, religious, or any real-world product/event.
──────────────────────────────────────────
Write a cinematic, photorealistic AI image prompt. Include:
  • [SCENE: describe the primary visual scene — location, time of day, atmosphere]
  • [SUBJECT: the hero product/element with precise visual details — NO humans]
  • [LIGHTING: studio softbox, golden hour, dramatic night sky, etc.]
  • [COLOR PALETTE: 3-5 dominant colors from the brand voice]
  • [COMPOSITION: overhead knolling / flat-lay / centered / rule-of-thirds + negative space]
  • [STYLE KEYWORDS: photorealistic, commercial photography, 8K, sharp focus, no text, no people,
    no watermarks, Sigma 85mm f/1.4, professional studio lighting]
  • [MOOD: emotional feeling grounded in brand voice]

  SPECIAL RULE — CLOTHING / FASHION / KIDS APPAREL BRANDS:
  Because the image generator cannot render human models, use these premium product photography
  techniques instead — they look stunning AND are Pollinations-compatible:
    Option 1 — PREMIUM FLAT LAY: Clothing items expertly arranged in a styled flat-lay on a
      clean linen/wood/marble surface with complementary props (tiny shoes, folded accessories,
      fabric swatches). Overhead shot, soft diffused lighting, product as clear hero.
    Option 2 — STYLED DETAIL SHOT: Extreme close-up macro of the clothing fabric, stitching,
      buttons, embroidery, or print pattern — showing craftsmanship and texture. Shallow depth of
      field, sharp focus on the detail, creamy bokeh background.
    Option 3 — EDITORIAL PRODUCT STILL LIFE: One or two clothing items beautifully folded/arranged
      on a premium surface with tasteful props (small flowers, ribbon, color-coordinated items).
      Warm studio lighting, aspirational lifestyle mood.
    → Pick whichever option best fits the specific post topic.

Example for kids clothing brand:
  "Premium overhead flat-lay of a soft pastel yellow cotton romper neatly arranged on a warm ivory
   linen surface, paired with tiny white sneakers, a small floral hair clip, and a folded muslin
   swaddle. Soft diffused studio lighting casting gentle shadows. Color palette: butter yellow, ivory
   white, sage green, blush pink. Clean centered composition with generous negative space at top
   for text. Photorealistic, commercial product photography, 8K sharp focus, Sigma 85mm,
   no people, no text, warm organic mood, premium children's fashion catalog quality."

Example for festive/events brand (Diwali, etc.):
  "Cinematic overhead shot of glowing clay diyas on burgundy silk, scattered marigold petals,
   vibrant multicolor fireworks in dark night sky, warm golden bokeh, dramatic chiaroscuro lighting,
   saffron orange, ruby red, deep indigo, gleaming gold, 8K photorealistic, Sigma 85mm,
   no text, no people, premium festive mood."

──────────────────────────────────────────
TEMPLATE B — TECH / SAAS / DIGITAL / INFOGRAPHIC BRANDS
Use when the brand voice mentions: productivity, software, apps, tools, SaaS, startup, AI,
minimal, clean, corporate, B2B, or digital services.
──────────────────────────────────────────
  "[BACKGROUND: flat clean color, e.g. pure flat matte white #FFFFFF or dark slate #121212],
   [HEADLINE: bold heavy black sans-serif text reading '[ACTUAL POST HEADLINE]' centered at top],
   [ICONS: 3-6 specific named real app icons floating with soft drop shadows,
    e.g. Notion icon, ChatGPT icon, Stripe icon — 3D glossy claymation style],
   [DOODLES: hand-drawn black ink sketch arrows and annotation lines connecting elements],
   [LAYOUT: clean knolling flat-lay or split-comparison grid],
   [STYLE: hyper-clean, minimal, viral Instagram infographic, 1:1 square, sharp, no blur]"

──────────────────────────────────────────
RULES (apply to ALL templates):
- NEVER include humans, people, children, models, faces, or body parts in ANY brief.
- NEVER use the tech/infographic template for lifestyle, festive, food, fashion, or event brands.
- NEVER use the photorealistic template for B2B SaaS or digital tool brands.
- DO NOT write abstract metaphors (cubes, spheres, generic shapes).
- DO NOT use vague terms like "modern design" or "technology concept".
- DO NOT generate briefs shorter than 80 words.
- ALWAYS ground every visual decision in the workspace brand rules and voice above.
- For Template B: ALWAYS name specific real-world recognizable app icons.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Return exactly 3 variations with different headline angles (punchy curiosity-gap, relatable meme, listicle).
- Instagram captions (caption): hook line 1 → 3-5 bullet points → CTA. Platform-native tone.
- LinkedIn captions (liCaption): professional paragraph format, same topic.
- hashtags and liHashtags must be plain strings WITHOUT the # prefix.
- Include brand keywords as hashtags when relevant (TitleCase, no spaces).
- imageBrief: 80-150 words, follow the correct template above for this brand type.
- liImageBrief: same template adapted for a LinkedIn professional aesthetic.
- Do not mention that you are an AI.
""".strip()

    def _model_candidates(self) -> list[str]:
        models: list[str] = []
        for model in (settings.GEMINI_MODEL, settings.GEMINI_FALLBACK_MODEL):
            if model and model not in models:
                models.append(model)
        return models

    @staticmethod
    def _error_detail(response: httpx.Response) -> str:
        try:
            return response.json().get("error", {}).get("message", "") or ""
        except Exception:
            return response.text[:300]

    def _post_generate_content(
        self, client: httpx.Client, model: str, payload: dict[str, Any]
    ) -> httpx.Response:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent"
        )
        return client.post(
            url,
            params={"key": settings.GEMINI_API_KEY},
            json=payload,
        )

    def _call_gemini(self, prompt_instructions: str) -> dict[str, Any]:
        self._ensure_configured()
        payload = {
            "contents": [{"parts": [{"text": prompt_instructions}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": _RESPONSE_SCHEMA,
            },
        }

        models = self._model_candidates()
        last_was_overload = False
        last_exc: Exception | None = None

        try:
            with httpx.Client(timeout=90.0) as client:
                for model_index, model in enumerate(models):
                    for attempt in range(_MAX_ATTEMPTS_PER_MODEL):
                        try:
                            response = self._post_generate_content(client, model, payload)
                        except httpx.TimeoutException as exc:
                            last_exc = exc
                            last_was_overload = False
                            logger.warning(
                                "Gemini timeout model=%s attempt=%s/%s",
                                model,
                                attempt + 1,
                                _MAX_ATTEMPTS_PER_MODEL,
                            )
                            if attempt + 1 < _MAX_ATTEMPTS_PER_MODEL:
                                time.sleep(min(2**attempt, 8) + random.uniform(0, 0.5))
                                continue
                            break

                        if not response.is_error:
                            body = response.json()
                            try:
                                text = body["candidates"][0]["content"]["parts"][0]["text"]
                                return json.loads(text)
                            except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
                                logger.error(
                                    "Failed to parse Gemini response: %s | body=%s",
                                    exc,
                                    body,
                                )
                                raise ValueError(ContentErrorCodes.GENERATION_FAILED) from exc

                        detail = self._error_detail(response)
                        status_code = response.status_code
                        retryable = status_code in _RETRYABLE_STATUS_CODES
                        last_was_overload = status_code in {429, 503}
                        logger.error(
                            "Gemini API call failed: %s %s model=%s attempt=%s/%s detail=%s",
                            status_code,
                            response.reason_phrase,
                            model,
                            attempt + 1,
                            _MAX_ATTEMPTS_PER_MODEL,
                            detail,
                        )

                        if retryable and attempt + 1 < _MAX_ATTEMPTS_PER_MODEL:
                            delay = min(2**attempt, 8) + random.uniform(0, 0.5)
                            time.sleep(delay)
                            continue

                        if retryable and model_index + 1 < len(models):
                            logger.warning(
                                "Falling back from model=%s to model=%s after overload",
                                model,
                                models[model_index + 1],
                            )
                            break

                        if last_was_overload:
                            raise ValueError(ContentErrorCodes.GENERATION_OVERLOADED)
                        raise ValueError(ContentErrorCodes.GENERATION_FAILED)
        except ValueError:
            raise
        except Exception as exc:
            logger.error(
                "Gemini API call failed: %s",
                type(exc).__name__,
            )
            raise ValueError(ContentErrorCodes.GENERATION_FAILED) from exc

        if last_was_overload:
            raise ValueError(ContentErrorCodes.GENERATION_OVERLOADED) from last_exc
        raise ValueError(ContentErrorCodes.GENERATION_FAILED) from last_exc

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

    def _rehost_image(self, pollinations_url: str, *, max_retries: int = 3) -> str | None:
        """Download from Pollinations and upload to Cloudinary.
        Retries on 429 Too Many Requests with exponential backoff.
        """
        for attempt in range(max_retries):
            try:
                with httpx.Client(timeout=120.0, follow_redirects=True) as client:
                    image_response = client.get(pollinations_url)
                    if image_response.status_code == 429:
                        wait = 2 ** attempt * 5  # 5s, 10s, 20s
                        logger.warning(
                            "Pollinations 429 rate-limit — retrying in %ds (attempt %d/%d)",
                            wait, attempt + 1, max_retries,
                        )
                        time.sleep(wait)
                        continue
                    image_response.raise_for_status()
                    content_type = image_response.headers.get("content-type", "image/png")
                    if "image" not in content_type:
                        content_type = "image/png"
                    file_bytes = image_response.content
                    break  # success — exit retry loop
            except httpx.HTTPStatusError:
                raise  # non-429 HTTP errors are not retried
            except Exception as exc:
                logger.warning("Failed to download Pollinations image: %s", exc)
                return None
        else:
            # All retries exhausted
            logger.warning("Pollinations image still rate-limited after %d attempts", max_retries)
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
        rules: list[str] | None = None,
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
            rules=rules,
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
        li_image_url: str | None = None
        image_warning: str | None = None

        first_brief = (raw_variations[0].get("imageBrief") or "").strip()
        first_li_brief = (raw_variations[0].get("liImageBrief") or "").strip()

        # Generate ONE Instagram image (1:1 square)
        if first_brief:
            try:
                pollinations_url = self.build_pollinations_url(first_brief, "1:1")
                image_url = self._rehost_image(pollinations_url) or pollinations_url
            except Exception as exc:
                logger.warning("Instagram image generation failed: %s", exc)
                image_warning = str(exc)
        else:
            image_warning = "No imageBrief returned from model."

        # Brief pause between requests to avoid Pollinations rate-limiting
        time.sleep(5)

        # Generate ONE LinkedIn image (16:9 landscape)
        li_brief_to_use = first_li_brief or first_brief
        if li_brief_to_use:
            try:
                li_pollinations_url = self.build_pollinations_url(li_brief_to_use, "16:9")
                li_image_url = self._rehost_image(li_pollinations_url) or li_pollinations_url
            except Exception as exc:
                logger.warning("LinkedIn image generation failed: %s", exc)

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
                    "imageUrl": image_url,        # Instagram 1:1
                    "liImageUrl": li_image_url,   # LinkedIn 16:9
                }
            )

        return {
            "variations": variations,
            "prompt": prompt,
            "geminiPrompt": instructions,   # exact prompt sent to Gemini API
            "imageWarning": image_warning,
        }


    def generate_from_feedback(
        self,
        *,
        feedback: str,
        previous_caption: str,
        previous_li_caption: str | None,
        previous_image_brief: str | None,
        previous_li_image_brief: str | None,
        previous_hashtags: list[str],
        previous_li_hashtags: list[str],
        previous_image_url: str | None,
        previous_li_image_url: str | None = None,
        # Brand context
        brand_name: str | None = None,
        tone: str | None = None,
        keywords: list[str] | None = None,
        target_audience: str | None = None,
        brand_voice: str | None = None,
        description: str | None = None,
        rules: list[str] | None = None,
        platforms: list[str] | None = None,
        aspect_ratio: str = "1:1",
    ) -> dict[str, Any]:
        """
        Generate a single improved post variation based on client feedback.
        The previous caption and feedback are used as context so the AI improves,
        rather than starting from scratch.
        """
        platforms_label = ", ".join(platforms or ["instagram", "linkedin"])
        keyword_list = ", ".join(keywords or []) or "(none)"
        brand_rules = "\n".join(f"- {rule}" for rule in (rules or []) if rule) or "(none)"
        hashtags_str = ", ".join(f"#{h}" for h in previous_hashtags) or "(none)"
        li_hashtags_str = ", ".join(f"#{h}" for h in previous_li_hashtags) or "(none)"

        prompt_instructions = f"""
You are an expert social media content strategist and AI image prompt engineer for Pressforge.
A client has reviewed the following post and provided revision feedback.
Produce exactly 1 improved variation that addresses the feedback.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKSPACE BRAND IDENTITY  ← PRIMARY SOURCE OF TRUTH (99% weight)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Brand name: "{brand_name or 'Our Brand'}"
Brand tone: "{tone or 'Professional'}"
Brand voice & visual style (PRIMARY): "{brand_voice or '(none)'}"
Brand description: "{description or '(none)'}"
Target audience: "{target_audience or 'General audience'}"
Brand keywords: "{keyword_list}"
Target platforms: "{platforms_label}"

Brand rules (MUST follow — override everything else):
{brand_rules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREVIOUS POST (only change what feedback requests)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Instagram caption: {previous_caption or '(none)'}
Instagram hashtags: {hashtags_str}
LinkedIn caption: {previous_li_caption or '(none)'}
LinkedIn hashtags: {li_hashtags_str}
Image brief: {previous_image_brief or '(none)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT FEEDBACK ← address every point
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"{feedback}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI IMAGE GENERATOR HARD CONSTRAINTS  ← NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The imageBrief is sent to Pollinations.ai (Flux model). CRITICAL limitations:
  ✗ CANNOT generate photorealistic humans — children, adults, body parts — always distorted/rejected.
  ✗ "child model", "person wearing clothing", "kid in outfit" ALWAYS produce unusable output.
  ✓ CAN generate: product flat-lays, styled clothing on surfaces, fabric close-ups, still-life, fireworks, food, décor.
THEREFORE: NEVER include human subjects in imageBrief regardless of brand rules. Use product techniques below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE BRIEF RULES  ← CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Read the brand voice above carefully — then choose the correct template:

TEMPLATE A — PHOTOREALISTIC / LIFESTYLE / PRODUCT / EVENT / FESTIVE BRANDS
(Use when brand mentions: festive, celebration, fireworks, food, fashion, travel, organic, cultural, luxury, events)
Write a cinematic photorealistic AI image prompt — NO humans. Include:
  • Scene + primary product/subject with exact visual details
  • Lighting style (golden hour, dramatic night sky, studio softbox, cinematic)
  • Color palette (3-5 colors from brand voice)
  • Composition (overhead / flat-lay / rule-of-thirds + negative space for text)
  • Style keywords: photorealistic, 8K, commercial photography, sharp focus, no text, no people
  • Mood aligned to brand voice

  CLOTHING / FASHION / KIDS BRANDS — use one of these product photography approaches:
    Option 1 — FLAT LAY: Clothing styled on linen/wood/marble surface with small props (shoes, accessories).
    Option 2 — DETAIL SHOT: Extreme close-up macro of fabric texture, stitching, print pattern.
    Option 3 — STILL LIFE: Folded/arranged clothing on premium surface with tasteful props.

TEMPLATE B — TECH / SAAS / DIGITAL / INFOGRAPHIC BRANDS
(Use when brand mentions: apps, software, productivity, SaaS, AI tools, startup, B2B)
  "[BACKGROUND: flat clean color], [HEADLINE: bold text reading actual headline],
   [ICONS: 3-6 named real app icons floating with drop shadows],
   [DOODLES: hand-drawn ink sketch arrows], [LAYOUT: knolling flat-lay],
   [STYLE: minimal, infographic, 1:1 square, sharp]"

RULES: DO NOT mix templates. NEVER include humans/children/people/body parts. DO NOT write briefs shorter than 80 words.
For Template B: always name specific real-world app icons.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Return exactly 1 variation in the `variations` array.
- Preserve untouched parts from the previous post.
- Directly address every point in the client feedback.
- Instagram captions: hook → bullets → CTA. Platform-native.
- LinkedIn captions: professional paragraph format.
- hashtags and liHashtags must be plain strings WITHOUT the # prefix.
- imageBrief: 80-150 words, follow template above.
- liImageBrief: same template, professional LinkedIn tone.
- Do not mention that you are an AI.
""".strip()

        raw = self._call_gemini(prompt_instructions)
        raw_variations = raw.get("variations") or []
        if not isinstance(raw_variations, list) or len(raw_variations) == 0:
            raise ValueError(ContentErrorCodes.GENERATION_FAILED)

        item = raw_variations[0]
        hashtags = item.get("hashtags") or []
        li_hashtags = item.get("liHashtags") or []
        if not isinstance(hashtags, list):
            hashtags = []
        if not isinstance(li_hashtags, list):
            li_hashtags = []

        new_image_brief = (item.get("imageBrief") or "").strip()
        new_li_image_brief = (item.get("liImageBrief") or "").strip()

        image_url: str | None = previous_image_url
        li_image_url: str | None = previous_li_image_url
        image_warning: str | None = None

        # Regenerate Instagram image (1:1) if brief changed
        if new_image_brief:
            try:
                pollinations_url = self.build_pollinations_url(new_image_brief, "1:1")
                image_url = self._rehost_image(pollinations_url) or pollinations_url
            except Exception as exc:
                logger.warning("Instagram image generation failed during feedback: %s", exc)
                image_warning = str(exc)
                image_url = previous_image_url

        # Regenerate LinkedIn image (16:9) if brief changed
        li_brief_to_use = new_li_image_brief or new_image_brief
        if li_brief_to_use:
            try:
                li_pollinations_url = self.build_pollinations_url(li_brief_to_use, "16:9")
                li_image_url = self._rehost_image(li_pollinations_url) or li_pollinations_url
            except Exception as exc:
                logger.warning("LinkedIn image generation failed during feedback: %s", exc)
                li_image_url = previous_li_image_url

        return {
            "caption": item.get("caption") or "",
            "hashtags": [str(tag).lstrip("#") for tag in hashtags],
            "imageBrief": new_image_brief,
            "liCaption": item.get("liCaption") or "",
            "liHashtags": [str(tag).lstrip("#") for tag in li_hashtags],
            "liImageBrief": new_li_image_brief,
            "imageUrl": image_url,        # Instagram 1:1
            "liImageUrl": li_image_url,   # LinkedIn 16:9
            "imageWarning": image_warning,
        }


gemini_content_provider = GeminiContentProvider()
