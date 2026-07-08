'use client';

import { notifications } from '@mantine/notifications';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Lock, Sparkles, ArrowRight, ShieldAlert, Check, Mail } from 'lucide-react';

import { ErrorMessage } from '@/components/common/error-message';
import { PageLoader } from '@/components/common/page-loader';
import { useAcceptInvitationMutation } from '@/lib/hooks/mutations/use-invitation';
import { ApiError } from '@/lib/utils/api-errors';
import { useMounted } from '@/lib/hooks/use-mounted';

export function AcceptInviteView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const acceptMutation = useAcceptInvitationMutation();
  const mounted = useMounted();

  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [accepted, setAccepted] = useState(false);

  // Clear any existing session so the invitee can set their own password (shared-browser case).
  useEffect(() => {
    if (!token) return;
    void fetch('/api/auth/logout', { method: 'POST' });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!token) {
      setFormError('This invitation link is invalid or missing a token.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    if (password.length > 30) {
      setFormError('Password must be 30 characters or less.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      await acceptMutation.mutateAsync({ token, password });
      setAccepted(true);
      notifications.show({
        title: 'Welcome to PressForge',
        message: 'You are logged in. Redirecting to your dashboard...',
        color: 'green',
      });

      // Cookies are set by the API response — go straight to the app, not onboarding.
      router.replace('/app');
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError('Failed to accept invitation. Please try again.', 500, 'UNKNOWN');
      setFormError(apiError.message);
      notifications.show({
        title: 'Invitation failed',
        message: apiError.message,
        color: 'red',
      });
    }
  };

  if (!mounted) {
    return <PageLoader />;
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-bg-card border border-border-primary rounded-3xl p-8 shadow-lg text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-yellow-600 mx-auto" />
          <h1 className="text-xl font-bold text-text-primary">Invalid Invitation Link</h1>
          <p className="text-sm text-text-secondary">
            This link is missing a valid invitation token. Please use the link from your invitation
            email or ask your team admin to resend the invite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-[440px] bg-bg-card border border-border-primary rounded-3xl p-8 shadow-lg flex flex-col gap-6 relative overflow-hidden transition-colors duration-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F58529]/10 to-[#DD2A7B]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-[#515BD4]/10 to-[#DD2A7B]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center relative z-10 space-y-2">
          <div className="inline-flex p-3 rounded-full bg-pink-50 dark:bg-pink-950/20 text-instagram-pink border border-pink-100 dark:border-pink-900/30 mb-2">
            {accepted ? <Check className="w-6 h-6" /> : <Sparkles className="w-6 h-6 animate-pulse" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {accepted ? 'You\'re all set!' : 'Accept Your Invitation'}
          </h1>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            {accepted
              ? 'Your account is ready and you are signed in.'
              : 'Set a permanent password to join your team on PressForge.'}
          </p>
        </div>

        {!accepted ? (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <ErrorMessage message={formError} />

            <div className="rounded-xl border border-border-primary bg-bg-app/60 px-3.5 py-3 text-xs text-text-secondary">
              <p className="font-semibold text-text-primary mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Create your account password
              </p>
              <p>
                Choose a password below to activate your invited account. You&apos;ll use this to sign
                in after accepting.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary" htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={30}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  maxLength={30}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 text-[10px] text-text-secondary leading-relaxed bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl">
              <ShieldAlert className="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
              <span>
                Your password must be 8–30 characters. You&apos;ll use this to sign in after accepting
                the invitation.
              </span>
            </div>

            <button
              type="submit"
              disabled={acceptMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3.5 rounded-full text-sm font-bold hover:opacity-95 transition shadow-md cursor-pointer disabled:opacity-60"
            >
              <span>{acceptMutation.isPending ? 'Creating account...' : 'Accept & Join Team'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
