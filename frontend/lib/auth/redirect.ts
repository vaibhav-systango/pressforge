export interface User {
  id: string;
  fullName: string;
  email: string;
  accountType: string;
  onboardingStatus: string;
  isActive: boolean;
  lastLogin?: number;
  createdAt?: number;
  updatedAt?: number;
  organizationId?: string | null;
  organizationRole?: string | null;
  userType?: string;
  name?: string;
}

export function isOnboardingComplete(user?: User | null): boolean {
  return user?.onboardingStatus === 'COMPLETED';
}

export function getPostAuthRedirect(user?: User | null): string {
  if (!user) return '/auth/login';
  if (user.onboardingStatus === 'COMPLETED') return '/app';
  
  if (user.onboardingStatus === 'NOT_STARTED') {
    return '/onboarding/organization';
  }

  // If in progress:
  if (user.accountType === 'INDIVIDUAL') {
    return '/onboarding/workspace';
  } else if (user.accountType === 'ORGANIZATION' || user.accountType.startsWith('ORG_')) {
    return '/onboarding/kyc';
  }

  return '/onboarding/organization';
}
