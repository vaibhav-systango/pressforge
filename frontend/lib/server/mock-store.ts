import type { AppState, Workspace, ClientUser, MockEmail, Schedule } from '../types';

interface SessionData {
  state: AppState;
  refreshTokenId?: string;
  user: {
    userId: string;
    userType: string;
    email: string;
    name: string;
  };
}

const sessions = new Map<string, SessionData>();

function createDefaultState(info: { userId: string; userType: string; email: string; name: string }): AppState {
  return {
    workspaces: [
      {
        id: 'workspace-default',
        name: 'Default Brand',
        website: 'https://example.com',
        tone: 'professional',
        keywords: ['press', 'news'],
        rules: ['Write clearly and concisely.'],
        schedules: [],
      },
    ],
    activeWorkspaceId: 'workspace-default',
    currentStep: 1,
    orgUsers: [
      { id: info.userId, name: info.name, email: info.email, instagramConnected: false, instagramUsername: '' }
    ],
    connectedAccounts: { instagram: false, linkedin: false },
    clients: [],
    mockInbox: [],
    accountType: 'unassigned',
    currentUserType: info.userType as any,
    drafts: [],
    mentions: [],
    campaigns: [],
    channels: [],
  };
}

export function ensureSession(
  sessionId: string,
  info: { userId: string; userType: string; email: string; name: string }
): AppState {
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      state: createDefaultState(info),
      user: info,
    };
    sessions.set(sessionId, session);
  }
  return session.state;
}

export function createSession(userId: string): void {
  ensureSession(userId, {
    userId,
    userType: 'owner',
    email: `${userId.toLowerCase()}@example.com`,
    name: userId,
  });
}

export function getSessionState(sessionId: string): AppState {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  return session.state;
}

export function resetSession(sessionId: string): AppState {
  const session = sessions.get(sessionId);
  if (session) {
    session.state = createDefaultState(session.user);
  }
  return session?.state || createDefaultState({ userId: '', userType: 'user', email: '', name: '' });
}

export function updateSession(
  sessionId: string,
  updates: Partial<AppState> | ((prev: AppState) => AppState)
): AppState {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  if (typeof updates === 'function') {
    session.state = updates(session.state);
  } else {
    session.state = {
      ...session.state,
      ...updates,
    };
  }
  return session.state;
}

export function getMe(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  return {
    user: session.user,
  };
}

export function setRefreshTokenId(sessionId: string, tokenId: string) {
  const session = sessions.get(sessionId);
  if (session) {
    session.refreshTokenId = tokenId;
  }
}

export function validateRefreshToken(sessionId: string, tokenId: string): boolean {
  const session = sessions.get(sessionId);
  return session?.refreshTokenId === tokenId;
}

export function clearRefreshToken(sessionId: string) {
  const session = sessions.get(sessionId);
  if (session) {
    delete session.refreshTokenId;
  }
}

export function logoutUser(sessionId: string) {
  sessions.delete(sessionId);
}

export function addWorkspace(sessionId: string, workspace: Workspace): AppState {
  const state = getSessionState(sessionId);
  state.workspaces.push(workspace);
  state.activeWorkspaceId = workspace.id;
  return state;
}

export function deleteWorkspace(sessionId: string, id: string): AppState {
  const state = getSessionState(sessionId);
  state.workspaces = state.workspaces.filter((w) => w.id !== id);
  if (state.activeWorkspaceId === id) {
    state.activeWorkspaceId = state.workspaces[0]?.id || null;
  }
  return state;
}

export function updateWorkspace(sessionId: string, workspace: Workspace): Workspace {
  const state = getSessionState(sessionId);
  const idx = state.workspaces.findIndex((w) => w.id === workspace.id);
  if (idx !== -1) {
    state.workspaces[idx] = workspace;
  }
  return workspace;
}

export function addWorkspaceSchedule(sessionId: string, workspaceId: string, schedule: Schedule): Schedule {
  const state = getSessionState(sessionId);
  const ws = state.workspaces.find((w) => w.id === workspaceId);
  if (ws) {
    if (!ws.schedules) ws.schedules = [];
    ws.schedules.push(schedule);
  }
  return schedule;
}

export function deleteWorkspaceSchedule(sessionId: string, workspaceId: string, scheduleId: string): void {
  const state = getSessionState(sessionId);
  const ws = state.workspaces.find((w) => w.id === workspaceId);
  if (ws && ws.schedules) {
    ws.schedules = ws.schedules.filter((s) => s.id !== scheduleId);
  }
}

export function updateWorkspaceSchedule(sessionId: string, workspaceId: string, schedule: Schedule): Schedule {
  const state = getSessionState(sessionId);
  const ws = state.workspaces.find((w) => w.id === workspaceId);
  if (ws && ws.schedules) {
    const idx = ws.schedules.findIndex((s) => s.id === schedule.id);
    if (idx !== -1) {
      ws.schedules[idx] = schedule;
    }
  }
  return schedule;
}

export function addClient(sessionId: string, client: ClientUser): ClientUser {
  const state = getSessionState(sessionId);
  if (!state.clients) state.clients = [];
  state.clients.push(client);
  return client;
}

export function deleteClient(sessionId: string, id: string): void {
  const state = getSessionState(sessionId);
  if (state.clients) {
    state.clients = state.clients.filter((c) => c.id !== id);
  }
}

export function updateClient(sessionId: string, client: ClientUser): ClientUser {
  const state = getSessionState(sessionId);
  if (state.clients) {
    const idx = state.clients.findIndex((c) => c.id === client.id);
    if (idx !== -1) {
      state.clients[idx] = client;
    }
  }
  return client;
}

export function inviteClient(sessionId: string, name: string, email: string, workspaceId: string) {
  const state = getSessionState(sessionId);
  const client: ClientUser = {
    id: `client-${Date.now()}`,
    name,
    email,
    workspaceId,
    status: 'pending',
    password: 'pass_' + Math.random().toString(36).substring(2, 6),
  };
  addClient(sessionId, client);

  const emailObj: MockEmail = {
    id: `email-${Date.now()}`,
    from: 'noreply@pressforge.ai',
    to: email,
    subject: `Invite: Join client portal for workspace`,
    preview: `Invitation to join on PressForge`,
    time: 'Just now',
    read: false,
    body: `Hi ${name},\n\nYou have been invited to review content briefs and approvals.\n\nYour login details are:\nEmail/Username: ${email}\nPassword: ${client.password}\n\nPlease accept the invitation and log in.`,
    timestamp: new Date().toISOString(),
    inviteLink: `/auth/accept-invite?email=${encodeURIComponent(email)}&password=${encodeURIComponent(client.password ?? '')}&workspaceId=${encodeURIComponent(workspaceId)}`,
  };

  if (!state.mockInbox) state.mockInbox = [];
  state.mockInbox.unshift(emailObj);

  return { client, email: emailObj };
}

export function loginUser(sessionId: string, email: string, password?: string) {
  for (const session of sessions.values()) {
    const client = session.state.clients.find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    );
    if (client) {
      const userInfo = {
        userId: client.id,
        userType: 'client',
        email: client.email,
        name: client.name,
      };
      
      const clientState = createDefaultState(userInfo);
      clientState.currentUserType = 'client';
      clientState.workspaces = session.state.workspaces.filter(w => w.id === client.workspaceId);
      clientState.activeWorkspaceId = client.workspaceId;
      clientState.clients = [client];
      
      sessions.set(sessionId, {
        state: clientState,
        user: userInfo,
      });

      return userInfo;
    }
  }

  const userInfo = {
    userId: `user-${Date.now()}`,
    userType: 'owner',
    email,
    name: email.split('@')[0],
  };

  sessions.set(sessionId, {
    state: createDefaultState(userInfo),
    user: userInfo,
  });

  return userInfo;
}

export function addDraft(sessionId: string, draft: any): any {
  const state = getSessionState(sessionId);
  if (!state.drafts) state.drafts = [];
  state.drafts.push(draft);
  return draft;
}

export function updateDraft(sessionId: string, draft: any): any {
  const state = getSessionState(sessionId);
  if (!state.drafts) state.drafts = [];
  const idx = state.drafts.findIndex((d) => d.id === draft.id);
  if (idx !== -1) {
    state.drafts[idx] = draft;
  }
  return draft;
}

export function getDraft(sessionId: string, id: string): any {
  const state = getSessionState(sessionId);
  if (!state.drafts) state.drafts = [];
  return state.drafts.find((d) => d.id === id);
}

export function addCampaign(sessionId: string, campaign: any): any {
  const state = getSessionState(sessionId);
  if (!state.campaigns) state.campaigns = [];
  state.campaigns.push(campaign);
  return campaign;
}

export function updateCampaign(sessionId: string, campaign: any): any {
  const state = getSessionState(sessionId);
  if (!state.campaigns) state.campaigns = [];
  const idx = state.campaigns.findIndex((c) => c.id === campaign.id);
  if (idx !== -1) {
    state.campaigns[idx] = campaign;
  }
  return campaign;
}
