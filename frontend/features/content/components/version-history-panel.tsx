'use client';

import React from 'react';
import { Undo } from 'lucide-react';

interface LocalHistoryItem {
  version: number;
  timestamp: string;
  action: string;
  caption: string;
  hashtags: string[];
  imageBrief: string;
  liCaption: string;
  liHashtags: string[];
  liImageBrief: string;
  imageUrl: string;
}

interface VersionHistoryPanelProps {
  history: LocalHistoryItem[];
  activePlatformTab: 'instagram' | 'linkedin';
  onRestoreVersion: (histItem: LocalHistoryItem) => void;
}

export function VersionHistoryPanel({
  history,
  activePlatformTab,
  onRestoreVersion,
}: VersionHistoryPanelProps) {
  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-border-primary pb-2">
        <Undo className="w-4 h-4 text-text-secondary" />
        <span>Version History</span>
      </h3>

      <div className="relative border-l-2 border-border-primary pl-3 ml-1.5 space-y-4 py-1.5 max-h-[250px] overflow-y-auto pr-1">
        {history.map((hist, index) => (
          <div key={index} className="relative text-[10px]">
            <span
              className={`absolute -left-[18.5px] top-1 w-2 h-2 rounded-full border border-bg-card ${
                index === 0 ? "bg-instagram-pink" : "bg-slate-300"
              }`}
            />

            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">
                  v{hist.version}.0
                </span>
                <span className="text-[8px] text-text-secondary">
                  {new Date(hist.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-instagram-pink font-semibold">
                {hist.action}
              </p>
              <p className="text-[9px] text-text-secondary line-clamp-1 italic">
                &quot;
                {(activePlatformTab === "instagram"
                  ? hist.caption
                  : hist.liCaption) || hist.caption}
                &quot;
              </p>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => onRestoreVersion(hist)}
                  className="mt-1 text-[9px] font-bold text-blue-500 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0 p-0 outline-none"
                >
                  <Undo className="w-2.5 h-2.5" /> Restore
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
