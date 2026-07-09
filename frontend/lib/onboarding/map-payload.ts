import type { AppState } from '@/lib/types';
import type { OnboardingRequest } from '@/lib/types/api';

export interface OrganizationKycInput {
  companyName: string;
  businessType: string;
  taxId: string;
  businessAddress: string;
  contactPerson: string;
}

const GOAL_MAP: Record<string, string> = {
  'grow audience': 'GROW_AUDIENCE',
  'promote offers': 'PROMOTE_OFFERS',
  'build authority': 'BUILD_AUTHORITY',
  'create content faster': 'CREATE_CONTENT_FASTER',
  'acquire clients': 'ACQUIRE_CLIENTS',
  'support campaigns': 'SUPPORT_CAMPAIGNS',
  'build brand awareness': 'BUILD_BRAND_AWARENESS',
  'streamline approvals': 'STREAMLINE_APPROVALS',
};

const ENTITY_TYPE_MAP: Record<string, string> = {
  llc: 'LLC',
  corporation: 'CORPORATION',
  partnership: 'PARTNERSHIP',
  solo: 'SOLO_PROPRIETORSHIP',
};

function mapGoal(goal: string): string {
  const normalized = goal.trim().toLowerCase();
  return GOAL_MAP[normalized] ?? goal.trim().toUpperCase().replace(/\s+/g, '_');
}

function mapEntityType(type: string): string {
  return ENTITY_TYPE_MAP[type.trim().toLowerCase()] ?? type.trim().toUpperCase();
}

function parseContactPerson(contact: string): { name: string; designation?: string } {
  const match = contact.match(/^(.+?)\s*\((.+)\)$/);
  if (match) {
    return { name: match[1].trim(), designation: match[2].trim() };
  }
  return { name: contact.trim() };
}

export function buildOnboardingPayload(
  state: AppState,
  orgKyc?: OrganizationKycInput,
): OnboardingRequest {
  const isOrganization = state.accountType === 'organization';

  if (isOrganization) {
    if (!orgKyc) {
      throw new Error('Organization KYC details are required.');
    }

    const contact = parseContactPerson(orgKyc.contactPerson);

    return {
      accountType: 'ORGANIZATION',
      organizationDetails: {
        name: state.organizationName,
        website: state.organizationWebsite || null,
        teamSize: state.organizationTeamSize || null,
        industries: state.organizationIndustries ?? [],
        primaryGoal: mapGoal(state.organizationObjective || 'acquire clients'),
        objective: state.organizationObjective || null,
        description: state.organizationDescription || null,
        legalName: orgKyc.companyName,
        businessEntityType: mapEntityType(orgKyc.businessType),
        taxIdentificationNumber: orgKyc.taxId,
        registeredAddress: orgKyc.businessAddress,
        primaryContactName: contact.name,
        primaryContactDesignation: contact.designation || null,
        businessDocumentFileKey: null,
      },
    };
  }

  const workspace = state.workspaces?.[0];

  return {
    accountType: 'INDIVIDUAL',
    individualDetails: {
      primaryGoal: mapGoal(state.individualGoal || 'grow audience'),
      contentThemes: state.individualThemes?.length
        ? state.individualThemes
        : ['General'],
      website: state.individualWebsite || workspace?.website || null,
    },
  };
}
