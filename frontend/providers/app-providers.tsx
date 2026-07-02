'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';

import { QueryProvider } from '@/providers/query-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <MantineProvider defaultColorScheme="auto">
        <Notifications position="top-right" zIndex={1000} />
        {children}
      </MantineProvider>
    </QueryProvider>
  );
}
