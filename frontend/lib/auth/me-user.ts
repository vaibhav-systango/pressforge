export function mapBackendUserToMe(backendUser: any) {
  if (!backendUser) return null;
  return {
    id: backendUser.id || backendUser.userId,
    fullName: backendUser.fullName || backendUser.name,
    email: backendUser.email,
    accountType: backendUser.accountType || backendUser.userType || 'UNASSIGNED',
    onboardingStatus: backendUser.onboardingStatus || 'NOT_STARTED',
    isActive: backendUser.isActive !== undefined ? backendUser.isActive : true,
    lastLogin: backendUser.lastLogin,
    createdAt: backendUser.createdAt,
    updatedAt: backendUser.updatedAt,
    organizationId: backendUser.organizationId || null,
    organizationRole: backendUser.organizationRole || null,
  };
}

export function formatAccountTypeLabel(accountType: string): string {
  if (accountType === 'INDIVIDUAL') return 'Individual';
  if (accountType === 'ORGANIZATION') return 'Organization';
  if (accountType === 'ORG_OWNER') return 'Owner';
  if (accountType === 'ORG_ADMIN') return 'Administrator';
  if (accountType === 'ORG_MEMBER') return 'Team Member';
  if (accountType === 'ORG_CLIENT') return 'Client';
  return accountType;
}

export function formatMeTimestamp(timestamp: number | string | undefined | null): string {
  if (!timestamp) return '—';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}
