'use client';

import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAppState } from '@/lib/queries/use-app-state';
import type { Draft } from '@/lib/types';
import type { PaginatedDraftListResponse } from '@/lib/types/pagination';

export interface UsePaginatedDraftsOptions {
  workspaceId?: string | null;
  status?: string | null;
  search?: string | null;
  platform?: string | null;
  page?: number;
  limit?: number;
}

async function fetchPaginatedDrafts(
  workspaceId?: string | null,
  status?: string | null,
  search?: string | null,
  platform?: string | null,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedDraftListResponse> {
  const params = new URLSearchParams();
  if (workspaceId) params.set('workspaceId', workspaceId);
  if (status && status !== 'all') params.set('status', status);
  if (search && search.trim()) params.set('search', search.trim());
  if (platform && platform !== 'all') params.set('platform', platform);
  params.set('page', String(page));
  params.set('limit', String(limit));

  const res = await fetch(`/api/drafts?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch paginated drafts');
  }
  return res.json();
}

export function usePaginatedDrafts({
  workspaceId,
  status,
  search,
  platform,
  page = 1,
  limit = 10,
}: UsePaginatedDraftsOptions = {}) {
  const { state } = useAppState();
  const queryClient = useQueryClient();
  const activeWorkspaceId = workspaceId ?? state.activeWorkspaceId;

  const queryKey = [
    'paginated-drafts',
    activeWorkspaceId,
    status || 'all',
    search || '',
    platform || 'all',
    page,
    limit,
  ];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchPaginatedDrafts(activeWorkspaceId, status, search, platform, page, limit),
    staleTime: 10_000,
    placeholderData: (previousData, previousQuery) => {
      const previousWorkspaceId = previousQuery?.queryKey?.[1];
      if (previousWorkspaceId && previousWorkspaceId === activeWorkspaceId) {
        return previousData;
      }
      return undefined;
    },
  });

  // Client-side fallback if query fails or state has local drafts
  const allWorkspaceDrafts = state.drafts.filter(
    (d) => !activeWorkspaceId || d.workspaceId === activeWorkspaceId
  );

  const filterDraft = (d: Draft) => {
    if (status && status !== 'all') {
      if (status === 'draft' && d.status !== 'draft' && d.status !== 'rejected') return false;
      if ((status === 'pending' || status === 'pending_approval') && d.status !== 'pending_approval') return false;
      if (status === 'approved' && d.status !== 'approved') return false;
      if (status === 'published' && d.status !== 'published') return false;
      if (status === 'approved_all' && d.status !== 'approved' && d.status !== 'published') return false;
      if (status === 'rejected' && d.status !== 'rejected') return false;
    }

    if (platform && platform !== 'all') {
      if (d.platform && d.platform !== platform && d.platform !== 'both') return false;
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const matchPrompt = d.prompt?.toLowerCase().includes(q);
      const matchCaption = d.caption?.toLowerCase().includes(q);
      const matchLiCaption = d.liCaption?.toLowerCase().includes(q);
      if (!matchPrompt && !matchCaption && !matchLiCaption) return false;
    }

    return true;
  };

  const filteredLocalDrafts = allWorkspaceDrafts.filter(filterDraft);
  const totalLocal = filteredLocalDrafts.length;
  const totalPagesLocal = Math.max(1, Math.ceil(totalLocal / limit));
  const offsetLocal = (page - 1) * limit;
  const paginatedLocal = filteredLocalDrafts.slice(offsetLocal, offsetLocal + limit);

  const pendingCount = allWorkspaceDrafts.filter((d) => d.status === 'pending_approval').length;
  const approvedCount = allWorkspaceDrafts.filter((d) => d.status === 'approved' || d.status === 'published').length;
  const rejectedCount = allWorkspaceDrafts.filter((d) => d.status === 'rejected').length;
  const draftCount = allWorkspaceDrafts.filter((d) => d.status === 'draft' || d.status === 'rejected').length;
  const publishedCount = allWorkspaceDrafts.filter((d) => d.status === 'published').length;

  const fallbackCounts = {
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    draft: draftCount,
    published: publishedCount,
    all: allWorkspaceDrafts.length,
  };

  // Look for any cached counts for this activeWorkspaceId in TanStack Query Cache
  const cachedQueries = queryClient.getQueriesData<PaginatedDraftListResponse>({
    queryKey: ['paginated-drafts', activeWorkspaceId],
  });
  const cachedCounts = cachedQueries.find(([, data]) => data?.counts)?.[1]?.counts;

  const isSuccess = query.isSuccess && !!query.data;

  // Do NOT return dummy mock data while loading.
  // Return query.data.drafts when success, or empty array while loading, or paginatedLocal only if there's an error.
  const drafts: Draft[] = isSuccess
    ? query.data.drafts
    : query.isError
    ? paginatedLocal
    : [];

  const total: number = isSuccess ? query.data.total : query.isError ? totalLocal : 0;
  const totalPages: number = isSuccess ? query.data.total_pages : query.isError ? totalPagesLocal : 1;
  const hasNext: boolean = isSuccess ? query.data.has_next : query.isError ? page < totalPagesLocal : false;
  const hasPrev: boolean = isSuccess ? query.data.has_prev : query.isError ? page > 1 : false;

  const emptyCounts = { pending: 0, approved: 0, rejected: 0, draft: 0, published: 0, all: 0 };
  const counts = query.data?.counts || cachedCounts || (query.isError ? fallbackCounts : emptyCounts);
  const isInitialLoading = query.isLoading && !query.data && !cachedCounts;

  return {
    drafts,
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
    counts,
    isLoading: query.isLoading,
    isInitialLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
