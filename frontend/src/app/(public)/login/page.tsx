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
} from '@mantine/core';
import { useAuth, UserRole } from '@/providers/AuthProvider';
import { ThemeToggle } from '@/common/layout/ThemeToggle';
import { AUTH } from '@/constants';
import { ROUTES } from '@/routes';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'editor', 'viewer'] as const),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: AUTH.LOGIN.DEFAULT_VALUES,
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
        <ThemeToggle className="border border-border/40" />
      </div>

      <Container size="xs" className="w-full">
        <Card withBorder padding="xl" radius="md" className="shadow-md bg-white dark:bg-zinc-900">
          <Stack gap="md" className="text-center mb-4">
            <span className="text-2xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {AUTH.BRAND_NAME}
            </span>
            <Title order={2} size="h3" className="font-bold">
              {AUTH.LOGIN.CARD_TITLE}
            </Title>
            <Text c="dimmed" size="sm">
              {AUTH.LOGIN.NO_ACCOUNT_PROMPT}{' '}
              <Link href={ROUTES.SIGNUP} className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                {AUTH.LOGIN.SIGNUP_LINK}
              </Link>
            </Text>
          </Stack>

          {/* Quick Login Section */}
          <Stack gap="xs" className="mb-4">
            <Text fw={600} size="xs" c="dimmed" className="text-center uppercase tracking-wider">
              {AUTH.LOGIN.SHORTCUTS_LABEL}
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

          <Divider label={AUTH.LOGIN.DIVIDER_LABEL} labelPosition="center" className="my-4" />

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
                    data={AUTH.ROLE_OPTIONS}
                    required
                    {...field}
                  />
                )}
              />

              <Button type="submit" color="violet" fullWidth mt="md" loading={isSubmitting}>
                {AUTH.LOGIN.SUBMIT_BTN}
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </div>
  );
}
