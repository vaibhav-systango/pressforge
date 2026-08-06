'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppState } from '@/lib/queries/use-app-state';

export interface DashboardStats {
  userRole: string;
  workspaceId: string;
  timeframe: string;
  kpis: {
    weeklyReach: string;
    weeklyReachGrowth: string;
    approvalRate: number;
    scheduledQueueCount: number;
    pendingReviewCount: number;
    rejectedCount: number;
  };
  healthScore: {
    score: number;
    label: string;
    color: string;
    gaugeColor: string;
  };
  chartData: {
    points: Array<{ label: string; value: number; height: number }>;
    svgPath: string;
  };
  workspacePerformance: {
    impressions: string;
    engagementRate: string;
    netFollowers: string;
    prReplies: string;
  };
  clientPendingQueue: Array<{
    id: string;
    prompt: string;
    caption?: string;
    version: number;
    createdAt?: string;
  }>;
  timestamp: string;
}

export async function fetchDashboardStats(workspaceId?: string | null, timeframe?: string): Promise<DashboardStats> {
  const params = new URLSearchParams();
  if (workspaceId) params.set('workspaceId', workspaceId);
  if (timeframe) params.set('timeframe', timeframe);

  const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export function useDashboardStats(timeframe: string = 'Last 7 Days') {
  const { state } = useAppState();
  const workspaceId = state.activeWorkspaceId;

  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', workspaceId, timeframe],
    queryFn: () => fetchDashboardStats(workspaceId, timeframe),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });
}
