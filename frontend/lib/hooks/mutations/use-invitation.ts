import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@/lib/utils/api-errors';

export function useInviteMemberMutation(organizationId: string) {
  return useMutation({
    mutationFn: async (payload: { email: string; fullName: string; role: string }) => {
      const res = await fetch(`/api/organizations/${organizationId}/invite`, {
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
          errorData?.error || 'Invitation failed',
          res.status,
          errorData?.code || 'UNKNOWN'
        );
      }

      return res.json();
    },
  });
}

export function useAcceptInvitationMutation() {
  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) => {
      const res = await fetch('/api/invitations/accept', {
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
          errorData?.error || 'Failed to accept invitation',
          res.status,
          errorData?.code || 'UNKNOWN'
        );
      }

      return res.json();
    },
  });
}
