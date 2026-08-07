'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useLinkedInConnection, useInstagramConnection } from '@/lib/hooks/queries/use-social-connection';
import React, { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  RefreshCw,
  Linkedin,
  Instagram,
  Share2,
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

function renderPlatformBadge(platform?: string) {
  const p = (platform || 'linkedin').toLowerCase();
  if (p === 'both') {
    return (
      <span className="flex items-center gap-1 text-instagram-pink font-bold">
        <Share2 className="w-3 h-3" /> Both (LinkedIn & IG)
      </span>
    );
  }
  if (p === 'instagram') {
    return (
      <span className="flex items-center gap-1 text-instagram-pink font-bold">
        <Instagram className="w-3 h-3" /> Instagram
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-blue-600 font-bold">
      <Linkedin className="w-3 h-3" /> LinkedIn
    </span>
  );
}

export function PublishingView() {
  const queryClient = useQueryClient();
  const { state } = useAppState();
  const { user } = useAuth();
  const {
    connection: linkedinConnection,
    isLoading: isLinkedInLoading,
    isConnecting: isLinkedInConnecting,
    connectLinkedIn,
  } = useLinkedInConnection();

  const {
    connection: instagramConnection,
    isLoading: isInstagramLoading,
    isConnecting: isInstagramConnecting,
    connectInstagram,
  } = useInstagramConnection();

  const [activeTab, setActiveTab] = useState<'scheduled' | 'logs'>('scheduled');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  const drafts = state.drafts.filter((d) => d.workspaceId === state.activeWorkspaceId);
  const scheduledPosts = drafts.filter((d) => d.status === 'approved');
  const publishedLogs = drafts.filter((d) => d.status === 'published');
  const linkedinConnected = linkedinConnection?.connected ?? false;
  const instagramConnected = instagramConnection?.connected ?? false;
  const isClient = user?.userType === 'client' || state.currentUserType === 'client';

  // Keep queue in sync while auto-publish clears approved drafts in the background
  useEffect(() => {
    if (scheduledPosts.length === 0) return;
    const id = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['app-state'] });
    }, 15_000);
    return () => window.clearInterval(id);
  }, [scheduledPosts.length, queryClient]);

  const handlePublishNow = async (draft: Draft) => {
    setPublishingId(draft.id);
    setPublishError(null);
    setPublishSuccess(null);

    try {
      const res = await fetch(`/api/drafts/${draft.id}/publish`, { method: 'POST' });
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
        const message = body?.error || 'Failed to publish content.';
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

      const successMessage = body.message || 'Published successfully.';
      setPublishSuccess(successMessage);
      notifications.show({
        title: 'Success',
        message: successMessage,
        color: 'green',
      });
      setActiveTab('logs');
    } catch {
      const message = 'Failed to publish post. Please try again.';
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
            Approved drafts auto-post to LinkedIn and Instagram when connected. Manual publish works anytime.
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

      {isClient && !isLinkedInLoading && !isInstagramLoading && (!linkedinConnected || !instagramConnected) && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 font-medium sm:flex-row sm:items-center sm:justify-between">
          <span>
            Connect social accounts to enable automated multi-platform publishing.
          </span>
          <div className="flex items-center gap-2">
            {!linkedinConnected && (
              <button
                type="button"
                onClick={() => connectLinkedIn('/app/publishing')}
                disabled={isLinkedInConnecting}
                className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isLinkedInConnecting ? 'Redirecting...' : 'Connect LinkedIn'}
              </button>
            )}
            {!instagramConnected && (
              <button
                type="button"
                onClick={() => connectInstagram('/app/publishing')}
                disabled={isInstagramConnecting}
                className="shrink-0 rounded-lg bg-instagram-pink px-3 py-1.5 text-[10px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isInstagramConnecting ? 'Redirecting...' : 'Connect Instagram'}
              </button>
            )}
          </div>
        </div>
      )}

      {publishError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-4 py-3 text-xs text-red-700 dark:text-red-400 font-medium">
          {publishError}
        </div>
      )}

      {publishSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 px-4 py-3 text-xs text-green-700 dark:text-green-400 font-medium">
          {publishSuccess}
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2">
            Approved Queue
          </h3>

          <div className="flex flex-col gap-4">
            {scheduledPosts.map((post) => {
              const platform = (post.platform || 'linkedin').toLowerCase();
              return (
                <div
                  key={post.id}
                  className="border border-border-primary rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-bg-app/50 transition relative overflow-hidden"
                >
                  {publishingId === post.id && (
                    <div className="absolute inset-0 bg-bg-card/70 backdrop-blur-sm z-10 flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-instagram-pink animate-spin" />
                      <span className="text-xs font-bold text-text-primary">
                        Publishing post...
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-bg-app flex items-center justify-center text-text-secondary shrink-0 mt-0.5 border border-border-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-text-primary">{post.prompt}</h4>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {draftPreviewText(post)}
                      </p>
                      <div className="flex items-center gap-3 pt-2 text-[10px] text-text-secondary font-semibold">
                        {renderPlatformBadge(post.platform)}
                        <span className="text-slate-300">|</span>
                        <span>
                          Scheduled:{' '}
                          {post.scheduledAt
                            ? new Date(post.scheduledAt).toLocaleDateString()
                            : 'Ready now'}
                        </span>
                        {!post.publishError && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="text-green-600">Auto-posting queued</span>
                          </>
                        )}
                      </div>
                      {post.publishError && (
                        <p className="pt-1 text-[10px] font-semibold text-red-600">
                          {post.publishError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <button
                      onClick={() => handlePublishNow(post)}
                      disabled={publishingId !== null}
                      className="flex items-center gap-1.5 bg-[#262626] dark:bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {platform === 'both'
                          ? 'Publish Both'
                          : platform === 'instagram'
                          ? 'Publish to IG'
                          : 'Publish to LinkedIn'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

            {scheduledPosts.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-sm font-bold text-slate-400 italic">
                  No posts in the approved queue.
                </p>
                <p className="text-xs text-text-secondary">
                  Approve a draft to queue it. It will auto-post when configured social channels are connected.
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
                        Published ({log.platform || 'multi-platform'})
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-1 italic">
                      &quot;{draftPreviewText(log)}&quot;
                    </p>
                    <p className="text-[9px] text-text-secondary font-semibold mt-1">
                      Published: {formatPublishedAt(log)}
                      {log.externalPostId ? ` · ID: ${log.externalPostId}` : ''}
                    </p>
                  </div>
                </div>
                {log.externalPostId && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Published
                  </span>
                )}
              </div>
            ))}

            {publishedLogs.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-sm font-bold text-slate-400 italic">No publish logs yet.</p>
                <p className="text-xs text-text-secondary">
                  Successful multi-platform publishes will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
