import { useQuery } from '@tanstack/react-query';
import type { User } from '@/lib/auth/redirect';

export function useAuth() {
  const { data: user, error, isLoading, isError } = useQuery<User | null>({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const res = await fetch('/api/me');
      if (!res.ok) {
        throw new Error('Not authenticated');
      }
      const data = await res.json();
      return data.user;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: user || null,
    isLoading,
    isError,
    isAuthReady: !isLoading,
    error,
  };
}
