'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/utils/api-errors';
import type {
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  InviteUserRequest,
  InviteUserResponse,
} from '@/lib/types/api';
import { fetchMe } from '@/lib/hooks/queries/use-auth';

async function inviteMemberFn({
  orgId,
  body,
}: {
  orgId: string;
  body: InviteUserRequest;
}): Promise<InviteUserResponse> {
  const res = await fetch(`/api/organizations/${orgId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      data.error ?? 'Failed to send invitation',
      res.status,
      data.code ?? 'INVITATION_FAILED'
    );
  }

  return res.json() as Promise<InviteUserResponse>;
}

export function useInviteMemberMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: InviteUserRequest) => inviteMemberFn({ orgId, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });
}

async function acceptInvitationFn(body: AcceptInvitationRequest): Promise<AcceptInvitationResponse> {
  const res = await fetch('/api/invitations/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      data.error ?? 'Failed to accept invitation',
      res.status,
      data.code ?? 'ACCEPTATION_FAILED'
    );
  }

  return res.json() as Promise<AcceptInvitationResponse>;
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvitationFn,
    onSuccess: async () => {
      await queryClient.fetchQuery({ queryKey: ['me'], queryFn: fetchMe });
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });
}
