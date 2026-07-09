import type { UserType } from '@/lib/types';

interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  accountType: string;
  onboardingStatus: string;
}

export function mapBackendUserType(accountType: string): UserType {
  if (accountType === 'INDIVIDUAL') {
    return 'individual';
  }

  if (accountType === 'ORG_CLIENT' || accountType.endsWith('_CLIENT')) {
    return 'client';
  }

  return 'agency';
}

export function mapBackendUser(user: BackendUser) {
  return {
    userId: user.id,
    userType: mapBackendUserType(user.accountType),
    email: user.email,
    name: user.fullName,
    onboardingCompleted: user.onboardingStatus === 'COMPLETED',
  };
}
