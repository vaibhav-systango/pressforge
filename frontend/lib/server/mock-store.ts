/**
 * In-memory mock data store for the Next.js API routes.
 *
 * All data lives in module-level Maps so it persists across requests within a
 * single server process (dev mode). In production you would replace this with
 * real database calls.
 */

import { INITIAL_STATE } from '@/lib/data/mock-data';
import type {
  AppState,
  Campaign,
  ClientUser,
  Draft,
  Schedule,
  Workspace,
} from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredUser {
  userId: string;
  userType: string;
  email: string;
  name: string;
  passwordHash?: string; // plain-text for demo purposes
}

interface Session {
  userId: string;
  user: StoredUser;
  state: AppState;
  refreshTokenId: string | null;
  backendAccessToken?: string;
}

// ── Seed users ────────────────────────────────────────────────────────────────

const SEED_USERS: StoredUser[] = [
  {
    userId: 'user-alex',
    userType: 'agency',
    email: 'alex@pressforge.ai',
    name: 'Alex Johnson',
    passwordHash: 'password123',
  },
  {
    userId: 'user-jane',
    userType: 'individual',
    email: 'jane@pressforge.ai',
    name: 'Jane Smith',
    passwordHash: 'password123',
  },
  {
    userId: 'user-alice',
    userType: 'client',
    email: 'alice@acmebrand.com',
    name: 'Alice Martin',
    passwordHash: 'password123',
  },
  {
    userId: 'user-bob',
    userType: 'client',
    email: 'bob@ecolifeco.com',
    name: 'Bob Lee',
    passwordHash: 'password123',
  },
];

// ── Module-level stores ───────────────────────────────────────────────────────

const userStore = new Map<string, StoredUser>(SEED_USERS.map((u) => [u.email, u]));
const sessionStore = new Map<string, Session>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val)) as T;
}

function buildInitialState(user: StoredUser): AppState {
  return deepClone({
    ...INITIAL_STATE,
    currentUserId: user.userId,
    currentUserType: user.userType as AppState['currentUserType'],
    currentUserEmail: user.email,
    currentUserName: user.name,
    onboardingCompleted: user.userType === 'client',
  });
}

function buildFreshUserState(user: StoredUser): AppState {
  return deepClone({
    ...INITIAL_STATE,
    currentUserId: user.userId,
    currentUserType: user.userType as AppState['currentUserType'],
    currentUserEmail: user.email,
    currentUserName: user.name,
    organizationName: '',
    orgUsers: [],
    onboardingStep: 0,
    onboardingCompleted: false,
    activeWorkspaceId: null,
    activeClientId: null,
    workspaces: [],
    clients: [],
    campaigns: [],
    drafts: [],
    mentions: [],
    mockInbox: [],
    connectedChannels: [],
    connectedAccounts: { instagram: false, linkedin: false },
  });
}

// ── Session management ────────────────────────────────────────────────────────

export function createSession(
  sessionId: string,
  user?: { userId: string; userType: string; email: string; name?: string },
): void {
  const finalUser = user || Array.from(userStore.values()).find(u => u.userId === sessionId) || {
    userId: sessionId,
    userType: 'individual',
    email: `${sessionId}@example.com`,
    name: sessionId,
  };

  const storedUser: StoredUser = {
    userId: finalUser.userId,
    userType: finalUser.userType,
    email: finalUser.email,
    name: finalUser.name ?? finalUser.email,
  };

  sessionStore.set(sessionId, {
    userId: finalUser.userId,
    user: storedUser,
    state: buildInitialState(storedUser),
    refreshTokenId: null,
  });
}

/** Create a blank session for backend-authenticated users if one does not exist yet. */
export function ensureSession(
  sessionId: string,
  user: { userId: string; userType: string; email: string; name?: string },
): AppState {
  if (!sessionStore.has(sessionId)) {
    const storedUser: StoredUser = {
      userId: user.userId,
      userType: user.userType,
      email: user.email,
      name: user.name ?? user.email,
    };

    sessionStore.set(sessionId, {
      userId: user.userId,
      user: storedUser,
      state: buildFreshUserState(storedUser),
      refreshTokenId: null,
    });
  }

  return sessionStore.get(sessionId)!.state;
}

/** Create or return an anonymous individual guest session. */
export function ensureGuestSession(sessionId: string): AppState {
  if (!sessionStore.has(sessionId)) {
    const storedUser: StoredUser = {
      userId: sessionId,
      userType: 'individual',
      email: '',
      name: 'Guest',
    };

    sessionStore.set(sessionId, {
      userId: sessionId,
      user: storedUser,
      state: {
        ...buildFreshUserState(storedUser),
        accountType: 'individual',
        currentUserType: 'individual',
      },
      refreshTokenId: null,
    });
  }

  return sessionStore.get(sessionId)!.state;
}

export { sessionStore };

export function setRefreshTokenId(sessionId: string, tokenId: string): void {
  const session = sessionStore.get(sessionId);
  if (session) session.refreshTokenId = tokenId;
}

export function validateRefreshToken(sessionId: string, tokenId: string): boolean {
  const session = sessionStore.get(sessionId);
  return session?.refreshTokenId === tokenId;
}

export function clearRefreshToken(sessionId: string): void {
  const session = sessionStore.get(sessionId);
  if (session) session.refreshTokenId = null;
}

export function logoutUser(sessionId: string): void {
  sessionStore.delete(sessionId);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function loginUser(
  sessionId: string,
  email: string,
  password: string,
): StoredUser | null {
  const user = userStore.get(email);
  if (!user || user.passwordHash !== password) return null;
  createSession(sessionId, user);
  return user;
}

// ── State access ──────────────────────────────────────────────────────────────

export function getSessionState(sessionId: string): AppState {
  const session = sessionStore.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  return session.state;
}

export function updateSession(
  sessionId: string,
  mergeOrFn: Partial<AppState> | ((prev: AppState) => AppState),
): AppState {
  const session = sessionStore.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  if (typeof mergeOrFn === 'function') {
    session.state = mergeOrFn(session.state);
  } else {
    session.state = { ...session.state, ...mergeOrFn };
  }

  return session.state;
}

export function resetSession(sessionId: string): AppState {
  const session = sessionStore.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  session.state = buildInitialState(session.user);
  return session.state;
}

export function getMe(sessionId: string): { user: StoredUser; state: AppState } {
  const session = sessionStore.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  return { user: session.user, state: session.state };
}

// ── Clients ───────────────────────────────────────────────────────────────────

export function addClient(sessionId: string, client: ClientUser): ClientUser {
  const state = getSessionState(sessionId);
  const newClient = { ...client, id: client.id || `client-${Date.now()}` };
  updateSession(sessionId, { clients: [...state.clients, newClient] });
  return newClient;
}

export function updateClient(sessionId: string, client: ClientUser): ClientUser {
  const state = getSessionState(sessionId);
  const clients = state.clients.map((c) => (c.id === client.id ? client : c));
  updateSession(sessionId, { clients });
  return client;
}

export function deleteClient(sessionId: string, clientId: string): void {
  const state = getSessionState(sessionId);
  updateSession(sessionId, { clients: state.clients.filter((c) => c.id !== clientId) });
}

export function inviteClient(
  sessionId: string,
  name: string,
  email: string,
  workspaceId: string,
): { inviteUrl: string; client: ClientUser } {
  const password = Math.random().toString(36).slice(2, 10);
  const newUser: StoredUser = {
    userId: `client-${Date.now()}`,
    userType: 'client',
    email,
    name,
    passwordHash: password,
  };
  userStore.set(email, newUser);

  const client: ClientUser = {
    id: newUser.userId,
    name,
    email,
    workspaceId,
    status: 'pending',
  };
  addClient(sessionId, client);

  const inviteUrl = `/auth/accept-invite?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&workspaceId=${encodeURIComponent(workspaceId)}`;
  return { inviteUrl, client };
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export function addCampaign(sessionId: string, campaign: Omit<Campaign, 'id'>): Campaign {
  const state = getSessionState(sessionId);
  const newCampaign: Campaign = { ...campaign, id: `camp-${Date.now()}` } as Campaign;
  updateSession(sessionId, { campaigns: [...state.campaigns, newCampaign] });
  return newCampaign;
}

export function updateCampaign(sessionId: string, campaign: Campaign): Campaign {
  const state = getSessionState(sessionId);
  const campaigns = state.campaigns.map((c) => (c.id === campaign.id ? campaign : c));
  updateSession(sessionId, { campaigns });
  return campaign;
}

// ── Drafts ────────────────────────────────────────────────────────────────────

export function addDraft(sessionId: string, draft: Omit<Draft, 'id'>): Draft {
  const state = getSessionState(sessionId);
  const newDraft: Draft = { ...draft, id: `draft-${Date.now()}` } as Draft;
  updateSession(sessionId, { drafts: [...state.drafts, newDraft] });
  return newDraft;
}

export function getDraft(sessionId: string, id: string): Draft | undefined {
  const state = getSessionState(sessionId);
  return state.drafts.find((d) => d.id === id);
}

export function updateDraft(sessionId: string, draft: Draft): Draft {
  const state = getSessionState(sessionId);
  const drafts = state.drafts.map((d) => (d.id === draft.id ? draft : d));
  updateSession(sessionId, { drafts });
  return draft;
}

// ── Workspaces ────────────────────────────────────────────────────────────────

export function addWorkspace(sessionId: string, workspace: Omit<Workspace, 'id'>): Workspace {
  const state = getSessionState(sessionId);
  const newWs: Workspace = { ...workspace, id: `ws-${Date.now()}`, schedules: [] };
  updateSession(sessionId, { workspaces: [...state.workspaces, newWs] });
  return newWs;
}

export function updateWorkspace(sessionId: string, workspace: Workspace): Workspace {
  const state = getSessionState(sessionId);
  const workspaces = state.workspaces.map((w) => (w.id === workspace.id ? workspace : w));
  updateSession(sessionId, { workspaces });
  return workspace;
}

export function deleteWorkspace(sessionId: string, workspaceId: string): void {
  const state = getSessionState(sessionId);
  updateSession(sessionId, {
    workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
    activeWorkspaceId:
      state.activeWorkspaceId === workspaceId
        ? (state.workspaces.find((w) => w.id !== workspaceId)?.id ?? null)
        : state.activeWorkspaceId,
  });
}

export function addWorkspaceSchedule(
  sessionId: string,
  workspaceId: string,
  schedule: Omit<Schedule, 'id'>,
): Schedule {
  const state = getSessionState(sessionId);
  const newSchedule: Schedule = { ...schedule, id: `sch-${Date.now()}`, workspaceId };
  const workspaces = state.workspaces.map((w) =>
    w.id === workspaceId ? { ...w, schedules: [...w.schedules, newSchedule] } : w,
  );
  updateSession(sessionId, { workspaces });
  return newSchedule;
}

export function updateWorkspaceSchedule(
  sessionId: string,
  workspaceId: string,
  schedule: Schedule,
): Schedule {
  const state = getSessionState(sessionId);
  const workspaces = state.workspaces.map((w) =>
    w.id === workspaceId
      ? { ...w, schedules: w.schedules.map((s) => (s.id === schedule.id ? schedule : s)) }
      : w,
  );
  updateSession(sessionId, { workspaces });
  return schedule;
}

export function deleteWorkspaceSchedule(
  sessionId: string,
  workspaceId: string,
  scheduleId: string,
): void {
  const state = getSessionState(sessionId);
  const workspaces = state.workspaces.map((w) =>
    w.id === workspaceId
      ? { ...w, schedules: w.schedules.filter((s) => s.id !== scheduleId) }
      : w,
  );
  updateSession(sessionId, { workspaces });
}

export function acceptOrganizationInvitation(
  sessionId: string,
  email: string,
  name: string,
  passwordHash: string
): StoredUser {
  const newUser: StoredUser = {
    userId: `org-user-${Date.now()}`,
    userType: 'agency',
    email,
    name,
    passwordHash,
  };
  userStore.set(email, newUser);

  try {
    const state = getSessionState(sessionId);
    const orgUsers = (state.orgUsers || []).map((u) =>
      u.email.toLowerCase() === email.toLowerCase() ? { ...u, status: 'active' as const } : u
    );
    updateSession(sessionId, { orgUsers });
  } catch (e) {
    // Session might not exist yet
  }

  return newUser;
}
