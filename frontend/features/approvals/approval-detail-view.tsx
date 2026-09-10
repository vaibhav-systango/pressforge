'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useLinkedInConnection, useInstagramConnection } from '@/lib/hooks/queries/use-social-connection';
import { notifications } from '@mantine/notifications';
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, Check, X, CornerDownLeft, MessageSquare, MoreVertical, Send,
  Heart, MessageCircle, Bookmark, ThumbsUp, Share2, Instagram, Linkedin,
  Loader2, History, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { Draft } from '@/lib/types';
import { useDraft } from '@/lib/hooks/queries/use-draft';
import { FeedbackThread } from './feedback-thread';

const getSimulatedImage = (promptText: string) => {
  const text = promptText.toLowerCase();
  if (text.includes('summer') || text.includes('dress') || text.includes('fashion') || text.includes('wear'))
    return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';
  if (text.includes('pack') || text.includes('box') || text.includes('deliver') || text.includes('shipping'))
    return 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80';
  if (text.includes('coffee') || text.includes('morning') || text.includes('latte'))
    return 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80';
  if (text.includes('food') || text.includes('restaurant') || text.includes('delicious'))
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80';
  if (text.includes('tech') || text.includes('code') || text.includes('computer'))
    return 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
};

export function ApprovalDetailView() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const searchParams = useSearchParams();
  const { state, updateDraft } = useAppState();
  const { user } = useAuth();
  const { draft, isLoading: isDraftLoading } = useDraft(id);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'instagram' | 'linkedin'>('instagram');

  const creatorPlatform = (draft?.platform || 'linkedin').toLowerCase() as 'instagram' | 'linkedin' | 'both';
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'linkedin' | 'both'>(
    (draft?.platform as 'instagram' | 'linkedin' | 'both') || 'both'
  );

  useEffect(() => {
    if (draft?.platform) {
      const p = (draft.platform.toLowerCase() as 'instagram' | 'linkedin' | 'both') || 'both';
      setSelectedPlatform(p);
      if (p === 'linkedin') {
        setActiveTab('linkedin');
      } else {
        setActiveTab('instagram');
      }
    }
  }, [draft?.platform]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { connection: linkedinConnection, connectLinkedIn, isLoading: isLinkedInLoading, refresh: refreshLinkedInConnection } = useLinkedInConnection();
  const { connection: instagramConnection, connectInstagram, isLoading: isInstagramLoading, refresh: refreshInstagramConnection } = useInstagramConnection();

  useEffect(() => {
    const platformParam = searchParams.get('platform');
    const status = searchParams.get('status');
    if (status === 'connected') {
      if (platformParam === 'linkedin') refreshLinkedInConnection();
      if (platformParam === 'instagram') refreshInstagramConnection();
      notifications.show({ title: 'Connected', message: `${platformParam === 'instagram' ? 'Instagram' : 'LinkedIn'} connected successfully.`, color: 'green' });
    } else if (status === 'error') {
      const reason = searchParams.get('reason');
      notifications.show({ title: 'Connection Failed', message: reason ? `Connection failed: ${reason}` : 'Social connection failed.', color: 'red' });
    }
    if (status) router.replace(`/app/approvals/${id}`);
  }, [refreshLinkedInConnection, refreshInstagramConnection, router, searchParams, id]);

  const isClient = user?.userType === 'client' || state.currentUserType === 'client';
  const isIndividual = user?.userType === 'individual' || state.currentUserType === 'individual' || state.accountType === 'individual';
  const canApprove = isClient || isIndividual;

  useEffect(() => {
    if (!canApprove && id) router.replace(`/app/content/${id}`);
  }, [canApprove, id, router]);

  if (!canApprove) {
    return (
      <div className="text-center py-12 space-y-3">
        <h2 className="text-xl font-bold text-text-primary">Access Restricted</h2>
        <p className="text-sm text-text-secondary">This approval page is only accessible to client and individual users.</p>
        <Link href={id ? `/app/content/${id}` : '/app/approvals'} className="text-xs text-instagram-pink font-semibold mt-2 hover:underline inline-block">View Content History</Link>
      </div>
    );
  }

  if (isDraftLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-instagram-pink" />
        <p className="text-sm font-semibold text-text-secondary">Loading approval details...</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-text-primary">Post Approval Not Found</h2>
        <p className="text-sm text-text-secondary mt-2">The requested approval link has expired or is invalid.</p>
        <Link href="/app/approvals" className="text-xs text-instagram-pink font-semibold mt-4 hover:underline inline-block">Return to Approvals</Link>
      </div>
    );
  }

  const activeWorkspace = state.workspaces.find((w) => w.id === draft.workspaceId) || state.workspaces[0];
  const imageUrl = draft.imageUrl || getSimulatedImage(draft.prompt ?? '');

  const linkedinConnected = linkedinConnection?.connected ?? false;
  const instagramConnected = instagramConnection?.connected ?? false;
  const requiresLinkedIn = selectedPlatform === 'linkedin' || selectedPlatform === 'both';
  const requiresInstagram = selectedPlatform === 'instagram' || selectedPlatform === 'both';
  const isLinkedInMissing = requiresLinkedIn && !isLinkedInLoading && !linkedinConnected;
  const isInstagramMissing = requiresInstagram && !isInstagramLoading && !instagramConnected;
  const isApprovalDisabled = canApprove && (isLinkedInMissing || isInstagramMissing);

  const handleApprove = () => {
    if (isApprovalDisabled) {
      notifications.show({ title: 'Social Account Connection Required', message: 'You must connect required social account(s) before approving this post.', color: 'red' });
      return;
    }
    const nextVersion = (draft.version ?? 1) + 1;
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 3);

    updateDraft({
      ...draft,
      platform: selectedPlatform,
      status: 'approved',
      scheduledAt: scheduledDate.toISOString(),
      version: nextVersion,
      history: [
        {
          version: nextVersion,
          timestamp: new Date().toISOString(),
          action: `Post Approved & Scheduled (${selectedPlatform === 'both' ? 'Both LinkedIn & IG' : selectedPlatform === 'instagram' ? 'Instagram' : 'LinkedIn'})`,
          caption: draft.caption,
        },
        ...(draft.history ?? []),
      ],
    });
    notifications.show({ title: 'Success', message: 'Post Approved & Scheduled successfully!', color: 'green' });
    router.push('/app/publishing');
  };

  const handleFeedback = async () => {
    if (!feedback.trim()) {
      notifications.show({ title: 'Validation error', message: 'Please enter your revision comments.', color: 'yellow' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/drafts/${draft.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedback.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit feedback');
      }
      const data = (await res.json()) as { draft: Draft };
      // Update the draft in cache with AI-revised content
      await updateDraft(data.draft);
      setFeedback('');
      setShowHistory(true);
      notifications.show({ title: 'Feedback submitted', message: 'AI has revised the post based on your feedback. Review the updated preview.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed to submit feedback. Please try again.', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectOnly = () => {
    const nextVersion = (draft.version ?? 1) + 1;
    updateDraft({
      ...draft,
      status: 'rejected',
      version: nextVersion,
      history: [
        { version: nextVersion, timestamp: new Date().toISOString(), action: 'Post Rejected', caption: draft.caption, feedback: 'Rejected by client' },
        ...(draft.history ?? []),
      ],
    });
    notifications.show({ title: 'Post rejected', message: 'Post rejected.', color: 'red' });
    router.push('/app/approvals');
  };

  const historyItems = draft.history ?? [];

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto w-full">
      {/* Back */}
      <div>
        <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary font-semibold transition cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT */}
        <div className="lg:col-span-6 space-y-5">
          {/* Title + actions */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approval Task</span>
                <span className="text-[10px] font-bold text-slate-400 bg-bg-app border border-border-primary px-2 py-0.5 rounded-full">
                  v{draft.version ?? 1}
                </span>
              </div>
              <h2 className="text-xl font-bold text-text-primary mt-0.5">{draft.prompt}</h2>
              <p className="text-xs text-text-secondary mt-1">Review the preview on the right and select an action.</p>
            </div>

            {/* Target Platform Selector (Only show choice if creator created draft for both platforms) */}
            {creatorPlatform === 'both' ? (
              <div className="space-y-2 pt-3 border-t border-border-primary">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">
                    Select Target Platform to Post:
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlatform('both');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      selectedPlatform === 'both'
                        ? 'bg-gradient-to-r from-[#F58529] to-[#DD2A7B] text-white border-transparent shadow-xs'
                        : 'bg-bg-app border-border-primary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Both</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlatform('linkedin');
                      setActiveTab('linkedin');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      selectedPlatform === 'linkedin'
                        ? 'bg-blue-600 text-white border-transparent shadow-xs'
                        : 'bg-bg-app border-border-primary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlatform('instagram');
                      setActiveTab('instagram');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      selectedPlatform === 'instagram'
                        ? 'bg-instagram-pink text-white border-transparent shadow-xs'
                        : 'bg-bg-app border-border-primary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Instagram</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-3 border-t border-border-primary text-xs">
                <span className="text-text-secondary font-medium">Target Publishing Platform:</span>
                <span className="font-bold text-text-primary capitalize flex items-center gap-1.5 bg-bg-app px-2.5 py-1 rounded-lg border border-border-primary">
                  {creatorPlatform === 'instagram' ? (
                    <>
                      <Instagram className="w-3.5 h-3.5 text-instagram-pink" /> Instagram
                    </>
                  ) : (
                    <>
                      <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn
                    </>
                  )}
                </span>
              </div>
            )}

            {isApprovalDisabled && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-4 text-xs space-y-2">
                <p className="font-semibold text-red-800 dark:text-red-400">Social Account Connection Required</p>
                <p className="text-red-700 dark:text-red-300">
                  Please connect ({requiresLinkedIn ? 'LinkedIn' : ''}{requiresLinkedIn && requiresInstagram ? ' & ' : ''}{requiresInstagram ? 'Instagram' : ''}) to approve.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {isLinkedInMissing && (
                    <button onClick={() => connectLinkedIn(`/app/approvals/${draft.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer">Connect LinkedIn</button>
                  )}
                  {isInstagramMissing && (
                    <button onClick={() => connectInstagram(`/app/approvals/${draft.id}`)} className="bg-instagram-pink hover:opacity-90 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer">Connect Instagram</button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border-primary">
              <button type="button" onClick={handleApprove} disabled={isApprovalDisabled}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-xs ${isApprovalDisabled ? 'bg-slate-200 dark:bg-slate-800/80 text-slate-400 border border-border-primary cursor-not-allowed' : 'bg-gradient-to-r from-[#F58529] to-[#DD2A7B] hover:opacity-95 text-white cursor-pointer'}`}>
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  Approve ({selectedPlatform === 'both' ? 'Both' : selectedPlatform === 'instagram' ? 'Instagram' : 'LinkedIn'})
                </span>
              </button>
              <button type="button" onClick={handleRejectOnly}
                className="w-full flex items-center justify-center gap-2 bg-bg-app hover:bg-bg-hover border border-border-primary text-text-primary px-4 py-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shadow-xs">
                <X className="w-4 h-4 shrink-0" /><span>Reject Draft</span>
              </button>
            </div>
          </div>

          {/* Feedback box */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-text-secondary" />
              <span>Request Changes / Edit Feedback</span>
            </h3>
            <div className="flex flex-col gap-3">
              <textarea
                ref={textareaRef}
                placeholder="e.g., 'Please change the third sentence to highlight the organic linen option instead of cotton, and add #LinenFashion.'"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isSubmitting}
                className="border border-border-primary rounded-xl p-3 text-xs focus:border-[#E1306C] outline-none transition min-h-[90px] resize-y disabled:opacity-60 bg-bg-app"
              />
              <button type="button" onClick={handleFeedback} disabled={isSubmitting || !feedback.trim()}
                className="w-full flex items-center justify-center gap-1.5 bg-text-primary text-bg-card hover:opacity-90 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CornerDownLeft className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'AI is revising…' : 'Submit Revision Feedback'}</span>
              </button>
            </div>
          </div>

          {/* History thread — only show if revisions have actually been requested */}
          {(() => {
            const revisionCount = historyItems.filter((h) => h.action === 'Client Requested Changes').length;
            if (revisionCount === 0) return null;

            return (
              <div className="bg-bg-card border border-border-primary rounded-2xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  className="w-full flex items-center justify-between p-5 text-sm font-bold text-text-primary hover:bg-bg-app transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-text-secondary" />
                    Revision History ({revisionCount} {revisionCount === 1 ? 'revision' : 'revisions'})
                  </span>
                  {showHistory ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                </button>
                {showHistory && (
                  <div className="px-5 pb-5 border-t border-border-primary pt-4 max-h-[420px] overflow-y-auto">
                    <FeedbackThread history={historyItems} currentVersion={draft.version ?? 1} />
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* RIGHT — Phone Preview */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="max-w-full w-[320px] h-[600px] border-[8px] border-[#1e293b] rounded-[32px] bg-bg-app overflow-hidden shadow-2xl relative flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1e293b] rounded-b-xl z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-[#374151] rounded-full mb-1"></div>
            </div>

            <div className="bg-bg-card border-b border-border-primary pt-8 pb-3 px-4 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-1.5">
                {activeTab === 'instagram' ? <Instagram className="w-4 h-4 text-instagram-pink" /> : <Linkedin className="w-4 h-4 text-blue-600" />}
                <span className="text-[11px] font-bold text-text-primary capitalize">{activeTab} Preview</span>
              </div>
              {creatorPlatform === 'both' && (
                <div className="flex gap-1 bg-bg-app p-0.5 rounded-full border border-border-primary">
                  <button onClick={() => { setSelectedPlatform('both'); }} className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition cursor-pointer ${selectedPlatform === 'both' ? 'bg-gradient-to-r from-[#F58529] to-[#DD2A7B] text-white shadow-xs' : 'text-text-secondary'}`}>Both</button>
                  <button onClick={() => { setSelectedPlatform('instagram'); setActiveTab('instagram'); }} className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition cursor-pointer ${selectedPlatform === 'instagram' ? 'bg-instagram-pink text-white shadow-xs' : 'text-text-secondary'}`}>Insta</button>
                  <button onClick={() => { setSelectedPlatform('linkedin'); setActiveTab('linkedin'); }} className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition cursor-pointer ${selectedPlatform === 'linkedin' ? 'bg-blue-600 text-white shadow-xs' : 'text-text-secondary'}`}>LinkedIn</button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-bg-app">
              {activeTab === 'instagram' ? (
                <div className="flex flex-col bg-bg-card">
                  <div className="flex items-center justify-between p-3 border-b border-border-primary">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white font-black text-[10px]">{activeWorkspace?.name?.charAt(0) || 'W'}</div>
                      <div>
                        <p className="text-[11px] font-bold text-text-primary leading-tight">{activeWorkspace?.name || 'Brand Name'}</p>
                        <p className="text-[8px] text-text-secondary leading-none mt-0.5">AI Mockup Draft</p>
                      </div>
                    </div>
                    <MoreVertical className="w-3.5 h-3.5 text-text-secondary" />
                  </div>
                  <div className="w-full aspect-square bg-bg-app flex items-center justify-center overflow-hidden border-b border-border-primary relative">
                    {imageUrl ? (
                      <Image src={imageUrl} alt="Instagram Visual" fill unoptimized className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-bg-hover">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">AI Image Concept</span>
                        <p className="text-[8px] text-text-secondary line-clamp-6 mt-1 font-mono leading-relaxed">{draft.imageBrief}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3.5 text-text-primary">
                      <Heart className="w-4.5 h-4.5 hover:text-red-500 transition cursor-pointer" />
                      <MessageCircle className="w-4.5 h-4.5 hover:opacity-80 transition cursor-pointer" />
                      <Send className="w-4.5 h-4.5 hover:opacity-80 transition cursor-pointer" />
                    </div>
                    <Bookmark className="w-4.5 h-4.5 text-text-primary hover:opacity-80 transition cursor-pointer" />
                  </div>
                  <div className="px-3 pb-4 space-y-1 text-[11px] text-text-primary">
                    <p className="leading-relaxed"><span className="font-bold mr-1">{activeWorkspace?.name?.toLowerCase().replace(/\s+/g, '') || 'brand'}</span>{draft.caption}</p>
                    <p className="text-instagram-pink font-semibold leading-normal">{(draft.hashtags ?? []).map((h) => `#${h}`).join(' ')}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-bg-card p-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-sm bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs">{activeWorkspace?.name?.charAt(0) || 'W'}</div>
                      <div>
                        <p className="font-bold text-text-primary text-xs leading-snug flex items-center gap-1">
                          <span>{activeWorkspace?.name || 'Brand Name'}</span>
                          <span className="text-[9px] font-normal text-text-secondary bg-bg-app border border-border-primary px-1 rounded-sm">2nd</span>
                        </p>
                        <p className="text-[10px] text-text-secondary leading-none mt-0.5">15,240 followers</p>
                        <p className="text-[9px] text-text-secondary mt-0.5">1h • Edited • 🌐</p>
                      </div>
                    </div>
                    <MoreVertical className="w-4 h-4 text-text-secondary" />
                  </div>
                  <div className="space-y-2 text-text-primary text-[11px] leading-relaxed whitespace-pre-wrap">
                    <p>{draft.liCaption || draft.caption}</p>
                    <p className="text-blue-700 dark:text-blue-400 font-semibold">{(draft.liHashtags ?? draft.hashtags ?? []).map((h) => `#${h}`).join(' ')}</p>
                  </div>
                  <div className="border border-border-primary rounded-lg overflow-hidden bg-bg-app">
                    {imageUrl ? (
                      <Image src={imageUrl} alt="LinkedIn Visual" width={600} height={400} unoptimized className="w-full object-cover max-h-52" />
                    ) : (
                      <div className="w-full aspect-[4/3] flex flex-col items-center justify-center p-4 text-center bg-bg-hover">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">AI Image Concept</span>
                        <p className="text-[8px] text-text-secondary line-clamp-6 mt-1 font-mono leading-relaxed">{draft.liImageBrief || draft.imageBrief}</p>
                      </div>
                    )}
                    <div className="p-2 border-t border-border-primary bg-bg-card">
                      <p className="font-bold text-[10px] truncate text-text-primary">{draft.prompt || 'PressForge AI Update'}</p>
                      <p className="text-[9px] text-text-secondary truncate">{activeWorkspace?.name || 'brand'}.com</p>
                    </div>
                  </div>
                  <div className="border-t border-border-primary pt-2 flex items-center justify-between text-text-secondary text-[10px] font-bold">
                    <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1"><ThumbsUp className="w-3.5 h-3.5" /><span>Like</span></button>
                    <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1"><MessageCircle className="w-3.5 h-3.5" /><span>Comment</span></button>
                    <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1"><Share2 className="w-3.5 h-3.5" /><span>Repost</span></button>
                    <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1"><Send className="w-3.5 h-3.5" /><span>Send</span></button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-bg-card p-3 flex gap-2 border-t border-border-primary shrink-0">
              <button type="button" onClick={handleApprove} disabled={isApprovalDisabled}
                className={`flex-1 text-white py-2 rounded-xl text-xs font-bold transition shadow-xs text-center ${isApprovalDisabled ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-border-primary' : 'bg-gradient-to-r from-[#F58529] to-[#DD2A7B] hover:opacity-95 cursor-pointer'}`}>
                Approve Post
              </button>
              <button type="button" onClick={() => textareaRef.current?.focus()}
                className="flex-1 bg-bg-app hover:bg-bg-hover border border-border-primary text-text-primary py-2 rounded-xl text-xs font-bold transition text-center cursor-pointer shadow-xs">
                Request Edits
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
