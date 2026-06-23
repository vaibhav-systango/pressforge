'use client';

import React from 'react';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Card,
  Badge,
  useMantineColorScheme,
  ActionIcon,
} from '@mantine/core';

export default function LandingPage() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-50">
        <Container size="lg" className="h-16 flex items-center justify-between">
          <Group gap="xs">
            <span className="text-2xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              PressForge
            </span>
          </Group>
          <Group gap="md">
            <ActionIcon
              variant="default"
              onClick={() => setColorScheme(dark ? 'light' : 'dark')}
              size="lg"
              aria-label="Toggle color scheme"
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
            <Button component={Link} href="/login" variant="subtle" color="violet">
              Log In
            </Button>
            <Button component={Link} href="/signup" color="violet">
              Sign Up
            </Button>
          </Group>
        </Container>
      </header>

      {/* Hero Section */}
      <Container size="lg" className="py-20 md:py-32">
        <Stack align="center" gap="xl" className="text-center max-w-3xl mx-auto">
          <Badge color="violet" size="lg" variant="dot">
            Next-Gen Brand Operations
          </Badge>
          <Title order={1} className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Deploy, Automate & Monitor{' '}
            <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Your Entire Brand Assets
            </span>
          </Title>
          <Text c="dimmed" className="text-lg md:text-xl">
            PressForge is the centralized workspace orchestration suite tailored for agencies and modern marketing
            teams. Execute project delivery sprints, audit budgets, and analyze team allocations.
          </Text>
          <Group gap="md">
            <Button component={Link} href="/signup" size="lg" color="violet">
              Start Free Trial
            </Button>
            <Button component={Link} href="/login" size="lg" variant="outline" color="violet">
              Access Dashboard
            </Button>
          </Group>
        </Stack>
      </Container>

      {/* Features Grid */}
      <Container size="lg" className="pb-24">
        <div className="text-center mb-16">
          <Title order={2} className="text-3xl font-bold">
            Features Built For Growth
          </Title>
          <Text c="dimmed" mt="xs">
            Centralize your teams, campaigns, and metrics under one dashboard.
          </Text>
        </div>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          <Card withBorder padding="xl" radius="md">
            <Stack gap="md">
              <span className="text-3xl">🚀</span>
              <Title order={3} size="h4">
                Workspace Operations
              </Title>
              <Text size="sm" c="dimmed">
                Create campaigns and organize brand assets seamlessly with zero configuration overhead.
              </Text>
            </Stack>
          </Card>
          <Card withBorder padding="xl" radius="md">
            <Stack gap="md">
              <span className="text-3xl">🛡️</span>
              <Title order={3} size="h4">
                Granular RBAC Guard
              </Title>
              <Text size="sm" c="dimmed">
                Control write, edit, and simulation access using roles like Administrators, Editors, and Viewers.
              </Text>
            </Stack>
          </Card>
          <Card withBorder padding="xl" radius="md">
            <Stack gap="md">
              <span className="text-3xl">📊</span>
              <Title order={3} size="h4">
                Budget Visualizers
              </Title>
              <Text size="sm" c="dimmed">
                Analyze and audit live campaign budgets, preventing cost overruns automatically.
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>
      </Container>
    </div>
  );
}
