'use client';

import Link from 'next/link';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { Select } from '@/components/common/select';
import { 
  ArrowUpRight, Award, Building
} from 'lucide-react';

function getDeterministicMetrics(workspaceId: string, name: string) {
  if (workspaceId === 'all') {
    return {
      impressions: '450.0K',
      impressionsGrowth: '+15.4% vs last month',
      engagementRate: '4.88%',
      engagementDiff: '+0.2% vs avg',
      followers: '+3,200',
      followersGrowth: '+7.8% acceleration',
      replies: '12 Replies',
      repliesSub: 'From Tier-1 editors',
      growthPath: 'M 10 180 L 100 150 L 200 110 L 300 80 L 400 40 L 490 10',
      bars: [
        { x: 30, y: 60, height: 120, color: '#F58529' },
        { x: 110, y: 30, height: 150, color: '#DD2A7B' },
        { x: 190, y: 90, height: 90, color: '#515BD4' },
        { x: 270, y: 20, height: 160, color: '#F58529' },
        { x: 350, y: 70, height: 110, color: '#DD2A7B' },
        { x: 430, y: 10, height: 170, color: '#515BD4' }
      ]
    };
  }
  if (workspaceId === 'acme-brand') {
    return {
      impressions: '248.5K',
      impressionsGrowth: '+18.2% vs last month',
      engagementRate: '4.82%',
      engagementDiff: '+0.4% industry avg',
      followers: '+1,842',
      followersGrowth: '+8.3% acceleration',
      replies: '4 Replies',
      repliesSub: 'From Tier-1 editors',
      growthPath: 'M 10 180 L 100 160 L 200 130 L 300 110 L 400 60 L 490 20',
      bars: [
        { x: 30, y: 80, height: 100, color: '#F58529' },
        { x: 110, y: 50, height: 130, color: '#DD2A7B' },
        { x: 190, y: 120, height: 60, color: '#515BD4' },
        { x: 270, y: 40, height: 140, color: '#F58529' },
        { x: 350, y: 90, height: 90, color: '#DD2A7B' },
        { x: 430, y: 30, height: 150, color: '#515BD4' }
      ]
    };
  }
  if (workspaceId === 'ecolife') {
    return {
      impressions: '112.4K',
      impressionsGrowth: '+10.5% vs last month',
      engagementRate: '5.15%',
      engagementDiff: '+0.6% industry avg',
      followers: '+850',
      followersGrowth: '+6.1% acceleration',
      replies: '3 Replies',
      repliesSub: 'From Tier-1 editors',
      growthPath: 'M 10 180 L 100 170 L 200 145 L 300 120 L 400 90 L 490 45',
      bars: [
        { x: 30, y: 100, height: 80, color: '#F58529' },
        { x: 110, y: 80, height: 100, color: '#DD2A7B' },
        { x: 190, y: 110, height: 70, color: '#515BD4' },
        { x: 270, y: 70, height: 110, color: '#F58529' },
        { x: 350, y: 100, height: 80, color: '#DD2A7B' },
        { x: 430, y: 60, height: 120, color: '#515BD4' }
      ]
    };
  }
  if (workspaceId === 'global-tech') {
    return {
      impressions: '89.1K',
      impressionsGrowth: '+12.8% vs last month',
      engagementRate: '4.70%',
      engagementDiff: '+0.1% industry avg',
      followers: '+508',
      followersGrowth: '+5.5% acceleration',
      replies: '5 Replies',
      repliesSub: 'From Tier-1 editors',
      growthPath: 'M 10 180 L 100 175 L 200 150 L 300 130 L 400 105 L 490 70',
      bars: [
        { x: 30, y: 110, height: 70, color: '#F58529' },
        { x: 110, y: 90, height: 90, color: '#DD2A7B' },
        { x: 190, y: 130, height: 50, color: '#515BD4' },
        { x: 270, y: 85, height: 95, color: '#F58529' },
        { x: 350, y: 105, height: 75, color: '#DD2A7B' },
        { x: 430, y: 75, height: 105, color: '#515BD4' }
      ]
    };
  }

  // Deterministic fallback for custom CRUD workspaces
  const code = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const calculatedImpressions = ((code % 150) + 50).toFixed(1) + 'K';
  const calculatedEngagement = (((code % 200) / 100) + 3.5).toFixed(2) + '%';
  const calculatedFollowers = '+' + ((code % 800) + 200);
  const calculatedReplies = (code % 8) + 1 + ' Replies';
  
  return {
    impressions: calculatedImpressions,
    impressionsGrowth: `+${((code % 10) + 5).toFixed(1)}% vs last month`,
    engagementRate: calculatedEngagement,
    engagementDiff: `+${((code % 5) / 10).toFixed(1)}% vs avg`,
    followers: calculatedFollowers,
    followersGrowth: `+${((code % 4) + 4).toFixed(1)}% acceleration`,
    replies: calculatedReplies,
    repliesSub: 'From Tier-1 editors',
    growthPath: 'M 10 180 L 100 165 L 200 140 L 300 115 L 400 80 L 490 35',
    bars: [
      { x: 30, y: 90, height: 90, color: '#F58529' },
      { x: 110, y: 70, height: 110, color: '#DD2A7B' },
      { x: 190, y: 115, height: 65, color: '#515BD4' },
      { x: 270, y: 55, height: 125, color: '#F58529' },
      { x: 350, y: 95, height: 85, color: '#DD2A7B' },
      { x: 430, y: 50, height: 130, color: '#515BD4' }
    ]
  };
}

export function AnalyticsView() {
  const { state } = useAppState();
  const isClient = state.currentUserType === 'client';

  // State to filter metrics by workspace
  const [selectedWorkspaceFilter, setSelectedWorkspaceFilter] = useState<string>(
    isClient ? (state.activeWorkspaceId || state.workspaces[0]?.id || '') : 'all'
  );

  // Get active workspace details (if filtered to one)
  const currentWorkspace = state.workspaces.find((w) => w.id === selectedWorkspaceFilter);

  // Get dynamic stats based on selection
  const metrics = getDeterministicMetrics(
    selectedWorkspaceFilter, 
    currentWorkspace ? currentWorkspace.name : 'All Workspaces'
  );

  // Get published drafts as mock performers based on filter
  const publishedPosts = state.drafts.filter((d) => 
    (selectedWorkspaceFilter === 'all' || d.workspaceId === selectedWorkspaceFilter) && d.status === 'published'
  );

  // Generate mock static items when no dynamic items exist, matching selected filter
  const getStaticSeedItems = () => {
    const seeds = [
      {
        id: 'seed-acme',
        workspaceId: 'acme-brand',
        workspaceName: 'Acme Brand',
        prompt: 'Summer clothes woven fabrics promo',
        caption: 'Emphasizing breathable linen threads and comfortable organic feel...',
        impressions: '22,180',
        likes: '1,020',
        rate: '4.6%'
      },
      {
        id: 'seed-eco',
        workspaceId: 'ecolife',
        workspaceName: 'EcoLife Co',
        prompt: 'Green energy solution release',
        caption: 'Focusing on community initiatives and zero waste lifestyle goals...',
        impressions: '18,450',
        likes: '950',
        rate: '5.1%'
      },
      {
        id: 'seed-tech',
        workspaceId: 'global-tech',
        workspaceName: 'Global Tech AI',
        prompt: 'AI scalability benchmarks report',
        caption: 'Sharing technical specifications, security upgrades and efficiency metrics...',
        impressions: '24,120',
        likes: '1,120',
        rate: '4.6%'
      }
    ];

    if (selectedWorkspaceFilter === 'all') {
      return seeds;
    }
    return seeds.filter(s => s.workspaceId === selectedWorkspaceFilter);
  };

  const seedItems = getStaticSeedItems();

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-text-primary">
      {/* Header */}
      <div className="border-b border-border-primary pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {isClient ? 'Performance Analytics' : 'Performance Analytics Dashboard'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isClient 
              ? `Track your social reach, growth, and AI-predicted scores for ${currentWorkspace?.name || 'your brand'}.`
              : 'Track social reach, engagement trend, and PR publication statistics across workspaces.'
            }
          </p>
        </div>

        {/* Workspace Selector Filter - Hide for client users */}
        {!isClient && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> Workspace Filter:
            </span>
            <Select
              value={selectedWorkspaceFilter}
              onChange={(e) => setSelectedWorkspaceFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Workspaces (Combined)' },
                ...state.workspaces.map((ws) => ({ value: ws.id, label: ws.name }))
              ]}
              className="py-2 text-xs font-bold"
              containerClassName="w-56"
            />
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">Total Impressions</p>
          <p className="text-2xl font-extrabold text-text-primary">{metrics.impressions}</p>
          <span className="text-[10px] text-green-600 font-bold">{metrics.impressionsGrowth}</span>
        </div>

        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">Engagement Rate</p>
          <p className="text-2xl font-extrabold text-text-primary">{metrics.engagementRate}</p>
          <span className="text-[10px] text-green-600 font-bold">{metrics.engagementDiff}</span>
        </div>

        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">Net Follower Growth</p>
          <p className="text-2xl font-extrabold text-text-primary">{metrics.followers}</p>
          <span className="text-[10px] text-green-600 font-bold">{metrics.followersGrowth}</span>
        </div>

        <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">PR Target Replies</p>
          <p className="text-2xl font-extrabold text-text-primary">{metrics.replies}</p>
          <span className="text-[10px] text-text-secondary font-bold">{metrics.repliesSub}</span>
        </div>
      </div>

      {/* SVG Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chart 1: Follower Growth */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Net Follower Growth Trend</h3>
          <div className="w-full h-48">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              <path
                d={metrics.growthPath}
                fill="none"
                stroke="#DD2A7B"
                strokeWidth="4"
                strokeLinecap="round"
                className="transition-all duration-500"
              />
              <text x="10" y="195" fill="var(--text-secondary)" fontSize="9" fontWeight="semibold">Week 1</text>
              <text x="100" y="195" fill="var(--text-secondary)" fontSize="9" fontWeight="semibold">Week 2</text>
              <text x="200" y="195" fill="var(--text-secondary)" fontSize="9" fontWeight="semibold">Week 3</text>
              <text x="300" y="195" fill="var(--text-secondary)" fontSize="9" fontWeight="semibold">Week 4</text>
              <text x="400" y="195" fill="var(--text-secondary)" fontSize="9" fontWeight="semibold">Week 5</text>
            </svg>
          </div>
        </div>

        {/* Chart 2: Daily Reach */}
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Daily Post Impressions</h3>
          <div className="w-full h-48">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Bar Chart bars */}
              {metrics.bars.map((bar, index) => (
                <rect 
                  key={index}
                  x={bar.x} 
                  y={bar.y} 
                  width="30" 
                  height={bar.height} 
                  fill={bar.color} 
                  rx="3" 
                  className="transition-all duration-500"
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Top Performing table */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2 flex items-center gap-1.5">
          <Award className="w-5 h-5 text-yellow-500" />
          <span>Top Performing Publications</span>
        </h3>

        <div className="overflow-hidden border border-border-primary rounded-xl text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-bg-app border-b border-border-primary text-[9px] font-bold text-text-secondary tracking-wide uppercase">
                {selectedWorkspaceFilter === 'all' && <th className="p-3">Workspace</th>}
                <th className="p-3">Brief Title</th>
                <th className="p-3">Social Caption</th>
                <th className="p-3">Impressions</th>
                <th className="p-3">Likes</th>
                <th className="p-3">Engagement Rate</th>
                <th className="p-3 text-right">Re-generate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {publishedPosts.map((post) => {
                const wsObj = state.workspaces.find(w => w.id === post.workspaceId);
                return (
                  <tr key={post.id} className="hover:bg-bg-hover transition">
                    {selectedWorkspaceFilter === 'all' && (
                      <td className="p-3 font-bold text-instagram-pink">{wsObj?.name || 'Unknown'}</td>
                    )}
                    <td className="p-3 font-bold text-text-primary">{post.prompt}</td>
                    <td className="p-3 text-text-secondary truncate max-w-[200px]">{post.caption}</td>
                    <td className="p-3 font-semibold text-text-primary">42,890</td>
                    <td className="p-3 font-semibold text-text-primary">1,940</td>
                    <td className="p-3 font-bold text-green-600">5.2%</td>
                    <td className="p-3 text-right">
                      <Link
                        href="/app/content/new"
                        className="text-instagram-pink hover:underline font-bold inline-flex items-center gap-0.5"
                      >
                        <span>Compose similar</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {/* Static Seed items to populate tables if no dynamic published items are in memory */}
              {publishedPosts.length === 0 && seedItems.map((item) => (
                <tr key={item.id} className="hover:bg-bg-hover transition">
                  {selectedWorkspaceFilter === 'all' && (
                    <td className="p-3 font-bold text-instagram-pink">{item.workspaceName}</td>
                  )}
                  <td className="p-3 font-bold text-text-primary">{item.prompt}</td>
                  <td className="p-3 text-text-secondary truncate max-w-[200px]">{item.caption}</td>
                  <td className="p-3 font-semibold text-text-primary">{item.impressions}</td>
                  <td className="p-3 font-semibold text-text-primary">{item.likes}</td>
                  <td className="p-3 font-bold text-green-600">{item.rate}</td>
                  <td className="p-3 text-right">
                    <Link
                      href="/app/content/new"
                      className="text-instagram-pink hover:underline font-bold inline-flex items-center gap-0.5"
                    >
                      <span>Compose similar</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              
              {publishedPosts.length === 0 && seedItems.length === 0 && (
                <tr>
                  <td colSpan={selectedWorkspaceFilter === 'all' ? 7 : 6} className="p-6 text-center text-text-secondary italic">
                    No analytics available for this workspace yet. Publish posts to populate metrics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

