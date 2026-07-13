'use client';

import type { Workspace } from '@/lib/types';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { ArrowRight, X, Plus } from 'lucide-react';



const TONES = ['casual', 'energetic', 'professional', 'witty', 'bold', 'formal'];

export function BrandVoiceView() {
  const router = useRouter();
  const { state, updateWorkspace, updateState } = useAppState();

  // Load the active workspace
  const activeWs = state.workspaces.find((w) => w.id === state.activeWorkspaceId) || state.workspaces[0];

  const [tone, setTone] = useState<Workspace['tone']>(activeWs?.tone || 'casual');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(activeWs?.keywords || []);
  const [ruleInput, setRuleInput] = useState('');
  const [rules, setRules] = useState<string[]>(activeWs?.rules || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim().toLowerCase()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleAddRule = () => {
    if (ruleInput.trim() && !rules.includes(ruleInput.trim())) {
      setRules([...rules, ruleInput.trim()]);
      setRuleInput('');
    }
  };

  const handleRemoveRule = (rule: string) => {
    setRules(rules.filter((r) => r !== rule));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeWs) {
        await updateWorkspace({
          ...activeWs,
          tone: tone as Workspace['tone'],
          keywords,
          rules,
        });
      }

      await updateState({ currentStep: 4 });
      router.push('/onboarding/kyc');
    } catch {
      alert('Failed to save brand voice settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#262626]">
          Configure Brand Voice
        </h1>
        <p className="text-slate-500 mt-2">
          Train the AI on how to write. These guidelines will inject into all draft generation prompts.
        </p>
      </div>

      <OnboardingStepper currentStep={3} />

      <div className="max-w-md w-full mx-auto bg-white border border-[#EFEFEF] rounded-2xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Tone Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#737373]">Writing Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t as Workspace['tone'])}
                  className={`border py-2 px-1 rounded-xl text-xs font-bold capitalize transition duration-150 ${
                    tone === t
                      ? 'border-instagram-pink text-instagram-pink bg-pink-50'
                      : 'border-[#EFEFEF] text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#737373]">Core Brand Keywords</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. eco-friendly"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                className="flex-1 border border-[#EFEFEF] rounded-xl px-3.5 py-2 text-sm focus:border-[#E1306C] outline-none transition duration-150"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                aria-label="Add keyword"
                className="bg-slate-100 hover:bg-slate-200 border border-[#EFEFEF] p-2.5 rounded-xl text-[#262626] transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {/* Keyword Chips */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-xs font-semibold text-[#262626]"
                >
                  <span>{kw}</span>
                  <button type="button" onClick={() => handleRemoveKeyword(kw)} aria-label={`Remove keyword ${kw}`}>
                    <X className="w-3 h-3 text-[#737373] hover:text-[#262626]" />
                  </button>
                </span>
              ))}
              {keywords.length === 0 && (
                <span className="text-xs text-slate-400 italic">No keywords added yet.</span>
              )}
            </div>
          </div>

          {/* Rules */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#737373]">Writing Rules / Constraints</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Always end with a question"
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
                className="flex-1 border border-[#EFEFEF] rounded-xl px-3.5 py-2 text-sm focus:border-[#E1306C] outline-none transition duration-150"
              />
              <button
                type="button"
                onClick={handleAddRule}
                aria-label="Add writing rule"
                className="bg-slate-100 hover:bg-slate-200 border border-[#EFEFEF] p-2.5 rounded-xl text-[#262626] transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {/* Rules List */}
            <ul className="flex flex-col gap-1.5 mt-1 max-h-[120px] overflow-y-auto pr-1">
              {rules.map((rule) => (
                <li
                  key={rule}
                  className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs text-[#262626]"
                >
                  <span className="truncate pr-2">{rule}</span>
                  <button type="button" onClick={() => handleRemoveRule(rule)} aria-label={`Remove rule: ${rule}`} className="shrink-0">
                    <X className="w-3 h-3 text-[#737373] hover:text-[#262626]" />
                  </button>
                </li>
              ))}
              {rules.length === 0 && (
                <li className="text-xs text-slate-400 italic">No rules added yet.</li>
              )}
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm mt-2 disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Saving...' : 'Continue to KYC'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>


      </div>
    </div>
  );
}

