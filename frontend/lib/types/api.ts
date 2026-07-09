// HTTP request/response shapes used by Next.js API routes and client hooks

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name?: string;
  fullName?: string;
  email: string;
  password: string;
}

export interface AuthUserResponse {
  id: string;
  userId: string;
  userType: 'agency' | 'individual' | 'client';
  email: string;
  name: string;
  onboardingStatus?: string;
  accountType?: string;
  organizationId?: string | null;
}

export function authUserToMeQueryUser(user: AuthUserResponse) {
  return {
    userId: user.userId ?? user.id,
    userType: user.userType,
    email: user.email,
    name: user.name,
    onboardingStatus: user.onboardingStatus,
    accountType: user.accountType,
    organizationId: user.organizationId ?? null,
  };
}

export interface LoginResponse {
  user: AuthUserResponse;
  expiresIn: number;
}

export interface SignupResponse {
  user: AuthUserResponse;
  expiresIn: number;
}

export interface BackendUserResponse {
  id: string;
  fullName: string;
  email: string;
  accountType: string;
  onboardingStatus: string;
  isActive: boolean;
  lastLogin: number | null;
  createdAt: number;
  updatedAt: number;
  organizationId?: string | null;
  organizationRole?: string | null;
}

export interface BackendTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: BackendUserResponse;
  organizationId?: string | null;
}

export interface AiGenerateRequest {
  prompt: string;
  workspaceId?: string;
  platform?: string;
  tone?: string;
}

export interface InviteUserRequest {
  email: string;
  fullName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'CLIENT';
}

export interface InviteUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  expiresAt: number;
  createdAt: number;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
}

export interface AcceptInvitationResponse {
  user: AuthUserResponse;
  expiresIn: number;
}

export interface IndividualOnboardingDetails {
  primaryGoal: string;
  contentThemes: string[];
  website?: string | null;
}

export interface OrganizationOnboardingDetails {
  name: string;
  website?: string | null;
  teamSize?: string | null;
  industries: string[];
  primaryGoal: string;
  objective?: string | null;
  description?: string | null;
  legalName: string;
  businessEntityType: string;
  taxIdentificationNumber: string;
  registeredAddress: string;
  primaryContactName: string;
  primaryContactDesignation?: string | null;
  businessDocumentFileKey?: string | null;
}

export interface OnboardingRequest {
  accountType: 'INDIVIDUAL' | 'ORGANIZATION';
  individualDetails?: IndividualOnboardingDetails | null;
  organizationDetails?: OrganizationOnboardingDetails | null;
}

export interface OnboardingResponse {
  user: BackendUserResponse;
}
