'use client';

import { MantineProvider } from '@mantine/core';
import { theme } from '@/theme/theme';
import React from 'react';

export default function MantineThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      {children}
    </MantineProvider>
  );
}
