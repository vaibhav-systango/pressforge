export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'CLIENT';
export type InvitableRole = 'ADMIN' | 'MEMBER' | 'CLIENT';

export function resolveOrganizationRole(
  orgRole: string | undefined | null,
  accountType: string | undefined | null
): OrganizationRole {
  if (orgRole) return orgRole as OrganizationRole;
  if (accountType === 'INDIVIDUAL') return 'OWNER';
  if (accountType === 'ORGANIZATION') return 'OWNER';
  return 'CLIENT';
}

export function getInvitableRoles(role: OrganizationRole): InvitableRole[] {
  if (role === 'OWNER') return ['ADMIN', 'MEMBER', 'CLIENT'];
  if (role === 'ADMIN') return ['MEMBER', 'CLIENT'];
  if (role === 'MEMBER') return ['CLIENT'];
  return [];
}

export function formatOrganizationRole(role: string): string {
  if (role === 'OWNER') return 'Owner';
  if (role === 'ADMIN') return 'Administrator';
  if (role === 'MEMBER') return 'Team Member';
  if (role === 'CLIENT') return 'Client';
  return role;
}
