'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState, useEffect } from 'react';

import {
  ArrowRight,
  Linkedin,
  X,
  Check,
  User,
  Building,
} from 'lucide-react';
import { Select } from '@/components/common/select';
import { notifications } from '@mantine/notifications';
import {
  validateWorkspaceName,
  validateWebsiteUrl,
  validateOrganizationName,
  validateOrganizationDescription,
} from '@/lib/utils/validation';
import { useLinkedInConnection } from '@/lib/hooks/queries/use-social-connection';

export function OrganizationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateState } = useAppState();
  const {
    connection: linkedinConnection,
    isLoading: isLinkedInLoading,
    isConnecting: isLinkedInConnecting,
    connectLinkedIn,
    refresh: refreshLinkedInConnection,
  } = useLinkedInConnection();

  const linkedinConnected = linkedinConnection?.connected ?? false;
  const linkedinDisplayName =
    linkedinConnection?.account?.displayName ?? linkedinConnection?.account?.username ?? null;

  useEffect(() => {
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    if (platform !== 'linkedin' || !status) {
      return;
    }

    if (status === 'connected') {
      refreshLinkedInConnection();
      updateState((prev) => ({
        ...prev,
        connectedAccounts: {
          ...(prev.connectedAccounts ?? { linkedin: false }),
          linkedin: true,
        },
      }));
    }

    router.replace('/onboarding/organization');
  }, [searchParams, router, refreshLinkedInConnection, updateState]);

  const [accountType, setAccountType] = useState<'individual' | 'organization'>(
    state.accountType || 'individual',
  );

  const [individualBrandName, setIndividualBrandName] = useState(
    state.workspaces?.[0] && state.workspaces?.[0]?.id !== 'ws-acme' ? state.workspaces[0].name : '',
  );
  const individualNiche = state.individualNiche || '';
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

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getErrors = () => {
    const errs: Record<string, string> = {};
    if (accountType === 'individual') {
      const nameErr = validateWorkspaceName(individualBrandName);
      if (nameErr) errs.individualBrandName = nameErr;

      if (!individualGoal) {
        errs.individualGoal = 'Please select a goal';
      } else if (individualGoal === 'other' && !individualGoalCustom.trim()) {
        errs.individualGoalCustom = 'Please describe your custom goal';
      }

      if (individualThemes.length === 0 && !individualThemeInput.trim()) {
        errs.individualThemes = 'Please select at least one content theme';
      }

      const webErr = validateWebsiteUrl(individualWebsite);
      if (webErr) errs.individualWebsite = webErr;
    } else {
      const nameErr = validateOrganizationName(orgName);
      if (nameErr) errs.orgName = nameErr;

      if (!orgWebsite.trim()) {
        errs.orgWebsite = 'Business Website / Portfolio URL is required';
      } else {
        const webErr = validateWebsiteUrl(orgWebsite);
        if (webErr) errs.orgWebsite = webErr;
      }

      if (!orgDesc.trim()) {
        errs.orgDesc = 'Brief Organization Description is required';
      } else {
        const descErr = validateOrganizationDescription(orgDesc);
        if (descErr) errs.orgDesc = descErr;
      }

      if (orgIndustries.length === 0) {
        errs.orgIndustries = 'Please select at least one industry';
      } else if (orgIndustries.includes('Other') && !orgIndustryCustom.trim()) {
        errs.orgIndustryCustom = 'Please describe your custom industry';
      }

      if (orgObjectives.length === 0) {
        errs.orgObjectives = 'Please select at least one primary objective';
      } else if (orgObjectives.includes('other') && !orgObjectiveCustom.trim()) {
        errs.orgObjectiveCustom = 'Please describe your custom objective';
      }
    }
    return errs;
  };

  const errors = getErrors();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const validationErrors = getErrors();
    if (Object.keys(validationErrors).length > 0) {
      notifications.show({
        title: 'Validation error',
        message: 'Please fix the errors below before continuing.',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (accountType === 'individual') {
        const savedThemes = individualThemeInput.trim()
          ? individualThemes.includes(individualThemeInput.trim())
            ? individualThemes
            : [...individualThemes, individualThemeInput.trim()]
          : individualThemes;
        const savedGoal =
          individualGoal === 'other' ? individualGoalCustom.trim() : individualGoal;

        await updateState((prev) => {
          return {
            ...prev,
            accountType: 'individual',
            individualNiche,
            individualGoal: savedGoal,
            individualThemes: savedThemes,
            individualWebsite,
            connectedAccounts: {
              ...(prev.connectedAccounts ?? { linkedin: false }),
              linkedin: linkedinConnected,
            },
            currentStep: 2,
          };
        });

        router.push('/onboarding/workspace');
      } else {
        const savedIndustries =
          orgIndustries.includes('Other') && orgIndustryCustom.trim()
            ? [...orgIndustries.filter((industry) => industry !== 'Other'), orgIndustryCustom.trim()]
            : orgIndustries;
        const savedObjective = orgObjectives.join(', ');

        await updateState((prev) => ({
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
    } catch (err) {
      console.error(err);
      notifications.show({
        title: 'Error saving details',
        message: err instanceof Error ? err.message : 'Please try again.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
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
                workspace and connect your LinkedIn profile.
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
                team members, and connect LinkedIn for publishing.
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
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    id="brand-name"
                    type="text"
                    required
                    placeholder="e.g. Jane Styles Travel"
                    value={individualBrandName}
                    onChange={(e) => setIndividualBrandName(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, individualBrandName: true }))}
                    className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                  />
                  {(touched.individualBrandName || submitted) && errors.individualBrandName && (
                    <p className="text-[11px] text-red-500 font-medium">{errors.individualBrandName}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Why are you creating this brand?
                    <span className="text-red-500 ml-0.5">*</span>
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
                      onClick={() => {
                        handleGoalSelect(option.value);
                        setTouched((prev) => ({ ...prev, individualGoal: true }));
                      }}
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
                {(touched.individualGoal || submitted) && errors.individualGoal && (
                  <p className="text-[11px] text-red-500 font-medium">{errors.individualGoal}</p>
                )}

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
                      onBlur={() => setTouched((prev) => ({ ...prev, individualGoalCustom: true }))}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                    {(touched.individualGoalCustom || submitted) && errors.individualGoalCustom && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.individualGoalCustom}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    What content themes should we prioritize?
                    <span className="text-red-500 ml-0.5">*</span>
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
                        onClick={() => {
                          toggleTheme(theme);
                          setTouched((prev) => ({ ...prev, individualThemes: true }));
                        }}
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
                {(touched.individualThemes || submitted) && errors.individualThemes && (
                  <p className="text-[11px] text-red-500 font-medium">{errors.individualThemes}</p>
                )}

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
                    onBlur={() => setTouched((prev) => ({ ...prev, individualWebsite: true }))}
                    className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                  />
                  {(touched.individualWebsite || submitted) && errors.individualWebsite && (
                    <p className="text-[11px] text-red-500 font-medium">{errors.individualWebsite}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#737373]">
                    LinkedIn Profile Connection (optional)
                  </label>
                  {linkedinConnected ? (
                    <div className="border border-green-100 bg-green-50/50 rounded-xl p-4.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Linkedin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                            <span>LinkedIn Connected</span>
                            <Check className="w-4 h-4 text-green-600" />
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Connected as{' '}
                            <span className="font-semibold text-blue-600">
                              {linkedinDisplayName}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#EFEFEF] rounded-xl p-6 text-center bg-slate-50/50 flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Linkedin className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-slate-500">
                        Connect now or skip and set up later in onboarding.
                      </p>
                      <button
                        type="button"
                        onClick={() => connectLinkedIn('/onboarding/organization')}
                        disabled={isLinkedInConnecting || isLinkedInLoading}
                        className="bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition shadow-sm disabled:opacity-50"
                      >
                        {isLinkedInConnecting ? 'Redirecting...' : 'Connect LinkedIn'}
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
                        <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        id="org-name"
                        type="text"
                        required
                        placeholder="e.g. Zenith Media Agency"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, orgName: true }))}
                        className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                      />
                      {(touched.orgName || submitted) && errors.orgName && (
                        <p className="text-[11px] text-red-500 font-medium">{errors.orgName}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Select
                        id="team-size"
                        label="Team Size"
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        options={[
                          { value: '1-5', label: '1-5 Members (Starter)' },
                          { value: '6-20', label: '6-20 Members (Growth)' },
                          { value: '21-100', label: '21-100 Members (Pro)' },
                          { value: '100+', label: '100+ Members (Enterprise)' }
                        ]}
                        className="py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373]" htmlFor="org-website">
                      Business Website / Portfolio URL
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      id="org-website"
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={orgWebsite}
                      onChange={(e) => setOrgWebsite(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, orgWebsite: true }))}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                    {(touched.orgWebsite || submitted) && errors.orgWebsite && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.orgWebsite}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="text-xs font-semibold text-[#737373]">
                        Business type / Industry verticals
                        <span className="text-red-500 ml-0.5">*</span>
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
                            onClick={() => {
                                toggleIndustry(industry);
                                setTouched((prev) => ({ ...prev, orgIndustries: true }));
                            }}
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
                    {(touched.orgIndustries || submitted) && errors.orgIndustries && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.orgIndustries}</p>
                    )}

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
                          onBlur={() => setTouched((prev) => ({ ...prev, orgIndustryCustom: true }))}
                          className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                        />
                        {(touched.orgIndustryCustom || submitted) && errors.orgIndustryCustom && (
                          <p className="text-[11px] text-red-500 font-medium">{errors.orgIndustryCustom}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="text-xs font-semibold text-[#737373]">
                        Primary business objective
                        <span className="text-red-500 ml-0.5">*</span>
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
                          onClick={() => {
                            handleOrgObjectiveSelect(option.value);
                            setTouched((prev) => ({ ...prev, orgObjectives: true }));
                          }}
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
                    {(touched.orgObjectives || submitted) && errors.orgObjectives && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.orgObjectives}</p>
                    )}
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
                        onBlur={() => setTouched((prev) => ({ ...prev, orgObjectiveCustom: true }))}
                        className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                      />
                      {(touched.orgObjectiveCustom || submitted) && errors.orgObjectiveCustom && (
                        <p className="text-[11px] text-red-500 font-medium">{errors.orgObjectiveCustom}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373]" htmlFor="org-desc">
                      Brief Organization Description
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <textarea
                      id="org-desc"
                      rows={3}
                      placeholder="e.g. A digital marketing agency specializing in organic retail growth."
                      value={orgDesc}
                      onChange={(e) => setOrgDesc(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, orgDesc: true }))}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150 resize-none"
                    />
                    {(touched.orgDesc || submitted) && errors.orgDesc && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.orgDesc}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                (accountType === 'individual'
                  ? !individualBrandName.trim() ||
                    !individualGoal ||
                    (individualGoal === 'other' && !individualGoalCustom.trim()) ||
                    (individualThemes.length === 0 && !individualThemeInput.trim()) ||
                    Object.keys(errors).length > 0
                  : !orgName.trim() ||
                    !orgWebsite.trim() ||
                    !orgDesc.trim() ||
                    (orgIndustries.length === 0 && !orgIndustryCustom.trim()) ||
                    (orgObjectives.length === 0 && !orgObjectiveCustom.trim()) ||
                    Object.keys(errors).length > 0)
              }
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3.5 rounded-full text-sm font-bold hover:opacity-95 transition shadow-md mt-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Saving settings...' : submitLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
