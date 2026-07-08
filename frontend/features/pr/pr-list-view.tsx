'use client';

import Link from 'next/link';
import { useAppState } from '@/lib/queries/use-app-state';
import React from 'react';
import { MailOpen, Plus, ArrowUpRight, BarChart2, Check, ShieldAlert } from 'lucide-react';



export function PrListView() {
  const { state } = useAppState();

  const activeWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId) || state.workspaces[0];

  const campaigns = state.campaigns.filter((c) => c.workspaceId === state.activeWorkspaceId);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFEFEF] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#262626]">PR Distribution</h1>
          <p className="text-sm text-[#737373] mt-1">
            Build and distribute AI-assisted press releases to targeted lists of journalists.
          </p>
        </div>

        <Link
          href="/app/pr/new"
          className="flex items-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white px-4 py-2 rounded-full text-xs font-semibold hover:opacity-95 transition shadow-sm self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New PR Campaign</span>
        </Link>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#EFEFEF] rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Total Sent Campaigns</p>
          <p className="text-3xl font-extrabold text-[#262626] mt-3">{campaigns.filter((c) => c.status === 'sent').length}</p>
        </div>
        <div className="bg-white border border-[#EFEFEF] rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Avg. Open Rate</p>
          <p className="text-3xl font-extrabold text-[#262626] mt-3">72%</p>
        </div>
        <div className="bg-white border border-[#EFEFEF] rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Avg. Reply Rate</p>
          <p className="text-3xl font-extrabold text-[#262626] mt-3">16.6%</p>
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white border border-[#EFEFEF] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#262626] border-b border-[#F5F5F5] pb-2">Campaign Logs</h3>

        <div className="overflow-hidden border border-[#EFEFEF] rounded-xl">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-[#EFEFEF] text-[10px] font-bold text-[#737373] tracking-wide uppercase">
                <th className="p-4">Campaign Title</th>
                <th className="p-4">Status</th>
                <th className="p-4">Target Count</th>
                <th className="p-4">Opens</th>
                <th className="p-4">Clicks</th>
                <th className="p-4">Replies</th>
                <th className="p-4 text-right">Metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFEF]">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-semibold text-sm text-[#262626] max-w-[240px] truncate">
                    {camp.title}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        camp.status === 'sent'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-slate-700">
                    {camp.journalists?.length ?? 0} Journalists
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-600">{camp.stats?.opens ?? 0}%</td>
                  <td className="p-4 text-xs font-medium text-slate-600">{camp.stats?.clicks ?? 0}%</td>
                  <td className="p-4 text-xs font-medium text-slate-600">{camp.stats?.replies ?? 0} Replies</td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/app/pr/${camp.id }`}
                      className="text-xs font-bold text-instagram-pink hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Analytics</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-400 italic">
                    No PR campaigns launched yet for this brand.
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

