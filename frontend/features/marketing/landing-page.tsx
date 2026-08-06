'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Zap, BarChart3, BellRing, Users } from 'lucide-react';

import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useClientSession } from '@/lib/hooks/use-client-session';
import { useMounted } from '@/lib/hooks/use-mounted';

export function LandingPage() {
  const router = useRouter();
  const mounted = useMounted();
  const hasSession = useClientSession();
  const { user } = useAuth();

  useEffect(() => {
    if (mounted && (hasSession || user)) {
      router.replace('/app');
    }
  }, [mounted, hasSession, user, router]);

  if (mounted && (hasSession || user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#262626] flex items-center">
              PRESSFORGE<span className="text-instagram-pink ml-0.5">.AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[#737373] hover:text-[#262626] font-medium transition">Features</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/auth/login"
              className="text-xs sm:text-sm font-semibold text-[#737373] hover:text-[#262626] transition py-1.5 px-2.5 sm:py-2 sm:px-3"
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

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#262626] max-w-4xl leading-tight sm:leading-tight">
          Automate Your Brand&apos;s PR & Social Media with <span className="bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#515BD4] bg-clip-text text-transparent">AI Intelligence</span>
        </h1>

        <p className="text-[#737373] text-sm sm:text-lg md:text-xl max-w-2xl mt-4 sm:mt-6 leading-relaxed px-2">
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
            className="w-full sm:w-auto bg-white border border-[#EFEFEF] text-[#262626] hover:bg-slate-50 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-bold transition shadow-sm flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto text-[#737373] hover:text-[#262626] px-4 py-2.5 sm:py-3.5 rounded-full text-sm sm:text-base font-semibold transition text-center"
          >
            Log In
          </Link>
        </div>

        {/* Dashboard Preview Wireframe Graphic */}
        <div className="w-full max-w-5xl border border-[#EFEFEF] rounded-2xl bg-white shadow-xl mt-10 sm:mt-16 p-3 sm:p-6 text-left relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EFEFEF] pb-3 sm:pb-4 mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400 shrink-0"></span>
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400 shrink-0"></span>
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400 shrink-0"></span>
              <span className="text-[10px] sm:text-xs text-[#737373] ml-1 sm:ml-2 truncate">pressforge.ai/app/dashboard</span>
            </div>
            <div className="w-32 sm:w-48 h-5 sm:h-6 bg-slate-100 rounded-full hidden sm:block"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="hidden md:block md:col-span-1 border-r border-[#EFEFEF] pr-4 space-y-4">
              <div className="w-full h-8 bg-slate-100 rounded-lg"></div>
              <div className="space-y-2">
                <div className="w-full h-6 bg-pink-50 rounded-lg"></div>
                <div className="w-4/5 h-6 bg-slate-100 rounded-lg"></div>
                <div className="w-3/4 h-6 bg-slate-100 rounded-lg"></div>
                <div className="w-5/6 h-6 bg-slate-100 rounded-lg"></div>
              </div>
            </div>
            <div className="md:col-span-3 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="border border-[#EFEFEF] p-3.5 sm:p-4 rounded-xl space-y-1.5 sm:space-y-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 rounded-full flex items-center justify-center text-instagram-pink font-bold text-xs sm:text-base">1</div>
                  <p className="text-xs font-semibold text-[#737373]">Total Reach</p>
                  <p className="text-lg sm:text-xl font-bold text-[#262626]">148.5K</p>
                </div>
                <div className="border border-[#EFEFEF] p-3.5 sm:p-4 rounded-xl space-y-1.5 sm:space-y-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 rounded-full flex items-center justify-center text-instagram-pink font-bold text-xs sm:text-base">2</div>
                  <p className="text-xs font-semibold text-[#737373]">Approval Rate</p>
                  <p className="text-lg sm:text-xl font-bold text-[#262626]">94.2%</p>
                </div>
                <div className="border border-[#EFEFEF] p-3.5 sm:p-4 rounded-xl space-y-1.5 sm:space-y-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 rounded-full flex items-center justify-center text-instagram-pink font-bold text-xs sm:text-base">3</div>
                  <p className="text-xs font-semibold text-[#737373]">Health Score</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">92/100</p>
                </div>
              </div>
              <div className="h-32 sm:h-48 bg-slate-50 border border-[#EFEFEF] rounded-xl flex items-center justify-center text-xs text-[#737373] font-medium text-center p-4">
                Real-time Campaign Performance Analytics Dashboard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-white border-t border-b border-[#EFEFEF] py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#262626]">The PressForge End-to-End Workflow</h2>
            <p className="text-sm sm:text-base text-[#737373] mt-2 sm:mt-4">We cover the entire brand promotion lifecycle, feeding performance insights directly back into content generation prompts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            <div className="p-5 sm:p-6 rounded-2xl border border-[#EFEFEF] space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-50 text-instagram-pink rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#262626]">1. Multi-Client Onboarding</h3>
              <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
                Set up organizations and brand workspaces. Configure specific AI voice rules, keywords, and connect social accounts seamlessly.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-[#EFEFEF] space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-50 text-instagram-pink rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#262626]">2. Brand Voice-Aware AI</h3>
              <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
                Generate copy, hashtag configurations, and image brief prompts automatically injected with your customized brand tones.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-[#EFEFEF] space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-50 text-instagram-pink rounded-xl flex items-center justify-center">
                <BellRing className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#262626]">3. Client Approvals</h3>
              <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
                Send posts directly to clients via a simulated link. Clients approve, reject, or comment.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-[#EFEFEF] space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-50 text-instagram-pink rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#262626]">4. Multi-Platform Publishing</h3>
              <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
                Schedule posts automatically on approved channels and maintain logs of publication history.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-[#EFEFEF] space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-50 text-instagram-pink rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#262626]">5. PR Campaign Distribution</h3>
              <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
                Draft PR releases, select matching targeted journalist feeds by beat or city, and track open/reply metrics.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-[#EFEFEF] space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-50 text-instagram-pink rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#262626]">6. Engagement & Analytics</h3>
              <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
                Track post analytics and generate key performance insights to optimize your future marketing and PR briefs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#EFEFEF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-[#737373]">
            &copy; 2026 PRESSFORGE AI. Designed for stakeholder validation. Built with Next.js & Tailwind CSS.
          </p>
          <div className="flex gap-4">
            <Link href="/auth/signup" className="text-xs font-semibold text-instagram-pink">Get Started</Link>
            <Link href="/app" className="text-xs font-semibold text-slate-700">App Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

