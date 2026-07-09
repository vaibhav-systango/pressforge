import type { OnboardingRequest } from '@/lib/types/api';

export function buildOnboardingPayload(state: any, orgKyc?: any): OnboardingRequest {
  const accountType = state.accountType === 'organization' ? 'ORGANIZATION' : 'INDIVIDUAL';

  if (accountType === 'ORGANIZATION') {
    return {
      accountType,
      organizationDetails: {
        name: orgKyc?.companyName || state.organizationName || '',
        teamSize: state.organizationTeamSize || '1-5',
        website: state.organizationWebsite || '',
        industries: state.organizationIndustries || [],
        primaryGoal: state.organizationObjective || '',
        objective: state.organizationObjective || '',
        description: state.organizationDescription || '',
      },
    };
  } else {
    const activeWorkspace = state.workspaces?.find((w: any) => w.id === state.activeWorkspaceId) || state.workspaces?.[0];
    return {
      accountType,
      individualDetails: {
        brandName: activeWorkspace?.name || '',
        niche: state.individualNiche || '',
        primaryGoal: state.individualGoal || '',
        contentThemes: state.individualThemes || [],
        website: state.individualWebsite || activeWorkspace?.website || '',
        instagramHandle: state.individualInstagramUsername || '',
      },
    };
  }
}
