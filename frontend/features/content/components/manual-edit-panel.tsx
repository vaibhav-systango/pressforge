'use client';

import React, { useState } from 'react';
import { Edit3, X, Plus } from 'lucide-react';

interface ManualEditPanelProps {
  activePlatformTab: 'instagram' | 'linkedin';
  caption: string;
  setCaption: (val: string) => void;
  hashtags: string[];
  setHashtags: (val: string[]) => void;
  imageBrief: string;
  setImageBrief: (val: string) => void;
  liCaption: string;
  setLinkedinCaption: (val: string) => void;
  liHashtags: string[];
  setLinkedinHashtags: (val: string[]) => void;
  liImageBrief: string;
  setLinkedinImageBrief: (val: string) => void;
}

export function ManualEditPanel({
  activePlatformTab,
  caption,
  setCaption,
  hashtags,
  setHashtags,
  imageBrief,
  setImageBrief,
  liCaption,
  setLinkedinCaption,
  liHashtags,
  setLinkedinHashtags,
  liImageBrief,
  setLinkedinImageBrief,
}: ManualEditPanelProps) {
  const [newHashtag, setNewHashtag] = useState('');
  const [newLiHashtag, setNewLinkedinHashtag] = useState('');

  const handleAddHashtag = () => {
    const normalized = newHashtag.trim().replace(/^#/, "");
    if (normalized && !hashtags.includes(normalized)) {
      setHashtags([...hashtags, normalized]);
      setNewHashtag("");
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleAddLinkedinHashtag = () => {
    const normalized = newLiHashtag.trim().replace(/^#/, "");
    if (normalized && !liHashtags.includes(normalized)) {
      setLinkedinHashtags([...liHashtags, normalized]);
      setNewLinkedinHashtag("");
    }
  };

  const handleRemoveLinkedinHashtag = (tag: string) => {
    setLinkedinHashtags(liHashtags.filter((t) => t !== tag));
  };

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-border-primary pb-2">
        <Edit3 className="w-4 h-4 text-text-secondary" />
        <span>
          Manual Edits:{" "}
          {activePlatformTab === "instagram"
            ? "Instagram"
            : "LinkedIn"}
        </span>
      </h3>

      {activePlatformTab === "instagram" ? (
        /* Instagram Form */
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-text-secondary" htmlFor="insta-caption-edit">
              Instagram Caption
            </label>
            <textarea
              id="insta-caption-edit"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none transition min-h-[80px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-text-secondary">
              Instagram Hashtags
            </label>
            <div className="flex flex-wrap gap-1 p-1.5 border border-border-primary bg-bg-app rounded-xl min-h-[35px] max-h-[100px] overflow-y-auto">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 bg-bg-card border border-border-primary rounded-full px-1.5 py-0.5 text-[9px] text-text-primary"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHashtag(tag)}
                  >
                    <X className="w-2.5 h-2.5 hover:text-text-primary" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 border-l border-border-primary pl-1.5 ml-1">
                <input
                  type="text"
                  placeholder="Tag"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddHashtag();
                    }
                  }}
                  className="text-[9px] text-text-primary bg-transparent outline-none w-10 border-0 p-0"
                />
                <button type="button" onClick={handleAddHashtag}>
                  <Plus className="w-2.5 h-2.5 hover:text-instagram-pink" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LinkedIn Form */
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-text-secondary" htmlFor="linkedin-caption-edit">
              LinkedIn Post Text
            </label>
            <textarea
              id="linkedin-caption-edit"
              value={liCaption}
              onChange={(e) => setLinkedinCaption(e.target.value)}
              className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none transition min-h-[90px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-text-secondary">
              LinkedIn Hashtags
            </label>
            <div className="flex flex-wrap gap-1 p-1.5 border border-border-primary bg-bg-app rounded-xl min-h-[35px] max-h-[100px] overflow-y-auto">
              {liHashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 bg-bg-card border border-border-primary rounded-full px-1.5 py-0.5 text-[9px] text-text-primary"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLinkedinHashtag(tag)}
                  >
                    <X className="w-2.5 h-2.5 hover:text-text-primary" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 border-l border-border-primary pl-1.5 ml-1">
                <input
                  type="text"
                  placeholder="Tag"
                  value={newLiHashtag}
                  onChange={(e) =>
                    setNewLinkedinHashtag(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLinkedinHashtag();
                    }
                  }}
                  className="text-[9px] text-text-primary bg-transparent outline-none w-10 border-0 p-0"
                />
                <button
                  type="button"
                  onClick={handleAddLinkedinHashtag}
                >
                  <Plus className="w-2.5 h-2.5 hover:text-instagram-pink" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Common Visual Concept Brief */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold text-text-secondary" htmlFor="visual-brief-edit">
          Visual Concept Brief
        </label>
        <textarea
          id="visual-brief-edit"
          value={
            activePlatformTab === "instagram"
              ? imageBrief
              : liImageBrief
          }
          onChange={(e) => {
            if (activePlatformTab === "instagram") {
              setImageBrief(e.target.value);
            } else {
              setLinkedinImageBrief(e.target.value);
            }
          }}
          className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none transition min-h-[60px]"
        />
      </div>
    </div>
  );
}
