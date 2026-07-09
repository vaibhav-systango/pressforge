'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/utils/api-errors';
import { fetchMe } from '@/lib/hooks/queries/use-auth';
import type { LoginRequest, LoginResponse, SignupRequest, SignupResponse } from '@/lib/types/api';

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
    onSuccess: async () => {
      await queryClient.fetchQuery({ queryKey: ['me'], queryFn: fetchMe });
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
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
    onSuccess: async () => {
      await queryClient.fetchQuery({ queryKey: ['me'], queryFn: fetchMe });
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────

async function logoutFn(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
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
