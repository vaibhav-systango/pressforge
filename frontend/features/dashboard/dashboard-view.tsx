'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Select } from '@/components/common/select';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useLinkedInConnection, useInstagramConnection } from '@/lib/hooks/queries/use-social-connection';
import { useDashboardStats } from '@/lib/hooks/queries/use-dashboard-stats';
import { usePaginatedDrafts } from '@/lib/hooks/queries/use-paginated-drafts';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ArrowRight,
  Linkedin,
  Instagram,
  MessageSquare,
  AlertCircle,
  XCircle,
  Plus,
  ChevronRight,
  Building,
  Users,
  ShieldCheck,
} from 'lucide-react';

export function DashboardView() {
  const [timeframe, setTimeframe] = useState('Last 7 Days');
  const { state, isLoading: isAppStateLoading } = useAppState();
  const { user } = useAuth();
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats(timeframe);
  const {
    connection: linkedinConnection,
    accountName: linkedinAccountName,
    isLoading: isLinkedInLoading,
    isConnecting: isLinkedInConnecting,
    isDisconnecting: isLinkedInDisconnecting,
    connectLinkedIn,
    disconnectLinkedIn,
  } = useLinkedInConnection();

  const { counts: workspaceDraftCounts, drafts: backendPendingDrafts } = usePaginatedDrafts({
    workspaceId: state.activeWorkspaceId,
    status: 'pending_approval',
    limit: 10,
  });

  const {
    connection: instagramConnection,
    accountName: instagramAccountName,
    isLoading: isInstagramLoading,
    isConnecting: isInstagramConnecting,
    isDisconnecting: isInstagramDisconnecting,
    connectInstagram,
    disconnectInstagram,
  } = useInstagramConnection();

  const isLoading = isAppStateLoading || isStatsLoading;

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        <div className="h-32 rounded-3xl bg-bg-card border border-border-primary animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 rounded-2xl bg-bg-card border border-border-primary animate-pulse" />
          <div className="h-28 rounded-2xl bg-bg-card border border-border-primary animate-pulse" />
          <div className="h-28 rounded-2xl bg-bg-card border border-border-primary animate-pulse" />
          <div className="h-28 rounded-2xl bg-bg-card border border-border-primary animate-pulse" />
        </div>
        <div className="h-64 rounded-3xl bg-bg-card border border-border-primary animate-pulse" />
      </div>
    );
  }

  // Active workspace & client resolution
  const activeWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId) || state.workspaces[0];
  const linkedinConnected = linkedinConnection?.connected ?? state.connectedAccounts?.linkedin ?? false;
  const instagramConnected = instagramConnection?.connected ?? state.connectedAccounts?.instagram ?? false;

  // Role detection
  const userType = user?.userType || state.currentUserType || 'agency';
  const orgRole = (user?.organizationRole || state.orgUsers.find(u => u.email === user?.email)?.role || 'admin').toLowerCase();

  const isClient = userType === 'client';
  const isIndividual = userType === 'individual' || state.accountType === 'individual';
  const isMember = userType === 'agency' && orgRole === 'member';
  const isAdmin = userType === 'agency' && (orgRole === 'admin' || orgRole === 'owner');

  const currentClient = isClient ? state.clients.find(c => c.id === state.activeClientId || c.workspaceId === activeWorkspace?.id) : null;
  const clientName = currentClient ? currentClient.name : user?.name || 'Valued Client';

  // Determine accessible workspaces based on user role (Organization, Individual, Member, Client)
  const clientObj = isClient ? state.clients.find(c => c.id === state.activeClientId || c.workspaceId === activeWorkspace?.id) : null;
  const clientWsIds = clientObj?.workspaceIds || (clientObj?.workspaceId ? [clientObj.workspaceId] : []);
  
  const accessibleWorkspaces = isClient
    ? (clientWsIds.length > 0 ? state.workspaces.filter(w => clientWsIds.includes(w.id)) : state.workspaces)
    : state.workspaces;

  const accessibleWsIds = accessibleWorkspaces.map(w => w.id);

  // Aggregate drafts across all accessible workspaces for fallback
  const roleDrafts = state.drafts.filter((d) => accessibleWsIds.length > 0 ? accessibleWsIds.includes(d.workspaceId) : true);
  const drafts = roleDrafts.length > 0 ? roleDrafts : state.drafts;
  const clientPending = backendPendingDrafts.length > 0 ? backendPendingDrafts : drafts.filter((d) => d.status === 'pending_approval');
  const clientPendingCount = workspaceDraftCounts.pending;
  const clientApprovedCount = workspaceDraftCounts.approved;
  const clientRejectedCount = workspaceDraftCounts.rejected;

  // KPI Metrics from API stats endpoint
  const weeklyReach = stats.kpis.weeklyReach;
  const weeklyReachGrowth = stats.kpis.weeklyReachGrowth;
  const approvalRate = stats.kpis.approvalRate;
  const scheduledCount = stats.kpis.scheduledQueueCount;
  const pendingCount = stats.kpis.pendingReviewCount;

  // Health Score from API stats
  const healthScore = stats.healthScore.score;
  const healthLabel = stats.healthScore.label;
  const healthColor = stats.healthScore.color;
  const healthGaugeColor = stats.healthScore.gaugeColor;

  // Performance numbers from API
  const perfImpressions = stats.workspacePerformance.impressions;
  const perfEngagement = stats.workspacePerformance.engagementRate;
  const perfFollowers = stats.workspacePerformance.netFollowers;
  const perfReplies = stats.workspacePerformance.prReplies;

  // ───────────────────────────────────────────────────────────────────────────
  // ROLE 1: CLIENT PORTAL DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  if (isClient) {
    return (
      <div className="flex flex-col gap-8 animate-fade-in text-text-primary">
        {/* Welcome Block */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 border border-border-primary rounded-3xl p-8 text-text-primary shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#F58529]/15 to-[#DD2A7B]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] bg-instagram-pink/15 text-instagram-pink border border-instagram-pink/25 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Client Portal
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
              Welcome back, {clientName}!
            </h1>
            <p className="text-text-secondary text-sm max-w-xl">
              Collaborate and review content drafts for the <span className="font-semibold text-text-primary">{activeWorkspace?.name || 'Brand'}</span> workspace. Approve ready drafts, request revisions, or review scheduling.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/app/approvals"
            className="bg-bg-card border border-border-primary hover:border-yellow-400 p-5 rounded-2xl text-left transition flex flex-col justify-between group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">Awaiting Your Review</span>
              <AlertCircle className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition duration-150" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-text-primary">{clientPendingCount}</p>
              <span className="text-xs font-semibold text-instagram-pink flex items-center gap-0.5">
                Review Pending <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          <div className="bg-bg-card border border-border-primary p-5 rounded-2xl text-left shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">Scheduled & Approved</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-extrabold text-text-primary mt-4">{clientApprovedCount}</p>
          </div>

          <div className="bg-bg-card border border-border-primary p-5 rounded-2xl text-left shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">Revision Requests</span>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-extrabold text-text-primary mt-4">{clientRejectedCount}</p>
          </div>
        </div>

        {/* Workspace Performance Metrics from API */}
        <div className="bg-bg-card border border-border-primary rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-primary pb-3 mb-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-instagram-pink" />
              <span>Workspace Performance Metrics</span>
            </h3>
            <Link href="/app/analytics" className="text-xs font-semibold text-instagram-pink hover:underline">
              View Detailed Analytics
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bg-app/40 border border-border-primary rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Impressions</span>
              <p className="text-xl font-extrabold text-text-primary">{perfImpressions}</p>
              <span className="text-[9px] text-green-600 font-bold">+18.2% vs last month</span>
            </div>
            <div className="bg-bg-app/40 border border-border-primary rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Engagement Rate</span>
              <p className="text-xl font-extrabold text-text-primary">{perfEngagement}</p>
              <span className="text-[9px] text-green-600 font-bold">+0.4% industry avg</span>
            </div>
            <div className="bg-bg-app/40 border border-border-primary rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Net Followers</span>
              <p className="text-xl font-extrabold text-text-primary">{perfFollowers}</p>
              <span className="text-[9px] text-green-600 font-bold">+8.3% acceleration</span>
            </div>
            <div className="bg-bg-app/40 border border-border-primary rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">PR Target Replies</span>
              <p className="text-xl font-extrabold text-text-primary">{perfReplies}</p>
              <span className="text-[9px] text-text-secondary font-medium">From Tier-1 editors</span>
            </div>
          </div>
        </div>

        {/* Pending Approvals List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-instagram-pink" />
                <span>Pending Approvals Queue</span>
              </h3>
              <span className="text-xs text-text-secondary font-medium">Awaiting feedback</span>
            </div>

            <div className="flex flex-col gap-4">
              {clientPending.map((draft) => (
                <div
                  key={draft.id}
                  className="border border-border-primary rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-app/30 hover:bg-bg-hover transition duration-150"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white text-xs font-extrabold shrink-0 mt-0.5 shadow-sm">
                      {draft.prompt.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-text-primary truncate">{draft.prompt}</h4>
                        <span className="text-[10px] text-text-secondary font-semibold shrink-0">v{draft.version || 1}.0</span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{draft.caption}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <Instagram className="w-3.5 h-3.5 text-instagram-pink" />
                        <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center self-end sm:self-center">
                    <Link
                      href={`/app/approvals/${draft.id}`}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-[#F58529] to-[#DD2A7B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-95 transition shadow-xs whitespace-nowrap cursor-pointer"
                    >
                      <span>Review & Approve</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </Link>
                  </div>
                </div>
              ))}

              {clientPending.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/20 text-green-500 border border-green-100 dark:border-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">All Caught Up!</h4>
                  <p className="text-xs text-text-secondary max-w-xs mx-auto">
                    There are no posts awaiting your review right now. We will notify you when new drafts are ready.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-between justify-between border-b border-border-primary pb-2.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Workspace Profile</h3>
                <Link href="/app/workspaces" className="text-[11px] text-instagram-pink font-semibold hover:underline">
                  View Details
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-secondary font-bold uppercase">Writing Tone</span>
                  <p className="font-semibold text-text-primary capitalize">{activeWorkspace?.tone || activeWorkspace?.brandVoice || 'Professional'}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-secondary font-bold uppercase">Brand Keywords</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(activeWorkspace?.keywords || ['brand', 'marketing', 'growth']).map((kw) => (
                      <span key={kw} className="bg-bg-app border border-border-primary text-text-primary px-2 py-0.5 rounded text-[10px] font-medium">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Channels */}
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-text-primary">Social Channels</h3>
              <div className="space-y-3">
                {/* Instagram */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm border-b border-border-primary pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Instagram className="w-4 h-4 text-instagram-pink shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-text-primary block truncate">Instagram</span>
                      {instagramConnected && instagramAccountName && (
                        <span className="text-xs text-text-secondary block truncate">
                          {instagramAccountName}
                        </span>
                      )}
                    </div>
                  </div>
                  {instagramConnected ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-2.5 py-1 rounded-full whitespace-nowrap">
                        Connected
                      </span>
                      <button
                        type="button"
                        onClick={() => disconnectInstagram()}
                        disabled={isInstagramLoading || isInstagramDisconnecting}
                        className="text-xs font-bold text-red-500 hover:text-red-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        {isInstagramDisconnecting ? '...' : 'Disconnect'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connectInstagram('/app')}
                      disabled={isInstagramLoading || isInstagramConnecting}
                      className="bg-instagram-pink hover:opacity-90 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isInstagramConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Linkedin className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-text-primary block truncate">LinkedIn</span>
                      {linkedinConnected && linkedinAccountName && (
                        <span className="text-xs text-text-secondary block truncate">
                          {linkedinAccountName}
                        </span>
                      )}
                    </div>
                  </div>
                  {linkedinConnected ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-2.5 py-1 rounded-full whitespace-nowrap">
                        Connected
                      </span>
                      <button
                        type="button"
                        onClick={() => disconnectLinkedIn()}
                        disabled={isLinkedInLoading || isLinkedInDisconnecting}
                        className="text-xs font-bold text-red-500 hover:text-red-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        {isLinkedInDisconnecting ? '...' : 'Disconnect'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connectLinkedIn('/app')}
                      disabled={isLinkedInLoading || isLinkedInConnecting}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isLinkedInConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ROLE 2: MEMBER DASHBOARD (Agency Team Member)
  // ───────────────────────────────────────────────────────────────────────────
  if (isMember) {
    return (
      <div className="flex flex-col gap-8 animate-fade-in text-text-primary">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold uppercase">
                Team Member View
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Welcome Back, {user?.name || 'Team Member'}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Content operations & draft management for workspace <span className="font-semibold text-text-primary">{activeWorkspace?.name}</span>.
            </p>
          </div>
          <Link
            href="/app/content/new"
            className="bg-gradient-to-r from-[#F58529] to-[#DD2A7B] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 hover:opacity-95 transition cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Draft</span>
          </Link>
        </div>

        {/* Member KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-text-secondary uppercase">Assigned Drafts</span>
            <p className="text-3xl font-extrabold text-text-primary mt-3">{drafts.length}</p>
            <p className="text-xs text-text-secondary mt-1">Total in {activeWorkspace?.name}</p>
          </div>
          <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-text-secondary uppercase">Awaiting Action</span>
            <p className="text-3xl font-extrabold text-yellow-600 mt-3">{pendingCount}</p>
            <p className="text-xs text-text-secondary mt-1">Pending client review</p>
          </div>
          <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-text-secondary uppercase">Approved Posts</span>
            <p className="text-3xl font-extrabold text-green-600 mt-3">{scheduledCount}</p>
            <p className="text-xs text-text-secondary mt-1">Ready for publication</p>
          </div>
          <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-text-secondary uppercase">Approval Rate</span>
            <p className="text-3xl font-extrabold text-text-primary mt-3">{approvalRate}%</p>
            <p className="text-xs text-text-secondary mt-1">Client accept ratio</p>
          </div>
        </div>

        {/* Chart + Recent Drafts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text-primary">Engagement Trend</h3>
                <p className="text-xs text-text-secondary">Workspace reach velocity (API Data)</p>
              </div>
              <Select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                options={['Last 7 Days', 'Last 30 Days']}
                className="py-1 px-2.5 text-xs font-semibold"
                containerClassName="w-36"
              />
            </div>
            <div className="w-full h-56 flex items-end">
              <svg viewBox="0 0 500 200" className="w-full h-full">
                <line x1="0" y1="50" x2="500" y2="50" stroke="#F1F1F1" strokeWidth="1" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#F1F1F1" strokeWidth="1" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#F1F1F1" strokeWidth="1" />
                <path
                  d={stats.chartData.svgPath}
                  fill="none"
                  stroke="url(#igGradMember)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="igGradMember" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F58529" />
                    <stop offset="50%" stopColor="#DD2A7B" />
                    <stop offset="100%" stopColor="#515BD4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-text-primary">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/app/content/new"
                className="w-full flex items-center justify-between p-3.5 border border-border-primary rounded-xl hover:border-instagram-pink transition group"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-instagram-pink" />
                  <div>
                    <p className="text-xs font-bold text-text-primary">Create AI Content Brief</p>
                    <p className="text-[10px] text-text-secondary">Generate brand-tuned drafts</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-text-secondary group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/app/approvals"
                className="w-full flex items-center justify-between p-3.5 border border-border-primary rounded-xl hover:border-yellow-500 transition group"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-xs font-bold text-text-primary">Check Approvals Queue</p>
                    <p className="text-[10px] text-text-secondary">{pendingCount} drafts pending</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-text-secondary group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* Drafts List */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary">Recent Content Drafts</h3>
            <Link href="/app/content" className="text-xs font-semibold text-instagram-pink hover:underline">
              View All Drafts
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {drafts.slice(0, 5).map((draft) => (
              <div
                key={draft.id}
                className="border border-border-primary p-4 rounded-xl flex items-center justify-between hover:bg-bg-app transition duration-150"
              >
                <div className="flex flex-col gap-1 pr-4 truncate">
                  <p className="text-sm font-semibold text-text-primary truncate">{draft.prompt}</p>
                  <p className="text-xs text-text-secondary truncate max-w-lg">{draft.caption}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    draft.status === 'approved'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : draft.status === 'pending_approval'
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      : 'bg-bg-app text-text-secondary'
                  }`}>
                    {draft.status.replace('_', ' ')}
                  </span>
                  <Link href={`/app/content/${draft.id}`} className="text-xs font-bold text-text-secondary hover:text-text-primary p-1">
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ROLE 3: ADMIN DASHBOARD (Agency Owner / Admin)
  // ───────────────────────────────────────────────────────────────────────────
  const displayOrgName = user?.organizationName || state.organizationName || user?.name || "Forge Agencies";

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-text-primary">
      {/* Welcome Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Welcome Back, {displayOrgName}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Executive status report for the <span className="font-semibold text-text-primary">{activeWorkspace?.name || 'Active'}</span> workspace (Powered by API Engine).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-bg-card border border-border-primary rounded-full px-3 py-1.5 font-medium shadow-sm self-start md:self-auto">
          <Clock className="w-3.5 h-3.5" />
          <span>Last API sync: Live</span>
        </div>
      </div>

      {/* Grid: KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Reach */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">Weekly Reach</span>
            <span className="text-green-500 text-xs font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> {weeklyReachGrowth}
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary mt-4">{weeklyReach}</p>
          <p className="text-xs text-text-secondary mt-2">Organic impressions across channels</p>
        </div>

        {/* KPI 2: Approvals */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">Approval Rate</span>
            <span className="text-text-secondary text-[10px] bg-bg-app px-1.5 py-0.5 rounded-full font-medium">API Metric</span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary mt-4">{approvalRate}%</p>
          <p className="text-xs text-text-secondary mt-2">Ratio of drafts approved by client</p>
        </div>

        {/* KPI 3: Scheduled Queue */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">Scheduled Queue</span>
            <Calendar className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-3xl font-extrabold text-text-primary mt-4">{scheduledCount}</p>
          <p className="text-xs text-text-secondary mt-2">Approved posts ready to publish</p>
        </div>

        {/* KPI 4: Pending Review */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">Awaiting Client</span>
            {pendingCount > 0 ? (
              <span className="bg-pink-100 text-instagram-pink text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Action Required
              </span>
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>
          <p className="text-3xl font-extrabold text-text-primary mt-4">{pendingCount}</p>
          <p className="text-xs text-text-secondary mt-2">Pending client review</p>
        </div>
      </div>

      {/* Grid: Charts & Client Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Widget: Engagement Chart */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-text-primary">Weekly Engagement Trend</h3>
              <p className="text-xs text-text-secondary">Likes, shares, and interactions (API calculated)</p>
            </div>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              options={['Last 7 Days', 'Last 30 Days']}
              className="py-1 px-2.5 text-xs font-semibold"
              containerClassName="w-36"
            />
          </div>

          {/* SVG Line Graph */}
          <div className="w-full h-56 flex items-end">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              <line x1="0" y1="50" x2="500" y2="50" stroke="#F1F1F1" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#F1F1F1" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#F1F1F1" strokeWidth="1" />
              <path
                d={stats.chartData.svgPath}
                fill="none"
                stroke="url(#igGradAdmin)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="igGradAdmin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F58529" />
                  <stop offset="50%" stopColor="#DD2A7B" />
                  <stop offset="100%" stopColor="#515BD4" />
                </linearGradient>
              </defs>
              {stats.chartData.points.map((pt, idx) => (
                <text
                  key={idx}
                  x={20 + idx * Math.floor(450 / Math.max(1, stats.chartData.points.length - 1))}
                  y="190"
                  fill="#737373"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {pt.label}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Right Widget: Client Health Score Gauge */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-base font-bold text-text-primary">Client Health Score</h3>
            <p className="text-xs text-text-secondary">Algorithmic churn risk score (API)</p>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <svg className="w-36 h-36" viewBox="0 0 100 100">
              <circle
                className="text-slate-100"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="38"
                cx="50"
                cy="50"
              />
              <circle
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={((100 - healthScore) / 100) * (2 * Math.PI * 38)}
                strokeLinecap="round"
                stroke={healthGaugeColor}
                fill="transparent"
                r="38"
                cx="50"
                cy="50"
                className="origin-center -rotate-90 transition-all duration-700"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-text-primary">{healthScore}</span>
              <span className="text-[10px] text-text-secondary uppercase tracking-wide font-bold">out of 100</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <span className={`inline-block border px-3 py-1 rounded-full text-xs font-bold ${healthColor}`}>
              {healthLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`grid grid-cols-1 ${isIndividual ? 'lg:grid-cols-3' : ''} gap-8`}>
        <div className={`bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm ${isIndividual ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary">Recent Content Drafts</h3>
            <Link href="/app/content" className="text-xs font-semibold text-instagram-pink hover:underline">
              View All
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {drafts.slice(0, 4).map((draft) => (
              <div
                key={draft.id}
                className="border border-border-primary p-4 rounded-xl flex items-center justify-between hover:bg-bg-app transition duration-150"
              >
                <div className="flex flex-col gap-1 pr-4 truncate">
                  <p className="text-sm font-semibold text-text-primary truncate">{draft.prompt}</p>
                  <p className="text-xs text-text-secondary truncate max-w-lg">{draft.caption}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      draft.status === 'approved'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : draft.status === 'pending_approval'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : draft.status === 'rejected'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-bg-app text-text-secondary'
                    }`}
                  >
                    {draft.status.replace('_', ' ')}
                  </span>
                  <Link
                    href={`/app/content/${draft.id}`}
                    className="text-xs font-bold text-text-secondary hover:text-text-primary p-1"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
            {drafts.length === 0 && (
              <p className="text-sm text-slate-400 italic py-4">No drafts generated for this brand yet.</p>
            )}
          </div>
        </div>

        {/* Social Channels for Individual */}
        {isIndividual && (
          <div className="flex flex-col gap-6">
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-text-primary">Social Channels</h3>

              <div className="space-y-3">
                {/* Instagram */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm border-b border-border-primary pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Instagram className="w-4 h-4 text-instagram-pink shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-text-primary block truncate">Instagram</span>
                      {instagramConnected && instagramAccountName && (
                        <span className="text-xs text-text-secondary block truncate">
                          {instagramAccountName}
                        </span>
                      )}
                    </div>
                  </div>
                  {instagramConnected ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-2.5 py-1 rounded-full whitespace-nowrap">
                        Connected
                      </span>
                      <button
                        type="button"
                        onClick={() => disconnectInstagram()}
                        disabled={isInstagramLoading || isInstagramDisconnecting}
                        className="text-xs font-bold text-red-500 hover:text-red-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        {isInstagramDisconnecting ? '...' : 'Disconnect'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connectInstagram('/app')}
                      disabled={isInstagramLoading || isInstagramConnecting}
                      className="bg-instagram-pink hover:opacity-90 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isInstagramConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Linkedin className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-text-primary block truncate">LinkedIn</span>
                      {linkedinConnected && linkedinAccountName && (
                        <span className="text-xs text-text-secondary block truncate">
                          {linkedinAccountName}
                        </span>
                      )}
                    </div>
                  </div>
                  {linkedinConnected ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-2.5 py-1 rounded-full whitespace-nowrap">
                        Connected
                      </span>
                      <button
                        type="button"
                        onClick={() => disconnectLinkedIn()}
                        disabled={isLinkedInLoading || isLinkedInDisconnecting}
                        className="text-xs font-bold text-red-500 hover:text-red-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        {isLinkedInDisconnecting ? '...' : 'Disconnect'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connectLinkedIn('/app')}
                      disabled={isLinkedInLoading || isLinkedInConnecting}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isLinkedInConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
