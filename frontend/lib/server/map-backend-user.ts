export function mapBackendUserType(backendAccountType: string): 'client' | 'admin' | 'owner' | 'member' | 'user' {
  if (!backendAccountType) return 'user';
  const typeUpper = backendAccountType.toUpperCase();
  if (typeUpper === 'ORG_CLIENT') return 'client';
  if (typeUpper === 'ORG_OWNER') return 'owner';
  if (typeUpper === 'ORG_ADMIN') return 'admin';
  if (typeUpper === 'ORG_MEMBER') return 'member';
  if (typeUpper === 'INDIVIDUAL') return 'owner';
  return 'user';
}
