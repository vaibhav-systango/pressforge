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
              
              {/* Minimalist Peak-Highlighted Campaign Reach Trend Chart */}
              {(() => {
                const weeklyTrendData = publicStats?.weeklyTrend || [
                  { day: 'Mon', value: 0, reach: 0 },
                  { day: 'Tue', value: 0, reach: 0 },
                  { day: 'Wed', value: 0, reach: 0 },
                  { day: 'Thu', value: 0, reach: 0 },
                  { day: 'Fri', value: 0, reach: 0 },
                  { day: 'Sat', value: 0, reach: 0 },
                  { day: 'Sun', value: 0, reach: 0 },
                ];

                const maxReach = Math.max(...weeklyTrendData.map((d) => d.reach ?? d.value ?? 0), 10);

                const X_START = 35;
                const X_END = 475;
                const Y_TOP = 40;
                const Y_BOTTOM = 135;

                const points = weeklyTrendData.map((item, idx) => {
                  const x = X_START + idx * ((X_END - X_START) / 6);
                  const reachVal = item.reach ?? item.value ?? 0;
                  const y = Y_BOTTOM - (reachVal / maxReach) * (Y_BOTTOM - Y_TOP);
                  return { x, y, reach: reachVal, day: item.day };
                });

                let curveD = '';
                if (points.length > 0) {
                  curveD = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 0; i < points.length - 1; i++) {
                    const curr = points[i];
                    const next = points[i + 1];
                    const cp1x = curr.x + (next.x - curr.x) / 2;
                    const cp1y = curr.y;
                    const cp2x = curr.x + (next.x - curr.x) / 2;
                    const cp2y = next.y;
                    curveD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
                  }
                }

                const areaD = points.length > 0
                  ? `${curveD} L ${points[points.length - 1].x} ${Y_BOTTOM} L ${points[0].x} ${Y_BOTTOM} Z`
                  : '';

                // Find peak (highest point)
                const peakPoint = points.reduce(
                  (max, p) => (p.reach > max.reach ? p : max),
                  points[0] || { x: 475, y: 40, reach: 0, day: 'Sun' }
                );

                return (
                  <div className="h-56 sm:h-64 bg-bg-app/60 border border-border-primary rounded-xl p-4 flex flex-col justify-between shadow-sm">
                    {/* Clean Non-Technical Header */}
                    <div className="flex items-center justify-between border-b border-border-primary/40 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">Organic Reach Growth</span>
                        <span className="text-[10px] text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                          +24% Growth
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" /> Live Growth
                      </span>
                    </div>

                    {/* Sleek Line Graph without Axes or Intermediate Dots */}
                    <div className="w-full flex-1 flex items-center justify-center pt-2">
                      <svg viewBox="0 0 510 170" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="igGradPublic" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F58529" />
                            <stop offset="50%" stopColor="#DD2A7B" />
                            <stop offset="100%" stopColor="#515BD4" />
                          </linearGradient>
                          <linearGradient id="igGradFill" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#DD2A7B" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#DD2A7B" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Subtle Horizontal Reference Gridlines */}
                        {[Y_TOP, Y_TOP + (Y_BOTTOM - Y_TOP) * 0.5, Y_BOTTOM].map((yVal, i) => (
                          <line
                            key={i}
                            x1={X_START}
                            y1={yVal}
                            x2={X_END}
                            y2={yVal}
                            stroke="currentColor"
                            strokeOpacity="0.08"
                            strokeDasharray="4 4"
                          />
                        ))}

                        {/* Translucent Area Fill below Curve */}
                        {areaD && <path d={areaD} fill="url(#igGradFill)" />}

                        {/* Main Smooth Trend Curve Line */}
                        {curveD && (
                          <path
                            d={curveD}
                            fill="none"
                            stroke="url(#igGradPublic)"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        )}

                        {/* HIGHLIGHTED PEAK POINT ONLY */}
                        {peakPoint && (
                          <g>
                            {/* Outer Glow Circle */}
                            <circle
                              cx={peakPoint.x}
                              cy={peakPoint.y}
                              r="8"
                              fill="#DD2A7B"
                              fillOpacity="0.3"
                            />
                            {/* Inner Peak Node */}
                            <circle
                              cx={peakPoint.x}
                              cy={peakPoint.y}
                              r="5"
                              className="fill-[#DD2A7B] stroke-white dark:stroke-bg-card"
                              strokeWidth="2.5"
                            />
                            {/* Highlighted Peak Value Badge */}
                            <g transform={`translate(${peakPoint.x > 430 ? peakPoint.x - 42 : peakPoint.x}, ${peakPoint.y - 14})`}>
                              <rect
                                x="-42"
                                y="-18"
                                width="84"
                                height="20"
                                rx="10"
                                fill="#DD2A7B"
                                className="shadow-md"
                              />
                              <text
                                x="0"
                                y="-4"
                                textAnchor="middle"
                                fill="#ffffff"
                                className="text-[10px] font-extrabold tracking-wide"
                              >
                                {peakPoint.reach}K Peak
                              </text>
                            </g>
                          </g>
                        )}
                      </svg>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Live Platform Counter Section */}
      <section id="live-metrics" className="bg-slate-900 dark:bg-bg-card border-y border-slate-800 dark:border-border-primary text-white py-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 text-white dark:text-text-primary">Live Platform Performance</h2>
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
            &copy; 2026 PRESSFORGE AI. Live API Integrated Platform.
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
