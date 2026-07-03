from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants.permission_constants import (
    PermissionErrorCodes,
    PermissionErrorMessages,
)
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.route_permission import RoutePermission
from app.models.organization_member import OrganizationMember


@dataclass(frozen=True)
class RoleResolution:
    role_name: str | None = None
    error_code: str | None = None


def path_matches_route_pattern(pattern: str, path: str) -> bool:
    pattern_segments = _path_segments(pattern)
    path_segments = _path_segments(path)
    if len(pattern_segments) != len(path_segments):
        return False

    for pattern_segment, path_segment in zip(pattern_segments, path_segments):
        if pattern_segment.startswith("{") and pattern_segment.endswith("}"):
            continue
        if pattern_segment != path_segment:
            return False
    return True


def get_required_permissions(db: Session, method: str, path: str) -> list[str]:
    route_permissions = (
        db.query(RoutePermission.path, Permission.name)
        .join(Permission, RoutePermission.permissionId == Permission.id)
        .filter(RoutePermission.method == method)
        .all()
    )
    return [
        permission_name
        for route_path, permission_name in route_permissions
        if path_matches_route_pattern(route_path, path)
    ]


def extract_org_id_from_path(path: str) -> str | None:
    segments = _path_segments(path)
    for index, segment in enumerate(segments):
        if segment == "organizations" and index + 1 < len(segments):
            return segments[index + 1]
    return None


def resolve_rbac_role(db: Session, user: User, org_id: str | None) -> RoleResolution:
    if not is_valid_role(db, user.accountType):
        return RoleResolution(error_code=PermissionErrorCodes.INVALID_ROLE)

    if org_id:
        member = (
            db.query(OrganizationMember)
            .filter(
                OrganizationMember.organizationId == org_id,
                OrganizationMember.userId == user.id,
            )
            .first()
        )
        if not member:
            return RoleResolution(error_code=PermissionErrorCodes.INSUFFICIENT_PERMISSION)

        rbac_role_name = f"ORG_{member.role}"
        if not is_valid_role(db, rbac_role_name):
            return RoleResolution(error_code=PermissionErrorCodes.INVALID_ROLE)
        return RoleResolution(role_name=rbac_role_name)

    return RoleResolution(role_name=user.accountType)


def get_role_permission_names(db: Session, role_name: str) -> set[str]:
    permissions = (
        db.query(Permission.name)
        .join(RolePermission, RolePermission.permissionId == Permission.id)
        .join(Role, Role.id == RolePermission.roleId)
        .filter(Role.name == role_name, Role.isActive.is_(True))
        .all()
    )
    return {permission.name for permission in permissions}


def is_valid_role(db: Session, role_name: str) -> bool:
    return (
        db.query(Role.id)
        .filter(Role.name == role_name, Role.isActive.is_(True))
        .first()
        is not None
    )


def permission_http_exception(error_code: str) -> HTTPException:
    messages = {
        PermissionErrorCodes.INVALID_ROLE: PermissionErrorMessages.INVALID_ROLE,
        PermissionErrorCodes.NOT_ORG_MEMBER: PermissionErrorMessages.NOT_ORG_MEMBER,
        PermissionErrorCodes.INSUFFICIENT_PERMISSION: PermissionErrorMessages.INSUFFICIENT_PERMISSION,
    }
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=messages.get(error_code, PermissionErrorMessages.INSUFFICIENT_PERMISSION),
    )


def _path_segments(route: str) -> list[str]:
    return [segment for segment in route.strip("/").split("/") if segment]
