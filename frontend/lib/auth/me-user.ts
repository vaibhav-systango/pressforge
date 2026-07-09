import type { BackendUserResponse } from '@/lib/types/api';
import type { UserType } from '@/lib/types';

export interface MeUser {
  userId: string;
  userType: UserType;
  email: string;
  name: string;
  onboardingStatus?: string;
  onboardingCompleted?: boolean;
  accountType?: string;
  organizationId?: string | null;
  organizationRole?: string | null;
  isActive?: boolean;
  lastLogin?: number | null;
  createdAt?: number;
  updatedAt?: number;
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

export function mapBackendUserToMe(user: BackendUserResponse): MeUser {
  return {
    userId: user.id,
    userType: mapBackendUserType(user.accountType),
    email: user.email,
    name: user.fullName,
    onboardingCompleted: user.onboardingStatus === 'COMPLETED',
    onboardingStatus: user.onboardingStatus,
    accountType: user.accountType,
    organizationId: user.organizationId ?? null,
    organizationRole: user.organizationRole ?? null,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function formatAccountTypeLabel(accountType?: string | null): string {
  if (!accountType) return 'Unknown';

  switch (accountType) {
    case 'INDIVIDUAL':
      return 'Individual';
    case 'UNASSIGNED':
      return 'Unassigned';
    case 'ORG_OWNER':
      return 'Organization Owner';
    case 'ORG_ADMIN':
      return 'Organization Admin';
    case 'ORG_MEMBER':
      return 'Organization Member';
    case 'ORG_CLIENT':
      return 'Client';
    default:
      if (accountType.startsWith('ORG_')) {
        return accountType.replace('ORG_', '').charAt(0) +
          accountType.replace('ORG_', '').slice(1).toLowerCase();
      }
      return accountType;
  }
}

export function formatMeTimestamp(timestamp?: number | null): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
