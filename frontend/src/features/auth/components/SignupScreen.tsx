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
} from '@mantine/core';
import { useAuth } from '@/providers/AuthProvider';
import { ThemeToggle } from '@/common/layout/ThemeToggle';
import { AUTH } from '@/constants';
import { ROUTES } from '@/routes';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'editor', 'viewer'] as const),
});

type SignupSchema = z.infer<typeof signupSchema>;

export function SignupScreen() {
  const { signup } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: AUTH.SIGNUP.DEFAULT_VALUES,
  });

  const onSubmit = async (values: SignupSchema) => {
    await signup(values.name, values.email, values.role);
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
              {AUTH.SIGNUP.CARD_TITLE}
            </Title>
            <Text c="dimmed" size="sm">
              {AUTH.SIGNUP.ALREADY_ACCOUNT_PROMPT}{' '}
              <Link href={ROUTES.LOGIN} className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                {AUTH.SIGNUP.LOGIN_LINK}
              </Link>
            </Text>
          </Stack>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap="md">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextInput
                    label="Full Name"
                    placeholder="Jane Doe"
                    required
                    error={errors.name?.message}
                    {...field}
                  />
                )}
              />

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
                    placeholder="Choose a password"
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
                {AUTH.SIGNUP.SUBMIT_BTN}
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </div>
  );
}
