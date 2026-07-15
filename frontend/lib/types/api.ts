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
  organizationName?: string | null;
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
    organizationName: user.organizationName ?? null,
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
  organizationName?: string | null;
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

export interface KycDocumentReference {
  publicId: string;
  secureUrl: string;
  resourceType?: string | null;
  format?: string | null;
  bytes?: number | null;
  originalFilename?: string | null;
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
  document: KycDocumentReference;
}

export interface OnboardingRequest {
  accountType: 'INDIVIDUAL' | 'ORGANIZATION';
  individualDetails?: IndividualOnboardingDetails | null;
  organizationDetails?: OrganizationOnboardingDetails | null;
}

export interface OnboardingResponse {
  user: BackendUserResponse;
}

export interface ScheduleResponse {
  id: string;
  workspaceId: string;
  platform?: string | null;
  dayOfWeek?: string | null;
  time?: string | null;
  contentType?: string | null;
  label?: string | null;
  datetime?: string | null;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | string;
  publishAsDraft?: boolean;
  enabled?: boolean;
  nextRun?: string | null;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  website?: string | null;
  description?: string | null;
  industry?: string | null;
  targetAudience?: string | null;
  brandVoice?: string | null;
  logoUrl?: string | null;
  tone?: string | null;
  keywords?: string[];
  rules?: string[];
  ownerId?: string | null;
  organizationId?: string | null;
  schedules?: ScheduleResponse[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceListResponse {
  workspaces: WorkspaceResponse[];
  activeWorkspaceId?: string | null;
}

export interface CreateWorkspaceRequest {
  name: string;
  website?: string | null;
  description?: string | null;
  industry?: string | null;
  targetAudience?: string | null;
  brandVoice?: string | null;
  logoUrl?: string | null;
  tone?: string | null;
  keywords?: string[];
  rules?: string[];
}

export type UpdateWorkspaceRequest = Partial<CreateWorkspaceRequest>;

export interface CreateScheduleRequest {
  platform?: string | null;
  dayOfWeek?: string | null;
  time?: string | null;
  contentType?: string | null;
  label?: string | null;
  datetime?: string | null;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | string;
  publishAsDraft?: boolean;
  enabled?: boolean;
  nextRun?: string | null;
}

export type UpdateScheduleRequest = Partial<CreateScheduleRequest>;

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

