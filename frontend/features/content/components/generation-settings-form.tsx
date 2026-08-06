'use client';

import React, { useState } from 'react';
import { Sparkles, Instagram, Linkedin, Check, Link2, X, Building, RefreshCw } from 'lucide-react';
import { Select } from '@/components/common/select';
import type { Workspace } from '@/lib/types';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';

const TONES = [
  "professional",
  "friendly",
  "witty",
  "bold",
  "empathetic",
  "casual",
  "formal",
];
const GOALS = [
  "Product Spotlight",
  "Behind the Scenes",
  "Educational / Tips",
  "Customer Story / Testimonial",
  "Event / Launch Announcement",
  "General Brand Awareness",
];
const CTAS = [
  "Link in Bio",
  "Comment below",
  "Save for later",
  "Share this post",
  "Visit Website",
  "No CTA",
];
const VISUAL_STYLES = [
  "Warm & Organic",
  "Bold & Vibrant",
  "Minimalist & Clean",
  "Dark & Moody",
  "Professional & Corporate",
];

interface GenerationSettingsFormProps {
  prompt: string;
  setPrompt: (val: string) => void;
  goal: string;
  setGoal: (val: string) => void;
  cta: string;
  setCta: (val: string) => void;
  visualStyle: string;
  setVisualStyle: (val: string) => void;
  targetPlatforms: ('instagram' | 'linkedin')[];
  handleTogglePlatform: (p: 'instagram' | 'linkedin') => void;
  referenceUrls: string[];
  setReferenceUrls: (urls: string[]) => void;
  referenceText: string;
  setReferenceText: (val: string) => void;
  activeWorkspace: Workspace | undefined;
  localBrandName: string;
  setLocalBrandName: (val: string) => void;
  localWebsite: string;
  setLocalWebsite: (val: string) => void;
  localTargetAudience: string;
  setLocalTargetAudience: (val: string) => void;
  localBrandVoice: string;
  setLocalBrandVoice: (val: string) => void;
  localTone: Workspace['tone'];
  setLocalTone: (val: Workspace['tone']) => void;
  localKeywords: string[];
  setLocalKeywords: (val: string[]) => void;
  localRules: string[];
  setLocalRules: (val: string[]) => void;
  generating: boolean;
  onGenerateSubmit: (e: React.FormEvent) => void;
}

export function GenerationSettingsForm({
  prompt,
  setPrompt,
  goal,
  setGoal,
  cta,
  setCta,
  visualStyle,
  setVisualStyle,
  targetPlatforms,
  handleTogglePlatform,
  referenceUrls,
  setReferenceUrls,
  referenceText,
  setReferenceText,
  activeWorkspace,
  localBrandName,
  setLocalBrandName,
  localWebsite,
  setLocalWebsite,
  localTargetAudience,
  setLocalTargetAudience,
  localBrandVoice,
  setLocalBrandVoice,
  localTone,
  setLocalTone,
  localKeywords,
  setLocalKeywords,
  localRules,
  setLocalRules,
  generating,
  onGenerateSubmit,
}: GenerationSettingsFormProps) {
  const { state } = useAppState();
  const { user } = useAuth();

  const isClient = user?.userType === 'client' || state.currentUserType === 'client';
  const isIndividual =
    user?.userType === 'individual' ||
    state.currentUserType === 'individual' ||
    state.accountType === 'individual';

  const isWorkspaceSelected = !!state.activeWorkspaceId;
  const isClientSelected = isClient || isIndividual || !!state.activeClientId;

  const isSubmitDisabled = generating || !isWorkspaceSelected || !isClientSelected;

  // Local input fields
  const [urlInput, setUrlInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    if (!referenceUrls.includes(url)) {
      setReferenceUrls([...referenceUrls, url]);
    }
    setUrlInput("");
  };

  const handleRemoveUrl = (target: string) => {
    setReferenceUrls(referenceUrls.filter((u) => u !== target));
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    const clean = keywordInput.trim().toLowerCase();
    if (!localKeywords.includes(clean)) {
      setLocalKeywords([...localKeywords, clean]);
    }
    setKeywordInput("");
  };

  const handleRemoveKeyword = (kw: string) => {
    setLocalKeywords(localKeywords.filter((k) => k !== kw));
  };

  const handleAddRule = () => {
    if (!ruleInput.trim()) return;
    const clean = ruleInput.trim();
    if (!localRules.includes(clean)) {
      setLocalRules([...localRules, clean]);
    }
    setRuleInput("");
  };

  const handleRemoveRule = (rule: string) => {
    setLocalRules(localRules.filter((r) => r !== rule));
  };

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-5">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-primary pb-2">
        <Sparkles className="w-4.5 h-4.5 text-instagram-pink" />
        <span>Generation Settings</span>
      </h3>

      <form onSubmit={onGenerateSubmit} className="space-y-5">
        {/* Prompt */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary" htmlFor="post-brief">
            Social Post Brief / Prompt <span className="font-normal text-text-secondary/70">(Optional)</span>
          </label>
          <textarea
            id="post-brief"
            placeholder="Describe your post concept. E.g., 'Teaser about organic summer clothing launch.'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition min-h-[80px]"
          />
        </div>

        {/* Target Platforms */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">
            Target Platforms
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Instagram Button */}
            <button
              type="button"
              onClick={() => handleTogglePlatform("instagram")}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
                targetPlatforms.includes("instagram")
                  ? "border-instagram-pink bg-pink-500/5 text-instagram-pink"
                  : "border-border-primary bg-bg-app text-text-secondary hover:text-text-primary hover:border-border-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                <span>Instagram Feed</span>
              </div>
              {targetPlatforms.includes("instagram") ? (
                <div className="w-4.5 h-4.5 rounded-full bg-instagram-pink text-white flex items-center justify-center shadow-sm shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </div>
              ) : (
                <div className="w-4.5 h-4.5 rounded-full border border-border-primary shrink-0" />
              )}
            </button>

            {/* LinkedIn Button */}
            <button
              type="button"
              onClick={() => handleTogglePlatform("linkedin")}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
                targetPlatforms.includes("linkedin")
                  ? "border-blue-600 bg-blue-600/5 text-blue-600"
                  : "border-border-primary bg-bg-app text-text-secondary hover:text-text-primary hover:border-border-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn Post</span>
              </div>
              {targetPlatforms.includes("linkedin") ? (
                <div className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </div>
              ) : (
                <div className="w-4.5 h-4.5 rounded-full border border-border-primary shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Select
              label="Objective"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              options={GOALS}
              className="py-2 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Select
              label="Call to Action (CTA)"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              options={CTAS}
              className="py-2 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Select
            label="Visual Aesthetic / Image Style"
            value={visualStyle}
            onChange={(e) => setVisualStyle(e.target.value)}
            options={VISUAL_STYLES}
            className="py-2 text-xs"
          />
        </div>

        {/* References & Inspiration */}
        <div className="border-t border-border-primary pt-4 space-y-4">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-text-secondary" />
            <span>Inspiration & References</span>
          </h4>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-text-secondary">
              Reference URLs / Links
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. competitor posts"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
                className="flex-1 border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1 text-xs focus:border-instagram-pink outline-none"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="bg-bg-hover hover:bg-slate-200 border border-border-primary px-3 py-1 rounded-xl text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </div>

            {referenceUrls.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {referenceUrls.map((u, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-bg-app border border-border-primary rounded-full px-2 py-0.5 text-[10px] text-text-secondary max-w-[200px] truncate"
                  >
                    <Link2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {u.replace(/^https?:\/\/(www\.)?/, "")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUrl(u)}
                    >
                      <X className="w-2.5 h-2.5 hover:text-text-primary" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-text-secondary" htmlFor="reference-text">
              Copy inspiration text / transcripts
            </label>
            <textarea
              id="reference-text"
              placeholder="Paste competitor text, copy drafts, or transcripts for context..."
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-2 text-xs focus:border-instagram-pink outline-none transition min-h-[60px]"
            />
          </div>
        </div>

        {/* Brand Guidelines */}
        <div className="border-t border-border-primary pt-4 space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-text-secondary" />
            <span>Workspace Brand Voice</span>
          </h4>

          {activeWorkspace ? (
            <div className="bg-bg-app border border-border-primary rounded-xl p-3.5 space-y-3 text-xs">
              {/* Brand Name */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-text-secondary" htmlFor="local-brand-name">
                  Brand Name
                </label>
                <input
                  id="local-brand-name"
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={localBrandName}
                  onChange={(e) => setLocalBrandName(e.target.value)}
                  className="border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none"
                />
              </div>

              {/* Website */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-text-secondary" htmlFor="local-brand-website">
                  Website URL
                </label>
                <input
                  id="local-brand-website"
                  type="text"
                  placeholder="e.g. https://example.com"
                  value={localWebsite}
                  onChange={(e) => setLocalWebsite(e.target.value)}
                  className="border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none"
                />
              </div>

              {/* Target Audience */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-text-secondary" htmlFor="local-brand-audience">
                  Target Audience
                </label>
                <input
                  id="local-brand-audience"
                  type="text"
                  placeholder="e.g. Eco-conscious millennials"
                  value={localTargetAudience}
                  onChange={(e) => setLocalTargetAudience(e.target.value)}
                  className="border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none"
                />
              </div>

              {/* Brand Voice / Description */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-text-secondary" htmlFor="local-brand-guidelines">
                  Brand Voice Description
                </label>
                <textarea
                  id="local-brand-guidelines"
                  placeholder="Describe the overall personality and style..."
                  value={localBrandVoice}
                  onChange={(e) => setLocalBrandVoice(e.target.value)}
                  className="border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none min-h-[60px] resize-y"
                />
              </div>

              {/* Active Tone */}
              <div className="flex flex-col gap-1">
                <Select
                  label="Active Tone"
                  value={localTone}
                  onChange={(e) => setLocalTone(e.target.value as Workspace['tone'])}
                  options={TONES.map((t) => ({
                    value: t,
                    label: t.charAt(0).toUpperCase() + t.slice(1),
                  }))}
                  className="py-1.5 text-xs"
                />
              </div>

              {/* Active Keywords */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-text-secondary">
                  Active Keywords
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. organic"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    className="flex-1 border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1 text-xs focus:border-instagram-pink outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="bg-bg-hover hover:bg-slate-200 border border-border-primary px-3 py-1 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {localKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 max-h-[80px] overflow-y-auto pr-1">
                    {localKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-0.5 bg-bg-card border border-border-primary rounded-full px-2 py-0.5 text-[10px] text-text-primary"
                      >
                        <span>#{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                        >
                          <X className="w-2.5 h-2.5 text-text-secondary hover:text-text-primary" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Writing Rules */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-text-secondary">
                  Writing Rules
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. No passive voice"
                    value={ruleInput}
                    onChange={(e) => setRuleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRule();
                      }
                    }}
                    className="flex-1 border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1 text-xs focus:border-instagram-pink outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="bg-bg-hover hover:bg-slate-200 border border-border-primary px-3 py-1 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {localRules.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {localRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-1.5 bg-bg-card border border-border-primary rounded-lg px-2.5 py-1 text-[10px] text-text-primary"
                      >
                        <span className="truncate">{rule}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(rule)}
                        >
                          <X className="w-2.5 h-2.5 text-text-secondary hover:text-text-primary shrink-0" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-secondary italic">
              No workspace active.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-xs font-bold hover:opacity-95 transition shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing references & generating copies...</span>
            </>
          ) : !isWorkspaceSelected ? (
            <span>Select a Workspace to Generate</span>
          ) : !isClientSelected ? (
            <span>Select a Client to Generate</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Content</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
