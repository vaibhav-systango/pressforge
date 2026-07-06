'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { 
  ChevronLeft, Save, Sparkles, Clock, X, Plus, Heart, 
  MessageCircle, Send as ShareIcon, Bookmark, Undo, Link2, 
  RefreshCw, Send, Edit3, Building, Linkedin, Share2, ThumbsUp, MoreHorizontal,
  Instagram, Check
} from 'lucide-react';

export function ContentDetailView() {
  const router = useRouter();
  const { id } = useParams();
  const { state, updateDraft } = useAppState();

  const draft = state.drafts.find((d) => d.id === id);

  if (!draft) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-text-primary">Draft Not Found</h2>
        <p className="text-sm text-text-secondary mt-2">The requested draft could not be located.</p>
        <Link href="/app/content" className="text-xs text-instagram-pink font-semibold mt-4 hover:underline inline-block">
          Return to Content Planner
        </Link>
      </div>
    );
  }

  const activeWorkspace = state.workspaces.find((w) => w.id === draft.workspaceId) || state.workspaces[0];

  // Simulated image fallback
  const getSimulatedImage = (promptText: string) => {
    const text = promptText.toLowerCase();
    if (text.includes('summer') || text.includes('dress') || text.includes('fashion') || text.includes('wear')) {
      return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';
    }
    if (text.includes('pack') || text.includes('box') || text.includes('deliver') || text.includes('shipping') || text.includes('sustain')) {
      return 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80';
    }
    if (text.includes('coffee') || text.includes('morning') || text.includes('latte') || text.includes('cafe')) {
      return 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80';
    }
    if (text.includes('food') || text.includes('restaurant') || text.includes('delicious') || text.includes('lunch')) {
      return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80';
    }
    if (text.includes('tech') || text.includes('code') || text.includes('computer') || text.includes('app')) {
      return 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
  };

  // Determine platform array
  const initialPlatforms: ('instagram' | 'linkedin')[] = 
    draft.platform === 'both' ? ['instagram', 'linkedin'] : 
    draft.platform === 'linkedin' ? ['linkedin'] : ['instagram'];

  const [targetPlatforms, setTargetPlatforms] = useState<('instagram' | 'linkedin')[]>(initialPlatforms);
  const [activePlatformTab, setActivePlatformTab] = useState<'instagram' | 'linkedin'>(
    initialPlatforms.includes('instagram') ? 'instagram' : 'linkedin'
  );

  // Instagram states
  const [caption, setCaption] = useState(draft.caption);
  const [hashtags, setHashtags] = useState<string[]>(draft.hashtags);
  const [imageBrief, setImageBrief] = useState(draft.imageBrief);
  const [newHashtag, setNewHashtag] = useState('');
  const [imageUrl, setImageUrl] = useState(draft.imageUrl || getSimulatedImage(draft.prompt));

  // LinkedIn states
  const [liCaption, setLinkedinCaption] = useState(draft.liCaption || draft.caption);
  const [liHashtags, setLinkedinHashtags] = useState<string[]>(draft.liHashtags || draft.hashtags);
  const [liImageBrief, setLinkedinImageBrief] = useState(draft.liImageBrief || draft.imageBrief);
  const [newLiHashtag, setNewLinkedinHashtag] = useState('');

  // Reference States
  const [referenceUrls, setReferenceUrls] = useState<string[]>(draft.referenceUrls || []);
  const [urlInput, setUrlInput] = useState('');
  const [referenceText, setReferenceText] = useState(draft.referenceText || '');
  const [goal, setGoal] = useState(draft.goal || 'Product Spotlight');
  const [cta, setCta] = useState(draft.cta || 'Link in Bio');
  const [visualStyle, setVisualStyle] = useState(draft.visualStyle || 'Warm & Organic');

  // AI Tweaks
  const [tweakInstruction, setTweakInstruction] = useState('');
  const [tweaking, setTweaking] = useState(false);
  const [tweakScope, setTweakScope] = useState<'active' | 'both'>('active');

  // History state locally synced with draft history
  const [history, setHistory] = useState<any[]>(draft.history || []);

  const handleTogglePlatform = (platform: 'instagram' | 'linkedin') => {
    if (targetPlatforms.includes(platform)) {
      if (targetPlatforms.length === 1) return;
      setTargetPlatforms(targetPlatforms.filter(p => p !== platform));
      const remaining = targetPlatforms.find(p => p !== platform);
      if (remaining) setActivePlatformTab(remaining);
    } else {
      setTargetPlatforms([...targetPlatforms, platform]);
      setActivePlatformTab(platform);
    }
  };

  // Add Reference URL
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    if (!referenceUrls.includes(url)) {
      setReferenceUrls([...referenceUrls, url]);
    }
    setUrlInput('');
  };

  // Remove Reference URL
  const handleRemoveUrl = (target: string) => {
    setReferenceUrls(referenceUrls.filter(u => u !== target));
  };

  // Instagram Hashtags
  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };
  const handleAddHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
      setHashtags([...hashtags, newHashtag.trim().replace(/^#/, '')]);
      setNewHashtag('');
    }
  };

  // LinkedIn Hashtags
  const handleRemoveLinkedinHashtag = (tag: string) => {
    setLinkedinHashtags(liHashtags.filter((t) => t !== tag));
  };
  const handleAddLinkedinHashtag = () => {
    if (newLiHashtag.trim() && !liHashtags.includes(newLiHashtag.trim())) {
      setLinkedinHashtags([...liHashtags, newLiHashtag.trim().replace(/^#/, '')]);
      setNewLinkedinHashtag('');
    }
  };

  // Apply AI Polish / Tweak
  const handleApplyTweak = (instructionText: string) => {
    if (!instructionText.trim()) return;
    setTweaking(true);

    setTimeout(() => {
      let tweakedCaption = caption;
      let tweakedHashtags = [...hashtags];
      let tweakedBrief = imageBrief;

      let tweakedLiCaption = liCaption;
      let tweakedLiHashtags = [...liHashtags];
      let tweakedLiBrief = liImageBrief;

      let actionLabel = `AI Tweak: ${instructionText}`;
      const lowerText = instructionText.toLowerCase();

      const applyToInst = tweakScope === 'both' || activePlatformTab === 'instagram';
      const applyToLi = tweakScope === 'both' || activePlatformTab === 'linkedin';

      if (lowerText.includes('shorter') || lowerText.includes('summarize') || lowerText.includes('brief')) {
        if (applyToInst) tweakedCaption = tweakedCaption.split('.').slice(0, 2).join('.') + '.';
        if (applyToLi) tweakedLiCaption = tweakedLiCaption.split('.').slice(0, 2).join('.') + '.';
        actionLabel = 'AI Tweak: Shortened caption';
      } else if (lowerText.includes('emoji')) {
        if (applyToInst) tweakedCaption = '✨ ' + tweakedCaption.replace(/!/g, '! 🚀') + ' 💖';
        if (applyToLi) tweakedLiCaption = '🌟 ' + tweakedLiCaption.replace(/!/g, '! 🚀') + ' ✨';
        actionLabel = 'AI Tweak: Added emojis';
      } else if (lowerText.includes('cta') || lowerText.includes('call to action') || lowerText.includes('action')) {
        if (applyToInst) tweakedCaption += ' 👇 Tap the link in bio right now!';
        if (applyToLi) tweakedLiCaption += '\n\n👇 Click the link in comments to read more!';
        actionLabel = 'AI Tweak: Emphasized CTA';
      } else if (lowerText.includes('bold') || lowerText.includes('exciting') || lowerText.includes('hype')) {
        if (applyToInst) tweakedCaption = '🔥 SPECIAL ANNOUNCEMENT! ' + tweakedCaption.toUpperCase();
        if (applyToLi) tweakedLiCaption = '📢 IMPORTANT LOGISTICS UPDATE: ' + tweakedLiCaption;
        actionLabel = 'AI Tweak: Changed tone to Bold';
      } else {
        if (applyToInst) tweakedCaption = `📢 [AI UPDATE] - ${tweakedCaption}`;
        if (applyToLi) tweakedLiCaption = `💡 [AI UPDATE] - ${tweakedLiCaption}`;
      }

      if (applyToInst) {
        setCaption(tweakedCaption);
        setHashtags(tweakedHashtags);
        setImageBrief(tweakedBrief);
      }

      if (applyToLi) {
        setLinkedinCaption(tweakedLiCaption);
        setLinkedinHashtags(tweakedLiHashtags);
        setLinkedinImageBrief(tweakedLiBrief);
      }

      const nextVer = history.length + 1;
      const item = {
        version: nextVer,
        timestamp: new Date().toISOString(),
        action: actionLabel,
        caption: applyToInst ? tweakedCaption : caption,
        hashtags: applyToInst ? tweakedHashtags : hashtags,
        imageBrief: applyToInst ? tweakedBrief : imageBrief,
        liCaption: applyToLi ? tweakedLiCaption : liCaption,
        liHashtags: applyToLi ? tweakedLiHashtags : liHashtags,
        liImageBrief: applyToLi ? tweakedLiBrief : liImageBrief,
        imageUrl: imageUrl
      };
      setHistory([item, ...history]);

      setTweakInstruction('');
      setTweaking(false);
    }, 850);
  };

  // Restore Version
  const handleRestoreVersion = (histItem: any) => {
    setCaption(histItem.caption);
    setHashtags(histItem.hashtags || hashtags);
    setImageBrief(histItem.imageBrief || imageBrief);
    setImageUrl(histItem.imageUrl || imageUrl);

    setLinkedinCaption(histItem.liCaption || histItem.caption);
    setLinkedinHashtags(histItem.liHashtags || histItem.hashtags || liHashtags);
    setLinkedinImageBrief(histItem.liImageBrief || histItem.imageBrief || liImageBrief);

    const nextVer = history.length + 1;
    const restoreLog = {
      version: nextVer,
      timestamp: new Date().toISOString(),
      action: `Restored Version ${histItem.version}.0`,
      caption: histItem.caption,
      hashtags: histItem.hashtags || hashtags,
      imageBrief: histItem.imageBrief || imageBrief,
      liCaption: histItem.liCaption || histItem.caption,
      liHashtags: histItem.liHashtags || histItem.hashtags || liHashtags,
      liImageBrief: histItem.liImageBrief || histItem.imageBrief || liImageBrief,
      imageUrl: histItem.imageUrl || imageUrl
    };
    setHistory([restoreLog, ...history]);
  };

  const handleSave = (statusToUpdate?: 'draft' | 'pending_approval') => {
    const updatedStatus = statusToUpdate || draft.status;
    const actionDesc = statusToUpdate === 'pending_approval'
      ? 'Resubmitted for WhatsApp approval'
      : 'Saved changes manually';

    const originalLiCaption = draft.liCaption ?? draft.caption;
    const originalLiHashtags = draft.liHashtags ?? draft.hashtags;
    const originalLiImageBrief = draft.liImageBrief ?? draft.imageBrief;

    let finalPlatform: 'instagram' | 'linkedin' | 'both' = 'instagram';
    if (targetPlatforms.includes('instagram') && targetPlatforms.includes('linkedin')) {
      finalPlatform = 'both';
    } else if (targetPlatforms.includes('linkedin')) {
      finalPlatform = 'linkedin';
    }

    // Build latest history log if we have changes not logged yet
    let finalHistory = [...history];
    const hasChanges =
      caption !== draft.caption ||
      hashtags.join(',') !== draft.hashtags.join(',') ||
      imageBrief !== draft.imageBrief ||
      liCaption !== originalLiCaption ||
      liHashtags.join(',') !== originalLiHashtags.join(',') ||
      liImageBrief !== originalLiImageBrief;

    const latestVersion = Math.max(draft.version, history[0]?.version ?? draft.version);
    const nextVersion = hasChanges ? latestVersion + 1 : latestVersion;

    if (hasChanges) {
      finalHistory = [
        {
          version: nextVersion,
          timestamp: new Date().toISOString(),
          action: actionDesc,
          caption,
          hashtags,
          imageBrief,
          liCaption,
          liHashtags,
          liImageBrief,
          imageUrl
        },
        ...finalHistory
      ];
    }

    updateDraft({
      ...draft,
      caption,
      hashtags,
      imageBrief,
      status: updatedStatus,
      version: nextVersion,
      history: finalHistory.map(h => ({
        version: h.version,
        timestamp: h.timestamp,
        action: h.action,
        caption: h.caption,
        feedback: h.feedback,
        hashtags: h.hashtags,
        imageBrief: h.imageBrief,
        liCaption: h.liCaption,
        liHashtags: h.liHashtags,
        liImageBrief: h.liImageBrief,
        imageUrl: h.imageUrl
      })),
      referenceUrls,
      referenceText,
      goal,
      cta,
      visualStyle,
      imageUrl,
      platform: finalPlatform,
      liCaption,
      liHashtags,
      liImageBrief
    });

    alert('Draft updated successfully!');
    if (statusToUpdate === 'pending_approval') {
      router.push('/app/approvals');
    } else {
      router.push(state.currentUserType === 'client' ? '/app' : '/app/content');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto w-full text-text-primary pb-12">
      {/* Back button */}
      <div>
        <Link
          href={state.currentUserType === 'client' ? '/app' : '/app/content'}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary font-semibold transition"
        >
          <ChevronLeft className="w-4 h-4" /> {state.currentUserType === 'client' ? 'Back to Dashboard' : 'Back to Content Planner'}
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-primary pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">{draft.prompt}</h1>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                draft.status === 'approved'
                  ? 'bg-green-55 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900'
                  : draft.status === 'pending_approval'
                  ? 'bg-yellow-55 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900'
                  : draft.status === 'rejected'
                  ? 'bg-red-55 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                  : 'bg-bg-app border border-border-primary text-text-secondary'
              }`}
            >
              {draft.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Review detailed metadata, adjust generated output, and view edit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave()}
            className="flex items-center gap-1.5 bg-bg-app hover:bg-bg-hover border border-border-primary text-text-primary px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
          {draft.status !== 'approved' && draft.status !== 'published' && (
            <button
              onClick={() => handleSave('pending_approval')}
              className="flex items-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white px-4 py-2 rounded-full text-xs font-semibold hover:opacity-95 transition shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Resubmit to Client</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: General Configuration & References (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-primary pb-2">
            <Edit3 className="w-4 h-4 text-text-secondary" />
            <span>Post Guidelines</span>
          </h3>

          {/* Prompt Brief (Read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Prompt Brief</label>
            <div className="bg-bg-app border border-border-primary p-3 rounded-xl text-xs text-text-secondary font-mono">
              {draft.prompt}
            </div>
          </div>

          {/* Target Platforms */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">Target Platforms</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Instagram Button */}
              <button
                type="button"
                onClick={() => handleTogglePlatform('instagram')}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
                  targetPlatforms.includes('instagram')
                    ? 'border-instagram-pink bg-pink-500/5 text-instagram-pink'
                    : 'border-border-primary bg-bg-app text-text-secondary hover:text-text-primary hover:border-border-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  <span>Instagram Feed</span>
                </div>
                {targetPlatforms.includes('instagram') ? (
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
                onClick={() => handleTogglePlatform('linkedin')}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
                  targetPlatforms.includes('linkedin')
                    ? 'border-blue-600 bg-blue-600/5 text-blue-600'
                    : 'border-border-primary bg-bg-app text-text-secondary hover:text-text-primary hover:border-border-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn Post</span>
                </div>
                {targetPlatforms.includes('linkedin') ? (
                  <div className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                ) : (
                  <div className="w-4.5 h-4.5 rounded-full border border-border-primary shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Settings objective/cta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Objective</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-2 text-xs focus:border-instagram-pink outline-none"
              >
                <option value="Product Spotlight">Product Spotlight</option>
                <option value="Behind the Scenes">Behind the Scenes</option>
                <option value="Educational / Tips">Educational / Tips</option>
                <option value="Customer Story / Testimonial">Customer Story</option>
                <option value="Event / Launch Announcement">Launch Event</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Call to Action</label>
              <select
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-2 text-xs focus:border-instagram-pink outline-none"
              >
                <option value="Link in Bio">Link in Bio</option>
                <option value="Comment below">Comment below</option>
                <option value="Save for later">Save for later</option>
                <option value="Share this post">Share this post</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Visual Style</label>
            <select
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value)}
              className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-2 text-xs focus:border-instagram-pink outline-none"
            >
              <option value="Warm & Organic">Warm & Organic</option>
              <option value="Bold & Vibrant">Bold & Vibrant</option>
              <option value="Minimalist & Clean">Minimalist & Clean</option>
              <option value="Dark & Moody">Dark & Moody</option>
              <option value="Professional & Corporate">Professional & Corporate</option>
            </select>
          </div>

          {/* References Manager */}
          <div className="border-t border-border-primary pt-4 space-y-4">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-text-secondary" />
              <span>Inspiration & References</span>
            </h4>

            {/* Links */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-text-secondary">Reference URLs / Links</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. competitor posts"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                  className="flex-1 border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1 text-xs focus:border-instagram-pink outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="bg-bg-hover hover:bg-slate-200 dark:hover:bg-slate-800 border border-border-primary px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              {referenceUrls.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {referenceUrls.map((u, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-bg-app border border-border-primary rounded-full px-2 py-0.5 text-[10px] text-text-secondary max-w-[200px] truncate">
                      <Link2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{u.replace(/^https?:\/\/(www\.)?/, '')}</span>
                      <button type="button" onClick={() => handleRemoveUrl(u)}>
                        <X className="w-2.5 h-2.5 hover:text-text-primary" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Text Snippet */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-text-secondary">Inspiration Copy / Transcript</label>
              <textarea
                placeholder="Competitor copywriting style or transcripts..."
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-2 text-xs focus:border-instagram-pink outline-none transition min-h-[60px]"
              />
            </div>
          </div>
        </div>

        {/* Middle Column: Live Visual Previews (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4 relative">
            {tweaking && (
              <div className="absolute inset-0 bg-bg-card/75 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-2 rounded-2xl">
                <RefreshCw className="w-8 h-8 text-instagram-pink animate-spin" />
                <p className="text-xs text-text-primary font-bold">Applying AI Tweak instruction...</p>
              </div>
            )}

            {/* Platform Preview Toggle Tabs */}
            <div className="border-b border-border-primary flex gap-2">
              {targetPlatforms.includes('instagram') && (
                <button
                  onClick={() => setActivePlatformTab('instagram')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border-b-2 text-xs font-bold transition cursor-pointer ${
                    activePlatformTab === 'instagram'
                      ? 'border-instagram-pink text-instagram-pink font-extrabold'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </button>
              )}
              {targetPlatforms.includes('linkedin') && (
                <button
                  onClick={() => setActivePlatformTab('linkedin')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border-b-2 text-xs font-bold transition cursor-pointer ${
                    activePlatformTab === 'linkedin'
                      ? 'border-blue-600 text-blue-600 font-extrabold'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </button>
              )}
            </div>

            {/* Render Selected Preview Layout */}
            {activePlatformTab === 'instagram' ? (
              /* INSTAGRAM MOCKUP */
              <div className="bg-bg-card border border-border-primary rounded-2xl overflow-hidden shadow-md max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border-primary">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white font-black text-[10px]">
                      {activeWorkspace?.name?.charAt(0) || 'W'}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-text-primary">{activeWorkspace?.name || 'Brand Name'}</p>
                      <p className="text-[9px] text-text-secondary">AI Mockup Draft</p>
                    </div>
                  </div>
                </div>

                {/* Image */}
                <div className="w-full aspect-square bg-bg-app flex items-center justify-center overflow-hidden border-b border-border-primary relative">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Draft Visual" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-text-secondary italic">Image placeholder</span>
                  )}
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                    {goal}
                  </span>
                </div>

                {/* Action Bar */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3.5 text-text-primary">
                    <Heart className="w-4.5 h-4.5 hover:text-red-500 transition cursor-pointer" />
                    <MessageCircle className="w-4.5 h-4.5 hover:opacity-80 transition cursor-pointer" />
                    <ShareIcon className="w-4.5 h-4.5 hover:opacity-80 transition cursor-pointer" />
                  </div>
                  <Bookmark className="w-4.5 h-4.5 text-text-primary hover:opacity-80 transition cursor-pointer" />
                </div>

                {/* Caption / Hashtags */}
                <div className="px-3 pb-3 space-y-1 text-[11px] text-text-primary">
                  <p className="leading-relaxed">
                    <span className="font-bold mr-1">{activeWorkspace?.name || 'brand'}</span>
                    {caption}
                  </p>
                  <p className="text-instagram-pink font-semibold leading-normal">
                    {hashtags.map((h) => `#${h}`).join(' ')}
                  </p>
                </div>
              </div>
            ) : (
              /* LINKEDIN MOCKUP */
              <div className="bg-bg-card border border-border-primary rounded-2xl overflow-hidden shadow-md max-w-md mx-auto p-4 space-y-3 text-xs">
                {/* LinkedIn Header */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-sm bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs">
                      {activeWorkspace?.name?.charAt(0) || 'W'}
                    </div>
                    <div>
                      <p className="font-bold text-text-primary text-xs leading-snug flex items-center gap-1">
                        <span>{activeWorkspace?.name || 'Brand Name'}</span>
                        <span className="text-[9px] font-normal text-text-secondary bg-bg-app border border-border-primary px-1 rounded-sm">2nd</span>
                      </p>
                      <p className="text-[10px] text-text-secondary leading-none mt-0.5">15,240 followers</p>
                      <p className="text-[9px] text-text-secondary mt-0.5">1h • Edited • 🌐</p>
                    </div>
                  </div>
                  <button type="button" className="text-text-secondary hover:text-text-primary">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* LinkedIn Copy */}
                <div className="space-y-2 text-text-primary text-[11px] leading-relaxed whitespace-pre-wrap">
                  <p>{liCaption}</p>
                  <p className="text-blue-700 dark:text-blue-400 font-semibold">
                    {liHashtags.map((h) => `#${h}`).join(' ')}
                  </p>
                </div>

                {/* Attachment image */}
                {imageUrl && (
                  <div className="border border-border-primary rounded-lg overflow-hidden bg-bg-app">
                    <img src={imageUrl} alt="Attachment" className="w-full object-cover max-h-56" />
                    <div className="p-2 border-t border-border-primary">
                      <p className="font-bold text-[10px] truncate text-text-primary">{goal} Update</p>
                      <p className="text-[9px] text-text-secondary truncate">{activeWorkspace?.name || 'brand'}.com</p>
                    </div>
                  </div>
                )}

                {/* LinkedIn Actions */}
                <div className="border-t border-border-primary pt-2 flex items-center justify-between text-text-secondary text-[10px] font-bold">
                  <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Like</span>
                  </button>
                  <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Comment</span>
                  </button>
                  <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Repost</span>
                  </button>
                  <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer">
                    <Send className="w-3.5 h-3.5 rotate-0" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Tweak, Manual Edits & Version History (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* AI Polish Tools */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-border-primary pb-2">
              <Sparkles className="w-4 h-4 text-instagram-pink" />
              <span>Polish & Tweak with AI</span>
            </h3>

            {/* Scope selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-semibold text-text-secondary">Tweak Scope</label>
              <div className="flex gap-1.5 bg-bg-app p-1 border border-border-primary rounded-lg text-[9px] font-bold">
                <button
                  type="button"
                  onClick={() => setTweakScope('active')}
                  className={`flex-1 py-1 rounded transition cursor-pointer ${
                    tweakScope === 'active' ? 'bg-bg-card shadow-xs text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  Active Tab Only
                </button>
                <button
                  type="button"
                  onClick={() => setTweakScope('both')}
                  className={`flex-1 py-1 rounded transition cursor-pointer ${
                    tweakScope === 'both' ? 'bg-bg-card shadow-xs text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  Both Channels
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold text-text-secondary">Custom AI Instruction</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. 'make it shorter'"
                  value={tweakInstruction}
                  onChange={(e) => setTweakInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyTweak(tweakInstruction);
                    }
                  }}
                  className="flex-1 border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleApplyTweak(tweakInstruction)}
                  className="bg-instagram-pink text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
                >
                  Tweak
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-semibold text-text-secondary block">Quick Presets</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleApplyTweak('Make Shorter')}
                  className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1.5 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
                >
                  📝 Shorten Copy
                </button>
                <button
                  onClick={() => handleApplyTweak('Add More Emojis')}
                  className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1.5 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
                >
                  🌟 Add Emojis
                </button>
                <button
                  onClick={() => handleApplyTweak('Stronger Call to Action')}
                  className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1.5 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
                >
                  🚀 Emphasize CTA
                </button>
                <button
                  onClick={() => handleApplyTweak('Exciting Bold Tone')}
                  className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1.5 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
                >
                  🔥 Make Tone Bold
                </button>
              </div>
            </div>
          </div>

          {/* Platform Manual Edits */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-border-primary pb-2">
              <Edit3 className="w-4 h-4 text-text-secondary" />
              <span>Manual Edits: {activePlatformTab === 'instagram' ? 'Instagram' : 'LinkedIn'}</span>
            </h3>

            {activePlatformTab === 'instagram' ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-text-secondary">Instagram Caption</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none transition min-h-[80px]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-text-secondary">Instagram Hashtags</label>
                  <div className="flex flex-wrap gap-1 p-1.5 border border-border-primary bg-bg-app rounded-xl min-h-[35px] max-h-[100px] overflow-y-auto">
                    {hashtags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-0.5 bg-bg-card border border-border-primary rounded-full px-1.5 py-0.5 text-[9px] text-text-primary">
                        <span>#{tag}</span>
                        <button type="button" onClick={() => handleRemoveHashtag(tag)}><X className="w-2.5 h-2.5 hover:text-text-primary" /></button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1 border-l border-border-primary pl-1.5 ml-1">
                      <input
                        type="text"
                        placeholder="Tag"
                        value={newHashtag}
                        onChange={(e) => setNewHashtag(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddHashtag(); } }}
                        className="text-[9px] text-text-primary bg-transparent outline-none w-10"
                      />
                      <button type="button" onClick={handleAddHashtag}><Plus className="w-2.5 h-2.5 hover:text-instagram-pink" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-text-secondary">LinkedIn Post Text</label>
                  <textarea
                    value={liCaption}
                    onChange={(e) => setLinkedinCaption(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none transition min-h-[90px]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-text-secondary">LinkedIn Hashtags</label>
                  <div className="flex flex-wrap gap-1 p-1.5 border border-border-primary bg-bg-app rounded-xl min-h-[35px] max-h-[100px] overflow-y-auto">
                    {liHashtags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-0.5 bg-bg-card border border-border-primary rounded-full px-1.5 py-0.5 text-[9px] text-text-primary">
                        <span>#{tag}</span>
                        <button type="button" onClick={() => handleRemoveLinkedinHashtag(tag)}><X className="w-2.5 h-2.5 hover:text-text-primary" /></button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1 border-l border-border-primary pl-1.5 ml-1">
                      <input
                        type="text"
                        placeholder="Tag"
                        value={newLiHashtag}
                        onChange={(e) => setNewLinkedinHashtag(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLinkedinHashtag(); } }}
                        className="text-[9px] text-text-primary bg-transparent outline-none w-10"
                      />
                      <button type="button" onClick={handleAddLinkedinHashtag}><Plus className="w-2.5 h-2.5 hover:text-instagram-pink" /></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Brief */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-text-secondary">Visual Concept Brief</label>
              <textarea
                value={activePlatformTab === 'instagram' ? imageBrief : liImageBrief}
                onChange={(e) => {
                  if (activePlatformTab === 'instagram') {
                    setImageBrief(e.target.value);
                  } else {
                    setLinkedinImageBrief(e.target.value);
                  }
                }}
                className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none transition min-h-[60px]"
              />
            </div>
          </div>

          {/* Version History & Restoration */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border-primary pb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-text-secondary" />
              <span>Version History</span>
            </h3>

            <div className="relative border-l-2 border-border-primary pl-3 ml-1.5 space-y-4 py-1.5 max-h-[300px] overflow-y-auto pr-1">
              {history.map((hist, index) => (
                <div key={index} className="relative text-[10px]">
                  {/* Marker dot */}
                  <span className={`absolute -left-[18.5px] top-1 w-2 h-2 rounded-full border border-bg-card ${
                    index === 0 ? 'bg-instagram-pink animate-pulse' : 'bg-slate-300'
                  }`} />

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">v{hist.version}.0</span>
                      <span className="text-[8px] text-text-secondary">
                        {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-instagram-pink font-semibold">{hist.action}</p>
                    <p className="text-[9px] text-text-secondary line-clamp-2 italic">
                      "{(activePlatformTab === 'instagram' ? hist.caption : hist.liCaption) || hist.caption}"
                    </p>
                    {hist.feedback && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg p-2 mt-1.5 text-[9px] text-red-700 dark:text-red-400">
                        <span className="font-bold block">Client Feedback:</span>
                        {hist.feedback}
                      </div>
                    )}

                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(hist)}
                        className="mt-1 text-[9px] font-bold text-blue-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Undo className="w-2.5 h-2.5" /> Restore
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

