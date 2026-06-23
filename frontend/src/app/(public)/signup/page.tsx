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
  useMantineColorScheme,
  ActionIcon,
} from '@mantine/core';
import { useAuth } from '@/providers/AuthProvider';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'editor', 'viewer'] as const),
});

type SignupSchema = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'admin',
    },
  });

  const onSubmit = async (values: SignupSchema) => {
    await signup(values.name, values.email, values.role);
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
              Create a new account
            </Title>
            <Text c="dimmed" size="sm">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                Log in
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
                Sign Up
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </div>
  );
}
