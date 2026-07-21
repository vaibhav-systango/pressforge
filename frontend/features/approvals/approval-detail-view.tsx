'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useLinkedInConnection } from '@/lib/hooks/queries/use-social-connection';
import { notifications } from '@mantine/notifications';
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Check, X, CornerDownLeft, MessageSquare, MoreVertical, Send,
  Heart, MessageCircle, Bookmark, ThumbsUp, Share2, Instagram, Linkedin 
} from 'lucide-react';

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

export function ApprovalDetailView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { state, updateDraft } = useAppState();
  const { user } = useAuth();
  const draft = state.drafts.find((d) => d.id === id);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState<'instagram' | 'linkedin'>(
    draft?.platform === 'linkedin' ? 'linkedin' : 'instagram',
  );

  const {
    connection: linkedinConnection,
    connectLinkedIn,
    isLoading: isLinkedInLoading,
    refresh: refreshLinkedInConnection,
  } = useLinkedInConnection();

  useEffect(() => {
    if (searchParams.get('platform') !== 'linkedin') return;

    const status = searchParams.get('status');
    if (status === 'connected') {
      refreshLinkedInConnection();
      notifications.show({
        title: 'Connected',
        message: 'LinkedIn connected successfully.',
        color: 'green',
      });
    } else if (status === 'error') {
      const reason = searchParams.get('reason');
      notifications.show({
        title: 'Connection Failed',
        message: reason ? `LinkedIn connection failed: ${reason}` : 'LinkedIn connection failed.',
        color: 'red',
      });
    }

    router.replace(`/app/approvals/${id}`);
  }, [refreshLinkedInConnection, router, searchParams, id]);

  if (!draft) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-text-primary">Post Approval Not Found</h2>
        <p className="text-sm text-text-secondary mt-2">The requested approval link has expired or is invalid.</p>
        <Link href="/app/approvals" className="text-xs text-instagram-pink font-semibold mt-4 hover:underline inline-block">
          Return to Approvals
        </Link>
      </div>
    );
  }

  const activeWorkspace = state.workspaces.find((w) => w.id === draft.workspaceId) || state.workspaces[0];
  const imageUrl = draft.imageUrl || getSimulatedImage(draft.prompt ?? '');

  const isClient = user?.userType === 'client' || state.currentUserType === 'client';
  const isLinkedInRequired = draft.platform === 'linkedin' || draft.platform === 'both';
  const linkedinConnected = linkedinConnection?.connected ?? false;
  const isApprovalDisabled = isClient && isLinkedInRequired && !isLinkedInLoading && !linkedinConnected;

  const handleApprove = () => {
    if (isApprovalDisabled) {
      notifications.show({
        title: 'LinkedIn Account Required',
        message: 'You must connect your LinkedIn account to approve this post.',
        color: 'red',
      });
      return;
    }

    const nextVersion = (draft.version ?? 1) + 1;
    updateDraft({
      ...draft,
      status: 'approved',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // scheduled 3 days from now
      version: nextVersion,
      history: [
        {
          version: nextVersion,
          timestamp: new Date().toISOString(),
          action: 'Post Approved & Scheduled',
          caption: draft.caption
        },
        ...(draft.history ?? [])
      ]
    });
    notifications.show({
      title: 'Success',
      message: 'Post Approved & Scheduled successfully!',
      color: 'green',
    });
    router.push('/app/publishing');
  };

  const handleFeedback = () => {
    if (!feedback.trim()) {
      notifications.show({
        title: 'Validation error',
        message: 'Please enter your revision comments before requesting changes.',
        color: 'yellow',
      });
      return;
    }

    const nextVersion = (draft.version ?? 1) + 1;
    updateDraft({
      ...draft,
      status: 'rejected',
      version: nextVersion,
      history: [
        {
          version: nextVersion,
          timestamp: new Date().toISOString(),
          action: 'Client Requested Changes',
          caption: draft.caption,
          feedback: feedback
        },
        ...(draft.history ?? [])
      ]
    });
    notifications.show({
      title: 'Feedback submitted',
      message: 'Draft returned to creator for revisions.',
      color: 'green',
    });
    router.push('/app/approvals');
  };

  const handleRejectOnly = () => {
    const nextVersion = (draft.version ?? 1) + 1;
    updateDraft({
      ...draft,
      status: 'rejected',
      version: nextVersion,
      history: [
        {
          version: nextVersion,
          timestamp: new Date().toISOString(),
          action: 'Post Rejected',
          caption: draft.caption,
          feedback: 'Rejected by client'
        },
        ...(draft.history ?? [])
      ]
    });
    notifications.show({
      title: 'Post rejected',
      message: 'Post rejected.',
      color: 'red',
    });
    router.push('/app/approvals');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto w-full">
      {/* Back button */}
      <div>
        <Link
          href="/app/approvals"
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary font-semibold transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Approvals List
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Metadata and Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approval Task</span>
              <h2 className="text-xl font-bold text-text-primary mt-0.5">{draft.prompt}</h2>
              <p className="text-xs text-text-secondary mt-1">Review the preview on the right and select an action.</p>
            </div>

            {isApprovalDisabled && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-4 text-xs space-y-2">
                <p className="font-semibold text-red-800 dark:text-red-400">
                  LinkedIn Account Required
                </p>
                <p className="text-red-700 dark:text-red-300">
                  Please connect your LinkedIn account to approve this post. As a standard, a client's account must be connected to where the post is published.
                </p>
                <button
                  onClick={() => connectLinkedIn(`/app/approvals/${draft.id}`)}
                  className="mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition shadow-xs cursor-pointer animate-pulse"
                >
                  Connect LinkedIn
                </button>
              </div>
            )}

            {/* Actions Panel */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-primary">
              <button
                onClick={handleApprove}
                disabled={isApprovalDisabled}
                className={`w-full flex items-center justify-center gap-2 text-white py-3 rounded-full text-xs font-bold transition shadow-sm ${
                  isApprovalDisabled
                    ? 'bg-slate-400 cursor-not-allowed opacity-50'
                    : 'bg-[#E1306C] hover:opacity-95'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Approve & Schedule</span>
              </button>
              <button
                onClick={handleRejectOnly}
                className="w-full flex items-center justify-center gap-2 bg-bg-app hover:bg-slate-200 border border-border-primary text-text-primary py-3 rounded-full text-xs font-bold transition"
              >
                <X className="w-4 h-4" />
                <span>Reject Draft</span>
              </button>
            </div>
          </div>

          {/* Feedback change request section */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-text-secondary" />
              <span>Request Changes / Edit Feedback</span>
            </h3>
            <div className="flex flex-col gap-3">
              <textarea
                placeholder="Client feedback: e.g., 'Please change the third sentence to highlight the organic linen option instead of cotton, and add #LinenFashion.'"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="border border-border-primary rounded-xl p-3 text-xs focus:border-[#E1306C] outline-none transition min-h-[90px] resize-y"
              />
              <button
                onClick={handleFeedback}
                className="w-full flex items-center justify-center gap-1.5 bg-[#262626] text-white py-2.5 rounded-full text-xs font-bold hover:opacity-95 transition"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>Submit Revision Feedback</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Simulated Smartphone Frame */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-[320px] h-[600px] border-[8px] border-[#1e293b] rounded-[32px] bg-bg-app overflow-hidden shadow-2xl relative flex flex-col">
            {/* Top Notch/Speaker */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1e293b] rounded-b-xl z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-[#374151] rounded-full mb-1"></div>
            </div>

            {/* Platform Mockup Header with Switcher */}
            <div className="bg-bg-card border-b border-border-primary pt-8 pb-3 px-4 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-1.5">
                {activeTab === 'instagram' ? (
                  <Instagram className="w-4 h-4 text-instagram-pink" />
                ) : (
                  <Linkedin className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-[11px] font-bold text-text-primary capitalize">{activeTab} Preview</span>
              </div>
              {draft.platform === 'both' && (
                <div className="flex gap-1 bg-bg-app p-0.5 rounded-full border border-border-primary">
                  <button 
                    onClick={() => setActiveTab('instagram')}
                    className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition cursor-pointer ${
                      activeTab === 'instagram' ? 'bg-instagram-pink text-white shadow-xs' : 'text-text-secondary'
                    }`}
                  >
                    Insta
                  </button>
                  <button 
                    onClick={() => setActiveTab('linkedin')}
                    className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition cursor-pointer ${
                      activeTab === 'linkedin' ? 'bg-blue-600 text-white shadow-xs' : 'text-text-secondary'
                    }`}
                  >
                    LinkedIn
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Preview Area */}
            <div className="flex-1 overflow-y-auto bg-bg-app">
              {activeTab === 'instagram' ? (
                /* INSTAGRAM MOCKUP */
                <div className="flex flex-col bg-bg-card">
                  {/* Instagram User Header */}
                  <div className="flex items-center justify-between p-3 border-b border-border-primary">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white font-black text-[10px]">
                        {activeWorkspace?.name?.charAt(0) || 'W'}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-text-primary leading-tight">{activeWorkspace?.name || 'Brand Name'}</p>
                        <p className="text-[8px] text-text-secondary leading-none mt-0.5">AI Mockup Draft</p>
                      </div>
                    </div>
                    <MoreVertical className="w-3.5 h-3.5 text-text-secondary" />
                  </div>

                  {/* Post Image */}
                  <div className="w-full aspect-square bg-bg-app flex items-center justify-center overflow-hidden border-b border-border-primary relative">
                    {imageUrl ? (
                      <Image 
                        src={imageUrl} 
                        alt="Instagram Visual" 
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-bg-hover">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">AI Image Concept</span>
                        <p className="text-[8px] text-text-secondary line-clamp-6 mt-1 font-mono leading-relaxed">
                          {draft.imageBrief}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Instagram Actions */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3.5 text-text-primary">
                      <Heart className="w-4.5 h-4.5 hover:text-red-500 transition cursor-pointer" />
                      <MessageCircle className="w-4.5 h-4.5 hover:opacity-80 transition cursor-pointer" />
                      <Send className="w-4.5 h-4.5 hover:opacity-80 transition cursor-pointer" />
                    </div>
                    <Bookmark className="w-4.5 h-4.5 text-text-primary hover:opacity-80 transition cursor-pointer" />
                  </div>

                  {/* Caption & Hashtags */}
                  <div className="px-3 pb-4 space-y-1 text-[11px] text-text-primary">
                    <p className="leading-relaxed">
                      <span className="font-bold mr-1">{activeWorkspace?.name?.toLowerCase().replace(/\s+/g, '') || 'brand'}</span>
                      {draft.caption}
                    </p>
                    <p className="text-instagram-pink font-semibold leading-normal">
                      {(draft.hashtags ?? []).map((h) => `#${h}`).join(' ')}
                    </p>
                  </div>
                </div>
              ) : (
                /* LINKEDIN MOCKUP */
                <div className="bg-bg-card p-3 space-y-3">
                  {/* LinkedIn User Header */}
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
                    <MoreVertical className="w-4 h-4 text-text-secondary" />
                  </div>

                  {/* LinkedIn Body Text */}
                  <div className="space-y-2 text-text-primary text-[11px] leading-relaxed whitespace-pre-wrap">
                    <p>{draft.liCaption || draft.caption}</p>
                    <p className="text-blue-700 dark:text-blue-400 font-semibold">
                      {(draft.liHashtags ?? draft.hashtags ?? []).map((h) => `#${h}`).join(' ')}
                    </p>
                  </div>

                  {/* LinkedIn Attachment Image */}
                  <div className="border border-border-primary rounded-lg overflow-hidden bg-bg-app">
                    {imageUrl ? (
                      <Image 
                        src={imageUrl} 
                        alt="LinkedIn Visual" 
                        width={600}
                        height={400}
                        unoptimized
                        className="w-full object-cover max-h-52" 
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] flex flex-col items-center justify-center p-4 text-center bg-bg-hover">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">AI Image Concept</span>
                        <p className="text-[8px] text-text-secondary line-clamp-6 mt-1 font-mono leading-relaxed">
                          {draft.liImageBrief || draft.imageBrief}
                        </p>
                      </div>
                    )}
                    <div className="p-2 border-t border-border-primary bg-bg-card">
                      <p className="font-bold text-[10px] truncate text-text-primary">{draft.prompt || 'PressForge AI Update'}</p>
                      <p className="text-[9px] text-text-secondary truncate">{activeWorkspace?.name || 'brand'}.com</p>
                    </div>
                  </div>

                  {/* LinkedIn Actions */}
                  <div className="border-t border-border-primary pt-2 flex items-center justify-between text-text-secondary text-[10px] font-bold">
                    <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Like</span>
                    </button>
                    <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Comment</span>
                    </button>
                    <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1">
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Repost</span>
                    </button>
                    <button type="button" className="flex items-center gap-1 hover:text-blue-600 py-1">
                      <Send className="w-3.5 h-3.5 rotate-0" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Frame */}
            <div className="bg-bg-card p-3 flex gap-2 border-t border-border-primary shrink-0">
              <button
                onClick={handleApprove}
                disabled={isApprovalDisabled}
                className={`flex-1 text-white py-2 rounded-full text-xs font-bold transition shadow-sm text-center ${
                  isApprovalDisabled
                    ? 'bg-slate-400 cursor-not-allowed opacity-50'
                    : 'bg-[#E1306C] hover:opacity-95'
                }`}
              >
                Approve Post
              </button>
              <button
                onClick={() => {
                  const el = document.querySelector('textarea');
                  if (el) el.focus();
                }}
                className="flex-1 bg-bg-app hover:bg-slate-200 border border-border-primary text-text-primary py-2 rounded-full text-xs font-bold transition text-center"
              >
                Request Edits
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

