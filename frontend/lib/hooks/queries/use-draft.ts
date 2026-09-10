'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppState } from '@/lib/queries/use-app-state';
import type { Draft } from '@/lib/types';

export function useDraft(id: string | undefined | null) {
  const { state, updateDraft } = useAppState();
  const stateDraft = state.drafts.find((d) => d.id === id);

  const query = useQuery({
    queryKey: ['draft', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/drafts/${id}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch draft');
      }
      const data = await res.json();
      const fetchedDraft = data.draft as Draft;
      if (fetchedDraft) {
        // Sync fetched draft into app state cache so other parts of the app also have it
        updateDraft(fetchedDraft);
      }
      return fetchedDraft;
    },
    enabled: Boolean(id),
    initialData: stateDraft,
    staleTime: 10_000,
  });

  const activeDraft = query.data ?? stateDraft;

  return {
    draft: activeDraft,
    isLoading: query.isLoading && !activeDraft,
    isError: query.isError,
    refetch: query.refetch,
  };
}
