'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState, useEffect } from 'react';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { Check, ArrowRight, Instagram, Linkedin, RefreshCw, Users } from 'lucide-react';

export function OnboardingConnectView() {
  const router = useRouter();
  const { state, updateState } = useAppState();
  const [connecting, setConnecting] = useState<'instagram' | 'linkedin' | null>(null);

  const isIndividual = state.accountType === 'individual';
  const isOrg = state.accountType === 'organization';

  // Automatically mark Instagram as connected in AppState if they are individual and connected
  useEffect(() => {
    if (isIndividual && state.individualInstagramConnected && !state.connectedAccounts?.instagram) {
      updateState((prev) => ({
        ...prev,
        connectedAccounts: {
          ...(prev.connectedAccounts ?? { instagram: false, linkedin: false }),
          instagram: true,
        },
      }));
    } else if (isOrg) {
      // For orgs, if there is at least one connected user, unlock instagram features
      const hasConnectedUser = (state.orgUsers || []).some(u => u.instagramConnected);
      if (hasConnectedUser && !state.connectedAccounts?.instagram) {
        updateState((prev) => ({
          ...prev,
          connectedAccounts: {
            ...(prev.connectedAccounts ?? { instagram: false, linkedin: false }),
            instagram: true,
          },
        }));
      }
    }
  }, [
    isIndividual,
    isOrg,
    state.individualInstagramConnected,
    state.orgUsers,
    state.connectedAccounts?.instagram,
    updateState,
  ]);

  const simulateConnect = (platform: 'instagram' | 'linkedin') => {
    setConnecting(platform);
    setTimeout(() => {
      updateState((prev) => ({
        ...prev,
        connectedAccounts: {
          ...(prev.connectedAccounts ?? { instagram: false, linkedin: false }),
          [platform]: true,
        },
      }));
      setConnecting(null);
    }, 1000);
  };

  const handleFinish = () => {
    updateState({ currentStep: 5 });
    router.push('/app');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-200/20 to-orange-200/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-200/20 to-orange-200/20 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#262626]">
            Connect Social Channels
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
            Establish secure API channels to publish content automatically to your selected platforms.
          </p>
        </div>

        <OnboardingStepper currentStep={4} />

        <div className="max-w-md w-full mx-auto bg-white border border-[#EFEFEF] rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col gap-6">
            
            {/* INDIVIDUAL VIEW */}
            {isIndividual && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Your Social Channels</span>
                
                {/* Instagram (Connected in Step 1) */}
                <div className="border border-[#EFEFEF] p-4.5 rounded-2xl flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-instagram-pink shrink-0">
                      <Instagram className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#262626]">Instagram Business</p>
                      <p className="text-xs text-slate-400 mt-0.5">Connected as <span className="font-mono font-bold text-instagram-pink">@{state.individualInstagramUsername || 'user'}</span></p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
                    <Check className="w-3.5 h-3.5" /> Connected
                  </span>
                </div>

                {/* LinkedIn */}
                <div className="border border-[#EFEFEF] p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Linkedin className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#262626]">LinkedIn Profile</p>
                      <p className="text-xs text-[#737373] mt-0.5">Publish articles, updates, and PDFs</p>
                    </div>
                  </div>

                  {state.connectedAccounts?.linkedin ? (
                    <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
                      <Check className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => simulateConnect('linkedin')}
                      disabled={connecting !== null}
                      className="bg-slate-100 hover:bg-slate-200 text-[#262626] font-bold text-xs px-4 py-2 rounded-full transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {connecting === 'linkedin' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ORGANIZATION VIEW */}
            {isOrg && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-instagram-pink" />
                    <span>Team Instagram Auth Status</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {(state.orgUsers || []).filter(u => u.instagramConnected).length} / {(state.orgUsers || []).length} Connected
                  </span>
                </div>

                {/* Team user list summaries */}
                <div className="border border-[#EFEFEF] rounded-2xl divide-y divide-[#EFEFEF] max-h-[180px] overflow-y-auto pr-1">
                  {(state.orgUsers || []).map((u) => (
                    <div key={u.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/30">
                      <div>
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                      </div>
                      <div>
                        {u.instagramConnected ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Check className="w-3 h-3 text-green-600" />
                            <span>@{u.instagramUsername}</span>
                          </span>
                        ) : (
                          <span className="text-red-500 font-semibold text-[10px] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                            Pending Auth
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(state.orgUsers || []).length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center p-4">No organization users created.</p>
                  )}
                </div>

                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mt-4">Corporate Channels (Optional)</span>

                {/* LinkedIn Agency connection */}
                <div className="border border-[#EFEFEF] p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Linkedin className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#262626]">Agency LinkedIn</p>
                      <p className="text-xs text-[#737373] mt-0.5">Publish articles, updates, and PDFs</p>
                    </div>
                  </div>

                  {state.connectedAccounts?.linkedin ? (
                    <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
                      <Check className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => simulateConnect('linkedin')}
                      disabled={connecting !== null}
                      className="bg-slate-100 hover:bg-slate-200 text-[#262626] font-bold text-xs px-4 py-2 rounded-full transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {connecting === 'linkedin' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Alert Info */}
            <p className="text-[11px] text-[#737373] leading-relaxed text-center mt-2">
              By completing the setup, you authorize PressForge AI to submit scheduled, approved content to your connected official brand channels.
            </p>

            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3.5 rounded-full text-sm font-bold hover:opacity-95 transition shadow-md mt-4 cursor-pointer"
            >
              <span>Finish Setup & Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}

