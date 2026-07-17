'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import {
  consumeSocialOAuthReturnTo,
  useLinkedInConnection,
} from '@/lib/hooks/queries/use-social-connection';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  formatAccountTypeLabel,
  formatMeTimestamp,
} from '@/lib/auth/me-user';
import { formatOrganizationRole } from '@/lib/invitations/role-hierarchy';
import { PageLoader } from '@/components/common/page-loader';
import React, { useEffect, useState } from 'react';
import { 
  Settings, User, Lock, ShieldAlert, 
  Check, Trash2, 
  Building2, Sparkles
} from 'lucide-react';
import { PasswordInput } from '@/components/common/password-input';
import { DeleteModal } from '@/components/common/delete-modal';
import { ErrorMessage } from '@/components/common/error-message';
import { validatePassword, validateFullName, validateOrganizationName } from '@/lib/utils/validation';

export function SettingsView() {
  const { state, updateState } = useAppState();
  const { user, isLoading: isUserLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const {
    connection: linkedinConnection,
    accountName: linkedinAccountName,
    isLoading: isLinkedInLoading,
    isConnecting: isLinkedInConnecting,
    isDisconnecting: isLinkedInDisconnecting,
    connectError: linkedinConnectError,
    disconnectError: linkedinDisconnectError,
    connectLinkedIn,
    disconnectLinkedIn,
    refresh: refreshLinkedInConnection,
  } = useLinkedInConnection();

  const isClient = user?.userType === 'client' || state.currentUserType === 'client';
  const showSocialIntegrations = true;

  // Modal confirm states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail] = useState(user?.email ?? '');
  const [orgName, setOrgName] = useState(
    state.organizationName && state.organizationName !== 'Forge Agencies' ? state.organizationName : '',
  );
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation errors
  const [profileNameError, setProfileNameError] = useState<string | null>(null);
  const [orgNameError, setOrgNameError] = useState<string | null>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // API Call errors
  const [profileApiError, setProfileApiError] = useState<string>('');
  const [orgApiError, setOrgApiError] = useState<string>('');
  const [passwordApiError, setPasswordApiError] = useState<string>('');
  
  // UI indicators
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Integration state
  const [linkedinOAuthMessage] = useState<string | null>(() =>
    searchParams.get('platform') === 'linkedin' && searchParams.get('status') === 'connected'
      ? 'LinkedIn connected successfully.'
      : null,
  );
  const [linkedinOAuthError] = useState<string | null>(() => {
    if (searchParams.get('platform') !== 'linkedin' || searchParams.get('status') !== 'error') {
      return null;
    }
    const reason = searchParams.get('reason');
    return reason ? `LinkedIn connection failed: ${reason}` : 'LinkedIn connection failed.';
  });
  const linkedinConnected = linkedinConnection?.connected ?? false;

  useEffect(() => {
    if (searchParams.get('platform') !== 'linkedin') return;

    const status = searchParams.get('status');
    if (status === 'connected') {
      refreshLinkedInConnection();
      const returnTo = consumeSocialOAuthReturnTo();
      router.replace(returnTo ?? '/app/settings');
      return;
    } else if (status === 'error') {
      consumeSocialOAuthReturnTo();
    }

    router.replace('/app/settings');
  }, [refreshLinkedInConnection, router, searchParams]);



  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileApiError('');
    
    const nameErr = validateFullName(profileName);
    if (nameErr) {
      setProfileNameError(nameErr);
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: profileName }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile name');
      }
      
      await updateState({
        currentUserName: profileName,
      });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setProfileApiError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgApiError('');

    const orgErr = validateOrganizationName(orgName);
    if (orgErr) {
      setOrgNameError(orgErr);
      return;
    }

    setIsSavingOrg(true);
    try {
      const res = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationName: orgName }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update organization name');
      }
      
      await updateState({ organizationName: orgName });
      setOrgSaved(true);
      setTimeout(() => setOrgSaved(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update organization';
      setOrgApiError(message);
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordApiError('');

    const curErr = currentPassword ? null : 'Current password is required';
    const passErr = validatePassword(newPassword);
    const confErr = newPassword === confirmPassword ? null : 'New passwords do not match';

    if (curErr || passErr || confErr) {
      setCurrentPasswordError(curErr);
      setNewPasswordError(passErr);
      setConfirmPasswordError(confErr);
      return;
    }
    
    setIsSavingPassword(true);
    try {
      const res = await fetch('/api/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update password');
      }
      
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordApiError(message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/me', {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete account');
      }
      
      // Perform client logout/redirect
      await fetch('/api/auth/logout', { method: 'POST' });
      setShowDeleteConfirm(false);
      window.location.href = '/';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      notifications.show({
        title: 'Error',
        message: message,
        color: 'red',
      });
    } finally {
      setIsDeletingAccount(false);
    }
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
          <div key={user?.userId || 'loading-profile'} className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2.5 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-text-secondary" />
              <span>Personal Profile</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <ErrorMessage message={profileApiError} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Full Name</label>
                  <input
                    type="text"
                    required
                    disabled={isSavingProfile}
                    value={profileName}
                    onChange={(e) => {
                      setProfileName(e.target.value);
                      if (profileNameError) {
                        setProfileNameError(validateFullName(e.target.value));
                      }
                    }}
                    onBlur={() => {
                      setProfileNameError(validateFullName(profileName));
                    }}
                    className={`border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition ${
                      profileNameError ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {profileNameError && (
                    <p className="text-[11px] text-red-500 font-medium">{profileNameError}</p>
                  )}
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
                    disabled={isSavingProfile || !!profileNameError}
                    className="bg-text-primary text-bg-card hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Agency Settings (Only for agency users) */}
          {!isClient && (
            <div key={state.organizationName || 'loading-org'} className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2.5 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-text-secondary" />
                <span>Agency Organization Details</span>
              </h3>

              <form onSubmit={handleSaveOrg} className="space-y-4">
                <ErrorMessage message={orgApiError} />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Organization / Agency Name</label>
                  <input
                    type="text"
                    required
                    disabled={isSavingOrg}
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      if (orgNameError) {
                        setOrgNameError(validateOrganizationName(e.target.value));
                      }
                    }}
                    onBlur={() => {
                      setOrgNameError(validateOrganizationName(orgName));
                    }}
                    className={`border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition ${
                      orgNameError ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {orgNameError && (
                    <p className="text-[11px] text-red-500 font-medium">{orgNameError}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  {orgSaved ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-xl border border-green-200 dark:border-green-900">
                      <Check className="w-3.5 h-3.5" /> Organization Details Saved
                    </span>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSavingOrg || !!orgNameError}
                      className="bg-text-primary text-bg-card hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingOrg ? 'Updating...' : 'Update Organization'}
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
              <ErrorMessage message={passwordApiError} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PasswordInput
                  id="current-password"
                  label="Current Password"
                  placeholder="••••••••"
                  disabled={isSavingPassword}
                  value={currentPassword}
                  error={currentPasswordError || undefined}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (currentPasswordError) {
                      setCurrentPasswordError(e.target.value ? null : 'Current password is required');
                    }
                  }}
                  onBlur={() => {
                    setCurrentPasswordError(currentPassword ? null : 'Current password is required');
                  }}
                  className="text-xs py-2"
                  required
                />
                <PasswordInput
                  id="new-password"
                  label="New Password"
                  placeholder="••••••••"
                  disabled={isSavingPassword}
                  value={newPassword}
                  error={newPasswordError || undefined}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (newPasswordError) {
                      setNewPasswordError(validatePassword(e.target.value));
                    }
                    if (confirmPassword) {
                      setConfirmPasswordError(e.target.value === confirmPassword ? null : 'New passwords do not match');
                    }
                  }}
                  onBlur={() => {
                    setNewPasswordError(validatePassword(newPassword));
                  }}
                  className="text-xs py-2"
                  required
                />
                <PasswordInput
                  id="confirm-password"
                  label="Confirm New Password"
                  placeholder="••••••••"
                  disabled={isSavingPassword}
                  value={confirmPassword}
                  error={confirmPasswordError || undefined}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError(e.target.value === newPassword ? null : 'New passwords do not match');
                  }}
                  onBlur={() => {
                    setConfirmPasswordError(confirmPassword === newPassword ? null : 'New passwords do not match');
                  }}
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
                    disabled={isSavingPassword || !!currentPasswordError || !!newPasswordError || !!confirmPasswordError}
                    className="bg-text-primary text-bg-card hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingPassword ? 'Updating...' : 'Update Password'}
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
                      <p className="text-[9px] font-bold text-text-secondary">Coming soon</p>
                    </div>
                  </div>
                  <span className="rounded-lg border border-border-primary px-3 py-2 text-[10px] font-bold text-text-secondary">
                    Unavailable
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                      IN
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">LinkedIn API</p>
                      <p
                        className={`text-[9px] font-bold ${
                          linkedinConnected ? 'text-green-600' : 'text-text-secondary'
                        }`}
                      >
                        {isLinkedInLoading
                          ? 'Checking connection...'
                          : linkedinConnected
                            ? `Connected${linkedinAccountName ? ` as ${linkedinAccountName}` : ''}`
                            : 'Disconnected'}
                      </p>
                    </div>
                  </div>
                  {linkedinConnected ? (
                    <button
                      type="button"
                      onClick={() => disconnectLinkedIn()}
                      disabled={isLinkedInLoading || isLinkedInDisconnecting}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLinkedInDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connectLinkedIn('/app/settings')}
                      disabled={isLinkedInLoading || isLinkedInConnecting}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLinkedInConnecting ? 'Redirecting...' : 'Connect LinkedIn'}
                    </button>
                  )}
                </div>

                {linkedinOAuthMessage && (
                  <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[10px] font-semibold text-green-700">
                    {linkedinOAuthMessage}
                  </p>
                )}
                {(linkedinOAuthError || linkedinConnectError || linkedinDisconnectError) && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-700">
                    {linkedinOAuthError ||
                      (linkedinConnectError instanceof Error
                        ? linkedinConnectError.message
                        : null) ||
                      (linkedinDisconnectError instanceof Error
                        ? linkedinDisconnectError.message
                        : 'Unable to update LinkedIn connection.')}
                  </p>
                )}
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
        isPending={isDeletingAccount}
        onClose={() => {
          if (!isDeletingAccount) setShowDeleteConfirm(false);
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action is irreversible."
        confirmLabel="Delete Account"
      />
    </div>
  );
}
