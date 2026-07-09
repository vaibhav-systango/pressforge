export interface BackendUserResponse {
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
}

export interface BackendTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: BackendUserResponse;
  organizationId?: string | null;
}

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface SignupRequest {
  fullName?: string;
  name?: string;
  email?: string;
  password?: string;
}

export interface AcceptInvitationRequest {
  token: string;
  password?: string;
}

export interface InviteUserRequest {
  email: string;
  fullName: string;
  role: string;
}

export interface InviteUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organizationId: string;
  invitedBy: string;
  status: string;
  expiresAt: number;
}

export interface OnboardingRequest {
  accountType: 'INDIVIDUAL' | 'ORGANIZATION';
  individualDetails?: {
    brandName: string;
    niche: string;
    primaryGoal: string;
    contentThemes: string[];
    website?: string;
    instagramHandle?: string;
  };
  organizationDetails?: {
    name: string;
    teamSize: string;
    website?: string;
    industries: string[];
    primaryGoal: string;
    objective: string;
    description?: string;
  };
}

export interface AiGenerateRequest {
  prompt: string;
  workspaceId: string;
  tone?: string;
  type?: string;
}
