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
  Settings, User, Lock, ShieldAlert, 
  Check, ToggleLeft, ToggleRight, Trash2, 
  Building2, Sparkles
} from 'lucide-react';
import { PasswordInput } from '@/components/common/password-input';
import { DeleteModal } from '@/components/common/delete-modal';
import { validatePassword } from '@/lib/utils/validation';

export function SettingsView() {
  const { state, updateState } = useAppState();
  const { user, isLoading: isUserLoading } = useAuth();
  const router = useRouter();
  const isClient = user?.userType === 'client' || state.currentUserType === 'client';
  const showSocialIntegrations = user?.userType === 'client' || state.currentUserType === 'client' || user?.userType === 'individual' || state.currentUserType === 'individual';

  // Modal confirm states
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

  // Integration toggles
  const [instagramConnected, setInstagramConnected] = useState(true);
  const [linkedinConnected, setLinkedinConnected] = useState(false);

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
          Manage your personal profile, organization preferences, and security integrations.
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

          {/* Security & Password */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2.5 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-text-secondary" />
              <span>Change Account Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PasswordInput
                  id="current-password"
                  label="Current Password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="text-xs py-2"
                  required
                />
                <PasswordInput
                  id="new-password"
                  label="New Password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs py-2"
                  required
                />
                <PasswordInput
                  id="confirm-password"
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

        </div>

        {/* Right Column: Integrations & Danger Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Integrations Panel */}
          {showSocialIntegrations && (
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
          )}

          {/* Danger Zone */}
          <div className="bg-bg-card border border-red-200 dark:border-red-950/40 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-red-600 border-b border-red-100 dark:border-red-950/40 pb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-red-500" />
              <span>Danger Zone</span>
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="space-y-1">
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

