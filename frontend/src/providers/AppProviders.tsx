'use client';

import React from 'react';
import QueryProvider from './QueryProvider';
import MantineThemeProvider from './MantineThemeProvider';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from './AuthProvider';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <MantineThemeProvider>
        <AuthProvider>
          <Notifications position="top-right" zIndex={1000} />
          {children}
        </AuthProvider>
      </MantineThemeProvider>
    </QueryProvider>
  );
}
