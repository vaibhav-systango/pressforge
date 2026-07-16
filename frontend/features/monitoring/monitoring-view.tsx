'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import { notifications } from '@mantine/notifications';
import React, { useState } from 'react';

import { ShieldCheck, Sparkles, Twitter, FileText, Globe, ArrowRight, X } from 'lucide-react';



export function MonitoringView() {
  const router = useRouter();
  const { state, updateWorkspace, addDraft } = useAppState();

  const activeWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId) || state.workspaces[0];

  const mentions = state.mentions.filter((m) => m.workspaceId === state.activeWorkspaceId);

  // Sentiment counters
  const positiveCount = mentions.filter((m) => m.sentiment === 'positive').length;
  const neutralCount = mentions.filter((m) => m.sentiment === 'neutral').length;
  const negativeCount = mentions.filter((m) => m.sentiment === 'negative').length;
  const total = mentions.length || 1;

  const positivePercent = Math.round((positiveCount / total) * 100);
  const neutralPercent = Math.round((neutralCount / total) * 100);
  const negativePercent = Math.round((negativeCount / total) * 100);

  const mentionHealth = (() => {
    if (mentions.length === 0) {
      return {
        label: 'No data',
        detail: 'No mentions scanned yet',
        className: 'text-text-secondary',
      };
    }
    if (negativePercent >= 50) {
      return {
        label: 'Poor',
        detail: `${negativePercent}% negative — needs attention`,
        className: 'text-red-600',
      };
    }
    if (negativePercent >= 30) {
      return {
        label: 'Fair',
        detail: 'Elevated negative sentiment',
        className: 'text-amber-600',
      };
    }
    if (positivePercent >= 50) {
      return {
        label: 'Good',
        detail: 'Sentiment ratio healthy',
        className: 'text-green-600',
      };
    }
    return {
      label: 'Stable',
      detail: 'Sentiment ratio stable',
      className: 'text-green-600',
    };
  })();

  const proposedRule = 'Always acknowledge delivery inquiries with warm shipping timelines.';
  const ruleInjected = activeWorkspace?.rules?.includes(proposedRule) ?? false;

  // Response drafter modal/box state
  const [draftingMentionId, setDraftingMentionId] = useState<string | null>(null);
  const [generatedResponse, setGeneratedResponse] = useState('');

  const handleInjectRule = async () => {
    if (!activeWorkspace) return;

    const alreadyHas = activeWorkspace.rules?.includes(proposedRule) ?? false;
    if (alreadyHas) {
      notifications.show({
        title: 'Success',
        message: 'AI Rule injected successfully into Brand Voice rules!',
        color: 'green',
      });
      return;
    }

    try {
      await updateWorkspace({
        ...activeWorkspace,
        rules: [...(activeWorkspace.rules ?? []), proposedRule],
      });
      notifications.show({
        title: 'Success',
        message: 'AI Rule injected successfully into Brand Voice rules!',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to inject rule into Brand Voice. Please try again.',
        color: 'red',
      });
    }
  };

  const handleCreateDraftResponse = (
    mentionId: string,
    author: string,
    content: string,
    sentiment: 'positive' | 'neutral' | 'negative',
  ) => {
    setDraftingMentionId(mentionId);
    const brand = activeWorkspace?.name || 'our team';
    const excerpt = content.length > 120 ? `${content.slice(0, 117)}…` : content;

    let reply: string;
    if (sentiment === 'negative') {
      reply = `@${author} We're sorry this happened. Thanks for telling us about "${excerpt}". ${brand} wants to make it right — please DM us so we can help resolve this quickly.`;
    } else if (sentiment === 'positive') {
      reply = `@${author} Thank you so much for the kind words about ${brand}! "${excerpt}" means a lot to our team.`;
    } else {
      reply = `@${author} Thanks for sharing your thoughts with ${brand}. Regarding "${excerpt}" — we're happy to answer any follow-ups if you reply or DM us.`;
    }

    setGeneratedResponse(reply);
  };

  const handleSaveResponseDraft = async () => {
    if (!generatedResponse.trim()) return;
    if (!state.activeWorkspaceId) {
      notifications.show({
        title: 'Validation error',
        message: 'Select a workspace before saving a draft.',
        color: 'red',
      });
      return;
    }

    try {
      await addDraft({
        id: 'draft-response-' + Date.now(),
        workspaceId: state.activeWorkspaceId,
        prompt: `Social Reply to mention ${draftingMentionId}`,
        caption: generatedResponse,
        hashtags: ['CustomerCare', activeWorkspace?.name.replace(/\s+/g, '') || 'BrandCare'],
        imageBrief: 'No image (text reply)',
        status: 'draft',
        scheduledAt: new Date().toISOString(),
        version: 1,
        history: [
          {
            version: 1,
            timestamp: new Date().toISOString(),
            action: 'Draft created from sentiment monitoring scanner',
            caption: generatedResponse
          }
        ]
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to save response draft',
        color: 'red',
      });
      return;
    }

    notifications.show({
      title: 'Success',
      message: 'Response draft saved! You can check it in the Content Planner.',
      color: 'green',
    });
    setDraftingMentionId(null);
    router.push('/app/content');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border-primary pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Sentiment Monitor & Learning Loop</h1>
        <p className="text-sm text-text-secondary mt-1">
          Listen to customer discussions, reply to negative sentiment immediately, and inject insights into brand prompts.
        </p>
      </div>

      {/* Sentiment metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sentiment percentage meters */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm md:col-span-3 space-y-4">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide">Brand Sentiment Breakdowns</h3>
          <div className="flex items-center gap-2 h-4 rounded-full overflow-hidden bg-bg-app">
            <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${positivePercent}%` }} title={`Positive: ${positivePercent}%`}></div>
            <div className="bg-slate-400 h-full transition-all duration-500" style={{ width: `${neutralPercent}%` }} title={`Neutral: ${neutralPercent}%`}></div>
            <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${negativePercent}%` }} title={`Negative: ${negativePercent}%`}></div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Positive ({positivePercent}%)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Neutral ({neutralPercent}%)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Negative ({negativePercent}%)</span>
          </div>
        </div>

        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm text-center flex flex-col justify-center">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">Mention Health</p>
          <p className="text-3xl font-extrabold text-text-primary mt-2">{mentionHealth.label}</p>
          <p className={`text-[10px] font-semibold mt-1 ${mentionHealth.className}`}>{mentionHealth.detail}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Live Feed */}
        <div className="lg:col-span-7 bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2">Scanned Online Mentions</h3>

          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
            {mentions.map((men) => {
              const PlatformIcon = men.platform === 'twitter' ? Twitter : men.platform === 'blog' ? FileText : Globe;
              const sentimentBadge =
                men.sentiment === 'positive'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : men.sentiment === 'neutral'
                  ? 'bg-bg-app text-text-secondary border-border-primary'
                  : 'bg-red-50 text-red-700 border-red-200';

              return (
                <div key={men.id} className="border border-border-primary p-4.5 rounded-2xl flex flex-col gap-3 hover:bg-bg-app/50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-bg-app flex items-center justify-center text-text-secondary">
                        <PlatformIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary">@{men.author}</p>
                        <p className="text-[9px] text-slate-400 capitalize">{men.platform} • 4 hours ago</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${sentimentBadge}`}>
                      {men.sentiment}
                    </span>
                  </div>

                  <p className="text-xs text-text-primary leading-relaxed italic">&quot;{men.content}&quot;</p>

                  <div className="text-right">
                    <button
                      onClick={() =>
                        handleCreateDraftResponse(
                          men.id,
                          men.author ?? 'user',
                          men.content ?? men.title ?? '',
                          men.sentiment,
                        )
                      }
                      className="text-[10px] text-instagram-pink font-bold hover:underline"
                    >
                      AI Response Draft
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Continuous Loop and response helper */}
        <div className="lg:col-span-5 space-y-6">
          {/* Response Box (dynamic show when clicking AI Response Draft) */}
          {draftingMentionId && (
            <div className="bg-bg-card border border-instagram-pink/30 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in ring-2 ring-pink-50">
              <div className="flex items-center justify-between border-b border-border-primary pb-2">
                <h3 className="text-xs font-bold text-instagram-pink flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Drafting AI Social Response
                </h3>
                <button
                  type="button"
                  onClick={() => setDraftingMentionId(null)}
                  aria-label="Close response draft"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-text-secondary" />
                </button>
              </div>
              <label htmlFor="ai-social-response" className="sr-only">
                AI social response draft
              </label>
              <textarea
                id="ai-social-response"
                value={generatedResponse}
                onChange={(e) => setGeneratedResponse(e.target.value)}
                className="w-full border border-border-primary rounded-xl p-3 text-xs focus:border-[#E1306C] outline-none min-h-[95px] resize-y"
              />
              <button
                onClick={handleSaveResponseDraft}
                className="w-full bg-[#E1306C] text-white py-2 rounded-full text-xs font-bold hover:opacity-95 transition"
              >
                Save Reply to Content Planner
              </button>
            </div>
          )}

          {/* AI Continuous Loop Card */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border-primary pb-2">
              <Sparkles className="w-5 h-5 text-instagram-pink" />
              <h3 className="text-base font-bold text-text-primary">AI Prompt Learning Loop</h3>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Our analyzer scanned recent negative Twitter reviews complaining about delayed shipping timelines. We propose injecting this rule to enforce clarity.
            </p>

            <div className="border border-border-primary rounded-xl p-3 bg-[#FAFAFA] text-xs font-semibold text-text-primary leading-normal">
              Proposed Writing Rule:
              <p className="text-xs text-instagram-pink font-bold mt-1 font-mono">
                &quot;{proposedRule}&quot;
              </p>
            </div>

            {ruleInjected ? (
              <span className="flex items-center justify-center gap-1 bg-green-50 border border-green-200 text-green-700 py-3 rounded-full text-xs font-bold">
                <ShieldCheck className="w-4 h-4" /> Rule Injected into Brand Voice
              </span>
            ) : (
              <button
                onClick={handleInjectRule}
                className="w-full flex items-center justify-center gap-1.5 bg-[#262626] text-white py-3 rounded-full text-xs font-bold hover:bg-slate-800 transition"
              >
                <span>Inject Rule to Active Voice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <p className="text-[10px] text-slate-400 text-center leading-normal">
              Injected rules instantly apply to all future prompts generated in the AI Draft Generator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

