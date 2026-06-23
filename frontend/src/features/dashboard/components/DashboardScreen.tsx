'use client';

import React from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Card,
  Badge,
  ActionIcon,
  useMantineColorScheme,
  ThemeIcon,
} from '@mantine/core';
import { useAuth } from '@/providers/AuthProvider';
import { RoleGuard } from '@/components/auth/RoleGuard';

export function DashboardScreen() {
  const { user, logout } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-zinc-800 pb-6 mb-8">
        <div>
          <Title order={1} className="text-3xl font-extrabold tracking-tight">
            System Workspace
          </Title>
          <Text c="dimmed" size="sm" mt="xs">
            A production-grade, secure, and role-guarded framework for your brand operations.
          </Text>
        </div>
        <Group>
          {user && (
            <div className="text-right mr-2 hidden md:block">
              <Text size="sm" fw={600}>
                {user.name}
              </Text>
              <Text size="xs" c="dimmed" className="capitalize">
                {user.role} Account
              </Text>
            </div>
          )}
          <ActionIcon
            variant="default"
            onClick={() => setColorScheme(dark ? 'light' : 'dark')}
            size="lg"
            aria-label="Toggle color scheme"
            data-testid="btn-toggle-theme"
          >
            {dark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-yellow-500"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-600"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </ActionIcon>
          <Button onClick={logout} variant="outline" color="red" size="md" data-testid="btn-logout">
            Log Out
          </Button>
        </Group>
      </div>

      {/* Welcome Banner */}
      <Card
        withBorder
        padding="xl"
        radius="lg"
        className="mb-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-950 text-white shadow-xl relative overflow-hidden"
      >
        {/* Decorative ambient blobs */}
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-50%] left-[-10%] w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />

        <Stack gap="sm" className="relative z-10">
          <Badge color="violet" size="lg" variant="filled">
            Ready for Figma integration
          </Badge>
          <Title order={2} className="text-3xl font-black tracking-tight">
            Welcome back, {user?.name || 'Developer'}!
          </Title>
          <Text className="text-indigo-200 text-base max-w-2xl">
            This repository is structured and optimized for rapid frontend development. 
            All core capabilities—State Management, Route Guarding, Mantine Styling, and Tailwind CSS v4—are fully pre-configured.
          </Text>
        </Stack>
      </Card>

      {/* Boilerplate Setup Info */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" className="mb-8">
        {/* Architecture & Tech Stack Card */}
        <Card withBorder padding="lg" radius="md" className="bg-white dark:bg-zinc-900 shadow-sm">
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon variant="light" color="violet" size="lg">
                <span className="text-lg">🛠️</span>
              </ThemeIcon>
              <Title order={3} size="h4" className="font-bold">
                Boilerplate Configuration
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              This frontend implements clean architecture best practices that make it highly maintainable and clean:
            </Text>
            <Stack gap="xs">
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✔</span>
                <Text size="sm">
                  <strong>Framework:</strong> Next.js 15+ App Router with client/server routing.
                </Text>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✔</span>
                <Text size="sm">
                  <strong>Styling:</strong> Tailwind CSS v4 alongside Mantine UI theme mapping.
                </Text>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✔</span>
                <Text size="sm">
                  <strong>State Management:</strong> TanStack React Query + React Context.
                </Text>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✔</span>
                <Text size="sm">
                  <strong>Types & Safety:</strong> Zod Schemas + TypeScript strict type-checking.
                </Text>
              </div>
            </Stack>
          </Stack>
        </Card>

        {/* Dynamic RBAC Matrix Card */}
        <Card withBorder padding="lg" radius="md" className="bg-white dark:bg-zinc-900 shadow-sm">
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon variant="light" color="violet" size="lg">
                <span className="text-lg">🛡️</span>
              </ThemeIcon>
              <Title order={3} size="h4" className="font-bold">
                Role-Based Access Controls (RBAC)
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Access permissions are dynamically checked based on the active session role:
            </Text>
            <Stack gap="xs">
              <Group justify="space-between" align="center" className="border-b border-gray-100 dark:border-zinc-800 pb-2">
                <Text size="sm" fw={600}>Administrator Account</Text>
                <Badge color="red" variant="light">Full Control</Badge>
              </Group>
              <Group justify="space-between" align="center" className="border-b border-gray-100 dark:border-zinc-800 pb-2">
                <Text size="sm" fw={600}>Editor Account</Text>
                <Badge color="blue" variant="light">Modify Content</Badge>
              </Group>
              <Group justify="space-between" align="center" className="pb-1">
                <Text size="sm" fw={600}>Viewer Account</Text>
                <Badge color="gray" variant="light">Read-Only</Badge>
              </Group>
            </Stack>

            {/* Dynamic RBAC Guard Demo */}
            <div className="mt-2 p-3 bg-slate-50 dark:bg-zinc-950 rounded-md border border-slate-100 dark:border-zinc-800">
              <Text size="xs" fw={700} c="violet" className="uppercase tracking-wider mb-2">
                Dynamic Component Guard Test
              </Text>
              <RoleGuard allowedRoles={['admin']}>
                <Text size="xs" c="green" fw={500}>
                  ✔ You are viewing this text because you are logged in as an <strong>Administrator</strong>.
                </Text>
              </RoleGuard>
              <RoleGuard allowedRoles={['editor']}>
                <Text size="xs" c="blue" fw={500}>
                  ✔ You are viewing this text because you are logged in as an <strong>Editor</strong>.
                </Text>
              </RoleGuard>
              <RoleGuard allowedRoles={['viewer']}>
                <Text size="xs" c="gray" fw={500}>
                  ✔ You are viewing this text because you are logged in as a <strong>Viewer</strong>.
                </Text>
              </RoleGuard>
            </div>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Feature Section Placeholder */}
      <Card
        withBorder
        padding="xl"
        radius="md"
        className="text-center py-16 flex flex-col items-center justify-center bg-gray-50/20"
        data-testid="dashboard-canvas"
      >
        <Stack align="center" gap="sm" className="max-w-md">
          <div className="text-4xl">🎨</div>
          <Text fw={700} size="xl">
            Design Canvas Ready
          </Text>
          <Text c="dimmed" size="sm">
            Import components, hooks, and pages matching your Figma mockups directly into the <code>src/features</code> directory.
          </Text>
          <Group gap="sm" mt="md">
            <RoleGuard allowedRoles={['admin', 'editor']}>
              <Button color="violet" variant="filled">
                Configure Layout
              </Button>
            </RoleGuard>
            <Button variant="outline" color="violet">
              View Boilerplate Docs
            </Button>
          </Group>
        </Stack>
      </Card>
    </div>
  );
}
