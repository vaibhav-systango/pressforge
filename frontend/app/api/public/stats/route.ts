import { NextResponse } from 'next/server';
import { callBackend } from '@/lib/server/backend-client';
import { getSessionState } from '@/lib/server/mock-store';
import { resolveRequestSession } from '@/lib/server/resolve-request-session';
import { MOCK_JOURNALISTS } from '@/lib/data/mock-data';

export async function GET() {
  try {
    // 1. Try calling Python FastAPI backend endpoint
    const backendRes = await callBackend<Record<string, unknown>>('/stats/public');
    if (backendRes.data && backendRes.response.ok) {
      return NextResponse.json(backendRes.data, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59' },
      });
    }

    // 2. Compute purely from live store state
    let state;
    try {
      const session = await resolveRequestSession();
      state = getSessionState(session.sessionId);
    } catch {
      state = null;
    }

    const workspaces = state?.workspaces || [];
    const drafts = state?.drafts || [];
    const mentions = state?.mentions || [];

    const totalWorkspaces = workspaces.length;
    const totalDrafts = drafts.length;
    const approvedDrafts = drafts.filter(d => d.status === 'approved' || d.status === 'published').length;
    const rejectedDrafts = drafts.filter(d => d.status === 'rejected').length;
    const totalDecided = approvedDrafts + rejectedDrafts;

    const approvalRateNum = totalDecided > 0 ? (approvedDrafts / totalDecided) * 100 : totalDrafts > 0 ? 100 : 0;
    const approvalRate = `${approvalRateNum.toFixed(1)}%`;

    // Dynamic reach calculated directly from workspace schedules and published drafts
    const totalSchedules = workspaces.reduce((acc, w) => acc + (w.schedules?.length || 0), 0);
    const calculatedReachVal = (approvedDrafts * 2.5) + (totalSchedules * 5.0) + (totalWorkspaces * 10.0);
    const totalReach = calculatedReachVal >= 1 ? `${calculatedReachVal.toFixed(1)}K` : '0K';

    // Compute average approval time in hours from draft creation to scheduled/published
    let totalApprovalMs = 0;
    let approvedCountWithTime = 0;
    drafts.forEach((d) => {
      if ((d.status === 'approved' || d.status === 'published') && d.createdAt && d.scheduledAt) {
        const created = new Date(d.createdAt).getTime();
        const scheduled = new Date(d.scheduledAt).getTime();
        if (scheduled > created) {
          totalApprovalMs += (scheduled - created);
          approvedCountWithTime++;
        }
      }
    });

    const avgApprovalHours = approvedCountWithTime > 0
      ? `${(totalApprovalMs / (approvedCountWithTime * 3600000)).toFixed(1)} hrs`
      : '0.0 hrs';

    // Compute weekly trend directly from draft timestamps
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    drafts.forEach((d) => {
      if (d.createdAt) {
        const day = dayNames[new Date(d.createdAt).getDay()];
        if (day in dayCounts) {
          dayCounts[day]++;
        }
      }
    });

    const weeklyTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day,
      value: dayCounts[day] || 0,
      reach: Number(((dayCounts[day] || 0) * 1.5).toFixed(1)),
    }));

    // Algorithmic health score out of 100 based on approval rate and active schedule coverage
    const activeScheduleCoverage = totalWorkspaces > 0 ? (workspaces.filter(w => (w.schedules?.length || 0) > 0).length / totalWorkspaces) * 30 : 0;
    const healthScoreVal = Math.round((approvalRateNum * 0.7) + activeScheduleCoverage);
    const healthScore = `${Math.min(100, Math.max(0, healthScoreVal))}/100`;

    const platformStats = {
      totalReach,
      approvalRate,
      healthScore,
      postsPublished: approvedDrafts,
      activeWorkspaces: totalWorkspaces,
      mediaOutletsTargeted: MOCK_JOURNALISTS.length + mentions.length,
      avgApprovalHours,
      weeklyTrend,
      featuresCount: 6,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(platformStats);
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json({
      totalReach: '0K',
      approvalRate: '0%',
      healthScore: '0/100',
      postsPublished: 0,
      activeWorkspaces: 0,
      mediaOutletsTargeted: 0,
      avgApprovalHours: '0.0 hrs',
      weeklyTrend: [
        { day: 'Mon', value: 0, reach: 0 },
        { day: 'Tue', value: 0, reach: 0 },
        { day: 'Wed', value: 0, reach: 0 },
        { day: 'Thu', value: 0, reach: 0 },
        { day: 'Fri', value: 0, reach: 0 },
        { day: 'Sat', value: 0, reach: 0 },
        { day: 'Sun', value: 0, reach: 0 },
      ],
      featuresCount: 6,
      timestamp: new Date().toISOString(),
    });
  }
}
