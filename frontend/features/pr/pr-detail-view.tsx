'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAppState, useJournalistsQuery } from '@/lib/queries/use-app-state';
import { ChevronLeft, MailOpen, MousePointerClick, MessageSquare, ShieldCheck, Mail, Send } from 'lucide-react';



export function PrDetailView() {
  const { id } = useParams<{ id: string }>();
  const { state } = useAppState();
  const { data: allJournalists = [] } = useJournalistsQuery();

  const campaign = state.campaigns.find((c) => c.id === id);

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800">PR Campaign Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested outreach log could not be located.</p>
        <Link href="/app/pr" className="text-xs text-instagram-pink font-semibold mt-4 hover:underline inline-block">
          Return to PR Dashboard
        </Link>
      </div>
    );
  }

  // Load journalists targeted
  const journalists = allJournalists.filter((j) => campaign.journalists?.includes(j.id) ?? false);
  const sortedJournalists = [...journalists].sort((a, b) => a.id.localeCompare(b.id));

  const repliedCount = Math.min(campaign.stats?.replies ?? 0, sortedJournalists.length);
  const clickedCount = Math.max(
    repliedCount,
    Math.min(Math.round(sortedJournalists.length * ((campaign.stats?.clicks ?? 0) / 100)), sortedJournalists.length),
  );
  const openedCount = Math.max(
    clickedCount,
    Math.min(Math.round(sortedJournalists.length * ((campaign.stats?.opens ?? 0) / 100)), sortedJournalists.length),
  );

  const getEngagementStatus = (index: number): 'replied' | 'clicked' | 'opened' | 'delivered' => {
    if (index < repliedCount) return 'replied';
    if (index < clickedCount) return 'clicked';
    if (index < openedCount) return 'opened';
    return 'delivered';
  };

  const getReplyText = (journalistName: string) =>
    `Hi! Thank you for your pitch regarding "${campaign.title}". ${journalistName}, I'd like to learn more about this story and explore a potential feature.`;

  const repliedJournalists = sortedJournalists
    .slice(0, repliedCount)
    .map((j) => ({ ...j, replyText: getReplyText(j.name) }));

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto w-full">
      {/* Back button */}
      <div>
        <Link
          href="/app/pr"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#262626] font-semibold transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to PR Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-[#EFEFEF] pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#262626]">{campaign.title}</h1>
          <span className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2.5 py-0.5 rounded-full font-bold uppercase">
            {campaign.status}
          </span>
        </div>
        <p className="text-sm text-[#737373] mt-1">
          Sent on {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : 'Not Sent'} • Managed via SendGrid API
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-[#EFEFEF] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Open Rate</span>
            <MailOpen className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-extrabold text-[#262626]">{campaign.stats?.opens ?? 0}%</p>
          <p className="text-[10px] text-slate-400 font-semibold">{Math.round(journalists.length * ((campaign.stats?.opens ?? 0) / 100))} of {journalists.length} Opened</p>
        </div>

        <div className="bg-white border border-[#EFEFEF] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Click Rate</span>
            <MousePointerClick className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-[#262626]">{campaign.stats?.clicks ?? 0}%</p>
          <p className="text-[10px] text-slate-400 font-semibold">{Math.round(journalists.length * ((campaign.stats?.clicks ?? 0) / 100))} clicked links</p>
        </div>

        <div className="bg-white border border-[#EFEFEF] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Replies</span>
            <MessageSquare className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-[#262626]">{campaign.stats?.replies ?? 0}</p>
          <p className="text-[10px] text-slate-400 font-semibold">Direct editorial replies</p>
        </div>

        <div className="bg-white border border-[#EFEFEF] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Deliverability</span>
            <ShieldCheck className="w-4 h-4 text-[#E1306C]" />
          </div>
          <p className="text-2xl font-extrabold text-[#262626]">100%</p>
          <p className="text-[10px] text-slate-400 font-semibold">0 bounces detected</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Targeted Editors Status */}
        <div className="lg:col-span-6 bg-white border border-[#EFEFEF] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#262626] border-b border-[#F5F5F5] pb-2">Targeted Journalists</h3>

          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
            {sortedJournalists.map((j, index) => {
              const status = getEngagementStatus(index);

              return (
                <div key={j.id} className="border border-[#EFEFEF] p-3 rounded-xl flex items-center justify-between gap-3 text-xs bg-slate-50/20">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#262626]">{j.name}</p>
                    <p className="text-[10px] text-[#737373]">{j.publication} • {j.beat}</p>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold">
                    {status === 'replied' ? (
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 text-[9px] flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" /> Replied
                      </span>
                    ) : status === 'clicked' ? (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 text-[9px] flex items-center gap-1">
                        <MousePointerClick className="w-2.5 h-2.5" /> Clicked
                      </span>
                    ) : status === 'opened' ? (
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200 text-[9px] flex items-center gap-1">
                        <MailOpen className="w-2.5 h-2.5" /> Opened
                      </span>
                    ) : (
                      <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 text-[9px] flex items-center gap-1">
                        <Send className="w-2.5 h-2.5" /> Delivered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Simulated Reply Contents */}
        <div className="lg:col-span-6 bg-white border border-[#EFEFEF] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#262626] border-b border-[#F5F5F5] pb-2 flex items-center gap-1.5">
            <Mail className="w-4.5 h-4.5 text-[#737373]" />
            <span>Editor Replies Received</span>
          </h3>

          <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1">
            {repliedJournalists.map((j) => (
                <div key={j.id} className="border border-[#EFEFEF] p-4 rounded-xl space-y-2 bg-slate-50/10">
                  <div className="flex items-center justify-between text-xs border-b border-[#F5F5F5] pb-1.5">
                    <div>
                      <span className="font-bold text-[#262626]">{j.name}</span>
                      <span className="text-slate-400"> &lt;{j.email}&gt;</span>
                    </div>
                    <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                      REPLY
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &quot;{j.replyText}&quot;
                  </p>
                  <div className="pt-2 text-right">
                    <button
                      onClick={() => alert(`Simulating mail draft replying to ${j.name}...`)}
                      className="text-[10px] text-instagram-pink font-bold hover:underline"
                    >
                      Draft Reply back
                    </button>
                  </div>
                </div>
              ))}

            {repliedJournalists.length === 0 && (
              <p className="text-sm text-slate-400 italic py-6 text-center">No replies received yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

