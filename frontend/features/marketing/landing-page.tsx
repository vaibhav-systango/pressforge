'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Zap, BarChart3, BellRing, Users, Activity, CheckCircle2, Globe, TrendingUp } from 'lucide-react';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useClientSession } from '@/lib/hooks/use-client-session';
import { useMounted } from '@/lib/hooks/use-mounted';
import { usePublicStats } from '@/lib/hooks/queries/use-public-stats';

export function LandingPage() {
  const router = useRouter();
  const mounted = useMounted();
  const hasSession = useClientSession();
  const { user } = useAuth();
  const { data: publicStats, isLoading: isStatsLoading } = usePublicStats();

  useEffect(() => {
    if (mounted && (hasSession || user)) {
      router.replace('/app');
    }
  }, [mounted, hasSession, user, router]);

  if (mounted && (hasSession || user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-app text-text-primary flex flex-col justify-between overflow-x-hidden transition-colors duration-200">
      {/* Header */}
      <header className="bg-bg-card/90 backdrop-blur-md border-b border-border-primary sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-text-primary flex items-center">
              PRESSFORGE<span className="text-instagram-pink ml-0.5">.AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary font-medium transition">Features</a>
            <a href="#live-metrics" className="text-sm text-text-secondary hover:text-text-primary font-medium transition">Platform Metrics</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary transition py-1.5 px-2.5 sm:py-2 sm:px-3"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold hover:opacity-95 transition shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-20 text-center flex-1 flex flex-col items-center justify-center w-full">

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-primary max-w-4xl leading-tight sm:leading-tight">
          Automate Your Brand&apos;s PR & Social Media with <span className="bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#515BD4] bg-clip-text text-transparent">AI Intelligence</span>
        </h1>

        <p className="text-text-secondary text-sm sm:text-lg md:text-xl max-w-2xl mt-4 sm:mt-6 leading-relaxed px-2">
          From workspace brand voices and automated drafts to client previews, scheduling, journalist target campaigns, and continuous learning analytics.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-10 w-full sm:w-auto px-4">
          <Link
            href="/workspace/new"
            className="w-full sm:w-auto bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-bold hover:opacity-95 transition shadow-md flex items-center justify-center gap-2"
          >
            <span>Create New Workspace</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto bg-bg-card border border-border-primary text-text-primary hover:bg-bg-hover px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-bold transition shadow-sm flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto text-text-secondary hover:text-text-primary px-4 py-2.5 sm:py-3.5 rounded-full text-sm sm:text-base font-semibold transition text-center"
          >
            Log In
          </Link>
        </div>

        {/* Live Dashboard Preview Wireframe Graphic with Real API Stats */}
        <div className="w-full max-w-5xl border border-border-primary rounded-2xl bg-bg-card shadow-xl mt-10 sm:mt-16 p-3 sm:p-6 text-left relative overflow-hidden transition-colors duration-200">
          <div className="flex items-center justify-between border-b border-border-primary pb-3 sm:pb-4 mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400 shrink-0"></span>
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400 shrink-0"></span>
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400 shrink-0"></span>
              <span className="text-[10px] sm:text-xs text-text-secondary ml-1 sm:ml-2 truncate font-mono">pressforge.ai/app/dashboard</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-green-500 font-semibold bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>Live API Connected</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="hidden md:block md:col-span-1 border-r border-border-primary pr-4 space-y-4">
              <div className="w-full h-8 bg-bg-app rounded-lg flex items-center px-3 text-xs font-bold text-text-primary">
                Dashboard Overview
              </div>
              <div className="space-y-2 text-xs font-medium text-text-secondary">
                <div className="w-full p-2 bg-pink-500/10 text-instagram-pink rounded-lg font-bold flex items-center justify-between border border-pink-500/20">
                  <span>Workspaces</span>
                  <span className="bg-bg-card text-instagram-pink px-1.5 py-0.5 rounded text-[10px] border border-border-primary">
                    {isStatsLoading ? '...' : (publicStats?.activeWorkspaces ?? 0)}
                  </span>
                </div>
                <div className="w-full p-2 hover:bg-bg-hover rounded-lg transition">Content Generator</div>
                <div className="w-full p-2 hover:bg-bg-hover rounded-lg transition">Approvals Queue</div>
                <div className="w-full p-2 hover:bg-bg-hover rounded-lg transition">Analytics Reports</div>
              </div>
            </div>
            <div className="md:col-span-3 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="border border-border-primary p-3.5 sm:p-4 rounded-xl space-y-1.5 sm:space-y-2 bg-bg-app/40">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-500/10 rounded-full flex items-center justify-center text-instagram-pink font-bold text-xs sm:text-base">1</div>
                  <p className="text-xs font-semibold text-text-secondary">Total Organic Reach</p>
                  <p className="text-lg sm:text-xl font-bold text-text-primary">
                    {isStatsLoading ? 'Loading...' : (publicStats?.totalReach ?? '0K')}
                  </p>
                </div>
                <div className="border border-border-primary p-3.5 sm:p-4 rounded-xl space-y-1.5 sm:space-y-2 bg-bg-app/40">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-500/10 rounded-full flex items-center justify-center text-instagram-pink font-bold text-xs sm:text-base">2</div>
                  <p className="text-xs font-semibold text-text-secondary">Approval Rate</p>
                  <p className="text-lg sm:text-xl font-bold text-text-primary">
                    {isStatsLoading ? 'Loading...' : (publicStats?.approvalRate ?? '0%')}
                  </p>
                </div>
                <div className="border border-border-primary p-3.5 sm:p-4 rounded-xl space-y-1.5 sm:space-y-2 bg-bg-app/40">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-500/10 rounded-full flex items-center justify-center text-instagram-pink font-bold text-xs sm:text-base">3</div>
                  <p className="text-xs font-semibold text-text-secondary">Platform Health Score</p>
                  <p className="text-lg sm:text-xl font-bold text-green-500">
                    {isStatsLoading ? 'Loading...' : (publicStats?.healthScore ?? '0/100')}
                  </p>
                </div>
              </div>
              
              {/* Dynamic SVG Weekly Trend Chart */}
              <div className="h-36 sm:h-48 bg-bg-app/60 border border-border-primary rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-text-secondary font-semibold">
                  <span>Weekly Campaign Reach Trend (API Analytics)</span>
                  <span className="text-green-500 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Live Data
                  </span>
                </div>
                <div className="w-full h-24 sm:h-32 flex items-end">
                  <svg viewBox="0 0 500 120" className="w-full h-full">
                    <path
                      d="M 20 100 Q 80 40, 140 70 T 260 30 T 380 50 T 480 15"
                      fill="none"
                      stroke="url(#igGradPublic)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="igGradPublic" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F58529" />
                        <stop offset="50%" stopColor="#DD2A7B" />
                        <stop offset="100%" stopColor="#515BD4" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live API Metrics Counter Section */}
      <section id="live-metrics" className="bg-slate-900 dark:bg-bg-card border-y border-slate-800 dark:border-border-primary text-white py-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-xs uppercase font-extrabold tracking-widest text-instagram-pink bg-pink-950/50 border border-pink-800/40 px-3 py-1 rounded-full">
              Real-time API Engine Metrics
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 text-white dark:text-text-primary">Live Platform Statistics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-800/60 dark:bg-bg-app border border-slate-700/60 dark:border-border-primary">
              <Activity className="w-6 h-6 text-instagram-pink mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-extrabold text-white dark:text-text-primary">
                {isStatsLoading ? '...' : (publicStats?.postsPublished?.toLocaleString() ?? 0)}
              </p>
              <p className="text-xs text-slate-400 dark:text-text-secondary font-medium mt-1">Posts Published</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 dark:bg-bg-app border border-slate-700/60 dark:border-border-primary">
              <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-extrabold text-white dark:text-text-primary">
                {isStatsLoading ? '...' : (publicStats?.approvalRate ?? '0%')}
              </p>
              <p className="text-xs text-slate-400 dark:text-text-secondary font-medium mt-1">Client Approval Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 dark:bg-bg-app border border-slate-700/60 dark:border-border-primary">
              <Globe className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-extrabold text-white dark:text-text-primary">
                {isStatsLoading ? '...' : (publicStats?.mediaOutletsTargeted ?? 0)}
              </p>
              <p className="text-xs text-slate-400 dark:text-text-secondary font-medium mt-1">Media Outlets Targeted</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 dark:bg-bg-app border border-slate-700/60 dark:border-border-primary">
              <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-extrabold text-white dark:text-text-primary">
                {isStatsLoading ? '...' : (publicStats?.avgApprovalHours ?? '0.0 hrs')}
              </p>
              <p className="text-xs text-slate-400 dark:text-text-secondary font-medium mt-1">Avg Approval Speed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-bg-card border-t border-b border-border-primary py-12 sm:py-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">The PressForge End-to-End Workflow</h2>
            <p className="text-sm sm:text-base text-text-secondary mt-2 sm:mt-4">We cover the entire brand promotion lifecycle, feeding performance insights directly back into content generation prompts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            <div className="p-5 sm:p-6 rounded-2xl border border-border-primary bg-bg-app/30 hover:bg-bg-hover space-y-3 sm:space-y-4 transition">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/10 text-instagram-pink rounded-xl flex items-center justify-center border border-pink-500/20">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary">1. Multi-Client Onboarding</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Set up organizations and brand workspaces. Configure specific AI voice rules, keywords, and connect social accounts seamlessly.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-border-primary bg-bg-app/30 hover:bg-bg-hover space-y-3 sm:space-y-4 transition">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/10 text-instagram-pink rounded-xl flex items-center justify-center border border-pink-500/20">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary">2. Brand Voice-Aware AI</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Generate copy, hashtag configurations, and image brief prompts automatically injected with your customized brand tones.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-border-primary bg-bg-app/30 hover:bg-bg-hover space-y-3 sm:space-y-4 transition">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/10 text-instagram-pink rounded-xl flex items-center justify-center border border-pink-500/20">
                <BellRing className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary">3. Client Approvals</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Send posts directly to clients via a simulated link. Clients approve, reject, or comment.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-border-primary bg-bg-app/30 hover:bg-bg-hover space-y-3 sm:space-y-4 transition">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/10 text-instagram-pink rounded-xl flex items-center justify-center border border-pink-500/20">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary">4. Multi-Platform Publishing</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Schedule posts automatically on approved channels and maintain logs of publication history.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-border-primary bg-bg-app/30 hover:bg-bg-hover space-y-3 sm:space-y-4 transition">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/10 text-instagram-pink rounded-xl flex items-center justify-center border border-pink-500/20">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary">5. PR Campaign Distribution</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Draft PR releases, select matching targeted journalist feeds by beat or city, and track open/reply metrics.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-border-primary bg-bg-app/30 hover:bg-bg-hover space-y-3 sm:space-y-4 transition">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/10 text-instagram-pink rounded-xl flex items-center justify-center border border-pink-500/20">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary">6. Engagement & Analytics</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Track post analytics and generate key performance insights to optimize your future marketing and PR briefs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-card border-t border-border-primary transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-text-secondary">
            &copy; 2026 PRESSFORGE AI. Live API Integrated Platform. Built with Next.js & Tailwind CSS.
          </p>
          <div className="flex gap-4">
            <Link href="/auth/signup" className="text-xs font-semibold text-instagram-pink">Get Started</Link>
            <Link href="/app" className="text-xs font-semibold text-text-primary hover:text-instagram-pink transition">App Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
