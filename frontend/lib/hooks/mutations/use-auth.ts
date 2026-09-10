'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/utils/api-errors';
import { clearAccessToken } from '@/lib/auth/token-storage';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@/lib/types/api';

// ── Login ─────────────────────────────────────────────────────────────────────

async function loginFn(body: LoginRequest): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      data.error ?? 'Invalid email or password',
      res.status,
      data.code ?? 'INVALID_CREDENTIALS',
    );
  }

  return res.json() as Promise<LoginResponse>;
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      void queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });
}

// ── Signup ────────────────────────────────────────────────────────────────────

async function signupFn(body: SignupRequest): Promise<SignupResponse> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, name: body.fullName ?? body.name }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      data.error ?? 'Unable to create account',
      res.status,
      data.code ?? 'SIGNUP_FAILED',
    );
  }

  return res.json() as Promise<SignupResponse>;
}

export function useSignupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signupFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      void queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────

async function logoutFn(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {}
  clearAccessToken();
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutFn,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// ── Forgot Password ───────────────────────────────────────────────────────────

async function forgotPasswordFn(body: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      data.error ?? 'Failed to request password reset',
      res.status,
      data.code ?? 'FORGOT_PASSWORD_FAILED',
    );
  }

  return res.json() as Promise<ForgotPasswordResponse>;
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: forgotPasswordFn,
  });
}

// ── Verify Reset Code ─────────────────────────────────────────────────────────

async function verifyResetCodeFn(body: VerifyResetCodeRequest): Promise<VerifyResetCodeResponse> {
  const res = await fetch('/api/auth/verify-reset-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      data.error ?? 'Invalid or expired verification code',
      res.status,
      data.code ?? 'VERIFY_RESET_CODE_FAILED',
    );
  }

  return res.json() as Promise<VerifyResetCodeResponse>;
}

export function useVerifyResetCodeMutation() {
  return useMutation({
    mutationFn: verifyResetCodeFn,
  });
}

// ── Reset Password ────────────────────────────────────────────────────────────

async function resetPasswordFn(body: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      data.error ?? 'Failed to reset password',
      res.status,
      data.code ?? 'RESET_PASSWORD_FAILED',
    );
  }

  return res.json() as Promise<ResetPasswordResponse>;
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPasswordFn,
  });
}
