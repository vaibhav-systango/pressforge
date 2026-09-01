'use client';

import React, { useState } from 'react';
import { Building, Globe, Save, X, Briefcase, Smile, Sparkles, Flame, Heart } from 'lucide-react';
import type { Workspace } from '@/lib/types';
import { 
  validateWorkspaceName, 
  validateWebsiteUrl, 
  validateKeyword, 
  validateRule, 
  validateBrandVoice 
} from '@/lib/utils/validation';

const TONES = ['professional', 'friendly', 'witty', 'bold', 'empathetic'] as const;
type ToneOption = (typeof TONES)[number];

const TONE_ICONS = {
  professional: Briefcase,
  friendly: Smile,
  witty: Sparkles,
  bold: Flame,
  empathetic: Heart,
};

interface EditWorkspaceFormProps {
  brandName: string;
  setBrandName: (val: string) => void;
  website: string;
  setWebsite: (val: string) => void;
  prompt: string;
  setPrompt: (val: string) => void;
  tone: ToneOption;
  setTone: (val: ToneOption) => void;
  brandVoice: string;
  setBrandVoice: (val: string) => void;
  keywords: string[];
  setKeywords: (val: string[]) => void;
  rules: string[];
  setRules: (val: string[]) => void;
  isSavingWorkspace: boolean;
  editValidationError: string | null;
  brandNameError: string | null;
  setBrandNameError: (val: string | null) => void;
  websiteError: string | null;
  setWebsiteError: (val: string | null) => void;
  brandVoiceError: string | null;
  setBrandVoiceError: (val: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditWorkspaceForm({
  brandName,
  setBrandName,
  website,
  setWebsite,
  prompt,
  setPrompt,
  tone,
  setTone,
  brandVoice,
  setBrandVoice,
  keywords,
  setKeywords,
  rules,
  setRules,
  isSavingWorkspace,
  editValidationError,
  brandNameError,
  setBrandNameError,
  websiteError,
  setWebsiteError,
  brandVoiceError,
  setBrandVoiceError,
  onSubmit,
}: EditWorkspaceFormProps) {
  // Local input states for keyword/rule addition
  const [keywordInput, setKeywordInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);

  const handleAddKeyword = () => {
    setKeywordError(null);
    const clean = keywordInput.trim();
    const err = validateKeyword(clean);
    if (err) {
      setKeywordError(err);
      return;
    }
    if (keywords.includes(clean.toLowerCase())) {
      setKeywordError('Keyword already exists');
      return;
    }
    setKeywords([...keywords, clean.toLowerCase()]);
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleAddRule = () => {
    setRuleError(null);
    const clean = ruleInput.trim();
    const err = validateRule(clean);
    if (err) {
      setRuleError(err);
      return;
    }
    if (rules.includes(clean)) {
      setRuleError('Rule already exists');
      return;
    }
    setRules([...rules, clean]);
    setRuleInput('');
  };

  const handleRemoveRule = (rule: string) => {
    setRules(rules.filter((r) => r !== rule));
  };

  return (
    <div className="md:col-span-12 bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
      <form onSubmit={onSubmit} className="space-y-6">
        <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2 flex items-center gap-1.5">
          <Building className="w-4 h-4 text-text-secondary" />
          <span>Workspace Properties & Guidelines</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Workspace properties */}
          <div className="space-y-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary" htmlFor="brand-name">
                Workspace / Brand Name
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="brand-name"
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => {
                    setBrandName(e.target.value.replace(/[^a-zA-Z0-9\s_-]/g, ''));
                    setBrandNameError(null);
                  }}
                  onBlur={() => {
                    setBrandNameError(validateWorkspaceName(brandName));
                  }}
                  className="pl-10 pr-3.5 py-2.5 w-full border border-border-primary bg-bg-app text-text-primary rounded-xl text-xs focus:border-instagram-pink outline-none transition"
                />
              </div>
              {brandNameError ? (
                <p className="text-[10px] text-red-500 font-semibold">{brandNameError}</p>
              ) : (
                <p className="text-[10px] text-text-secondary">
                  This name is used to identify your workspace/brand.
                </p>
              )}
            </div>

            {/* Website */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary" htmlFor="website">
                Website URL (Optional)
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => {
                    setWebsite(e.target.value);
                    setWebsiteError(null);
                  }}
                  onBlur={() => {
                    setWebsiteError(validateWebsiteUrl(website));
                  }}
                  className="pl-10 pr-3.5 py-2.5 w-full border border-border-primary bg-bg-app text-text-primary rounded-xl text-xs focus:border-instagram-pink outline-none transition"
                />
              </div>
              {websiteError ? (
                <p className="text-[10px] text-red-500 font-semibold">{websiteError}</p>
              ) : (
                <p className="text-[10px] text-text-secondary">
                  Used to index keywords and context for generated drafts.
                </p>
              )}
            </div>

            {/* Tone */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-primary">Active Writing Tone</label>
              <p className="text-[10px] text-text-secondary">
                Select the primary communication style of your brand voice.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TONES.map((t) => {
                  const IconComponent = TONE_ICONS[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`border p-3 rounded-xl text-xs font-bold capitalize transition duration-150 cursor-pointer flex flex-col items-center gap-1.5 justify-center ${
                        tone === t
                          ? 'border-instagram-pink text-instagram-pink bg-pink-50 dark:bg-pink-950/20 shadow-sm font-semibold'
                          : 'border-border-primary text-text-secondary hover:bg-bg-hover'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <span className="text-[10px]">{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand Voice Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary" htmlFor="brand-voice-description">
                Brand Voice Guidelines / Description
              </label>
              <textarea
                id="brand-voice-description"
                placeholder="Describe your brand voice, formatting requirements, or guidelines..."
                value={brandVoice}
                onChange={(e) => {
                  setBrandVoice(e.target.value);
                  setBrandVoiceError(null);
                }}
                onBlur={() => {
                  setBrandVoiceError(validateBrandVoice(brandVoice));
                }}
                rows={4}
                className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none resize-none transition"
              />
              {brandVoiceError ? (
                <p className="text-[10px] text-red-500 font-semibold">{brandVoiceError}</p>
              ) : (
                <p className="text-[10px] text-text-secondary">
                  Describe detailed instructions on style rules, tone shifts, and formatting instructions.
                </p>
              )}
            </div>

            {/* Social Post Brief / Prompt */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary" htmlFor="brand-prompt">
                Social Post Brief / Prompt <span className="text-instagram-pink font-bold">*</span>
              </label>
              <textarea
                id="brand-prompt"
                required
                placeholder="Default social post brief or concept for this workspace..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none resize-none transition"
              />
              <p className="text-[10px] text-text-secondary">
                This prompt will serve as the default post concept for content generation in this workspace.
              </p>
            </div>
          </div>

          {/* Right Column: Writing guidelines */}
          <div className="space-y-6">
            {/* Keywords */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-primary">Brand Keywords</label>
              <p className="text-[10px] text-text-secondary">
                Add words or phrases that define your brand identity (e.g. #eco, #vegan).
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Add tag"
                  value={keywordInput}
                  onChange={(e) => {
                    setKeywordInput(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''));
                    setKeywordError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  onBlur={() => {
                    if (keywordInput.trim()) {
                      setKeywordError(validateKeyword(keywordInput.trim()));
                    }
                  }}
                  className="flex-1 min-w-0 border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="w-full sm:w-auto shrink-0 bg-instagram-pink hover:opacity-90 text-white border-0 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Add
                </button>
              </div>
              {keywordError && (
                <p className="text-[10px] text-red-500 font-semibold mt-1">{keywordError}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2 max-h-[100px] overflow-y-auto pr-1">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1.5 bg-pink-50/50 dark:bg-pink-950/10 border border-instagram-pink/20 rounded-lg px-2.5 py-1 text-xs text-instagram-pink font-semibold"
                  >
                    <span>#{kw}</span>
                    <button type="button" onClick={() => handleRemoveKeyword(kw)} className="hover:bg-instagram-pink/10 rounded p-0.5 transition">
                      <X className="w-3.5 h-3.5 text-instagram-pink" />
                    </button>
                  </span>
                ))}
                {keywords.length === 0 && (
                  <span className="text-[11px] text-text-secondary italic">No keywords added yet.</span>
                )}
              </div>
            </div>

            {/* Rules */}
            <div className="flex flex-col gap-1.5 pt-4 border-t border-border-primary">
              <label className="text-xs font-bold text-text-primary">Writing Prompt Rules</label>
              <p className="text-[10px] text-text-secondary">
                Define specific constraints or guidelines for the AI generation model.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. Always capitalize PR title"
                  value={ruleInput}
                  onChange={(e) => {
                    setRuleInput(e.target.value);
                    setRuleError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRule();
                    }
                  }}
                  onBlur={() => {
                    if (ruleInput.trim()) {
                      setRuleError(validateRule(ruleInput.trim()));
                    }
                  }}
                  className="flex-1 min-w-0 border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="w-full sm:w-auto shrink-0 bg-instagram-pink hover:opacity-90 text-white border-0 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Add
                </button>
              </div>
              {ruleError && (
                <p className="text-[10px] text-red-500 font-semibold mt-1">{ruleError}</p>
              )}
              <ul className="flex flex-col gap-2 mt-2 max-h-[140px] overflow-y-auto pr-1">
                {rules.map((rule) => (
                  <li
                    key={rule}
                    className="flex items-start justify-between bg-bg-app/60 border border-border-primary rounded-xl p-2.5 text-xs text-text-primary shadow-sm"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-instagram-pink mt-1.5 shrink-0" />
                      <span className="break-all pr-2">{rule}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveRule(rule)} className="shrink-0 p-1 hover:bg-bg-hover rounded-lg transition">
                      <X className="w-3.5 h-3.5 text-text-secondary hover:text-text-primary" />
                    </button>
                  </li>
                ))}
                {rules.length === 0 && (
                  <li className="text-[11px] text-text-secondary italic py-1">No writing prompt rules added yet.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {editValidationError && (
          <div className="text-xs text-red-500 font-semibold mt-2 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 py-2.5 rounded-xl">
            {editValidationError}
          </div>
        )}

        <div className="pt-4 border-t border-border-primary">
          <button
            type="submit"
            disabled={isSavingWorkspace}
            className={`w-full flex items-center justify-center gap-1.5 bg-text-primary hover:opacity-90 text-bg-card py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${isSavingWorkspace ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isSavingWorkspace ? (
              <span className="w-4 h-4 border-2 border-bg-card/30 border-t-bg-card rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSavingWorkspace ? 'Saving...' : 'Save Workspace settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
