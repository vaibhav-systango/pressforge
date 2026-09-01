export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'CLIENT';
export type InvitableRole = 'ADMIN' | 'MEMBER' | 'CLIENT';

const INVITATION_PERMISSION_MATRIX: Record<OrganizationRole, InvitableRole[]> = {
  OWNER: ['ADMIN', 'MEMBER', 'CLIENT'],
  ADMIN: ['MEMBER', 'CLIENT'],
  MEMBER: ['CLIENT'],
  CLIENT: [],
};

export function getInvitableRoles(orgRole: string | null | undefined): InvitableRole[] {
  if (!orgRole) return [];
  const normalized = orgRole.toUpperCase() as OrganizationRole;
  return INVITATION_PERMISSION_MATRIX[normalized] ?? [];
}

export function resolveOrganizationRole(
  organizationRole?: string | null,
  accountType?: string | null,
): OrganizationRole | null {
  if (organizationRole) {
    return organizationRole.toUpperCase() as OrganizationRole;
  }

  if (accountType?.startsWith('ORG_')) {
    return accountType.replace('ORG_', '') as OrganizationRole;
  }

  return null;
}

export function formatOrganizationRole(role?: string | null): string {
  if (!role) return 'Member';
  return role.charAt(0) + role.slice(1).toLowerCase();
}
