import json
import logging
import random
import re
import time
import urllib.parse
from typing import Any

import httpx

from app.core.config import settings
from app.core.constants.content_constants import ContentErrorCodes
from app.models.user import generate_ulid
from app.providers.cloudinary_provider import cloudinary_provider
from app.providers.qwen_image_provider import qwen_image_provider

logger = logging.getLogger(__name__)

VARIATION_NAMES = ("Generated Draft",)
_RETRYABLE_STATUS_CODES = frozenset({429, 500, 503})
_MAX_ATTEMPTS_PER_MODEL = 3
_PROMPT_STOP_WORDS = frozenset({
    "about", "and", "are", "content", "create", "for", "from", "into", "next",
    "post", "the", "this", "with", "your",
})
_GENERIC_TOPIC_TERMS = frozenset({
    "ai", "artificial", "cloud", "digital", "future", "innovation", "modern",
    "technology", "tech", "trends",
})

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
WORKSPACE BRAND IDENTITY  ← VISUAL GUARDRAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{workspace_identity}

Brand rules (MUST follow — override everything else):
{brand_rules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT REQUEST  ← REQUIRED SUBJECT AND MESSAGE
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
The imageBrief is sent to Qwen-Image when configured, with Pollinations Flux as a fallback. Follow these constraints:

  ✗ Do not ask it to render readable headlines, exact logos, brand marks, app interfaces, or watermarks.
    Add those in the design editor after generation.
  ✓ A single, clearly described human subject is allowed when it is essential to the post. Avoid crowds,
    tiny faces, and complex hand poses. Use product-only imagery when a person is not needed.
  ✓ It excels at product photography, still lifes, food, décor, atmospheric scenes, and simple editorial
    lifestyle photography.

The image must communicate BOTH the content request and brand identity. Do not make a generic brand image.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE BRIEF RULES  ← CRITICAL — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The imageBrief field MUST be a complete, self-contained AI image generation prompt (60-110 words).
Read the content request and brand context carefully, then create the most appropriate visual treatment.

QUALITY GATE — COMPLETE THIS BEFORE YOU RETURN JSON:
Before returning the imageBrief, silently audit it against this rubric and rewrite it yourself until it scores
at least 80/100. Do not return a draft that requires a later repair call. The rubric is:
specific topic/hero subject (30), concrete visual details and environment (25), composition and lighting
(20), generator compatibility: no readable text/logos/UI (15), and focused 60-110-word length (10).
If the content request is broad, choose one concrete angle that fits the requested goal; never use a
generic laptop, abstract technology shape, or vague "future tech" scene as the hero subject.

For a short or vague user request, expand it privately using the workspace context into a specific visual story.
Never ask the user for more detail and never echo a vague request as the hero subject. Before returning, verify
that the brief explicitly names a hero, a setting/surface/material, two supporting props or details, lighting,
a named colour palette, composition/framing, focus/depth/contrast or negative space, mood, and exclusions.

──────────────────────────────────────────
UNIVERSAL VISUAL-BRIEF FRAMEWORK
──────────────────────────────────────────
First infer the post's concrete visual story from the topic, campaign goal, audience, brand voice, and keywords.
Then choose the medium that best serves that story: product photography, editorial lifestyle photography,
still life, atmospheric location photography, food/fashion detail photography, or a text-free editorial
illustration. Do not classify the brand into a fixed template.

Every brief must include:
  • One precise hero subject and a specific use case, moment, or setting.
  • Two or more supporting objects/details that make the topic recognizable.
  • Lighting, a 3-5-colour palette, composition, mood, and image style.
  • Clear negative space only when post-production copy is needed.
  • "No readable text, no logos, no watermarks" and no request for app icons or UI screenshots.

Choose a single, clearly described person only when it adds meaning; otherwise use the product, scene, or
process as the hero. For a broad brief, select one specific angle supported by the brand context—never a
generic laptop, keyboard, phone, desk scene, abstract cube, or vague "future technology" visual. Do not
invent product claims. Keep all visual decisions grounded in the supplied content and brand context.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Return exactly 1 definitive, production-ready variation. Do not create alternatives or variations.
- Instagram captions (caption): hook line 1 → 3-5 bullet points → CTA. Platform-native tone.
- LinkedIn captions (liCaption): professional paragraph format, same topic.
- hashtags and liHashtags must be plain strings WITHOUT the # prefix.
- Include brand keywords as hashtags when relevant (TitleCase, no spaces).
- imageBrief: 60-110 words, follow the universal visual-brief framework above.
- liImageBrief: same visual concept adapted for a LinkedIn professional aesthetic.
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
            # Keep credentials out of the query string. httpx logs request URLs at
            # INFO level, so using `?key=...` can leak the API key into application logs.
            headers={"x-goog-api-key": settings.GEMINI_API_KEY},
            json=payload,
        )

    def _call_gemini(
        self,
        prompt_instructions: str,
        *,
        trace_id: str | None = None,
        purpose: str = "content_generation",
    ) -> dict[str, Any]:
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
        logger.info(
            "AI generation started trace_id=%s purpose=%s provider=gemini models=%s instruction_chars=%d",
            trace_id or "none",
            purpose,
            ",".join(models),
            len(prompt_instructions),
        )

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
                                "Gemini timeout trace_id=%s purpose=%s model=%s attempt=%s/%s",
                                trace_id or "none",
                                purpose,
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
                                parsed = json.loads(text)
                                usage = body.get("usageMetadata") or {}
                                logger.info(
                                    "Gemini response accepted trace_id=%s purpose=%s model=%s attempt=%d/%d "
                                    "variations=%d prompt_tokens=%s output_tokens=%s total_tokens=%s",
                                    trace_id or "none",
                                    purpose,
                                    model,
                                    attempt + 1,
                                    _MAX_ATTEMPTS_PER_MODEL,
                                    len(parsed.get("variations") or []),
                                    usage.get("promptTokenCount", "unknown"),
                                    usage.get("candidatesTokenCount", "unknown"),
                                    usage.get("totalTokenCount", "unknown"),
                                )
                                return parsed
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
                            "Gemini API call failed trace_id=%s purpose=%s: %s %s model=%s attempt=%s/%s detail=%s",
                            trace_id or "none",
                            purpose,
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
                "Gemini API call failed trace_id=%s purpose=%s error_type=%s",
                trace_id or "none",
                purpose,
                type(exc).__name__,
            )
            raise ValueError(ContentErrorCodes.GENERATION_FAILED) from exc

        if last_was_overload:
            raise ValueError(ContentErrorCodes.GENERATION_OVERLOADED) from last_exc
        raise ValueError(ContentErrorCodes.GENERATION_FAILED) from last_exc

    def build_pollinations_url(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        *,
        seed: int | None = None,
    ) -> str:
        sizes = {
            "1:1": (1024, 1024),
            "16:9": (1280, 720),
            "9:16": (720, 1280),
        }
        width, height = sizes.get(aspect_ratio, sizes["1:1"])
        # The image brief has a deliberate word limit in the Gemini instructions.
        # Do not silently truncate it here: the composition and exclusion details
        # are commonly placed at the end of a prompt.
        encoded = urllib.parse.quote(prompt.strip())
        seed = seed if seed is not None else random.randint(0, 999_999)
        params = urllib.parse.urlencode(
            {
                "width": width,
                "height": height,
                "nologo": "true",
                "model": "flux",
                "seed": seed,
            }
        )
        return f"https://image.pollinations.ai/prompt/{encoded}?{params}"

    @staticmethod
    def _evaluate_image_brief(
        brief: str,
        content_request: str | None,
        brand_name: str | None,
        tone: str | None,
        keywords: list[str] | None,
        brand_voice: str | None,
        description: str | None,
    ) -> dict[str, Any]:
        """Score a generated image brief before it is presented to the user.

        This is intentionally deterministic: it makes the quality gate transparent,
        has no additional model cost, and gives the UI actionable reasons for a low score.
        """
        normalized = " ".join(brief.lower().split())
        words = normalized.split()
        request_terms = {
            term
            for term in re.findall(r"[a-z0-9]+", (content_request or "").lower())
            if len(term) > 2 and term not in _PROMPT_STOP_WORDS
        }
        brief_terms = set(re.findall(r"[a-z0-9]+", normalized))
        specific_request_terms = request_terms - _GENERIC_TOPIC_TERMS
        contextual_terms = {
            term
            for term in re.findall(
                r"[a-z0-9]+",
                " ".join([brand_name or "", brand_voice or "", description or "", *(keywords or [])]).lower(),
            )
            if len(term) > 2 and term not in _PROMPT_STOP_WORDS and term not in _GENERIC_TOPIC_TERMS
        }
        overlap = request_terms & brief_terms
        contextual_overlap = contextual_terms & brief_terms
        generic_hero = any(
            term in normalized
            for term in ("laptop", "keyboard", "smartphone", "phone on a desk", "abstract cube", "future technology")
        )

        suggestions: list[str] = []
        if len(specific_request_terms) < 2:
            if not generic_hero and (contextual_overlap or len(words) >= 60):
                topic_score = 25
            else:
                topic_score = 8
                suggestions.append(
                    "Make the content brief concrete: name the product, use case, audience, setting, or event to show."
                )
        elif len(overlap) >= min(3, len(specific_request_terms)):
            topic_score = 30
        elif overlap:
            topic_score = 18
            suggestions.append("Name the requested topic or product directly in the image brief's hero subject.")
        else:
            topic_score = 5
            suggestions.append("Align the hero subject with the requested content topic instead of using a generic visual.")

        visual_markers = (
            "scene", "studio", "desk", "office", "home", "city", "background", "surface",
            "fabric", "product", "device", "person", "editorial", "close-up", "overhead",
            "hero", "subject", "setting", "environment", "foreground", "texture", "material",
            "shadow", "props", "warehouse", "store", "kitchen", "garden", "workshop",
        )
        visual_score = min(25, sum(marker in normalized for marker in visual_markers) * 4)
        if visual_score < 17:
            suggestions.append("Add a concrete hero subject, setting, materials, and supporting objects.")

        composition_markers = (
            "lighting", "softbox", "golden hour", "composition", "rule-of-thirds", "centered",
            "flat-lay", "split-grid", "palette", "color", "negative space", "sharp focus",
            "framing", "depth of field", "bokeh", "contrast", "symmetrical", "angle",
        )
        composition_score = min(20, sum(marker in normalized for marker in composition_markers) * 3)
        if composition_score < 14:
            suggestions.append("Specify lighting, composition, and a restrained colour palette.")

        requests_text = "readable text" in normalized and "no readable text" not in normalized
        requests_logo_or_ui = any(
            marker in normalized
            for marker in ("headline", "brand mark", "app icon", "ui screenshot")
        ) or (" logo" in normalized and "no logo" not in normalized)
        has_forbidden_request = requests_text or requests_logo_or_ui
        compatibility_score = 3 if has_forbidden_request else 15
        if has_forbidden_request:
            suggestions.append("Remove requests for readable text, logos, app icons, and UI screenshots; add them after generation.")

        length_score = 10 if 60 <= len(words) <= 110 else 4
        if length_score < 10:
            suggestions.append("Keep the image brief focused between 60 and 110 words.")

        brand_terms = [brand_name or "", tone or "", *(keywords or [])]
        if brand_terms and not any(term and term.lower() in normalized for term in brand_terms):
            suggestions.append("Reflect a relevant brand colour, tone, or keyword in the visual direction.")

        criteria = [
            {"name": "Topic specificity", "score": topic_score, "maxScore": 30},
            {"name": "Visual detail", "score": visual_score, "maxScore": 25},
            {"name": "Composition & lighting", "score": composition_score, "maxScore": 20},
            {"name": "Generator compatibility", "score": compatibility_score, "maxScore": 15},
            {"name": "Prompt length", "score": length_score, "maxScore": 10},
        ]
        overall_score = sum(item["score"] for item in criteria)
        return {
            "overallScore": overall_score,
            "status": "ready" if overall_score >= 80 else "needs_review",
            "criteria": criteria,
            "suggestions": suggestions[:3],
        }

    def _repair_low_quality_image_briefs(
        self,
        *,
        items: list[dict[str, Any]],
        evaluations: list[dict[str, Any]],
        content_request: str,
        brand_name: str | None,
        tone: str | None,
        keywords: list[str] | None,
        brand_voice: str | None,
        description: str | None,
        visual_style: str | None,
        trace_id: str | None = None,
    ) -> list[str]:
        """Rewrite weak briefs in one Gemini call, preserving their variation order."""
        briefs = "\n\n".join(
            "\n".join(
                [
                    f"BRIEF {index + 1}: {item.get('imageBrief') or item.get('liImageBrief') or '(missing)'}",
                    f"CURRENT RUBRIC SCORE: {evaluations[index]['overallScore']}/100",
                    "MISSING POINTS: " + ", ".join(
                        criterion["name"]
                        for criterion in evaluations[index]["criteria"]
                        if criterion["score"] < criterion["maxScore"]
                    ),
                    "REPAIR NOTES: " + " | ".join(evaluations[index]["suggestions"] or ["Increase concrete visual specificity."]),
                ]
            )
            for index, item in enumerate(items)
        )
        prompt_instructions = f"""
You are a strict social-image prompt editor. Rewrite the image briefs below so each reaches at least
80/100 on the supplied quality gate before it is sent to Flux/Pollinations. Address every listed missing
criterion and repair note; do not return a lightly edited version of the same weak brief.

CONTENT REQUEST: {content_request or '(broad brand topic)'}
BRAND: {brand_name or 'Our Brand'}
BRAND VOICE: {brand_voice or '(none)'}
DESCRIPTION: {description or '(none)'}
TONE: {tone or 'professional'}
KEYWORDS: {', '.join(keywords or []) or '(none)'}
VISUAL STYLE: {visual_style or '(none)'}

For every brief, write 70-100 words with: one precise hero subject, concrete setting and supporting
objects, lighting, 3-5 colours, composition, mood, and the most appropriate visual medium. Use text-free
editorial illustration only when an illustrated concept best communicates the topic; otherwise choose
commercial, editorial, product, lifestyle, still-life, or location photography as appropriate. Never use a
generic laptop, keyboard, desk, phone, abstract cube, or vague trend visual as the hero subject unless explicitly
requested. If the content request is broad, select one concrete theme supported by the brand voice or keywords.
Do not invent a product claim.

Return exactly {len(items)} variations in the same order. Only imageBrief matters, but populate all required
fields with valid placeholders. Do not include commentary outside the JSON response.

{briefs}
""".strip()
        repaired = self._call_gemini(
            prompt_instructions,
            trace_id=trace_id,
            purpose="image_brief_repair",
        ).get("variations") or []
        return [str(item.get("imageBrief") or "").strip() for item in repaired[: len(items)]]

    @staticmethod
    def _complete_image_brief_for_rubric(
        brief: str,
        evaluation: dict[str, Any],
        content_request: str | None,
    ) -> str:
        """Add missing render-critical direction without another Gemini request.

        Gemini is asked to meet the rubric in its first response. This deterministic
        safety net covers any omitted production terms so a short user topic does
        not turn into another model call, extra latency, or an unnecessary image
        rejection.
        """
        result = " ".join(brief.split())
        if not result:
            return result

        scores = {criterion["name"]: criterion["score"] for criterion in evaluation["criteria"]}
        additions: list[str] = []
        if scores.get("Topic specificity", 0) < 25:
            topic_terms = [
                term
                for term in re.findall(r"[a-zA-Z0-9]+", content_request or "")
                if len(term) > 2
                and term.lower() not in _PROMPT_STOP_WORDS
                and term.lower() not in {"text", "logo", "logos", "watermark", "watermarks", "ui"}
            ][:6]
            if topic_terms:
                additions.append(
                    "Visual story anchored to the requested concept: " + " ".join(topic_terms) + "."
                )
        if scores.get("Visual detail", 0) < 20 or scores.get("Composition & lighting", 0) < 17:
            additions.append(
                "Textured studio surface with foreground props and gentle shadows; deliberate centered composition, soft lighting, restrained color palette, balanced framing, sharp focus, and clean negative space."
            )
        if "no readable text" not in result.lower():
            additions.append("No readable text, no logos, no watermarks, no UI.")

        # Preserve room for the safety details and mandatory exclusions. The model's
        # initial brief carries the subject and brand story, so only trim excessive
        # wording from its tail when it violates the stated 110-word maximum.
        addition_words = sum(len(addition.split()) for addition in additions)
        max_base_words = max(60, 110 - addition_words)
        base_words = result.split()
        if len(base_words) > max_base_words:
            result = " ".join(base_words[:max_base_words]).rstrip(" ,;:") + "."
        if additions:
            result = f"{result} {' '.join(additions)}"
        if len(result.split()) < 60:
            result = (
                f"{result} Detailed editorial styling creates a cohesive tactile premium intentional calm "
                "inviting refined visual treatment."
            )
        return result

    @staticmethod
    def _quality_log_fields(evaluation: dict[str, Any]) -> tuple[str, str]:
        """Return concise, safe review details for application logs."""
        missing = ", ".join(
            f"{criterion['name']}={criterion['score']}/{criterion['maxScore']}"
            for criterion in evaluation["criteria"]
            if criterion["score"] < criterion["maxScore"]
        ) or "none"
        suggestions = " | ".join(evaluation.get("suggestions") or []) or "none"
        return missing, suggestions

    def _rehost_image(
        self,
        pollinations_url: str,
        *,
        max_retries: int = 3,
        trace_id: str | None = None,
        variation: int | None = None,
    ) -> str | None:
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
                    logger.info(
                        "Image render downloaded trace_id=%s variation=%s provider=pollinations model=flux "
                        "status=%d bytes=%d content_type=%s",
                        trace_id or "none",
                        variation if variation is not None else "none",
                        image_response.status_code,
                        len(file_bytes),
                        content_type,
                    )
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
            secure_url = uploaded.get("secureUrl")
            logger.info(
                "Image rehost completed trace_id=%s variation=%s provider=cloudinary success=%s",
                trace_id or "none",
                variation if variation is not None else "none",
                bool(secure_url),
            )
            return secure_url
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
        trace_id = generate_ulid()
        logger.info(
            "Content generation request trace_id=%s prompt_chars=%d platforms=%s aspect_ratio=%s",
            trace_id,
            len(prompt or ""),
            ",".join(platforms or ["instagram"]),
            aspect_ratio,
        )
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
        raw = self._call_gemini(instructions, trace_id=trace_id)
        raw_variations = raw.get("variations") or []
        if not isinstance(raw_variations, list) or len(raw_variations) == 0:
            raise ValueError(ContentErrorCodes.GENERATION_FAILED)

        # One definitive generation avoids multiplying provider calls and image
        # charges. The UI accepts a one-item list and no longer needs padding.
        raw_variations = raw_variations[:1]

        image_warning: str | None = None
        variation_image_urls: list[str | None] = []
        evaluations = [
            self._evaluate_image_brief(
                brief=(item.get("imageBrief") or item.get("liImageBrief") or "").strip(),
                content_request=prompt,
                brand_name=brand_name,
                tone=tone,
                keywords=keywords,
                brand_voice=brand_voice,
                description=description,
            )
            for item in raw_variations
        ]
        for index, evaluation in enumerate(evaluations):
            missing, suggestions = self._quality_log_fields(evaluation)
            logger.info(
                "Image quality review trace_id=%s variation=%d phase=initial score=%d/100 status=%s missing=[%s] suggestions=[%s]",
                trace_id,
                index + 1,
                evaluation["overallScore"],
                evaluation["status"],
                missing,
                suggestions,
            )

        # Complete omitted visual-production details locally rather than issuing
        # repair prompts. This keeps generation to one Gemini call, even for a
        # short user topic, while retaining the 80-point quality gate.
        for index, evaluation in enumerate(evaluations):
            if evaluation["overallScore"] >= 80:
                continue
            completed_brief = self._complete_image_brief_for_rubric(
                (raw_variations[index].get("imageBrief") or raw_variations[index].get("liImageBrief") or "").strip(),
                evaluation,
                prompt,
            )
            raw_variations[index]["imageBrief"] = completed_brief
            evaluations[index] = self._evaluate_image_brief(
                brief=completed_brief,
                content_request=prompt,
                brand_name=brand_name,
                tone=tone,
                keywords=keywords,
                brand_voice=brand_voice,
                description=description,
            )
            missing, suggestions = self._quality_log_fields(evaluations[index])
            logger.info(
                "Image quality review trace_id=%s variation=%d phase=local_completion score=%d/100 status=%s missing=[%s] suggestions=[%s]",
                trace_id,
                index + 1,
                evaluations[index]["overallScore"],
                evaluations[index]["status"],
                missing,
                suggestions,
            )

        # Give every variation its own image URL. Previously all variation cards
        # displayed the first prompt's image, even after a user selected B or C.
        # Only the initially visible image is rehosted; the other URLs are fetched
        # when selected and already carry their own prompt and seed.
        for index, item in enumerate(raw_variations):
            brief = (item.get("imageBrief") or item.get("liImageBrief") or "").strip()
            if evaluations[index]["overallScore"] < 80:
                variation_image_urls.append(None)
                image_warning = image_warning or (
                    "Image generation was skipped because the prompt did not meet the 80/100 quality gate."
                )
                logger.warning(
                    "Image generation skipped trace_id=%s variation=%d score=%d/100 reason=quality_gate",
                    trace_id,
                    index + 1,
                    evaluations[index]["overallScore"],
                )
                continue
            if not brief:
                variation_image_urls.append(None)
                image_warning = image_warning or "No imageBrief returned from model."
                continue
            try:
                seed = random.randint(0, 999_999)
                logger.info(
                    "Image render requested trace_id=%s variation=%d provider=qwen-primary pollinations-flux-fallback "
                    "aspect_ratio=%s prompt_words=%d prompt=%r",
                    trace_id,
                    index + 1,
                    aspect_ratio,
                    len(brief.split()),
                    brief,
                )
                image_url = qwen_image_provider.generate_image(
                    prompt=brief,
                    aspect_ratio=aspect_ratio,
                    seed=seed,
                    trace_id=trace_id,
                    variation=index + 1,
                )
                if image_url:
                    variation_image_urls.append(image_url)
                    logger.info(
                        "Image generation prepared trace_id=%s variation=%d score=%d/100 source=qwen",
                        trace_id,
                        index + 1,
                        evaluations[index]["overallScore"],
                    )
                    continue

                pollinations_url = self.build_pollinations_url(brief, aspect_ratio, seed=seed)
                logger.info(
                    "Image render dispatch trace_id=%s variation=%d provider=pollinations model=flux seed=%s",
                    trace_id,
                    index + 1,
                    seed,
                )
                image_url = (
                    self._rehost_image(pollinations_url, trace_id=trace_id, variation=index + 1)
                    if index == 0
                    else None
                )
                variation_image_urls.append(image_url or pollinations_url)
                logger.info(
                    "Image generation prepared trace_id=%s variation=%d score=%d/100 source=%s",
                    trace_id,
                    index + 1,
                    evaluations[index]["overallScore"],
                    "cloudinary" if image_url else "pollinations",
                )
            except Exception as exc:
                logger.warning(
                    "Image generation failed trace_id=%s variation=%d error_type=%s error=%s",
                    trace_id,
                    index + 1,
                    type(exc).__name__,
                    exc,
                )
                variation_image_urls.append(None)
                image_warning = image_warning or str(exc)

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
                    "imageUrl": variation_image_urls[index],
                    "imagePromptEvaluation": evaluations[index],
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
        trace_id = generate_ulid()
        platforms_label = ", ".join(platforms or ["instagram", "linkedin"])
        logger.info(
            "Feedback generation request trace_id=%s feedback_chars=%d aspect_ratio=%s",
            trace_id,
            len(feedback or ""),
            aspect_ratio,
        )
        keyword_list = ", ".join(keywords or []) or "(none)"
        brand_rules = "\n".join(f"- {rule}" for rule in (rules or []) if rule) or "(none)"
        hashtags_str = ", ".join(f"#{h}" for h in previous_hashtags) or "(none)"
        li_hashtags_str = ", ".join(f"#{h}" for h in previous_li_hashtags) or "(none)"

        prompt_instructions = f"""
You are an expert social media content strategist and AI image prompt engineer for Pressforge.
A client has reviewed the following post and provided revision feedback.
Produce exactly 1 improved variation that addresses the feedback.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKSPACE BRAND IDENTITY  ← VISUAL GUARDRAILS
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
The imageBrief is sent to Pollinations.ai (Flux model). Follow these constraints:
  ✗ Do not ask for readable headlines, exact logos, brand marks, app interfaces, or watermarks.
    Add those in the design editor after generation.
  ✓ A single, clearly described person is allowed when essential to the post. Avoid crowds, tiny faces,
    and complex hand poses. Use product-only imagery when a person is not needed.
  ✓ It works especially well for product flat-lays, styled clothing, fabric close-ups, still-life,
    fireworks, food, décor, and simple editorial lifestyle photography.
The revised image must communicate both the feedback/topic and the brand identity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE BRIEF RULES  ← CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use the same universal visual-brief framework as initial generation. Infer the best visual medium from the
feedback, post topic, audience, brand context, and requested change; do not use fixed category templates.
Write 60-110 words with one precise hero subject, a specific setting/use case, two supporting details,
lighting, a 3-5-colour palette, composition, mood, and style. Use a person only when meaningful. Never
request readable text, logos, watermarks, app icons, or UI screenshots. For broad topics, choose one
specific brand-supported angle; never use a generic laptop, keyboard, phone, desk, abstract cube, or vague
"future technology" visual as the hero subject.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Return exactly 1 variation in the `variations` array.
- Preserve untouched parts from the previous post.
- Directly address every point in the client feedback.
- Instagram captions: hook → bullets → CTA. Platform-native.
- LinkedIn captions: professional paragraph format.
- hashtags and liHashtags must be plain strings WITHOUT the # prefix.
- imageBrief: 60-110 words, follow the universal visual-brief framework above.
- liImageBrief: same visual concept, professional LinkedIn tone.
- Do not mention that you are an AI.
""".strip()

        raw = self._call_gemini(prompt_instructions, trace_id=trace_id, purpose="feedback_generation")
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
        image_warning: str | None = None

        brief_to_use = new_image_brief or new_li_image_brief
        evaluation = self._evaluate_image_brief(
            brief=brief_to_use,
            content_request=feedback,
            brand_name=brand_name,
            tone=tone,
            keywords=keywords,
            brand_voice=brand_voice,
            description=description,
        )
        missing, suggestions = self._quality_log_fields(evaluation)
        logger.info(
            "Image quality review trace_id=%s variation=1 phase=feedback-initial score=%d/100 status=%s missing=[%s] suggestions=[%s]",
            trace_id,
            evaluation["overallScore"],
            evaluation["status"],
            missing,
            suggestions,
        )
        for repair_attempt in range(2):
            if evaluation["overallScore"] >= 80:
                break
            try:
                repaired = self._repair_low_quality_image_briefs(
                    items=[item],
                    evaluations=[evaluation],
                    content_request=feedback,
                    brand_name=brand_name,
                    tone=tone,
                    keywords=keywords,
                    brand_voice=brand_voice,
                    description=description,
                    visual_style=None,
                    trace_id=trace_id,
                )
                if repaired and repaired[0]:
                    new_image_brief = repaired[0]
                    brief_to_use = new_image_brief
                    evaluation = self._evaluate_image_brief(
                        brief=brief_to_use,
                        content_request=feedback,
                        brand_name=brand_name,
                        tone=tone,
                        keywords=keywords,
                        brand_voice=brand_voice,
                        description=description,
                    )
                    missing, suggestions = self._quality_log_fields(evaluation)
                    logger.info(
                        "Image quality review trace_id=%s variation=1 phase=feedback-repair-%d score=%d/100 status=%s missing=[%s] suggestions=[%s]",
                        trace_id,
                        repair_attempt + 1,
                        evaluation["overallScore"],
                        evaluation["status"],
                        missing,
                        suggestions,
                    )
            except Exception as exc:
                logger.warning(
                    "Image brief quality repair failed trace_id=%s pass=%d phase=feedback error_type=%s error=%s",
                    trace_id,
                    repair_attempt + 1,
                    type(exc).__name__,
                    exc,
                )
                break

        if evaluation["overallScore"] < 80:
            image_warning = "Image generation was skipped because the prompt did not meet the 80/100 quality gate."
        elif brief_to_use:
            try:
                seed = random.randint(0, 999_999)
                logger.info(
                    "Image render requested trace_id=%s variation=1 provider=qwen-primary pollinations-flux-fallback "
                    "aspect_ratio=%s prompt_words=%d prompt=%r",
                    trace_id,
                    aspect_ratio,
                    len(brief_to_use.split()),
                    brief_to_use,
                )
                image_url = qwen_image_provider.generate_image(
                    prompt=brief_to_use,
                    aspect_ratio=aspect_ratio,
                    seed=seed,
                    trace_id=trace_id,
                    variation=1,
                )
                if image_url:
                    logger.info(
                        "Image generation prepared trace_id=%s variation=1 score=%d/100 source=qwen",
                        trace_id,
                        evaluation["overallScore"],
                    )
                    return {
                        "caption": item.get("caption") or "",
                        "hashtags": [str(tag).lstrip("#") for tag in hashtags],
                        "imageBrief": new_image_brief,
                        "liCaption": item.get("liCaption") or "",
                        "liHashtags": [str(tag).lstrip("#") for tag in li_hashtags],
                        "liImageBrief": new_li_image_brief,
                        "imageUrl": image_url,
                        "imageWarning": image_warning,
                        "imagePromptEvaluation": evaluation,
                    }

                pollinations_url = self.build_pollinations_url(brief_to_use, aspect_ratio, seed=seed)
                logger.info(
                    "Image render dispatch trace_id=%s variation=1 provider=pollinations model=flux seed=%s",
                    trace_id,
                    seed,
                )
                image_url = self._rehost_image(
                    pollinations_url,
                    trace_id=trace_id,
                    variation=1,
                ) or pollinations_url
            except Exception as exc:
                logger.warning(
                    "Image generation failed trace_id=%s variation=1 phase=feedback error_type=%s error=%s",
                    trace_id,
                    type(exc).__name__,
                    exc,
                )
                image_warning = str(exc)
                image_url = previous_image_url

        return {
            "caption": item.get("caption") or "",
            "hashtags": [str(tag).lstrip("#") for tag in hashtags],
            "imageBrief": new_image_brief,
            "liCaption": item.get("liCaption") or "",
            "liHashtags": [str(tag).lstrip("#") for tag in li_hashtags],
            "liImageBrief": new_li_image_brief,
            "imageUrl": image_url,
            "imageWarning": image_warning,
            "imagePromptEvaluation": evaluation,
        }


gemini_content_provider = GeminiContentProvider()
