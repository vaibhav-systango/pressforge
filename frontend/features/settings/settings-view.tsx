'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import {
  formatAccountTypeLabel,
  formatMeTimestamp,
} from '@/lib/auth/me-user';
import { formatOrganizationRole } from '@/lib/invitations/role-hierarchy';
import { PageLoader } from '@/components/common/page-loader';
import React, { useState } from 'react';
import { 
  Settings, User, Lock, CreditCard, ShieldAlert, 
  Check, ToggleLeft, ToggleRight, Trash2, RefreshCw, 
  Building2, Sparkles, Users, Instagram, X
} from 'lucide-react';
import { PasswordInput } from '@/components/common/password-input';
import { DeleteModal } from '@/components/common/delete-modal';
import { validatePassword } from '@/lib/utils/validation';

export function SettingsView() {
  const { state, updateState, resetState } = useAppState();
  const { user, isLoading: isUserLoading } = useAuth();
  const router = useRouter();
  const isClient = user?.userType === 'client' || state.currentUserType === 'client';

  // Modal confirm states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [orgName, setOrgName] = useState(
    state.organizationName && state.organizationName !== 'Forge Agencies' ? state.organizationName : '',
  );
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI indicators
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  // Integration toggles
  const [instagramConnected, setInstagramConnected] = useState(true);
  const [linkedinConnected, setLinkedinConnected] = useState(false);

  // Selected billing plan (Agency only)
  const [activePlan, setActivePlan] = useState<string>('growth');

  // Instagram Auth modal states
  const [showInstaModal, setShowInstaModal] = useState(false);
  const [instaModalTarget, setInstaModalTarget] = useState<string | null>(null);
  const [instaUsername, setInstaUsername] = useState('');
  const [instaPassword, setInstaPassword] = useState('');
  const [instaStep, setInstaStep] = useState<'login' | 'authorize' | 'loading'>('login');

  const activeTeamMembers = (state.orgUsers || []).filter((member) => member.status !== 'pending');

  const handleToggleWorkspace = (userId: string, workspaceId: string) => {
    updateState((prev) => ({
      ...prev,
      orgUsers: (prev.orgUsers || []).map((u) => {
        if (u.id === userId) {
          const currentIds = u.workspaceIds || [];
          const newIds = currentIds.includes(workspaceId)
            ? currentIds.filter((id) => id !== workspaceId)
            : [...currentIds, workspaceId];
          return { ...u, workspaceIds: newIds };
        }
        return u;
      })
    }));
  };

  const openInstaModal = (userId: string) => {
    setInstaModalTarget(userId);
    setInstaUsername('');
    setInstaPassword('');
    setInstaStep('login');
    setShowInstaModal(true);
  };

  const handleInstaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInstaStep('loading');
    setTimeout(() => {
      setInstaStep('authorize');
    }, 800);
  };

  const handleInstaAuthorize = () => {
    setInstaStep('loading');
    setTimeout(() => {
      const finalUsername = instaUsername.startsWith('@') ? instaUsername.substring(1) : instaUsername;
      updateState((prev) => ({
        ...prev,
        orgUsers: (prev.orgUsers || []).map((u) => 
          u.id === instaModalTarget 
            ? { ...u, instagramConnected: true, instagramUsername: finalUsername } 
            : u
        )
      }));
      setShowInstaModal(false);
      setInstaModalTarget(null);
    }, 1000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateState({
      currentUserName: profileName,
      currentUserEmail: profileEmail,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      alert("Organization name cannot be empty.");
      return;
    }
    updateState({ organizationName: orgName });
    setOrgSaved(true);
    setTimeout(() => setOrgSaved(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const passError = validatePassword(newPassword);
    if (passError) {
      alert(passError);
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const handleUpdatePlan = (planId: string) => {
    setActivePlan(planId);
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 3000);
  };

  const handleResetData = () => {
    resetState();
    alert("Application state reset successfully.");
    router.push('/app');
  };

  const handleDeleteAccount = () => {
    window.location.href = '/';
  };

  if (isUserLoading && !user) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto w-full text-text-primary">
      {/* Header */}
      <div className="border-b border-border-primary pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-instagram-pink" />
          <span>Account Settings</span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your personal profile, organization preferences, billing plans, and security integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Account Profile & Security */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Profile Form */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2.5 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-text-secondary" />
              <span>Personal Profile</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Email Address</label>
                  <input
                    type="email"
                    required
                    readOnly
                    value={profileEmail}
                    className="border border-border-primary bg-bg-app/60 text-text-secondary rounded-xl px-3.5 py-2.5 text-xs outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {user ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-border-primary bg-bg-app/40 p-4 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-text-secondary mb-1">Account Type</span>
                    <span className="font-semibold text-text-primary">{formatAccountTypeLabel(user.accountType)}</span>
                  </div>
                  {user.organizationRole ? (
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-text-secondary mb-1">Organization Role</span>
                      <span className="font-semibold text-text-primary">{formatOrganizationRole(user.organizationRole)}</span>
                    </div>
                  ) : null}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-text-secondary mb-1">Onboarding Status</span>
                    <span className="font-semibold text-text-primary">{user.onboardingStatus ?? '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-text-secondary mb-1">Account Status</span>
                    <span className={`font-semibold ${user.isActive ? 'text-green-600' : 'text-red-500'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-text-secondary mb-1">Member Since</span>
                    <span className="font-semibold text-text-primary">{formatMeTimestamp(user.createdAt)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-text-secondary mb-1">Last Login</span>
                    <span className="font-semibold text-text-primary">{formatMeTimestamp(user.lastLogin)}</span>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-2">
                <div className="text-[10px] text-text-secondary">
                  Role:{' '}
                  <span className="font-bold text-instagram-pink uppercase">
                    {user?.userType ?? state.currentUserType}
                  </span>
                </div>
                {profileSaved ? (
                  <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-xl border border-green-200 dark:border-green-900">
                    <Check className="w-3.5 h-3.5" /> Profile Saved
                  </span>
                ) : (
                  <button
                    type="submit"
                    className="bg-text-primary text-bg-card hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Save Profile
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Agency Settings (Only for agency users) */}
          {!isClient && (
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2.5 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-text-secondary" />
                <span>Agency Organization Details</span>
              </h3>

              <form onSubmit={handleSaveOrg} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Organization / Agency Name</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition"
                  />
                </div>

                <div className="flex justify-end">
                  {orgSaved ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-xl border border-green-200 dark:border-green-900">
                      <Check className="w-3.5 h-3.5" /> Organization Details Saved
                    </span>
                  ) : (
                    <button
                      type="submit"
                      className="bg-text-primary text-bg-card hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Update Organization
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {!isClient && state.accountType === 'organization' && (
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2.5 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-instagram-pink" />
                <span>Team Members & Workspace Access</span>
              </h3>

              <p className="text-xs text-text-secondary">
                Invite new users from Client Portals. Use this section to manage workspace access and Instagram
                connections for active team members.
              </p>

              {/* Members List Table */}
              <div className="border border-border-primary rounded-xl overflow-hidden bg-bg-card">
                <table className="w-full text-left border-collapse text-xs text-text-primary">
                  <thead>
                    <tr className="bg-bg-app border-b border-border-primary text-text-secondary font-bold">
                      <th className="p-3">User Details</th>
                      <th className="p-3">Instagram Channel</th>
                      <th className="p-3">Assigned Workspaces</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {activeTeamMembers.map((user) => (
                      <tr key={user.id} className="hover:bg-bg-app/20">
                        <td className="p-3">
                          <p className="font-bold text-text-primary">{user.name}</p>
                          <p className="text-[10px] text-text-secondary font-mono mt-0.5">{user.email}</p>
                        </td>
                        <td className="p-3">
                          {user.instagramConnected ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <Instagram className="w-3 h-3 text-green-600" />
                              <span>@{user.instagramUsername}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openInstaModal(user.id)}
                              className="text-[10px] text-instagram-pink hover:underline font-semibold flex items-center gap-0.5"
                            >
                              <Instagram className="w-3.5 h-3.5" />
                              <span>Connect Instagram</span>
                            </button>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {state.workspaces.map((ws) => {
                              const isAssigned = (user.workspaceIds || []).includes(ws.id);
                              return (
                                <button
                                  key={ws.id}
                                  type="button"
                                  onClick={() => handleToggleWorkspace(user.id, ws.id)}
                                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold border transition ${
                                    isAssigned
                                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400'
                                      : 'bg-transparent border-border-primary text-text-secondary hover:text-text-primary hover:border-slate-300 dark:hover:border-slate-800'
                                  }`}
                                >
                                  {ws.name}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activeTeamMembers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center p-6 text-text-secondary italic">
                          No active team members yet. Invite users from Client Portals to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Security & Password */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2.5 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-text-secondary" />
              <span>Change Account Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PasswordInput
                  label="Current Password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="text-xs py-2"
                  required
                />
                <PasswordInput
                  label="New Password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs py-2"
                  required
                />
                <PasswordInput
                  label="Confirm New Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-xs py-2"
                  required
                />
              </div>

              <div className="flex justify-end">
                {passwordSaved ? (
                  <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-xl border border-green-200 dark:border-green-900">
                    <Check className="w-3.5 h-3.5" /> Password Updated
                  </span>
                ) : (
                  <button
                    type="submit"
                    className="bg-text-primary text-bg-card hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Update Password
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Pricing Plans & Billing (Only for agency users) */}
          {!isClient && (
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border-primary pb-2.5">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-text-secondary" />
                  <span>Subscription Plan & Billing</span>
                </h3>
                {planSaved && (
                  <span className="text-[10px] text-green-600 font-bold bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-md border border-green-200 dark:border-green-900">
                    Plan Updated Successfully
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Plan 1 */}
                <div className={`border rounded-xl p-4 flex flex-col justify-between gap-3 text-xs transition ${
                  activePlan === 'starter' 
                    ? 'border-instagram-pink bg-pink-50/10' 
                    : 'border-border-primary hover:bg-bg-hover'
                }`}>
                  <div className="space-y-1">
                    <p className="font-bold text-text-primary">Agency Starter</p>
                    <p className="text-2xl font-black text-text-primary">$49<span className="text-[10px] font-normal">/mo</span></p>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Up to 3 workspaces, 5 clients, and standard AI completions.
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpdatePlan('starter')}
                    className={`w-full py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                      activePlan === 'starter'
                        ? 'bg-instagram-pink text-white'
                        : 'bg-bg-app border border-border-primary text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    {activePlan === 'starter' ? 'Active Plan' : 'Select Plan'}
                  </button>
                </div>

                {/* Plan 2 */}
                <div className={`border rounded-xl p-4 flex flex-col justify-between gap-3 text-xs transition relative ${
                  activePlan === 'growth' 
                    ? 'border-instagram-pink bg-pink-50/10' 
                    : 'border-border-primary hover:bg-bg-hover'
                }`}>
                  <span className="absolute -top-2.5 right-3 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow">
                    Popular
                  </span>
                  <div className="space-y-1">
                    <p className="font-bold text-text-primary">Agency Growth</p>
                    <p className="text-2xl font-black text-text-primary">$99<span className="text-[10px] font-normal">/mo</span></p>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Up to 10 workspaces, 20 clients, and premium custom AI rules.
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpdatePlan('growth')}
                    className={`w-full py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                      activePlan === 'growth'
                        ? 'bg-instagram-pink text-white'
                        : 'bg-bg-app border border-border-primary text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    {activePlan === 'growth' ? 'Active Plan' : 'Select Plan'}
                  </button>
                </div>

                {/* Plan 3 */}
                <div className={`border rounded-xl p-4 flex flex-col justify-between gap-3 text-xs transition ${
                  activePlan === 'enterprise' 
                    ? 'border-instagram-pink bg-pink-50/10' 
                    : 'border-border-primary hover:bg-bg-hover'
                }`}>
                  <div className="space-y-1">
                    <p className="font-bold text-text-primary">Enterprise</p>
                    <p className="text-2xl font-black text-text-primary">$249<span className="text-[10px] font-normal">/mo</span></p>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Unlimited workspaces & clients, fine-tuned custom agent models.
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpdatePlan('enterprise')}
                    className={`w-full py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                      activePlan === 'enterprise'
                        ? 'bg-instagram-pink text-white'
                        : 'bg-bg-app border border-border-primary text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    {activePlan === 'enterprise' ? 'Active Plan' : 'Select Plan'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Integrations & Danger Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Integrations Panel */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2 flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-instagram-pink" />
              <span>Social Integrations</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Connect platform APIs to publish approved content automatically.
            </p>

            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold">
                    IG
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">Instagram API</p>
                    <p className="text-[9px] text-green-600 font-bold">Connected</p>
                  </div>
                </div>
                <button 
                  onClick={() => setInstagramConnected(!instagramConnected)}
                  className="text-text-secondary hover:text-text-primary transition"
                >
                  {instagramConnected ? (
                    <ToggleRight className="w-7 h-7 text-instagram-pink" />
                  ) : (
                    <ToggleLeft className="w-7 h-7" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                    IN
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">LinkedIn API</p>
                    <p className="text-[9px] text-text-secondary">Disconnected</p>
                  </div>
                </div>
                <button 
                  onClick={() => setLinkedinConnected(!linkedinConnected)}
                  className="text-text-secondary hover:text-text-primary transition"
                >
                  {linkedinConnected ? (
                    <ToggleRight className="w-7 h-7 text-instagram-pink" />
                  ) : (
                    <ToggleLeft className="w-7 h-7" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-bg-card border border-red-200 dark:border-red-950/40 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-red-600 border-b border-red-100 dark:border-red-950/40 pb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-red-500" />
              <span>Danger Zone</span>
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-text-primary">Reset App Data</p>
                <p className="text-[10px] text-text-secondary">
                  Restores default settings, clear all custom workspaces and client invitations.
                </p>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full mt-1.5 border border-border-primary bg-bg-app hover:bg-red-50 dark:hover:bg-red-950/20 text-text-primary hover:text-red-500 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset App State</span>
                </button>
              </div>

              <div className="space-y-1 pt-3 border-t border-border-primary">
                <p className="text-xs font-bold text-text-primary">Delete Account</p>
                <p className="text-[10px] text-text-secondary">
                  Permanently delete this account and all linked organization records.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full mt-1.5 bg-red-600 hover:opacity-90 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Authentication modal */}
      {showInstaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white border border-[#EFEFEF] rounded-3xl w-full max-w-sm p-6 shadow-xl animate-scale-up space-y-4 text-slate-800">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EFEFEF] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Instagram className="w-4 h-4 text-instagram-pink" />
                <span>Instagram Auth Bridge</span>
              </span>
              <button
                onClick={() => {
                  setShowInstaModal(false);
                  setInstaModalTarget(null);
                }}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Loading State */}
            {instaStep === 'loading' && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-10 h-10 border-2 border-instagram-pink border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 font-medium">Communicating with Meta API...</p>
              </div>
            )}

            {/* Login State */}
            {instaStep === 'login' && (
              <form onSubmit={handleInstaSubmit} className="space-y-4">
                <p className="text-[11px] text-slate-500 leading-normal">
                  Connect your team member's Instagram Creator or Business profile to PressForge.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Instagram Username</label>
                  <input
                    type="text"
                    required
                    placeholder="@username"
                    value={instaUsername}
                    onChange={(e) => setInstaUsername(e.target.value)}
                    className="border border-[#EFEFEF] bg-white text-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-instagram-pink"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Password</label>
                  <PasswordInput
                    placeholder="••••••••"
                    value={instaPassword}
                    onChange={(e) => setInstaPassword(e.target.value)}
                    className="border border-[#EFEFEF] bg-white text-slate-800 rounded-lg text-xs py-1.5 focus:border-instagram-pink"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#262626] text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition"
                >
                  Log In & Connect
                </button>


              </form>
            )}

            {/* Authorize State */}
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
      )}

      {/* Reset Confirmation Modal */}
      <DeleteModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setShowResetConfirm(false);
          handleResetData();
        }}
        title="Reset Application Data"
        description="Are you sure you want to reset all data to default settings? This will delete custom workspaces, drafts, and client portals."
        confirmLabel="Reset Data"
      />

      {/* Delete Account Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeleteAccount();
        }}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action is irreversible."
        confirmLabel="Delete Account"
      />
    </div>
  );
}

