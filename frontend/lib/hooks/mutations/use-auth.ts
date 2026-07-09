import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/utils/api-errors';

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: any) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          // ignore
        }
        throw new ApiError(
          errorData?.error || 'Login failed',
          res.status,
          errorData?.code || 'UNAUTHORIZED'
        );
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth-user'], data.user);
    },
  });
}

export function useSignupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: any) => {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          // ignore
        }
        throw new ApiError(
          errorData?.error || 'Signup failed',
          res.status,
          errorData?.code || 'BAD_REQUEST'
        );
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth-user'], data.user);
    },
  });
}
