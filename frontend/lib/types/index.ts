// ── Core user / session types ────────────────────────────────────────────────

export type UserType = 'agency' | 'individual' | 'client';

export interface User {
  id: string;
  userId: string;
  userType: UserType;
  email: string;
  name: string;
}

// ── Organisation / account types ─────────────────────────────────────────────

export type AccountType = 'individual' | 'organization';

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  instagramConnected?: boolean;
  instagramUsername?: string;
  workspaceIds?: string[];
  status?: 'active' | 'pending';
}

// ── Workspace types ───────────────────────────────────────────────────────────

export interface Schedule {
  id: string;
  workspaceId?: string;
  platform?: string;
  dayOfWeek?: string;
  time?: string;
  contentType?: string;
  label?: string;
  datetime?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  publishAsDraft?: boolean;
  enabled?: boolean;
  nextRun?: string;
}

export interface Workspace {
  id: string;
  name: string;
  website?: string;
  description?: string;
  industry?: string;
  targetAudience?: string;
  brandVoice?: string;
  logoUrl?: string;
  brandAsset?: string;
  schedules: Schedule[];
  ownerId?: string;
  tone?: 'professional' | 'friendly' | 'witty' | 'bold' | 'empathetic' | 'casual' | 'energetic' | 'formal';
  keywords?: string[];
  rules?: string[];
}

// ── Client types ─────────────────────────────────────────────────────────────

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
  workspaceIds?: string[];
  status: 'active' | 'pending' | 'inactive' | 'expired';
  role?: string;
  password?: string;
  plan?: string;
  expiresAt?: string;
}

export interface MockEmail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  workspaceId?: string;
  to?: string;
  body?: string;
  timestamp?: string;
  inviteLink?: string;
}

// ── Campaign / Draft types ────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  workspaceId: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'sent';
  platform?: string;
  createdAt?: string;
  scheduledAt?: string;
  brief?: string;
  sentAt?: string;
  journalists?: string[];
  stats?: { opens: number; clicks: number; replies: number };
}

export interface DraftHistoryEntry {
  version: number;
  timestamp: string;
  action: string;
  caption?: string;
  liCaption?: string;
  feedback?: string;
  hashtags?: string[];
  imageBrief?: string;
  liHashtags?: string[];
  liImageBrief?: string;
  imageUrl?: string;
}

export interface Draft {
  id: string;
  workspaceId: string;
  title?: string;
  content?: string;
  platform?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';
  createdAt?: string;
  scheduledAt?: string;
  caption?: string;
  hashtags?: string[];
  imageBrief?: string;
  imageUrl?: string;
  prompt: string;
  version?: number;
  liImageBrief?: string;
  liCaption?: string;
  liHashtags?: string[];
  history?: DraftHistoryEntry[];
  // Content editor extras
  referenceUrls?: string[];
  referenceText?: string;
  goal?: string;
  cta?: string;
  visualStyle?: string;
}

// ── Journalist / mention types ────────────────────────────────────────────────

export interface Journalist {
  id: string;
  name: string;
  email: string;
  publication: string;
  beat: string;
  twitter?: string;
  linkedin?: string;
  city?: string;
  tier?: string;
}

export interface Mention {
  id: string;
  workspaceId: string;
  source: string;
  title: string;
  url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  publishedAt: string;
  platform?: string;
  author?: string;
  content?: string;
}

// ── Application state ─────────────────────────────────────────────────────────

export interface AppState {
  // Session / user
  currentUserId: string;
  currentUserType: UserType;
  currentUserEmail: string;
  currentUserName: string;

  // Organisation
  accountType: AccountType;
  organizationName: string;
  orgUsers: OrgUser[];

  // Onboarding
  onboardingStep: number;
  onboardingCompleted: boolean;
  currentStep?: number;
  individualNiche?: string;
  individualGoal?: string;
  individualThemes?: string[];
  individualWebsite?: string;
  organizationTeamSize?: string;
  organizationWebsite?: string;
  organizationIndustries?: string[];
  organizationIndustryCustom?: string;
  organizationObjective?: string;
  organizationObjectiveCustom?: string;
  organizationDescription?: string;
  individualInstagramConnected?: boolean;
  individualInstagramUsername?: string;
  connectedAccounts?: { instagram?: boolean; linkedin?: boolean };
  kycDetails?: {
    fullName?: string;
    phoneNumber?: string;
    dob?: string;
    idType?: string;
    companyName?: string;
    businessType?: string;
    taxId?: string;
    businessAddress?: string;
    contactPerson?: string;
    uploadedFile?: string;
  };

  // Active workspace
  activeWorkspaceId: string | null;
  activeClientId?: string | null;

  // Data collections
  workspaces: Workspace[];
  clients: ClientUser[];
  campaigns: Campaign[];
  drafts: Draft[];
  mentions: Mention[];
  mockInbox: MockEmail[];
  connectedChannels: Array<{ id: string; name: string; platform: string }>;

  // Brand / voice
  brandVoice?: string;
  targetAudience?: string;
  industry?: string;
}
