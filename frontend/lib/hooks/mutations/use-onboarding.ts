'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/utils/api-errors';
import type { OnboardingRequest, OnboardingResponse } from '@/lib/types/api';

async function completeOnboardingFn(body: OnboardingRequest): Promise<OnboardingResponse> {
  const res = await fetch('/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      data.error ?? 'Unable to complete onboarding',
      res.status,
      data.code ?? 'ONBOARDING_FAILED',
    );
  }

  return res.json() as Promise<OnboardingResponse>;
}

export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboardingFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
