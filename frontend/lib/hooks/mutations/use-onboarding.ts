import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/utils/api-errors';
import type { OnboardingRequest } from '@/lib/types/api';

export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: OnboardingRequest) => {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          // ignore
        }
        throw new ApiError(
          errorData?.error || 'Onboarding failed',
          res.status,
          errorData?.code || 'UNKNOWN'
        );
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    },
  });
}
