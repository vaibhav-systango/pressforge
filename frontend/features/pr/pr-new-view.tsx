'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppState, useJournalistsQuery } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { ChevronLeft, Send, Sparkles, Filter, Search, UserCheck } from 'lucide-react';



export function PrNewView() {
  const router = useRouter();
  const { state, addCampaign } = useAppState();
  const { data: journalistsData } = useJournalistsQuery();
  const journalists = journalistsData?.journalists || [];

  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [selectedJournalists, setSelectedJournalists] = useState<string[]>([]);

  // Filter state
  const [search, setSearch] = useState('');
  const [beatFilter, setBeatFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');

  // Toggle selection
  const handleToggleJournalist = (id: string) => {
    if (selectedJournalists.includes(id)) {
      setSelectedJournalists(selectedJournalists.filter((jid) => jid !== id));
    } else {
      setSelectedJournalists([...selectedJournalists, id]);
    }
  };

  const handleSelectAllVisible = (visibleIds: string[]) => {
    const allSelected = visibleIds.every((id) => selectedJournalists.includes(id));
    if (allSelected) {
      // Deselect all visible
      setSelectedJournalists(selectedJournalists.filter((id) => !visibleIds.includes(id)));
    } else {
      // Select all visible
      const newSelected = [...selectedJournalists];
      visibleIds.forEach((id) => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedJournalists(newSelected);
    }
  };

  // Filter journalists list
  const filteredJournalists = journalists.filter((j: any) => {
    const matchesSearch = j.name.toLowerCase().includes(search.toLowerCase()) ||
                          j.publication.toLowerCase().includes(search.toLowerCase());
    const matchesBeat = beatFilter === 'All' || j.beat === beatFilter || (beatFilter === 'Environment' && j.beat === 'Environment');
    const matchesCity = cityFilter === 'All' || j.city === cityFilter;
    const matchesTier = tierFilter === 'All' || j.tier === tierFilter;
    return matchesSearch && matchesBeat && matchesCity && matchesTier;
  });

  const visibleIds = filteredJournalists.map((j: any) => j.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !brief.trim()) {
      alert('Please fill out the campaign title and release brief.');
      return;
    }
    if (selectedJournalists.length === 0) {
      alert('Please select at least one journalist to target.');
      return;
    }

    addCampaign({
      id: 'campaign-' + Date.now(),
      workspaceId: state.activeWorkspaceId ?? '',
      title,
      brief,
      status: 'sent',
      sentAt: new Date().toISOString(),
      stats: {
        opens: 0,
        clicks: 0,
        replies: 0,
      },
      journalists: selectedJournalists
    });

    alert('PR brief distributed successfully to selected editors!');
    router.push('/app/pr');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-6xl mx-auto w-full">
      {/* Back link */}
      <div>
        <Link
          href="/app/pr"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#262626] font-semibold transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to PR Dashboard
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#262626]">PR Brief Builder</h1>
        <p className="text-sm text-[#737373] mt-1">
          Draft a press release, target editors based on beats, and schedule SendGrid distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Brief form */}
        <div className="lg:col-span-5 bg-white border border-[#EFEFEF] rounded-2xl p-6 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#737373]" htmlFor="title">
                Campaign / Release Title
              </label>
              <input
                id="title"
                type="text"
                required
                placeholder="e.g. Acme Clothing launches carbon-neutral organic collection"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#E1306C] outline-none transition duration-150"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#737373]" htmlFor="brief">
                Press Release Body / Brief
              </label>
              <textarea
                id="brief"
                required
                placeholder="Draft the press release pitch..."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#E1306C] outline-none transition duration-150 min-h-[180px] resize-y"
              />
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-[#737373] leading-relaxed">
              <span className="font-bold text-slate-800 block mb-1">Target Summary:</span>
              Selected <span className="font-bold text-instagram-pink">{selectedJournalists.length}</span> journalists across{' '}
              <span className="font-bold text-slate-800">
                {Array.from(
                  new Set(journalists.filter((j: any) => selectedJournalists.includes(j.id)).map((j: any) => j.publication))
                ).length}
              </span>{' '}
              publications.
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#E1306C] text-white py-3.5 rounded-full text-sm font-bold hover:opacity-95 transition shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Distribute PR Release</span>
            </button>
          </form>

          {/* Preset Demo */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left">
            <button
              type="button"
              onClick={() => {
                setTitle('EcoLife Co launches clean organic hemp line for global shipping');
                setBrief('FOR IMMEDIATE RELEASE\n\nEcoLife Co is proud to announce its custom 100% biodegradable hemp shirts, launching June 24, 2026. The new product line resolves previous logistics challenges by deploying direct-to-consumer partnerships across Europe and USA.');
                setSelectedJournalists(['sarah-jenkins', 'marcus-lee', 'elena-rodriguez']);
              }}
              className="text-[10px] text-instagram-pink font-semibold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Populate mock PR release & target 3 editors
            </button>
          </div>
        </div>

        {/* Right Panel: Journalist Target Table */}
        <div className="lg:col-span-7 bg-white border border-[#EFEFEF] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-2">
            <h3 className="text-base font-bold text-[#262626] flex items-center gap-1.5">
              <UserCheck className="w-5 h-5 text-slate-500" />
              <span>Journalist Target Board</span>
            </h3>
            <span className="text-xs text-[#737373]">
              {selectedJournalists.length} selected
            </span>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-slate-500">Search</span>
              <input
                type="text"
                placeholder="Name/Media"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-[#EFEFEF] rounded-lg p-1.5 outline-none focus:border-[#E1306C]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-slate-500">Beat</span>
              <select
                value={beatFilter}
                onChange={(e) => setBeatFilter(e.target.value)}
                className="border border-[#EFEFEF] bg-white rounded-lg p-1.5 outline-none focus:border-[#E1306C]"
              >
                <option value="All">All Beats</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Business">Business</option>
                <option value="Tech">Tech</option>
                <option value="Environment">Environment</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-slate-500">City</span>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="border border-[#EFEFEF] bg-white rounded-lg p-1.5 outline-none focus:border-[#E1306C]"
              >
                <option value="All">All Cities</option>
                <option value="New York">New York</option>
                <option value="San Francisco">San Francisco</option>
                <option value="London">London</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-slate-500">Tier</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="border border-[#EFEFEF] bg-white rounded-lg p-1.5 outline-none focus:border-[#E1306C]"
              >
                <option value="All">All Tiers</option>
                <option value="Tier 1">Tier 1</option>
                <option value="Tier 2">Tier 2</option>
                <option value="Tier 3">Tier 3</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-[#EFEFEF] rounded-xl text-xs max-h-[300px] overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-[#EFEFEF] text-[9px] font-bold text-[#737373] tracking-wide uppercase">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={visibleIds.length > 0 && visibleIds.every((id: string) => selectedJournalists.includes(id))}
                      onChange={() => handleSelectAllVisible(visibleIds)}
                      className="rounded text-[#E1306C] focus:ring-[#E1306C]"
                    />
                  </th>
                  <th className="p-3">Journalist</th>
                  <th className="p-3">Media Outlet</th>
                  <th className="p-3">Beat</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEF]">
                {filteredJournalists.map((j: any) => (
                  <tr
                    key={j.id}
                    onClick={() => handleToggleJournalist(j.id)}
                    className={`hover:bg-slate-50/50 transition cursor-pointer ${
                      selectedJournalists.includes(j.id) ? 'bg-pink-50/20' : ''
                    }`}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedJournalists.includes(j.id)}
                        onChange={() => handleToggleJournalist(j.id)}
                        className="rounded text-[#E1306C] focus:ring-[#E1306C]"
                      />
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-[#262626]">{j.name}</p>
                      <p className="text-[10px] text-slate-400">{j.email}</p>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{j.publication}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">
                        {j.beat}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-semibold">{j.city}</td>
                    <td className="p-3 font-bold text-instagram-pink">{j.tier}</td>
                  </tr>
                ))}
                {filteredJournalists.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      No journalists match active filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

