'use client';

import React from 'react';
import Link from 'next/link';
import { Container, Card, Title, Text, Button, Group, Stack } from '@mantine/core';
import { useAuth } from '@/providers/AuthProvider';
import { AUTH } from '@/constants';
import { ROUTES } from '@/routes';

export function UnauthorizedScreen() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 dark:bg-zinc-950 transition-colors py-12 px-4">
      <Container size="xs" className="w-full">
        <Card withBorder padding="xl" radius="md" className="shadow-md bg-white dark:bg-zinc-900 text-center">
          <Stack gap="md" align="center">
            <span className="text-5xl">🛑</span>
            <Title order={2} size="h3" className="font-black text-red-600 dark:text-red-400">
              {AUTH.UNAUTHORIZED.TITLE}
            </Title>
            <Text c="dimmed" size="sm">
              {AUTH.UNAUTHORIZED.DESC}
            </Text>
            <Group justify="center" mt="md">
              <Button component={Link} href={ROUTES.DASHBOARD} variant="default">
                Go to Dashboard
              </Button>
              <Button onClick={() => logout()} color="red">
                Log Out
              </Button>
            </Group>
          </Stack>
        </Card>
      </Container>
    </div>
  );
}
