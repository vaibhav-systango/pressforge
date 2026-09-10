'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send as ShareIcon, Bookmark, MoreHorizontal, ThumbsUp, Share2, Send, RefreshCw, Copy, Check } from 'lucide-react';

interface ImagePromptEvaluation {
  overallScore: number;
  status: 'ready' | 'needs_review';
  criteria: Array<{ name: string; score: number; maxScore: number }>;
  suggestions: string[];
}

interface PostPreviewProps {
  activePlatformTab: 'instagram' | 'linkedin';
  localBrandName: string;
  generatedImageUrl: string;
  goal: string;
  caption: string;
  hashtags: string[];
  liCaption: string;
  liHashtags: string[];
  localWebsite: string;
  generating?: boolean;
  imageBrief?: string;
  liImageBrief?: string;
  geminiPrompt?: string;
  imagePromptEvaluation?: ImagePromptEvaluation;
}

/** Render the generated post preview for the selected social platform. */
export function PostPreview({
  activePlatformTab,
  localBrandName,
  generatedImageUrl,
  goal,
  caption,
  hashtags,
  liCaption,
  liHashtags,
  localWebsite,
  generating = false,
  imageBrief = '',
  liImageBrief = '',
  geminiPrompt = '',
  imagePromptEvaluation,
}: PostPreviewProps) {
  const [copiedInsta, setCopiedInsta] = useState(false);
  const [copiedLi, setCopiedLi] = useState(false);
  const [copiedGemini, setCopiedGemini] = useState(false);

  /** Copy preview text and briefly expose confirmation through the given setter. */
  const handleCopy = (text: string, setter: (v: boolean) => void) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  };
  if (activePlatformTab === 'instagram') {
    return (
      <div className="bg-bg-card border border-border-primary rounded-2xl overflow-hidden shadow-md max-w-md mx-auto">
        <div className="flex items-center justify-between p-3 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white font-black text-[10px]">
              {localBrandName?.charAt(0) || "W"}
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-primary">
                {localBrandName || "Brand Name"}
              </p>
              <p className="text-[9px] text-text-secondary">
                Sponsored • AI Mockup
              </p>
            </div>
          </div>
        </div>

        {generating ? (
          <div className="w-full aspect-square bg-bg-app flex flex-col items-center justify-center gap-3 text-text-secondary animate-pulse border-b border-border-primary relative">
            <RefreshCw className="w-7 h-7 animate-spin text-instagram-pink" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Generating AI Image...</span>
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
              {goal}
            </span>
          </div>
        ) : (
          <div className="w-full aspect-square bg-bg-app flex items-center justify-center overflow-hidden border-b border-border-primary relative">
            {generatedImageUrl && (
              <Image
                src={generatedImageUrl}
                alt="Mockup"
                fill
                unoptimized
                className="object-cover"
              />
            )}
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
              {goal}
            </span>
          </div>
        )}

        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-text-primary">
            <Heart className="w-4.5 h-4.5 hover:text-red-500 transition cursor-pointer" />
            <MessageCircle className="w-4.5 h-4.5 hover:opacity-80 transition cursor-pointer" />
            <ShareIcon className="w-4.5 h-4.5 hover:opacity-80 transition cursor-pointer" />
          </div>
          <Bookmark className="w-4.5 h-4.5 text-text-primary hover:opacity-80 transition cursor-pointer" />
        </div>

        {/* Image Prompt Tag */}
        {!generating && imagePromptEvaluation && (
          <div className="px-3 pb-2">
            <div className={`rounded-md border px-2 py-1.5 text-[9px] ${
              imagePromptEvaluation.status === 'ready'
                ? 'border-green-500/40 bg-green-500/10 text-green-600'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-700'
            }`}>
              <p className="font-bold">
                Image prompt rubric: {imagePromptEvaluation.overallScore}/100 · {imagePromptEvaluation.status === 'ready' ? 'Ready' : 'Needs review'}
              </p>
              {imagePromptEvaluation.suggestions[0] && (
                <p className="mt-0.5 text-text-secondary">{imagePromptEvaluation.suggestions[0]}</p>
              )}
            </div>
          </div>
        )}
        {!generating && imageBrief && (
          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={() => handleCopy(imageBrief, setCopiedInsta)}
              title={imageBrief}
              className="inline-flex items-center gap-1.5 max-w-full bg-bg-app border border-border-primary rounded-md px-2 py-1 text-[9px] text-text-secondary hover:text-text-primary hover:border-instagram-pink transition cursor-pointer group"
            >
              {copiedInsta
                ? <Check className="w-2.5 h-2.5 text-green-500 shrink-0" />
                : <Copy className="w-2.5 h-2.5 shrink-0 group-hover:text-instagram-pink" />
              }
              <span className="truncate max-w-[240px]">
                {copiedInsta ? 'Prompt copied!' : imageBrief.slice(0, 60) + (imageBrief.length > 60 ? '…' : '')}
              </span>
            </button>
          </div>
        )}

        {/* Gemini Prompt Tag */}
        {!generating && geminiPrompt && (
          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={() => handleCopy(geminiPrompt, setCopiedGemini)}
              title={geminiPrompt}
              className="inline-flex items-center gap-1.5 max-w-full bg-bg-app border border-border-primary rounded-md px-2 py-1 text-[9px] text-text-secondary hover:text-text-primary hover:border-purple-500 transition cursor-pointer group"
            >
              {copiedGemini
                ? <Check className="w-2.5 h-2.5 text-green-500 shrink-0" />
                : <Copy className="w-2.5 h-2.5 shrink-0 group-hover:text-purple-500" />
              }
              <span className="truncate max-w-[240px] font-semibold text-purple-500/70 group-hover:text-purple-500">
                {copiedGemini ? 'Copied!' : 'Gemini Prompt · click to copy'}
              </span>
            </button>
          </div>
        )}

        {generating ? (
          <div className="px-3 pb-4 space-y-2 animate-pulse">
            <div className="h-3.5 bg-bg-app rounded-md w-5/6"></div>
            <div className="h-3.5 bg-bg-app rounded-md w-2/3"></div>
            <div className="h-3 bg-bg-app rounded-md w-1/3"></div>
          </div>
        ) : (
          <div className="px-3 pb-3 space-y-1 text-[11px] text-text-primary">
            <p className="leading-relaxed">
              <span className="font-bold mr-1">
                {localBrandName || "brand"}
              </span>
              {caption}
            </p>
            <p className="text-instagram-pink font-semibold">
              {hashtags.map((h) => `#${h}`).join(" ")}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl overflow-hidden shadow-md max-w-md mx-auto p-4 space-y-3 text-xs">
      {/* LinkedIn Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-sm bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs">
            {localBrandName?.charAt(0) || "W"}
          </div>
          <div>
            <p className="font-bold text-text-primary text-xs leading-snug flex items-center gap-1">
              <span>{localBrandName || "Brand Name"}</span>
              <span className="text-[9px] font-normal text-text-secondary bg-bg-app border border-border-primary px-1 rounded-sm">
                2nd
              </span>
            </p>
            <p className="text-[10px] text-text-secondary leading-none mt-0.5">
              15,240 followers
            </p>
            <p className="text-[9px] text-text-secondary mt-0.5">
              1h • Edited • 🌐
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-text-secondary hover:text-text-primary"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* LinkedIn Copy */}
      {generating ? (
        <div className="space-y-2 animate-pulse py-1">
          <div className="h-3.5 bg-bg-app rounded-md w-11/12"></div>
          <div className="h-3.5 bg-bg-app rounded-md w-full"></div>
          <div className="h-3.5 bg-bg-app rounded-md w-4/5"></div>
          <div className="h-3 bg-bg-app rounded-md w-1/2"></div>
        </div>
      ) : (
        <div className="space-y-2 text-text-primary text-[11px] leading-relaxed whitespace-pre-wrap">
          <p>{liCaption}</p>
          <p className="text-blue-700 dark:text-blue-400 font-semibold">
            {liHashtags.map((h) => `#${h}`).join(" ")}
          </p>
        </div>
      )}

      {/* Attachment card */}
      {generating ? (
        <div className="border border-border-primary rounded-lg overflow-hidden bg-bg-app animate-pulse">
          <div className="w-full h-48 flex flex-col items-center justify-center gap-3 text-text-secondary">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Generating AI Image...</span>
          </div>
          <div className="p-3 border-t border-border-primary bg-bg-card space-y-2">
            <div className="h-3.5 bg-bg-app rounded-md w-1/3"></div>
            <div className="h-2.5 bg-bg-app rounded-md w-1/4"></div>
          </div>
        </div>
      ) : generatedImageUrl ? (
        <div className="border border-border-primary rounded-lg overflow-hidden bg-bg-app">
          <Image
            src={generatedImageUrl}
            alt="Attachment"
            width={600}
            height={400}
            unoptimized
            className="w-full object-cover max-h-56"
          />
          <div className="p-2 border-t border-border-primary">
            <p className="font-bold text-[10px] truncate text-text-primary">
              {goal} Update
            </p>
            <p className="text-[9px] text-text-secondary truncate">
              {localWebsite
                ? localWebsite.replace(/^https?:\/\/(www\.)?/, "")
                : (localBrandName || "brand")
                    .toLowerCase()
                    .replace(/\s+/g, "") + ".com"}
            </p>
          </div>
        </div>
      ) : null}

      {/* LinkedIn Footer Actions */}
      <div className="border-t border-border-primary pt-2 flex items-center justify-between text-text-secondary text-[10px] font-bold">
        <button
          type="button"
          className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer bg-transparent border-0 outline-none"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Like</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer bg-transparent border-0 outline-none"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Comment</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer bg-transparent border-0 outline-none"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Repost</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer bg-transparent border-0 outline-none"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>

      {/* LinkedIn Image Prompt Tag */}
      {!generating && (liImageBrief || imageBrief) && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => handleCopy(liImageBrief || imageBrief, setCopiedLi)}
            title={liImageBrief || imageBrief}
            className="inline-flex items-center gap-1.5 max-w-full bg-bg-app border border-border-primary rounded-md px-2 py-1 text-[9px] text-text-secondary hover:text-text-primary hover:border-blue-500 transition cursor-pointer group"
          >
            {copiedLi
              ? <Check className="w-2.5 h-2.5 text-green-500 shrink-0" />
              : <Copy className="w-2.5 h-2.5 shrink-0 group-hover:text-blue-500" />
            }
            <span className="truncate max-w-[240px]">
              {copiedLi ? 'Prompt copied!' : (liImageBrief || imageBrief).slice(0, 60) + ((liImageBrief || imageBrief).length > 60 ? '…' : '')}
            </span>
          </button>
        </div>
      )}

      {/* Gemini Prompt Tag */}
      {!generating && geminiPrompt && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => handleCopy(geminiPrompt, setCopiedGemini)}
            title={geminiPrompt}
            className="inline-flex items-center gap-1.5 max-w-full bg-bg-app border border-border-primary rounded-md px-2 py-1 text-[9px] text-text-secondary hover:text-text-primary hover:border-purple-500 transition cursor-pointer group"
          >
            {copiedGemini
              ? <Check className="w-2.5 h-2.5 text-green-500 shrink-0" />
              : <Copy className="w-2.5 h-2.5 shrink-0 group-hover:text-purple-500" />
            }
            <span className="truncate max-w-[240px] font-semibold text-purple-500/70 group-hover:text-purple-500">
              {copiedGemini ? 'Copied!' : 'Gemini Prompt · click to copy'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
