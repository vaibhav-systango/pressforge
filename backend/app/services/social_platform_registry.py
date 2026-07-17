from app.core.constants.social_constants import SocialErrorCodes
from app.services.linkedin_service import linkedin_service

_REGISTRY: dict[str, object] = {
    "linkedin": linkedin_service,
}


def normalize_platform_slug(platform: str) -> str:
    return platform.strip().lower()


def get_social_platform_service(platform: str):
    slug = normalize_platform_slug(platform)
    service = _REGISTRY.get(slug)
    if not service:
        raise ValueError(SocialErrorCodes.UNSUPPORTED_PLATFORM)
    return service


def get_all_social_platform_services() -> list:
    return list(_REGISTRY.values())


def is_supported_platform(platform: str) -> bool:
    return normalize_platform_slug(platform) in _REGISTRY
