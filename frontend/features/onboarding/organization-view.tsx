'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { 
  ArrowRight, Sparkles, Instagram, Plus, X, Check, 
  Users, User, ShieldCheck, Lock, Globe, Building 
} from 'lucide-react';

interface OrgUser {
  id: string;
  name: string;
  email: string;
  instagramConnected: boolean;
  instagramUsername?: string;
}

export function OrganizationView() {
  const router = useRouter();
  const { state, updateState } = useAppState();

  // Onboarding local states
  const [accountType, setAccountType] = useState<'individual' | 'organization'>(
    state.accountType || 'individual'
  );

  // Individual Form states
  const [individualBrandName, setIndividualBrandName] = useState(
    state.workspaces[0]?.name || ''
  );
  const [individualInstaConnected, setIndividualInstaConnected] = useState(
    state.individualInstagramConnected || false
  );
  const [individualInstaUser, setIndividualInstaUser] = useState(
    state.individualInstagramUsername || ''
  );

  // Organization Form states
  const [orgName, setOrgName] = useState(state.organizationName || 'Forge Agencies');
  const [teamSize, setTeamSize] = useState('1-5');
  const [orgDesc, setOrgDesc] = useState('');
  


  // Instagram Auth Modal states
  const [showInstaModal, setShowInstaModal] = useState(false);
  const [instaModalTarget, setInstaModalTarget] = useState<'individual' | string | null>(null);
  const [instaUsername, setInstaUsername] = useState('');
  const [instaPassword, setInstaPassword] = useState('');
  const [instaStep, setInstaStep] = useState<'login' | 'authorize' | 'loading'>('login');



  // Open Insta Auth Dialog
  const openInstaAuth = (target: 'individual' | string) => {
    setInstaModalTarget(target);
    setInstaUsername('');
    setInstaPassword('');
    setInstaStep('login');
    setShowInstaModal(true);
  };

  // Submit Instagram Login Mock
  const handleInstaLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instaUsername.trim()) {
      alert('Please enter a username.');
      return;
    }
    setInstaStep('loading');
    setTimeout(() => {
      setInstaStep('authorize');
    }, 800);
  };

  // Authorize Mock
  const handleInstaAuthorize = () => {
    setInstaStep('loading');
    setTimeout(() => {
      const finalUsername = instaUsername.startsWith('@') ? instaUsername.substring(1) : instaUsername;
      
      if (instaModalTarget === 'individual') {
        setIndividualInstaConnected(true);
        setIndividualInstaUser(finalUsername);
      }
      
      setShowInstaModal(false);
      setInstaModalTarget(null);
    }, 1000);
  };

  // Handle Main Step Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (accountType === 'individual') {
      if (!individualBrandName.trim()) {
        alert('Please enter your Brand / Workspace Name.');
        return;
      }
      if (!individualInstaConnected) {
        alert('Please connect your Instagram account first.');
        return;
      }

      // Save to App State
      updateState((prev) => {
        const brandId = individualBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const defaultWorkspace = {
          id: brandId,
          name: individualBrandName,
          website: 'https://instagram.com/' + individualInstaUser,
          tone: 'casual',
          keywords: [],
          rules: []
        };
        
        return {
          ...prev,
          accountType: 'individual',
          individualInstagramConnected: true,
          individualInstagramUsername: individualInstaUser,
          workspaces: [defaultWorkspace],
          activeWorkspaceId: brandId,
          currentStep: 2
        };
      });
      
      router.push('/onboarding/workspace');
    } else {
      if (!orgName.trim()) {
        alert('Please enter an organization name.');
        return;
      }

      // Save to App State
      updateState((prev) => {
        return {
          ...prev,
          accountType: 'organization',
          organizationName: orgName,
          currentStep: 2
        };
      });

      router.push('/onboarding/kyc');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-200/20 to-orange-200/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-200/20 to-orange-200/20 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#262626] sm:text-4xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Choose Your Journey
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
            Select the account type that matches your workflow. We will custom-tailor your brand workspace.
          </p>
        </div>

        <OnboardingStepper currentStep={1} />

        {/* Account Type Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Individual Card */}
          <button
            type="button"
            onClick={() => setAccountType('individual')}
            className={`text-left p-6 bg-white border rounded-2xl transition duration-300 flex flex-col gap-4 relative group cursor-pointer ${
              accountType === 'individual'
                ? 'border-instagram-pink ring-2 ring-pink-100 shadow-md'
                : 'border-[#EFEFEF] hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            {accountType === 'individual' && (
              <span className="absolute top-4 right-4 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white p-1 rounded-full">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
              accountType === 'individual' ? 'bg-pink-50 text-instagram-pink' : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'
            }`}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#262626]">Creator / Individual</h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Best for content creators, influencers, and solo business owners. Manage a single workspace and connect one direct Instagram account.
              </p>
            </div>
          </button>

          {/* Organization Card */}
          <button
            type="button"
            onClick={() => setAccountType('organization')}
            className={`text-left p-6 bg-white border rounded-2xl transition duration-300 flex flex-col gap-4 relative group cursor-pointer ${
              accountType === 'organization'
                ? 'border-instagram-pink ring-2 ring-pink-100 shadow-md'
                : 'border-[#EFEFEF] hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            {accountType === 'organization' && (
              <span className="absolute top-4 right-4 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white p-1 rounded-full">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
              accountType === 'organization' ? 'bg-pink-50 text-instagram-pink' : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'
            }`}>
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#262626]">Agency / Organization</h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Best for agencies and social media teams. Manage multiple client workspaces, invite team members, and authenticate each via Instagram Auth.
              </p>
            </div>
          </button>
        </div>

        {/* Dynamic Form Area */}
        <div className="max-w-2xl mx-auto bg-white border border-[#EFEFEF] rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* INDIVIDUAL ACCOUNT SETUP */}
            {accountType === 'individual' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-instagram-pink" />
                    <span>Personal Brand Settings</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Enter your brand name and authenticate your social account.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#737373]" htmlFor="brand-name">
                    Workspace / Brand Name
                  </label>
                  <input
                    id="brand-name"
                    type="text"
                    required
                    placeholder="e.g. Jane Styles Travel"
                    value={individualBrandName}
                    onChange={(e) => setIndividualBrandName(e.target.value)}
                    className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                  />
                </div>

                {/* Instagram Connection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#737373]">Instagram Account Connection</label>
                  
                  {individualInstaConnected ? (
                    <div className="border border-green-100 bg-green-50/50 rounded-xl p-4.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <Instagram className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                            <span>Instagram Connected</span>
                            <Check className="w-4 h-4 text-green-600" />
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Connected as <span className="font-mono text-instagram-pink font-semibold">@{individualInstaUser}</span></p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIndividualInstaConnected(false);
                          setIndividualInstaUser('');
                        }}
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#EFEFEF] rounded-xl p-6 text-center bg-slate-50/50 flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-50 text-instagram-pink flex items-center justify-center">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Authenticate with Instagram</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Connect your business profile to start generating drafts.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openInstaAuth('individual')}
                        className="bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition shadow-sm"
                      >
                        Login via Instagram Auth
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ORGANIZATION ACCOUNT SETUP */}
            {accountType === 'organization' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Building className="w-4 h-4 text-instagram-pink" />
                    <span>Organization Settings</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Configure your corporate account and manage team accounts.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373]" htmlFor="org-name">
                      Organization Name
                    </label>
                    <input
                      id="org-name"
                      type="text"
                      required
                      placeholder="e.g. Zenith Media Agency"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373]" htmlFor="team-size">
                      Team Size
                    </label>
                    <select
                      id="team-size"
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="border border-[#EFEFEF] bg-white rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    >
                      <option value="1-5">1-5 Members (Starter)</option>
                      <option value="6-20">6-20 Members (Growth)</option>
                      <option value="21-100">21-100 Members (Pro)</option>
                      <option value="100+">100+ Members (Enterprise)</option>
                    </select>
                  </div>
                </div>

                {/* Organization Details Info */}
                <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100">
                  <label className="text-xs font-semibold text-[#737373]" htmlFor="org-desc">
                    Brief Organization Description (Optional)
                  </label>
                  <textarea
                    id="org-desc"
                    rows={3}
                    placeholder="e.g. A digital marketing agency specializing in organic retail growth."
                    value={orgDesc}
                    onChange={(e) => setOrgDesc(e.target.value)}
                    className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3.5 rounded-full text-sm font-bold hover:opacity-95 transition shadow-md mt-4 cursor-pointer"
            >
              <span>Continue to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-left mt-6">
            <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-instagram-pink" /> Wireframe Demo Helper
            </p>
            <button
              type="button"
              onClick={() => {
                if (accountType === 'individual') {
                  setIndividualBrandName('EcoFashion Inc');
                  setIndividualInstaConnected(true);
                  setIndividualInstaUser('ecofashion_official');
                } else {
                  setOrgName('Vibrant Agencies');
                }
              }}
              className="text-[10px] text-instagram-pink font-semibold hover:underline mt-1.5 block"
            >
              Instant Autofill Demo Settings
            </button>
          </div>
        </div>
      </div>

      {/* MOCK INSTAGRAM AUTH MODAL */}
      {showInstaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[380px] rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#FAFBFB] px-5 py-4 border-b border-[#EFEFEF] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white">
                  <Instagram className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-xs tracking-wider uppercase text-slate-700">Instagram Developer Auth</span>
              </div>
              <button 
                onClick={() => {
                  setShowInstaModal(false);
                  setInstaModalTarget(null);
                }} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col justify-center">
              
              {/* STEP: LOADING */}
              {instaStep === 'loading' && (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#DD2A7B] animate-spin"></div>
                  </div>
                  <p className="text-xs font-bold text-slate-500 mt-2">Connecting to Instagram APIs...</p>
                </div>
              )}

              {/* STEP: LOGIN Form */}
              {instaStep === 'login' && (
                <form onSubmit={handleInstaLogin} className="flex flex-col gap-4">
                  {/* Instagram Brand Mockup */}
                  <div className="text-center my-3">
                    <h2 className="text-3xl font-normal tracking-tight text-[#262626] font-serif italic">
                      Instagram
                    </h2>
                    <p className="text-slate-400 text-[10px] mt-1">Sign in to authorize PressForge Client integration</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Phone number, username, or email"
                      value={instaUsername}
                      onChange={(e) => setInstaUsername(e.target.value)}
                      className="border border-[#EFEFEF] bg-[#FAFAFA] rounded-md px-3 py-2 text-xs focus:border-slate-400 outline-none transition"
                    />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={instaPassword}
                      onChange={(e) => setInstaPassword(e.target.value)}
                      className="border border-[#EFEFEF] bg-[#FAFAFA] rounded-md px-3 py-2 text-xs focus:border-slate-400 outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#0095F6] hover:bg-[#1877F2] text-white text-xs font-bold py-2 rounded-md transition shadow-xs mt-1"
                  >
                    Log In
                  </button>

                  <div className="flex items-center my-2.5">
                    <div className="flex-1 h-px bg-[#EFEFEF]"></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mx-3">OR</span>
                    <div className="flex-1 h-px bg-[#EFEFEF]"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInstaUsername('facebook_linked_user');
                      setInstaStep('loading');
                      setTimeout(() => {
                        setInstaStep('authorize');
                      }, 800);
                    }}
                    className="text-[#385185] font-bold text-xs hover:underline flex items-center justify-center gap-1.5"
                  >
                    <span className="w-4 h-4 bg-[#385185] text-white rounded-xs flex items-center justify-center text-[9px] font-extrabold">f</span>
                    <span>Log in with Facebook</span>
                  </button>

                  {/* Demo Pre-fills */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mt-2">
                    <span className="text-[9px] font-bold text-slate-500 block">Demo Quick Access:</span>
                    <button
                      type="button"
                      onClick={() => setInstaUsername('travel_guru_2026')}
                      className="text-[9px] text-[#0095F6] font-semibold hover:underline block mt-0.5"
                    >
                      Autofill: @travel_guru_2026
                    </button>
                  </div>
                </form>
              )}

              {/* STEP: AUTHORIZE Perms */}
              {instaStep === 'authorize' && (
                <div className="flex flex-col gap-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#262626]">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <span className="text-slate-400 text-xs">↔</span>
                    <div className="w-10 h-10 rounded-full bg-pink-50 text-instagram-pink flex items-center justify-center font-bold text-xs">
                      PF
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm text-[#262626] mt-2">
                    Authorize PressForge Integration
                  </h3>

                  <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-left space-y-2.5">
                    <p className="text-[10px] text-slate-500 leading-normal">
                      PressForge AI is requesting permission to access the following info for <span className="font-bold text-slate-700">@{instaUsername}</span>:
                    </p>
                    <ul className="text-[9px] text-slate-600 space-y-1.5 pl-1">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                        <span>Profile info and media files</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                        <span>Publish scheduled posts, reels, and stories</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                        <span>Read audience comments and insights</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-2.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInstaModal(false);
                        setInstaModalTarget(null);
                      }}
                      className="flex-1 border border-[#EFEFEF] hover:bg-slate-50 text-slate-600 font-bold py-2 rounded-md text-xs transition"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={handleInstaAuthorize}
                      className="flex-1 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white font-bold py-2 rounded-md text-xs transition shadow-xs"
                    >
                      Allow Access
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

