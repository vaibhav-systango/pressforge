'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

import { useSignupMutation } from '@/lib/queries/use-app-state';

export function SignupView() {
  const router = useRouter();
  const signupMutation = useSignupMutation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    terms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill out all required fields.');
      return;
    }

    await signupMutation.mutateAsync({
      email: formData.email,
      password: formData.password,
      name: formData.name,
    });
    router.replace('/onboarding/organization');
  };

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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#737373]" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder="Jane Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border border-[#EFEFEF] bg-[#FAFAFA] text-[#262626] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#737373]" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="jane@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border border-[#EFEFEF] bg-[#FAFAFA] text-[#262626] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#737373]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="border border-[#EFEFEF] bg-[#FAFAFA] text-[#262626] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-[#737373] cursor-pointer">
            <input
              type="checkbox"
              checked={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
              className="mt-0.5"
              required
            />
            <span>I agree to the Terms of Service and Privacy Policy.</span>
          </label>

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

        <div className="bg-[#FAFAFA] border border-[#EFEFEF] rounded-xl p-3.5 text-left">
          <p className="text-[11px] font-semibold text-[#737373] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-instagram-pink" /> Demo Mode
          </p>
          <p className="text-[10px] text-[#737373] mt-1">
            Signup issues a session cookie and starts the onboarding flow via API.
          </p>
        </div>
      </div>
    </div>
  );
}
