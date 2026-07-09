import type { UserType } from '@/lib/types';

export interface AuthRedirectUser {
  userType?: UserType;
  onboardingCompleted?: boolean;
  onboardingStatus?: string;
  accountType?: string;
  organizationId?: string | null;
}

/** True when the user should not be sent through self-serve onboarding. */
export function isOnboardingComplete(user?: AuthRedirectUser | null): boolean {
  if (!user) return false;

  if (user.onboardingCompleted === true) return true;
  if (user.onboardingStatus === 'COMPLETED') return true;

  // Invited org members are provisioned by the invite — skip "Choose Your Journey".
  if (user.accountType?.startsWith('ORG_')) {
    return true;
  }

  return false;
}

/**
 * After login, signup, or accept-invite — decide where to send the user.
 */
export function getPostAuthRedirect(user: AuthRedirectUser): string {
  return isOnboardingComplete(user) ? '/app' : '/onboarding/organization';
}
