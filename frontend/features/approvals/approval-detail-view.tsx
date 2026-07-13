'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { ChevronLeft, Check, X, CornerDownLeft, MessageSquare, Phone, Video, MoreVertical, Sparkles, Send } from 'lucide-react';



export function ApprovalDetailView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { state, updateDraft } = useAppState();
  const draft = state.drafts.find((d) => d.id === id);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState<'instagram' | 'linkedin'>(
    draft?.platform === 'linkedin' ? 'linkedin' : 'instagram',
  );

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

  const handleApprove = () => {
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
    alert('Post Approved & Scheduled successfully!');
    router.push('/app/publishing');
  };

  const handleFeedback = () => {
    if (!feedback.trim()) {
      alert('Please enter your revision comments before requesting changes.');
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
    alert('Feedback submitted. Draft returned to creator for revisions.');
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
    alert('Post rejected.');
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

            {/* Actions Panel */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-primary">
              <button
                onClick={handleApprove}
                className="w-full flex items-center justify-center gap-2 bg-[#E1306C] text-white py-3 rounded-full text-xs font-bold hover:opacity-95 transition shadow-sm"
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

        {/* Right Side: Simulated Smartphone Frame (WhatsApp Mock) */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-[320px] h-[600px] border-[8px] border-[#1e293b] rounded-[32px] bg-[#0f172a] overflow-hidden shadow-2xl relative flex flex-col">
            {/* Top Notch/Speaker */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1e293b] rounded-b-xl z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-[#374151] rounded-full mb-1"></div>
            </div>

            {/* WhatsApp Header */}
            <div className="bg-[#075E54] text-white pt-7 pb-2.5 px-4 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-[#075E54] text-xs font-extrabold">
                  PF
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">PressForge Approvals</p>
                  <p className="text-[9px] text-[#25D366] font-semibold leading-none mt-0.5">Online</p>
                </div>
              </div>
              <div className="flex gap-2.5 text-slate-100">
                <Video className="w-3.5 h-3.5" />
                <Phone className="w-3.5 h-3.5" />
                <MoreVertical className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-[#E5DDD5] p-3 overflow-y-auto space-y-4 flex flex-col justify-end">
              {/* Message 1: Bot Explainer */}
              <div className="bg-bg-card rounded-lg p-2.5 text-xs text-text-primary shadow-sm max-w-[85%] self-start relative">
                {/* Speech tail */}
                <span className="absolute -left-1.5 top-2 border-[6px] border-transparent border-r-white"></span>
                <p className="leading-relaxed">
                  Hi! Here is the latest cross-platform post draft. Review the media brief and text below:
                </p>
              </div>

              {/* Platform Toggle Pill (Inside WhatsApp Chat) */}
              {draft.platform === 'both' && (
                <div className="flex gap-1 justify-center self-center bg-bg-card/50 backdrop-blur-xs p-0.5 rounded-full border border-slate-300/40">
                  <button 
                    onClick={() => setActiveTab('instagram')}
                    className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase transition cursor-pointer ${
                      activeTab === 'instagram' ? 'bg-[#075E54] text-white shadow-xs' : 'text-text-secondary'
                    }`}
                  >
                    Instagram
                  </button>
                  <button 
                    onClick={() => setActiveTab('linkedin')}
                    className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase transition cursor-pointer ${
                      activeTab === 'linkedin' ? 'bg-[#075E54] text-white shadow-xs' : 'text-text-secondary'
                    }`}
                  >
                    LinkedIn
                  </button>
                </div>
              )}

              {/* Message 2: Post Card */}
              <div className="bg-[#DCF8C6] rounded-lg p-1.5 shadow-sm max-w-[90%] self-end relative space-y-2 border border-green-200">
                {/* Speech tail */}
                <span className="absolute -right-1.5 top-2 border-[6px] border-transparent border-l-[#DCF8C6]"></span>

                {/* Mock Image Box */}
                <div className="w-full aspect-[4/3] bg-bg-app border border-border-primary rounded-md flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">AI Image Concept</span>
                  <p className="text-[8px] text-text-secondary line-clamp-4 mt-1 font-mono leading-relaxed">
                    {activeTab === 'instagram' ? draft.imageBrief : (draft.liImageBrief || draft.imageBrief)}
                  </p>
                </div>

                {/* Caption text */}
                <div className="px-1 py-0.5 text-[10px] text-text-primary leading-relaxed space-y-1">
                  <p className="whitespace-pre-wrap">
                    {activeTab === 'instagram' ? draft.caption : (draft.liCaption || draft.caption)}
                  </p>
                  <p className="text-[#075E54] font-semibold">
                    {activeTab === 'instagram' 
                      ? (draft.hashtags ?? []).map((h) => `#${h}`).join(' ') 
                      : (draft.liHashtags ?? draft.hashtags ?? []).map((h) => `#${h}`).join(' ')}
                  </p>
                </div>
              </div>

              {/* simulated actions inside chat */}
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-[#25D366] text-white py-2 rounded-xl text-[10px] font-bold shadow hover:opacity-95 transition text-center"
                >
                  Approve Post
                </button>
                <button
                  onClick={() => {
                    const el = document.querySelector('textarea');
                    if (el) el.focus();
                  }}
                  className="flex-1 bg-bg-card border border-border-primary text-text-primary py-2 rounded-xl text-[10px] font-bold shadow hover:bg-bg-app transition text-center"
                >
                  Request Edits
                </button>
              </div>
            </div>

            {/* Bottom Input Area */}
            <div className="bg-bg-app p-2 flex items-center gap-2 border-t border-border-primary shrink-0">
              <div className="flex-1 bg-bg-card rounded-full px-3 py-1.5 border border-border-primary text-slate-400 text-[10px] font-medium">
                Type a message...
              </div>
              <div className="w-8 h-8 rounded-full bg-[#075E54] flex items-center justify-center text-white shrink-0 shadow">
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

