'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import type { Schedule } from '@/lib/types';
import React, { useState } from 'react';

import {
  ArrowRight,
  Instagram,
  X,
  Check,
  User,
  Building,
} from 'lucide-react';
import { PasswordInput } from '@/components/common/password-input';

export function OrganizationView() {
  const router = useRouter();
  const { state, updateState } = useAppState();

  const [accountType, setAccountType] = useState<'individual' | 'organization'>(
    state.accountType || 'individual',
  );

  const [individualBrandName, setIndividualBrandName] = useState(
    state.workspaces?.[0] && state.workspaces?.[0]?.id !== 'ws-acme' ? state.workspaces[0].name : '',
  );
  const [individualNiche, setIndividualNiche] = useState(state.individualNiche || '');
  const [individualGoal, setIndividualGoal] = useState(
    state.individualGoal && state.individualGoal !== 'grow audience' ? state.individualGoal : '',
  );
  const [individualGoalCustom, setIndividualGoalCustom] = useState('');
  const [individualThemes, setIndividualThemes] = useState<string[]>(
    state.individualThemes || [],
  );
  const [individualThemeInput, setIndividualThemeInput] = useState('');
  const [individualWebsite, setIndividualWebsite] = useState(
    state.individualWebsite || '',
  );
  const [individualInstaConnected, setIndividualInstaConnected] = useState(
    state.individualInstagramConnected || false,
  );
  const [individualInstaUser, setIndividualInstaUser] = useState(
    state.individualInstagramUsername || '',
  );

  const goalOptions = [
    { value: 'grow audience', label: 'Grow audience' },
    { value: 'promote offers', label: 'Promote offers' },
    { value: 'build authority', label: 'Build authority' },
    { value: 'create content faster', label: 'Create content faster' },
    { value: 'other', label: 'Other purpose' },
  ];

  const themeOptions = [
    'Lifestyle',
    'Education',
    'Product Reviews',
    'Behind the Scenes',
    'Storytelling',
    'Tips & Advice',
  ];

  const toggleTheme = (theme: string) => {
    setIndividualThemes((prev) =>
      prev.includes(theme) ? prev.filter((item) => item !== theme) : [...prev, theme],
    );
  };

  const addCustomTheme = () => {
    const value = individualThemeInput.trim();
    if (!value) return;
    setIndividualThemes((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setIndividualThemeInput('');
  };

  const removeTheme = (theme: string) => {
    setIndividualThemes((prev) => prev.filter((item) => item !== theme));
  };

  const handleGoalSelect = (value: string) => {
    setIndividualGoal(value);
    if (value !== 'other') {
      setIndividualGoalCustom('');
    }
  };

  const handleAddThemeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTheme();
    }
  };

  const [orgName, setOrgName] = useState(
    state.organizationName && state.organizationName !== 'Forge Agencies' ? state.organizationName : '',
  );
  const [teamSize, setTeamSize] = useState(state.organizationTeamSize || '1-5');
  const [orgWebsite, setOrgWebsite] = useState(state.organizationWebsite || '');
  const [orgIndustries, setOrgIndustries] = useState<string[]>(
    state.organizationIndustries || [],
  );
  const [orgIndustryCustom, setOrgIndustryCustom] = useState(
    state.organizationIndustryCustom || '',
  );
  const [orgObjectives, setOrgObjectives] = useState<string[]>(() => {
    if (!state.organizationObjective) return [];
    if (state.organizationObjective === 'acquire clients') return [];
    return state.organizationObjective.split(',').map((s) => s.trim()).filter(Boolean);
  });
  const [orgObjectiveCustom, setOrgObjectiveCustom] = useState(
    state.organizationObjectiveCustom || '',
  );
  const [orgDesc, setOrgDesc] = useState(state.organizationDescription || '');

  const industryOptions = [
    'Marketing',
    'E-commerce',
    'SaaS',
    'Wellness',
    'Consumer Goods',
    'B2B Services',
    'Other',
  ];

  const objectiveOptions = [
    { value: 'acquire clients', label: 'Acquire clients' },
    { value: 'support campaigns', label: 'Support campaigns' },
    { value: 'build brand awareness', label: 'Build brand awareness' },
    { value: 'streamline approvals', label: 'Streamline approvals' },
    { value: 'other', label: 'Other purpose' },
  ];

  const toggleIndustry = (industry: string) => {
    setOrgIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((item) => item !== industry)
        : [...prev, industry],
    );
  };

  const handleOrgObjectiveSelect = (value: string) => {
    setOrgObjectives((prev) => {
      let next;
      if (prev.includes(value)) {
        next = prev.filter((item) => item !== value);
      } else {
        next = [...prev, value];
      }
      if (!next.includes('other')) {
        setOrgObjectiveCustom('');
      }
      return next;
    });
  };

  const [showInstaModal, setShowInstaModal] = useState(false);
  const [instaModalTarget, setInstaModalTarget] = useState<'individual' | string | null>(null);
  const [instaUsername, setInstaUsername] = useState('');
  const [instaPassword, setInstaPassword] = useState('');
  const [instaStep, setInstaStep] = useState<'login' | 'authorize' | 'loading'>('login');

  const openInstaAuth = (target: 'individual' | string) => {
    setInstaModalTarget(target);
    setInstaUsername('');
    setInstaPassword('');
    setInstaStep('login');
    setShowInstaModal(true);
  };

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

  const handleInstaAuthorize = () => {
    setInstaStep('loading');
    setTimeout(() => {
      const finalUsername = instaUsername.startsWith('@')
        ? instaUsername.substring(1)
        : instaUsername;

      if (instaModalTarget === 'individual') {
        setIndividualInstaConnected(true);
        setIndividualInstaUser(finalUsername);
      }

      setShowInstaModal(false);
      setInstaModalTarget(null);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (accountType === 'individual') {
      if (!individualBrandName.trim()) {
        alert('Please enter your Brand / Workspace Name.');
        return;
      }
      if (!individualGoal) {
        alert('Please select a goal.');
        return;
      }
      if (individualGoal === 'other' && !individualGoalCustom.trim()) {
        alert('Please tell us your custom purpose.');
        return;
      }
      if (individualThemes.length === 0 && !individualThemeInput.trim()) {
        alert('Please select at least one content theme.');
        return;
      }

      const savedThemes = individualThemeInput.trim()
        ? individualThemes.includes(individualThemeInput.trim())
          ? individualThemes
          : [...individualThemes, individualThemeInput.trim()]
        : individualThemes;
      const savedGoal =
        individualGoal === 'other' ? individualGoalCustom.trim() : individualGoal;

      updateState((prev) => {
        const brandId = individualBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const defaultWorkspace = {
          id: brandId,
          name: individualBrandName,
          website: individualWebsite || '',
          tone: 'casual' as const,
          keywords: [] as string[],
          rules: [] as string[],
          schedules: [] as Schedule[],
        };

        return {
          ...prev,
          accountType: 'individual',
          individualNiche,
          individualGoal: savedGoal,
          individualThemes: savedThemes,
          individualWebsite,
          individualInstagramConnected: individualInstaConnected,
          individualInstagramUsername: individualInstaUser,
          workspaces: [defaultWorkspace],
          activeWorkspaceId: brandId,
          currentStep: 2,
        };
      });

      router.push('/onboarding/workspace');
    } else {
      if (!orgName.trim()) {
        alert('Please enter an organization name.');
        return;
      }
      if (orgIndustries.includes('Other') && !orgIndustryCustom.trim()) {
        alert('Please describe your custom industry.');
        return;
      }
      if (orgObjectives.length === 0) {
        alert('Please select at least one primary business objective.');
        return;
      }
      if (orgObjectives.includes('other') && !orgObjectiveCustom.trim()) {
        alert('Please enter your custom objective.');
        return;
      }

      const savedIndustries =
        orgIndustries.includes('Other') && orgIndustryCustom.trim()
          ? [...orgIndustries.filter((industry) => industry !== 'Other'), orgIndustryCustom.trim()]
          : orgIndustries;
      const savedObjective = orgObjectives.join(', ');

      updateState((prev) => ({
        ...prev,
        accountType: 'organization',
        organizationName: orgName,
        organizationTeamSize: teamSize,
        organizationWebsite: orgWebsite,
        organizationIndustries: savedIndustries,
        organizationIndustryCustom: orgIndustryCustom.trim(),
        organizationObjective: savedObjective,
        organizationObjectiveCustom: orgObjectives.includes('other') ? orgObjectiveCustom.trim() : '',
        organizationDescription: orgDesc,
        currentStep: 2,
      }));

      router.push('/onboarding/kyc');
    }
  };

  const submitLabel =
    accountType === 'individual' ? 'Continue to Workspace' : 'Continue to KYC';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-200/20 to-orange-200/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-200/20 to-orange-200/20 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#262626] sm:text-4xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Choose Your Journey
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
            Select the account type that matches your workflow. We will custom-tailor your brand
            workspace.
          </p>
        </div>



        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
                accountType === 'individual'
                  ? 'bg-pink-50 text-instagram-pink'
                  : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'
              }`}
            >
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#262626]">Creator / Individual</h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Best for content creators, influencers, and solo business owners. Manage a single
                workspace and connect one direct Instagram account.
              </p>
            </div>
          </button>

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
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
                accountType === 'organization'
                  ? 'bg-pink-50 text-instagram-pink'
                  : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'
              }`}
            >
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#262626]">Agency / Organization</h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Best for agencies and social media teams. Manage multiple client workspaces, invite
                team members, and authenticate each via Instagram Auth.
              </p>
            </div>
          </button>
        </div>

        <div className="max-w-2xl mx-auto bg-white border border-[#EFEFEF] rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {accountType === 'individual' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-instagram-pink" />
                    <span>Personal Brand Settings</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Share what you create and how you want PressForge to support your solo brand.
                  </p>
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

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Why are you creating this brand?
                  </p>
                  <p className="text-sm text-slate-500">
                    Choose the goal that best matches your current priority, or select Other to
                    describe a custom purpose.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goalOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleGoalSelect(option.value)}
                      className={`text-left rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-150 ${
                        individualGoal === option.value
                          ? 'border-instagram-pink bg-pink-50 text-slate-900'
                          : 'border-[#E5E7EB] bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {individualGoal === 'other' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373]" htmlFor="goal-custom">
                      Tell us your goal
                    </label>
                    <input
                      id="goal-custom"
                      type="text"
                      placeholder="e.g. Showcase my handmade art, generate event leads"
                      value={individualGoalCustom}
                      onChange={(e) => setIndividualGoalCustom(e.target.value)}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    What content themes should we prioritize?
                  </p>
                  <p className="text-sm text-slate-500">
                    Pick your most important themes, then add a custom theme if needed.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {themeOptions.map((theme) => {
                    const active = individualThemes.includes(theme);
                    return (
                      <button
                        type="button"
                        key={theme}
                        onClick={() => toggleTheme(theme)}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition duration-150 ${
                          active
                            ? 'border-instagram-pink bg-pink-50 text-instagram-pink'
                            : 'border-[#E5E7EB] bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {theme}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#737373]" htmlFor="theme-custom">
                    Add another theme (optional)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      id="theme-custom"
                      type="text"
                      placeholder="e.g. Story-driven product launches"
                      value={individualThemeInput}
                      onChange={(e) => setIndividualThemeInput(e.target.value)}
                      onKeyDown={handleAddThemeKey}
                      className="flex-1 border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                    <button
                      type="button"
                      onClick={addCustomTheme}
                      className="rounded-xl bg-instagram-pink text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {individualThemes.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {individualThemes.map((theme) => (
                      <span
                        key={theme}
                        className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50/70 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm"
                      >
                        <span>{theme}</span>
                        <button
                          type="button"
                          onClick={() => removeTheme(theme)}
                          className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-slate-500 hover:text-instagram-pink transition"
                          aria-label={`Remove ${theme}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#737373]" htmlFor="website">
                    Website / Portfolio URL (optional)
                  </label>
                  <input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={individualWebsite}
                    onChange={(e) => setIndividualWebsite(e.target.value)}
                    className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#737373]">
                    Instagram Account Connection (optional)
                  </label>
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
                          <p className="text-xs text-slate-500 mt-0.5">
                            Connected as{' '}
                            <span className="font-mono text-instagram-pink font-semibold">
                              @{individualInstaUser}
                            </span>
                          </p>
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

            {accountType === 'organization' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Building className="w-4 h-4 text-instagram-pink" />
                    <span>Organization Settings</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure your corporate account and manage team accounts.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#737373]" htmlFor="org-name">
                        Organization Legal Name
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

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373]" htmlFor="org-website">
                      Business Website / Portfolio URL
                    </label>
                    <input
                      id="org-website"
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={orgWebsite}
                      onChange={(e) => setOrgWebsite(e.target.value)}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="text-xs font-semibold text-[#737373]">
                        Business type / Industry verticals
                      </label>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Select one or more industry labels that fit your organization.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {industryOptions.map((industry) => {
                        const active = orgIndustries.includes(industry);
                        return (
                          <button
                            type="button"
                            key={industry}
                            onClick={() => toggleIndustry(industry)}
                            className={`rounded-full border px-3 py-2 text-xs font-semibold transition duration-150 ${
                              active
                                ? 'border-instagram-pink bg-pink-50 text-instagram-pink'
                                : 'border-[#E5E7EB] bg-white text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {industry}
                          </button>
                        );
                      })}
                    </div>

                    {orgIndustries.includes('Other') && (
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold text-[#737373]"
                          htmlFor="org-industry-custom"
                        >
                          Describe your industry
                        </label>
                        <input
                          id="org-industry-custom"
                          type="text"
                          placeholder="e.g. Sustainable sports nutrition"
                          value={orgIndustryCustom}
                          onChange={(e) => setOrgIndustryCustom(e.target.value)}
                          className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="text-xs font-semibold text-[#737373]">
                        Primary business objective
                      </label>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Pick the goals that best describe why you onboard PressForge.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {objectiveOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleOrgObjectiveSelect(option.value)}
                          className={`text-left rounded-2xl border p-4 text-sm font-semibold transition duration-150 ${
                            orgObjectives.includes(option.value)
                              ? 'border-instagram-pink bg-pink-50 text-slate-900 shadow-sm'
                              : 'border-[#E5E7EB] bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {orgObjectives.includes('other') && (
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-[#737373]"
                        htmlFor="org-objective-custom"
                      >
                        Describe your objective
                      </label>
                      <input
                        id="org-objective-custom"
                        type="text"
                        placeholder="e.g. streamline our agency approval process"
                        value={orgObjectiveCustom}
                        onChange={(e) => setOrgObjectiveCustom(e.target.value)}
                        className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373]" htmlFor="org-desc">
                      Brief Organization Description
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
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3.5 rounded-full text-sm font-bold hover:opacity-95 transition shadow-md mt-4 cursor-pointer"
            >
              <span>{submitLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>


        </div>
      </div>

      {showInstaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[380px] rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-scale-up">
            <div className="bg-[#FAFBFB] px-5 py-4 border-b border-[#EFEFEF] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white">
                  <Instagram className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-xs tracking-wider uppercase text-slate-700">
                  Instagram Developer Auth
                </span>
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

            <div className="p-6 flex flex-col justify-center">
              {instaStep === 'loading' && (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#DD2A7B] animate-spin"></div>
                  </div>
                  <p className="text-xs font-bold text-slate-500 mt-2">
                    Connecting to Instagram APIs...
                  </p>
                </div>
              )}

              {instaStep === 'login' && (
                <form onSubmit={handleInstaLogin} className="flex flex-col gap-4">
                  <div className="text-center my-3">
                    <h2 className="text-3xl font-normal tracking-tight text-[#262626] font-serif italic">
                      Instagram
                    </h2>
                    <p className="text-slate-400 text-[10px] mt-1">
                      Sign in to authorize PressForge Client integration
                    </p>
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
                    <PasswordInput
                      placeholder="Password"
                      value={instaPassword}
                      onChange={(e) => setInstaPassword(e.target.value)}
                      className="border border-[#EFEFEF] bg-[#FAFAFA] rounded-md text-xs py-2 focus:border-slate-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#0095F6] hover:bg-[#1877F2] text-white text-xs font-bold py-2 rounded-md transition shadow-xs mt-1"
                  >
                    Log In
                  </button>
                </form>
              )}

              {instaStep === 'authorize' && (
                <div className="flex flex-col gap-4 text-center">
                  <h3 className="font-extrabold text-sm text-[#262626] mt-2">
                    Authorize PressForge Integration
                  </h3>
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
