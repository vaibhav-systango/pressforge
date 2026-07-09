import type {
  AppState,
  Campaign,
  ClientUser,
  Draft,
  Journalist,
  Mention,
  MockEmail,
  OrgUser,
  Schedule,
  Workspace,
} from '@/lib/types';

// ── Journalists ───────────────────────────────────────────────────────────────

export const MOCK_JOURNALISTS: Journalist[] = [
  {
    id: 'j1',
    name: 'Sarah Chen',
    email: 'sarah.chen@techcrunch.com',
    publication: 'TechCrunch',
    beat: 'AI & Startups',
    twitter: '@sarahchen',
    linkedin: 'linkedin.com/in/sarahchen',
  },
  {
    id: 'j2',
    name: 'Marcus Williams',
    email: 'm.williams@forbes.com',
    publication: 'Forbes',
    beat: 'Business & Finance',
    twitter: '@marcuswforbes',
    linkedin: 'linkedin.com/in/marcuswilliams',
  },
  {
    id: 'j3',
    name: 'Priya Patel',
    email: 'priya@wired.com',
    publication: 'Wired',
    beat: 'Technology & Culture',
    twitter: '@priyapatel',
    linkedin: 'linkedin.com/in/priyapatel',
  },
  {
    id: 'j4',
    name: 'James O\'Connor',
    email: 'james@theguardian.com',
    publication: 'The Guardian',
    beat: 'Sustainability & Climate',
    twitter: '@jamesoconnor',
  },
  {
    id: 'j5',
    name: 'Aisha Johnson',
    email: 'aisha.j@bloomberg.com',
    publication: 'Bloomberg',
    beat: 'Markets & Fintech',
    linkedin: 'linkedin.com/in/aishajohnson',
  },
];

// ── AI output templates ────────────────────────────────────────────────────────

export const MOCK_AI_OUTPUTS = [
  {
    caption:
      'Transforming the way brands connect with their audience. Our latest campaign hit 2M impressions in just 48 hours. 🚀',
    hashtags: ['#BrandGrowth', '#DigitalMarketing', '#ContentStrategy', '#PR'],
    imageBrief: 'Clean white background with bold brand logo, upward trending graph overlay.',
  },
  {
    caption:
      'Behind every great brand is a story worth telling. What\'s yours? Let us help you craft it with precision and purpose.',
    hashtags: ['#Storytelling', '#BrandVoice', '#PRStrategy', '#ContentCreation'],
    imageBrief: 'Warm editorial photo of a diverse team collaborating around a whiteboard.',
  },
  {
    caption:
      'Data-driven. Human-led. Our AI-assisted PR approach delivers results that matter to your bottom line.',
    hashtags: ['#AIMarketing', '#DataDriven', '#PRResults', '#MarketingROI'],
    imageBrief: 'Futuristic dark background with glowing data visualisation elements.',
  },
];

// ── Seed data helpers ─────────────────────────────────────────────────────────

const SEED_WORKSPACES: Workspace[] = [
  {
    id: 'ws-acme',
    name: 'Acme Brand',
    website: 'https://acmebrand.com',
    industry: 'Consumer Goods',
    brandVoice: 'Bold and playful',
    schedules: [
      {
        id: 'sch-1',
        workspaceId: 'ws-acme',
        platform: 'instagram',
        dayOfWeek: 'Monday',
        time: '10:00',
        contentType: 'image',
      },
    ],
  },
  {
    id: 'ws-ecolife',
    name: 'EcoLife Co',
    website: 'https://ecolifeco.com',
    industry: 'Sustainability',
    brandVoice: 'Authentic and inspiring',
    schedules: [],
  },
];

const SEED_CLIENTS: ClientUser[] = [
  {
    id: 'client-1',
    name: 'Alice Martin',
    email: 'alice@acmebrand.com',
    workspaceId: 'ws-acme',
    status: 'active',
    role: 'Brand Manager',
  },
  {
    id: 'client-2',
    name: 'Bob Lee',
    email: 'bob@ecolifeco.com',
    workspaceId: 'ws-ecolife',
    status: 'active',
    role: 'PR Lead',
  },
];

const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    workspaceId: 'ws-acme',
    title: 'Summer Launch 2025',
    status: 'active',
    platform: 'instagram',
    createdAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
    scheduledAt: new Date(Date.now() + 3 * 86400_000).toISOString(),
  },
  {
    id: 'camp-2',
    workspaceId: 'ws-ecolife',
    title: 'Earth Day Campaign',
    status: 'draft',
    platform: 'linkedin',
    createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
  },
];

const SEED_DRAFTS: Draft[] = [
  {
    id: 'draft-1',
    workspaceId: 'ws-acme',
    title: 'Instagram Summer Post',
    content: 'Summer is here — and so is our hottest collection yet! 🌞',
    platform: 'instagram',
    status: 'approved',
    caption: 'Summer is here — and so is our hottest collection yet! 🌞',
    hashtags: ['#Summer2025', '#AcmeBrand', '#NewCollection'],
    createdAt: new Date(Date.now() - 4 * 86400_000).toISOString(),
    scheduledAt: new Date(Date.now() + 1 * 86400_000).toISOString(),
    prompt: 'Instagram Summer Post',
    version: 1,
  },
  {
    id: 'draft-2',
    workspaceId: 'ws-acme',
    title: 'LinkedIn Thought Leadership',
    content: 'Sustainability isn\'t a trend — it\'s the future of every brand.',
    platform: 'linkedin',
    status: 'pending_approval',
    createdAt: new Date(Date.now() - 1 * 86400_000).toISOString(),
    prompt: 'LinkedIn Thought Leadership',
    version: 1,
  },
];

const SEED_MENTIONS: Mention[] = [
  {
    id: 'mention-1',
    workspaceId: 'ws-acme',
    source: 'TechCrunch',
    title: 'Acme Brand disrupts the consumer goods market',
    url: 'https://techcrunch.com',
    sentiment: 'positive',
    publishedAt: new Date(Date.now() - 1 * 86400_000).toISOString(),
  },
  {
    id: 'mention-2',
    workspaceId: 'ws-ecolife',
    source: 'The Guardian',
    title: 'EcoLife Co leads the charge on sustainable packaging',
    url: 'https://theguardian.com',
    sentiment: 'positive',
    publishedAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
  },
];

const SEED_INBOX: MockEmail[] = [
  {
    id: 'email-1',
    from: 'sarah.chen@techcrunch.com',
    subject: 'Follow-up on your latest campaign',
    preview: 'Hi, I saw your recent announcement and would love to...',
    time: '2h ago',
    read: false,
    workspaceId: 'ws-acme',
  },
  {
    id: 'email-2',
    from: 'press@forbes.com',
    subject: 'Interview request — Acme Brand founder',
    preview: 'We\'re putting together a feature on up-and-coming consumer brands...',
    time: '1d ago',
    read: true,
    workspaceId: 'ws-acme',
  },
];

const SEED_ORG_USERS: OrgUser[] = [
  { id: 'org-user-1', name: 'Alex Johnson', email: 'alex@pressforge.ai', role: 'owner' },
  { id: 'org-user-2', name: 'Jane Smith', email: 'jane@pressforge.ai', role: 'admin' },
];

// ── Initial application state ─────────────────────────────────────────────────

export const INITIAL_STATE: AppState = {
  currentUserId: '',
  currentUserType: 'agency',
  currentUserEmail: '',
  currentUserName: '',

  accountType: 'organization',
  organizationName: 'Forge Agencies',
  orgUsers: SEED_ORG_USERS,

  onboardingStep: 0,
  onboardingCompleted: false,

  activeWorkspaceId: SEED_WORKSPACES[0].id,
  activeClientId: null,

  workspaces: SEED_WORKSPACES,
  clients: SEED_CLIENTS,
  campaigns: SEED_CAMPAIGNS,
  drafts: SEED_DRAFTS,
  mentions: SEED_MENTIONS,
  mockInbox: SEED_INBOX,
  connectedChannels: [
    { id: 'ch-1', name: 'Acme Instagram', platform: 'instagram' },
    { id: 'ch-2', name: 'Acme LinkedIn', platform: 'linkedin' },
  ],
};

export type { ClientUser, MockEmail, Workspace, Schedule } from '@/lib/types';
