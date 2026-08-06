'use client';

import { useQuery } from '@tanstack/react-query';

export interface PublicStats {
  totalReach: string;
  approvalRate: string;
  healthScore: string;
  postsPublished: number;
  activeWorkspaces: number;
  mediaOutletsTargeted: number;
  avgApprovalHours: string;
  weeklyTrend: Array<{ day: string; value: number; reach: number }>;
  featuresCount: number;
  timestamp: string;
}

export async function fetchPublicStats(): Promise<PublicStats> {
  const res = await fetch('/api/public/stats');
  if (!res.ok) throw new Error('Failed to fetch public stats');
  return res.json();
}

export function usePublicStats() {
  return useQuery<PublicStats>({
    queryKey: ['public-stats'],
    queryFn: fetchPublicStats,
    staleTime: 30 * 1000,
  });
}
