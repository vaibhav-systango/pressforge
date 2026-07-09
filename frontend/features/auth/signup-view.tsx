'use client';

import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { ErrorMessage } from '@/components/common/error-message';
import { getPostAuthRedirect } from '@/lib/auth/redirect';
import { useSignupMutation } from '@/lib/hooks/mutations/use-auth';
import { ApiError } from '@/lib/utils/api-errors';

export function SignupView() {
  const router = useRouter();
  const signupMutation = useSignupMutation();
  const [formError, setFormError] = useState('');

  const form = useForm({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      terms: false,
    },
    validate: {
      fullName: (value) => {
        if (!value.trim()) return 'Full name is required';
        if (value.length > 100) return 'Full name must be 100 characters or less';
        return null;
      },
      email: (value) => {
        if (!value.trim()) return 'Email is required';
        return /^\S+@\S+\.\S+$/.test(value) ? null : 'Enter a valid email address';
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (value.length > 30) return 'Password must be 30 characters or less';
        return null;
      },
      terms: (value) => (value ? null : 'You must agree to the terms'),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setFormError('');
    try {
      const result = await signupMutation.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      router.replace(getPostAuthRedirect(result.user));
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError('Unable to create account. Please try again.', 500, 'UNKNOWN');
      setFormError(apiError.message);
      notifications.show({
        title: 'Signup failed',
        message: apiError.message,
        color: 'red',
      });
    }
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white border border-[#EFEFEF] rounded-2xl p-8 shadow-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#262626] flex items-center justify-center gap-1">
            PRESSFORGE<span className="text-instagram-pink font-extrabold">.AI</span>
          </h1>
          <p className="text-[#737373] text-sm mt-2">
            Create an account to start automating your PR & social media.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ErrorMessage message={formError} />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#737373]" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Jane Doe"
              {...form.getInputProps('fullName')}
              className="border border-[#EFEFEF] bg-[#FAFAFA] text-[#262626] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
            />
            {form.errors.fullName ? (
              <p className="text-[11px] text-red-500 font-medium">{form.errors.fullName}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#737373]" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="jane@example.com"
              {...form.getInputProps('email')}
              className="border border-[#EFEFEF] bg-[#FAFAFA] text-[#262626] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
            />
            {form.errors.email ? (
              <p className="text-[11px] text-red-500 font-medium">{form.errors.email}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#737373]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.getInputProps('password')}
              className="border border-[#EFEFEF] bg-[#FAFAFA] text-[#262626] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
            />
            {form.errors.password ? (
              <p className="text-[11px] text-red-500 font-medium">{form.errors.password}</p>
            ) : null}
          </div>

          <label className="flex items-start gap-2 text-xs text-[#737373] cursor-pointer">
            <input
              type="checkbox"
              {...form.getInputProps('terms', { type: 'checkbox' })}
              className="mt-0.5"
            />
            <span>I agree to the Terms of Service and Privacy Policy.</span>
          </label>
          {form.errors.terms ? (
            <p className="text-[11px] text-red-500 font-medium -mt-2">{form.errors.terms}</p>
          ) : null}

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm mt-3 cursor-pointer disabled:opacity-60"
          >
            <span>{signupMutation.isPending ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-[#EFEFEF] pt-4 text-center">
          <p className="text-xs text-[#737373]">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-instagram-pink font-semibold hover:underline">
              Log In
            </Link>
          </p>
        </div>


      </div>
    </div>
  );
}
