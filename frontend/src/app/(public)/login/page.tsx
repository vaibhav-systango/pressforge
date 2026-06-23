'use client';

import React from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Container,
  Card,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Select,
  Button,
  Stack,
  Divider,
  Group,
  useMantineColorScheme,
  ActionIcon,
} from '@mantine/core';
import { useAuth, UserRole } from '@/providers/AuthProvider';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'editor', 'viewer'] as const),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'admin',
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    await login(values.email, values.role);
  };

  const handleQuickLogin = (role: UserRole) => {
    setValue('email', `${role}@pressforge.com`);
    setValue('password', 'password123');
    setValue('role', role);
    handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 dark:bg-zinc-950 transition-colors py-12 px-4 sm:px-6 lg:px-8">
      {/* Corner Theme Toggle */}
      <div className="absolute top-4 right-4">
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
      </div>

      <Container size="xs" className="w-full">
        <Card withBorder padding="xl" radius="md" className="shadow-md bg-white dark:bg-zinc-900">
          <Stack gap="md" className="text-center mb-4">
            <span className="text-2xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              PressForge
            </span>
            <Title order={2} size="h3" className="font-bold">
              Log in to your account
            </Title>
            <Text c="dimmed" size="sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                Sign up
              </Link>
            </Text>
          </Stack>

          {/* Quick Login Section */}
          <Stack gap="xs" className="mb-4">
            <Text fw={600} size="xs" c="dimmed" className="text-center uppercase tracking-wider">
              Quick Role Shortcuts
            </Text>
            <Group grow gap="xs">
              <Button onClick={() => handleQuickLogin('admin')} variant="light" color="red" size="xs">
                Admin
              </Button>
              <Button onClick={() => handleQuickLogin('editor')} variant="light" color="blue" size="xs">
                Editor
              </Button>
              <Button onClick={() => handleQuickLogin('viewer')} variant="light" color="gray" size="xs">
                Viewer
              </Button>
            </Group>
          </Stack>

          <Divider label="Or enter credentials" labelPosition="center" className="my-4" />

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap="md">
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextInput
                    label="Email address"
                    placeholder="you@example.com"
                    required
                    error={errors.email?.message}
                    {...field}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    required
                    error={errors.password?.message}
                    {...field}
                  />
                )}
              />

              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    label="System Role"
                    data={[
                      { value: 'admin', label: 'Administrator (Full Edit/Create)' },
                      { value: 'editor', label: 'Editor (Modify simulation only)' },
                      { value: 'viewer', label: 'Viewer (Read-only)' },
                    ]}
                    required
                    {...field}
                  />
                )}
              />

              <Button type="submit" color="violet" fullWidth mt="md" loading={isSubmitting}>
                Sign In
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </div>
  );
}
