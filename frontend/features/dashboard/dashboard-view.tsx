'use client';

import Link from 'next/link';
import { useAppState } from '@/lib/queries/use-app-state';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ArrowRight,
  Instagram,
  Linkedin,
  MessageSquare,
  AlertCircle,
  XCircle,
  Plus,
  Settings,
  Building,
  ChevronRight,
  Users
} from 'lucide-react';



export function DashboardView() {
  const { state, isLoading } = useAppState();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        <div className="h-32 rounded-3xl bg-bg-card border border-border-primary animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 rounded-2xl bg-bg-card border border-border-primary animate-pulse" />
          <div className="h-28 rounded-2xl bg-bg-card border border-border-primary animate-pulse" />
          <div className="h-28 rounded-2xl bg-bg-card border border-border-primary animate-pulse" />
        </div>
        <div className="h-64 rounded-3xl bg-bg-card border border-border-primary animate-pulse" />
      </div>
    );
  }

  const activeWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId) || state.workspaces[0];

  const isClient = state.currentUserType === 'client';
  const currentClient = isClient ? state.clients.find(c => c.id === state.activeClientId) : null;
  const clientName = currentClient ? currentClient.name : 'Valued Client';

  // Client workspace details
  const clientDrafts = state.drafts.filter((d) => d.workspaceId === state.activeWorkspaceId);
  const clientPending = clientDrafts.filter((d) => d.status === 'pending_approval');
  const clientApproved = clientDrafts.filter((d) => d.status === 'approved' || d.status === 'published');
  const clientRejected = clientDrafts.filter((d) => d.status === 'rejected');

  // Get active workspace data for agency
  const drafts = state.drafts.filter((d) => d.workspaceId === state.activeWorkspaceId);
  const approvedCount = drafts.filter((d) => d.status === 'approved').length;
  const pendingCount = drafts.filter((d) => d.status === 'pending_approval').length;
  const campaignCount = state.campaigns.filter((c) => c.workspaceId === state.activeWorkspaceId).length;

  // Calculate approval rate dynamically
  const totalDecided = drafts.filter((d) => d.status === 'approved' || d.status === 'rejected').length;
  const approvedDecided = drafts.filter((d) => d.status === 'approved').length;
  const approvalRate = totalDecided > 0 ? Math.round((approvedDecided / totalDecided) * 100) : 92;

  // Mock score health
  const healthScore = activeWorkspace?.id === 'acme-brand' ? 92 : activeWorkspace?.id === 'ecolife' ? 84 : 54;
  const healthLabel = healthScore >= 85 ? 'Low Churn Risk' : healthScore >= 60 ? 'Medium Churn Risk' : 'High Churn Risk';
  const healthColor = healthScore >= 85 ? 'text-green-600 border-green-200 bg-green-50' : healthScore >= 60 ? 'text-yellow-600 border-yellow-200 bg-yellow-50' : 'text-red-600 border-red-200 bg-red-50';
  const healthGaugeColor = healthScore >= 85 ? '#10B981' : healthScore >= 60 ? '#F59E0B' : '#EF4444';

  if (isClient) {
    return (
      <div className="flex flex-col gap-8 animate-fade-in text-text-primary">
        {/* Welcome Block */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#F58529]/20 to-[#DD2A7B]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] bg-instagram-pink/20 text-instagram-pink border border-instagram-pink/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Client Portal
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {clientName}!
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Collaborate and review content drafts for the <span className="font-semibold text-white">{activeWorkspace?.name}</span> workspace. You can approve drafts, request revisions, and suggest new content ideas.
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
              <p className="text-3xl font-extrabold text-text-primary">{clientPending.length}</p>
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
            <p className="text-3xl font-extrabold text-text-primary mt-4">{clientApproved.length}</p>
          </div>

          <div className="bg-bg-card border border-border-primary p-5 rounded-2xl text-left shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">Revision Requests</span>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-extrabold text-text-primary mt-4">{clientRejected.length}</p>
          </div>
        </div>

        {/* Workspace Performance Stats Quick View */}
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
              <p className="text-xl font-extrabold text-text-primary">
                {activeWorkspace?.id === 'acme-brand' ? '248.5K' : activeWorkspace?.id === 'ecolife' ? '112.4K' : '89.1K'}
              </p>
              <span className="text-[9px] text-green-600 font-bold">+18.2% vs last month</span>
            </div>
            <div className="bg-bg-app/40 border border-border-primary rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Engagement Rate</span>
              <p className="text-xl font-extrabold text-text-primary">
                {activeWorkspace?.id === 'acme-brand' ? '4.82%' : activeWorkspace?.id === 'ecolife' ? '5.15%' : '4.70%'}
              </p>
              <span className="text-[9px] text-green-600 font-bold">+0.4% industry avg</span>
            </div>
            <div className="bg-bg-app/40 border border-border-primary rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Net Followers</span>
              <p className="text-xl font-extrabold text-text-primary">
                {activeWorkspace?.id === 'acme-brand' ? '+1,842' : activeWorkspace?.id === 'ecolife' ? '+850' : '+508'}
              </p>
              <span className="text-[9px] text-green-600 font-bold">+8.3% acceleration</span>
            </div>
            <div className="bg-bg-app/40 border border-border-primary rounded-2xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">PR Target Replies</span>
              <p className="text-xl font-extrabold text-text-primary">
                {activeWorkspace?.id === 'acme-brand' ? '4 Replies' : activeWorkspace?.id === 'ecolife' ? '3 Replies' : '5 Replies'}
              </p>
              <span className="text-[9px] text-text-secondary font-medium">From Tier-1 editors</span>
            </div>
          </div>
        </div>

        {/* Main Grid split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Pending Approvals list */}
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
                        <span className="text-[10px] text-text-secondary font-semibold shrink-0">v{draft.version}.0</span>
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
                      className="flex items-center gap-1.5 bg-instagram-pink text-white px-4 py-2 rounded-full text-xs font-bold hover:opacity-95 transition shadow-sm"
                    >
                      <span>Review & Approve</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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

          {/* Right: Quick actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Create Post Idea Card */}
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-instagram-pink" />
                <h3 className="text-sm font-bold text-text-primary">Suggest a Post Idea</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Have a campaign concept, update, or social announcement? Run it through our brand-tuned AI writer to auto-generate a draft for approval.
              </p>
              <Link
                href="/app/content/new"
                className="w-full flex items-center justify-center gap-1.5 bg-text-primary hover:opacity-90 text-bg-card py-2.5 rounded-full text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Post Draft</span>
              </Link>
            </div>

            {/* Workspace details card */}
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-between justify-between border-b border-border-primary pb-2.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Workspace Profile</h3>
                <Link href="/app/workspaces" className="text-[11px] text-instagram-pink font-semibold hover:underline">
                  View Profile
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-secondary font-bold uppercase">Active Writing Tone</span>
                  <p className="font-semibold text-text-primary capitalize">{activeWorkspace?.tone}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-secondary font-bold uppercase">Brand Keywords</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activeWorkspace?.keywords.map((kw) => (
                      <span key={kw} className="bg-bg-app border border-border-primary text-text-primary px-2 py-0.5 rounded text-[10px] font-medium">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Welcome Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Welcome Back, {state.organizationName}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Here is the current status of the <span className="font-semibold text-text-primary">{activeWorkspace?.name}</span> workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-bg-card border border-border-primary rounded-full px-3 py-1.5 font-medium shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          <span>Last automated scan: 2 hours ago</span>
        </div>
      </div>

      {/* Grid: KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Reach */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">Weekly Reach</span>
            <span className="text-green-500 text-xs font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +12.4%
            </span>
          </div>
          <p className="text-3xl font-extrabold text-text-primary mt-4">148.5K</p>
          <p className="text-xs text-text-secondary mt-2">Organic impressions across socials</p>
        </div>

        {/* KPI 2: Approvals */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">Approval Rate</span>
            <span className="text-text-secondary text-[10px] bg-bg-app px-1.5 py-0.5 rounded-full font-medium">All Time</span>
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
          <p className="text-3xl font-extrabold text-text-primary mt-4">{approvedCount}</p>
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
          <p className="text-xs text-text-secondary mt-2">Awaiting WhatsApp approval</p>
        </div>
      </div>

      {/* Grid: Charts & Client Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Widget: Engagement Chart */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-text-primary">Weekly Engagement Trend</h3>
              <p className="text-xs text-text-secondary">Likes, shares, and comments count</p>
            </div>
            <select className="border border-border-primary text-xs font-semibold text-text-primary bg-bg-card rounded-lg px-2.5 py-1.5">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          {/* SVG Line Graph */}
          <div className="w-full h-56 flex items-end">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="#F1F1F1" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#F1F1F1" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#F1F1F1" strokeWidth="1" />
              {/* Chart Line */}
              <path
                d="M 20 160 Q 80 80, 140 120 T 260 60 T 380 90 T 480 30"
                fill="none"
                stroke="url(#igGrad)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Gradients */}
              <defs>
                <linearGradient id="igGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F58529" />
                  <stop offset="50%" stopColor="#DD2A7B" />
                  <stop offset="100%" stopColor="#515BD4" />
                </linearGradient>
              </defs>
              {/* Axis labels */}
              <text x="20" y="190" fill="#737373" fontSize="10" fontWeight="bold">Mon</text>
              <text x="100" y="190" fill="#737373" fontSize="10" fontWeight="bold">Tue</text>
              <text x="180" y="190" fill="#737373" fontSize="10" fontWeight="bold">Wed</text>
              <text x="260" y="190" fill="#737373" fontSize="10" fontWeight="bold">Thu</text>
              <text x="340" y="190" fill="#737373" fontSize="10" fontWeight="bold">Fri</text>
              <text x="420" y="190" fill="#737373" fontSize="10" fontWeight="bold">Sat</text>
              <text x="470" y="190" fill="#737373" fontSize="10" fontWeight="bold">Sun</text>
            </svg>
          </div>
        </div>

        {/* Right Widget: Client Health Score Gauge */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-base font-bold text-text-primary">Client Health Score</h3>
            <p className="text-xs text-text-secondary">Algorithmic churn risk prediction</p>
          </div>

          <div className="relative flex items-center justify-center my-6">
            {/* SVG circular gauge */}
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
            {healthScore < 60 && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-100 text-left text-[11px] leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  High Risk: Brand Voice tone rules conflicts with negative Twitter sentiments. Update tone rules in settings.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Recent Activity & Workspace Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Drafts */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary">Recent Content Drafts</h3>
            <Link href="/app/content" className="text-xs font-semibold text-instagram-pink hover:underline">
              View All
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {drafts.slice(0, 3).map((draft) => (
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
                    href={draft.status === 'pending_approval' ? '/app/approvals/$id' : '/app/content/$id'.replace("$id", draft.id )}
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

        {/* Right Column: Channels & Guidelines */}
        <div className="flex flex-col gap-6">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-text-primary">Brand Voice & Channels</h3>

            {/* Socials Connectors */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Social Channels</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-text-secondary">
                  <Instagram className="w-4 h-4 text-instagram-pink" /> Instagram
                </span>
                <span
                  className={`text-xs font-bold ${
                    state.connectedAccounts.instagram ? 'text-green-600' : 'text-slate-400'
                  }`}
                >
                  {state.connectedAccounts.instagram ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-text-secondary">
                  <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn
                </span>
                <span
                  className={`text-xs font-bold ${
                    state.connectedAccounts.linkedin ? 'text-green-600' : 'text-slate-400'
                  }`}
                >
                  {state.connectedAccounts.linkedin ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="border-t border-border-primary pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Voice Rules</h4>
              <div className="flex flex-wrap gap-1.5">
                {activeWorkspace?.keywords.map((kw) => (
                  <span key={kw} className="text-[10px] bg-bg-app text-text-secondary px-2 py-0.5 rounded-full font-bold">
                    #{kw}
                  </span>
                ))}
              </div>
              <p className="text-xs text-text-secondary italic">
                Active tone: <span className="font-semibold text-text-primary capitalize">{activeWorkspace?.tone}</span>
              </p>
            </div>
          </div>

          {/* Client Portals Card */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-2.5">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <Users className="w-4 h-4 text-instagram-pink" />
                <span>Client Portals</span>
              </h3>
              <Link href="/app/clients" className="text-xs font-semibold text-instagram-pink hover:underline">
                Manage
              </Link>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Invite clients to collaborate and approve their brand's drafts. Currently, you have <span className="font-semibold text-text-primary">{(state.clients || []).length} active client portals</span>.
            </p>
            <Link
              href="/app/clients"
              className="w-full flex items-center justify-center gap-1.5 bg-[#262626] hover:bg-slate-800 text-white py-2.5 rounded-full text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 animate-pulse" />
              <span>Invite Client User</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

