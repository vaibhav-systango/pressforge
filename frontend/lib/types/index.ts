export interface Schedule {
  id: string;
  label: string;
  datetime?: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  publishAsDraft: boolean;
  enabled: boolean;
  nextRun?: string;
}

export interface Workspace {
  id: string;
  name: string;
  website?: string;
  tone: string;
  keywords: string[];
  rules: string[];
  schedules: Schedule[];
}

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  workspaceId: string;
  status: 'pending' | 'active' | 'expired' | 'inactive';
  plan?: 'Basic' | 'Pro' | 'Enterprise';
  expiresAt?: string;
}

export interface MockEmail {
  id: string;
  from?: string;
  to?: string;
  subject?: string;
  preview?: string;
  time?: string;
  read?: boolean;
  body?: string;
  timestamp?: string;
  inviteLink?: string;
}

export interface AppState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  currentStep: number;
  orgUsers?: any[];
  connectedAccounts?: {
    instagram?: boolean;
    linkedin?: boolean;
  };
  clients: ClientUser[];
  mockInbox: MockEmail[];
  accountType: 'unassigned' | 'individual' | 'organization';
  currentUserType: 'client' | 'admin' | 'owner' | 'member' | 'user' | 'individual';
  individualBrandName?: string;
  individualNiche?: string;
  individualGoal?: string;
  individualThemes?: string[];
  individualWebsite?: string;
  individualInstagramConnected?: boolean;
  individualInstagramUsername?: string;
  organizationName?: string;
  organizationTeamSize?: string;
  organizationWebsite?: string;
  organizationIndustries?: string[];
  organizationIndustryCustom?: string;
  organizationObjective?: string;
  organizationObjectiveCustom?: string;
  organizationDescription?: string;
  onboardingCompleted?: boolean;
  currentUserName?: string;
  currentUserEmail?: string;
  currentUserRole?: string;
  activeClientId?: string | null;
  drafts: any[];
  mentions: any[];
  campaigns: any[];
  channels: any[];
  connectedChannels?: Array<{ id: string; name: string; platform: string }>;
}

export interface DraftHistoryEntry {
  version: number;
  timestamp: string;
  action: string;
  caption?: string;
  feedback?: string;
  hashtags?: string[];
  imageBrief?: string;
  liCaption?: string;
  liHashtags?: string[];
  liImageBrief?: string;
  imageUrl?: string;
}
