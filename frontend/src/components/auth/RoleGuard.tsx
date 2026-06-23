'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/providers/AuthProvider';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirect?: boolean;
}

export function RoleGuard({ allowedRoles, children, fallback = null, redirect = false }: RoleGuardProps) {
  const { isLoading, hasRole } = useAuth();
  const router = useRouter();

  const isAuthorized = hasRole(allowedRoles);

  useEffect(() => {
    if (!isLoading && !isAuthorized && redirect) {
      router.push('/unauthorized');
    }
  }, [isLoading, isAuthorized, redirect, router]);

  if (isLoading) {
    return null;
  }

  if (!isAuthorized) {
    return redirect ? null : <>{fallback}</>;
  }

  return <>{children}</>;
}
