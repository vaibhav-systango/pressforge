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
  ThemeIcon,
} from '@mantine/core';
import { useAuth } from '@/providers/AuthProvider';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ThemeToggle } from '@/common/layout/ThemeToggle';
import { AUTH, DASHBOARD } from '@/constants';

export function DashboardScreen() {
  const { user, logout } = useAuth();

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-zinc-800 pb-6 mb-8">
        <div>
          <Title order={1} className="text-3xl font-extrabold tracking-tight">
            {DASHBOARD.TITLE}
          </Title>
          <Text c="dimmed" size="sm" mt="xs">
            {DASHBOARD.SUBTITLE}
          </Text>
        </div>
        <Group>
          {user && (
            <div className="text-right mr-2 hidden md:block">
              <Text size="sm" fw={600}>
                {user.name}
              </Text>
              <Text size="xs" c="dimmed" className="capitalize">
                {user.role}{AUTH.DASHBOARD_ROLE_SUFFIX}
              </Text>
            </div>
          )}
          <ThemeToggle data-testid="btn-toggle-theme" />
          <Button onClick={logout} variant="outline" color="red" size="md" data-testid="btn-logout">
            {AUTH.LOGOUT_BTN_TEXT}
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
            {DASHBOARD.WELCOME_BADGE}
          </Badge>
          <Title order={2} className="text-3xl font-black tracking-tight">
            {DASHBOARD.WELCOME_PREFIX}{user?.name || DASHBOARD.WELCOME_FALLBACK_USER}!
          </Title>
          <Text className="text-indigo-200 text-base max-w-2xl">
            {DASHBOARD.WELCOME_DESC}
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
                {DASHBOARD.BOILERPLATE.TITLE}
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              {DASHBOARD.BOILERPLATE.DESC}
            </Text>
            <Stack gap="xs">
              {DASHBOARD.BOILERPLATE.ITEMS.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✔</span>
                  <Text size="sm">
                    <strong>{item.term}</strong> {item.detail}
                  </Text>
                </div>
              ))}
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
                {DASHBOARD.RBAC.TITLE}
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              {DASHBOARD.RBAC.DESC}
            </Text>
            <Stack gap="xs">
              {DASHBOARD.RBAC.ITEMS.map((item, idx) => (
                <Group key={idx} justify="space-between" align="center" className={`${idx < DASHBOARD.RBAC.ITEMS.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800 pb-2' : 'pb-1'}`}>
                  <Text size="sm" fw={600}>{item.role}</Text>
                  <Badge color={item.color} variant="light">{item.badge}</Badge>
                </Group>
              ))}
            </Stack>

            {/* Dynamic RBAC Guard Demo */}
            <div className="mt-2 p-3 bg-slate-50 dark:bg-zinc-950 rounded-md border border-slate-100 dark:border-zinc-800">
              <Text size="xs" fw={700} c="violet" className="uppercase tracking-wider mb-2">
                {DASHBOARD.DYNAMIC_GUARD.TITLE}
              </Text>
              <RoleGuard allowedRoles={['admin']}>
                <Text size="xs" c="green" fw={500}>
                  {DASHBOARD.DYNAMIC_GUARD.ADMIN_MSG}
                </Text>
              </RoleGuard>
              <RoleGuard allowedRoles={['editor']}>
                <Text size="xs" c="blue" fw={500}>
                  {DASHBOARD.DYNAMIC_GUARD.EDITOR_MSG}
                </Text>
              </RoleGuard>
              <RoleGuard allowedRoles={['viewer']}>
                <Text size="xs" c="gray" fw={500}>
                  {DASHBOARD.DYNAMIC_GUARD.VIEWER_MSG}
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
            {DASHBOARD.CANVAS.TITLE}
          </Text>
          <Text c="dimmed" size="sm">
            {DASHBOARD.CANVAS.DESC}
          </Text>
          <Group gap="sm" mt="md">
            <RoleGuard allowedRoles={['admin', 'editor']}>
              <Button color="violet" variant="filled">
                {DASHBOARD.CANVAS.CONFIG_BTN}
              </Button>
            </RoleGuard>
            <Button variant="outline" color="violet">
              {DASHBOARD.CANVAS.DOCS_BTN}
            </Button>
          </Group>
        </Stack>
      </Card>
    </div>
  );
}
