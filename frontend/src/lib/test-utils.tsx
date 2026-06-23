import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { theme } from '@/theme/theme';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: React.ReactNode;
}

import { AuthProvider } from '@/providers/AuthProvider';

export function createWrapper() {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: AllTheProvidersProps) => (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <AuthProvider>{children}</AuthProvider>
      </MantineProvider>
    </QueryClientProvider>
  );

  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, { wrapper: createWrapper(), ...options });
};

export * from '@testing-library/react';
export { customRender as render };
export { default as userEvent } from '@testing-library/user-event';
export { createWrapper as getTestWrapper };
