'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useAppState } from '@/lib/queries/use-app-state';
import { useLinkedInConnection } from '@/lib/hooks/queries/use-social-connection';
import React, { useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  RefreshCw,
  Linkedin,
  ExternalLink,
} from 'lucide-react';
import type { AppState, Draft } from '@/lib/types';

function draftPreviewText(draft: Draft): string {
  return (draft.liCaption || draft.caption || draft.prompt || '').trim();
}

function formatPublishedAt(draft: Draft): string {
  if (typeof draft.publishedAt === 'number') {
    return new Date(draft.publishedAt).toLocaleString();
  }
  if (draft.scheduledAt) {
    return new Date(draft.scheduledAt).toLocaleString();
  }
  return 'Just now';
}

export function PublishingView() {
  const queryClient = useQueryClient();
  const { state } = useAppState();
  const {
    connection: linkedinConnection,
    isLoading: isLinkedInLoading,
    isConnecting: isLinkedInConnecting,
    connectLinkedIn,
  } = useLinkedInConnection();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'logs'>('scheduled');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  const drafts = state.drafts.filter((d) => d.workspaceId === state.activeWorkspaceId);
  const scheduledPosts = drafts.filter((d) => d.status === 'approved');
  const publishedLogs = drafts.filter((d) => d.status === 'published');
  const linkedinConnected = linkedinConnection?.connected ?? false;

  const handlePublishNow = async (draftId: string) => {
    setPublishingId(draftId);
    setPublishError(null);
    setPublishSuccess(null);

    try {
      const res = await fetch(`/api/drafts/${draftId}/publish`, { method: 'POST' });
      const body = (await res.json().catch(() => null)) as
        | {
            draft?: Draft;
            message?: string;
            externalPostId?: string;
            error?: string;
            code?: string;
          }
        | null;

      if (!res.ok || !body?.draft) {
        const message =
          body?.error ||
          (body?.code === 'LINKEDIN_RECONNECT_REQUIRED'
            ? 'LinkedIn connection expired. Reconnect LinkedIn in Settings.'
            : 'Failed to publish to LinkedIn.');
        setPublishError(message);
        notifications.show({
          title: 'Publish failed',
          message,
          color: 'red',
        });
        return;
      }

      const publishedDraft: Draft = {
        ...body.draft,
        status: 'published',
        externalPostId: body.externalPostId ?? body.draft.externalPostId,
      };

      queryClient.setQueryData(['app-state'], (old: { state: AppState } | undefined) => {
        if (!old?.state) return old;
        return {
          state: {
            ...old.state,
            drafts: (old.state.drafts || []).map((d) =>
              d.id === publishedDraft.id ? { ...d, ...publishedDraft } : d,
            ),
          },
        };
      });

      const successMessage = body.message || 'Published to LinkedIn successfully.';
      setPublishSuccess(successMessage);
      notifications.show({
        title: 'Success',
        message: successMessage,
        color: 'green',
      });
      setActiveTab('logs');
    } catch {
      const message = 'Failed to publish to LinkedIn. Please try again.';
      setPublishError(message);
      notifications.show({
        title: 'Publish failed',
        message,
        color: 'red',
      });
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="border-b border-border-primary pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Publishing Hub</h1>
          <p className="text-sm text-text-secondary mt-1">
            Publish approved drafts to LinkedIn and review publication history.
          </p>
        </div>

        <div className="bg-bg-app p-1 rounded-xl flex items-center border border-border-primary self-start sm:self-center">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 ${
              activeTab === 'scheduled'
                ? 'bg-bg-card text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Approved Queue ({scheduledPosts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 ${
              activeTab === 'logs'
                ? 'bg-bg-card text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Publishing Logs ({publishedLogs.length})</span>
          </button>
        </div>
      </div>

      {!isLinkedInLoading && !linkedinConnected && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 font-medium sm:flex-row sm:items-center sm:justify-between">
          <span>
            Connect LinkedIn before publishing. Approved drafts stay queued until an account is
            connected.
          </span>
          <button
            type="button"
            onClick={() => connectLinkedIn('/app/publishing')}
            disabled={isLinkedInConnecting}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLinkedInConnecting ? 'Redirecting...' : 'Connect LinkedIn'}
          </button>
        </div>
      )}

      {publishError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-medium">
          {publishError}
        </div>
      )}

      {publishSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700 font-medium">
          {publishSuccess}
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2">
            Approved Queue
          </h3>

          <div className="flex flex-col gap-4">
            {scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="border border-border-primary rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-bg-app/50 transition relative overflow-hidden"
              >
                {publishingId === post.id && (
                  <div className="absolute inset-0 bg-bg-card/70 backdrop-blur-sm z-10 flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-xs font-bold text-text-primary">
                      Publishing to LinkedIn...
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-bg-app flex items-center justify-center text-text-secondary shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-text-primary">{post.prompt}</h4>
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {draftPreviewText(post)}
                    </p>
                    <div className="flex items-center gap-3 pt-2 text-[10px] text-text-secondary font-semibold">
                      <span className="flex items-center gap-1">
                        <Linkedin className="w-3 h-3 text-blue-600" /> LinkedIn
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>
                        Scheduled:{' '}
                        {post.scheduledAt
                          ? new Date(post.scheduledAt).toLocaleDateString()
                          : 'Ready now'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <button
                    onClick={() => handlePublishNow(post.id)}
                    disabled={!linkedinConnected || publishingId !== null}
                    className="flex items-center gap-1.5 bg-[#262626] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish to LinkedIn</span>
                  </button>
                </div>
              </div>
            ))}

            {scheduledPosts.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-sm font-bold text-slate-400 italic">
                  No posts in the approved queue.
                </p>
                <p className="text-xs text-text-secondary">
                  Approve a draft first, then publish it to LinkedIn from here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2">
            Publishing Status Logs
          </h3>

          <div className="flex flex-col gap-4">
            {publishedLogs.map((log) => (
              <div
                key={log.id}
                className="border border-border-primary rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-app/30"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-text-primary">{log.prompt}</h4>
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                        Published to LinkedIn
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-1 italic">
                      &quot;{draftPreviewText(log)}&quot;
                    </p>
                    <p className="text-[9px] text-text-secondary font-semibold mt-1">
                      Published: {formatPublishedAt(log)}
                      {log.externalPostId ? ` · Post ID: ${log.externalPostId}` : ''}
                    </p>
                  </div>
                </div>
                {log.externalPostId && (
                  <a
                    href={`https://www.linkedin.com/feed/update/${encodeURIComponent(log.externalPostId)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on LinkedIn
                  </a>
                )}
              </div>
            ))}

            {publishedLogs.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-sm font-bold text-slate-400 italic">No publish logs yet.</p>
                <p className="text-xs text-text-secondary">
                  Successful LinkedIn publishes will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
