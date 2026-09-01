'use client';

import React from 'react';
import { Bot, User, Clock, Check, RotateCcw } from 'lucide-react';
import type { DraftHistoryEntry } from '@/lib/types';
import Image from 'next/image';

interface FeedbackThreadProps {
  history: DraftHistoryEntry[];
  currentVersion: number;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function FeedbackThread({ history, currentVersion }: FeedbackThreadProps) {
  if (!history || history.length === 0) return null;

  // Show oldest first (chronological order for chat)
  const ordered = [...history].reverse();

  return (
    <div className="flex flex-col gap-4">
      {ordered.map((entry, idx) => {
        const isClientFeedback = entry.action === 'Client Requested Changes';
        const isAiRevision = entry.action === 'AI Revised Post';
        const isApproved = entry.action === 'Post Approved & Scheduled';
        const isInitial = entry.action === 'Draft Created';

        // ── Client feedback bubble (right) ───────────────────────────────
        if (isClientFeedback) {
          return (
            <div key={idx} className="flex gap-2 justify-end">
              <div className="max-w-[90%] space-y-1">
                <div className="bg-gradient-to-br from-[#F58529]/15 to-[#DD2A7B]/15 border border-[#DD2A7B]/30 rounded-2xl rounded-tr-sm px-4 py-3 space-y-2">
                  <p className="text-xs text-text-primary font-medium leading-relaxed">
                    {entry.feedback}
                  </p>
                  {/* Quoted previous version content */}
                  {(entry.caption || entry.imageUrl) && (
                    <div className="pt-2 border-t border-[#DD2A7B]/20 text-[10px] space-y-1 text-text-secondary">
                      <span className="font-bold text-text-secondary/80 uppercase tracking-wider block text-[9px]">
                        Feedback on v{entry.version} draft:
                      </span>
                      {entry.caption && (
                        <p className="italic line-clamp-2 leading-relaxed">&quot;{entry.caption}&quot;</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <User className="w-3 h-3 text-text-secondary" />
                  <span className="text-[10px] text-text-secondary">Client • v{entry.version}</span>
                  {entry.timestamp && (
                    <span className="text-[10px] text-text-secondary">• {timeAgo(entry.timestamp)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // ── AI revision bubble (left) ─────────────────────────────────────
        if (isAiRevision) {
          const isCurrent = entry.version === currentVersion;
          return (
            <div key={idx} className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="max-w-[90%] space-y-1">
                <div className={`border rounded-2xl rounded-tl-sm px-4 py-3 space-y-2 ${isCurrent ? 'bg-green-500/5 border-green-500/30' : 'bg-bg-card border-border-primary'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${isCurrent ? 'text-green-500' : 'text-purple-500'}`}>
                      <RotateCcw className="w-3 h-3" />
                      AI Revised Version {entry.version}
                    </p>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                        Current Active Post
                      </span>
                    )}
                  </div>
                  {entry.caption && (
                    <p className="text-xs text-text-primary leading-relaxed">{entry.caption}</p>
                  )}
                  {entry.hashtags && entry.hashtags.length > 0 && (
                    <p className="text-[10px] text-instagram-pink font-semibold">
                      {entry.hashtags.map((h) => `#${h}`).join(' ')}
                    </p>
                  )}
                  {entry.imageUrl && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border-primary">
                      <Image src={entry.imageUrl} alt={`Revised version ${entry.version}`} fill unoptimized className="object-cover" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-secondary">PressForge AI</span>
                  {entry.timestamp && (
                    <span className="text-[10px] text-text-secondary">• {timeAgo(entry.timestamp)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // ── Approved pill (center) ────────────────────────────────────────
        if (isApproved) {
          return (
            <div key={idx} className="flex justify-center my-1">
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5">
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[11px] font-bold text-green-500">Approved & Scheduled</span>
                {entry.timestamp && (
                  <span className="text-[10px] text-text-secondary">• {timeAgo(entry.timestamp)}</span>
                )}
              </div>
            </div>
          );
        }

        // ── Initial draft bubble (left) ────────────────────────────────────
        if (isInitial && entry.caption) {
          return (
            <div key={idx} className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="max-w-[90%] space-y-1">
                <div className="bg-bg-card border border-border-primary rounded-2xl rounded-tl-sm px-4 py-3 space-y-2">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Initial Draft (v{entry.version})
                  </p>
                  <p className="text-xs text-text-primary leading-relaxed">{entry.caption}</p>
                  {entry.hashtags && entry.hashtags.length > 0 && (
                    <p className="text-[10px] text-instagram-pink font-semibold">
                      {entry.hashtags.map((h) => `#${h}`).join(' ')}
                    </p>
                  )}
                  {entry.imageUrl && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border-primary">
                      <Image src={entry.imageUrl} alt="Initial draft image" fill unoptimized className="object-cover" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-secondary">PressForge AI</span>
                  {entry.timestamp && (
                    <span className="text-[10px] text-text-secondary">• {timeAgo(entry.timestamp)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
