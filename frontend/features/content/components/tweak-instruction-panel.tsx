'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface TweakInstructionPanelProps {
  tweakScope: 'active' | 'both';
  setTweakScope: (scope: 'active' | 'both') => void;
  tweakInstruction: string;
  setTweakInstruction: (val: string) => void;
  onApplyTweak: (instruction: string) => void;
}

export function TweakInstructionPanel({
  tweakScope,
  setTweakScope,
  tweakInstruction,
  setTweakInstruction,
  onApplyTweak,
}: TweakInstructionPanelProps) {
  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-border-primary pb-2">
        <Sparkles className="w-4 h-4 text-instagram-pink" />
        <span>Polish & Tweak with AI</span>
      </h3>

      {/* Scope selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] font-semibold text-text-secondary">
          Tweak Scope
        </label>
        <div className="flex gap-1.5 bg-bg-app p-1 border border-border-primary rounded-lg text-[9px] font-bold">
          <button
            type="button"
            onClick={() => setTweakScope("active")}
            className={`flex-1 py-1 rounded transition cursor-pointer ${
              tweakScope === "active"
                ? "bg-bg-card shadow-xs text-text-primary"
                : "text-text-secondary"
            }`}
          >
            Active Tab Only
          </button>
          <button
            type="button"
            onClick={() => setTweakScope("both")}
            className={`flex-1 py-1 rounded transition cursor-pointer ${
              tweakScope === "both"
                ? "bg-bg-card shadow-xs text-text-primary"
                : "text-text-secondary"
            }`}
          >
            Both Channels
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-text-secondary">
          Custom Tweak Directive
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="e.g. 'make it shorter'"
            value={tweakInstruction}
            onChange={(e) => setTweakInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onApplyTweak(tweakInstruction);
              }
            }}
            className="flex-1 border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none"
          />
          <button
            type="button"
            onClick={() => onApplyTweak(tweakInstruction)}
            className="bg-instagram-pink text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
          >
            Tweak
          </button>
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <label className="text-[10px] font-semibold text-text-secondary block">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onApplyTweak("Make Shorter")}
            className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
          >
            📝 Shorten Copy
          </button>
          <button
            onClick={() => onApplyTweak("Add More Emojis")}
            className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
          >
            🌟 Add Emojis
          </button>
          <button
            onClick={() =>
              onApplyTweak("Stronger Call to Action")
            }
            className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
          >
            🚀 Emphasize CTA
          </button>
          <button
            onClick={() => onApplyTweak("Exciting Bold Tone")}
            className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
          >
            🔥 Make Tone Bold
          </button>
        </div>
      </div>
    </div>
  );
}
