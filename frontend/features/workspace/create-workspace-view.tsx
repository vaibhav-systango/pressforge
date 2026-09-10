'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Building, CheckCircle2 } from 'lucide-react';
import { notifications } from '@mantine/notifications';

import { useAppState } from '@/lib/queries/use-app-state';

export function CreateWorkspaceView() {
  const { addWorkspace, setActiveWorkspace } = useAppState();

  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await addWorkspace({
        id: '',
        name: name.trim(),
        website: website.trim() || undefined,
        tone: 'casual',
        keywords: [],
        rules: [],
        schedules: [],
      });

      const workspace = result.workspace;
      await setActiveWorkspace(workspace.id);
      setCreatedName(workspace.name);
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to create workspace. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdName) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 px-6">
        <div className="max-w-md w-full mx-auto bg-white border border-[#EFEFEF] rounded-2xl p-8 shadow-sm text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#262626]">Workspace Created</h1>
          <p className="text-slate-500 mt-2">
            <span className="font-semibold text-[#262626]">{createdName}</span> is ready. Create a
            free account to save it permanently and continue setup.
          </p>
          <div className="flex flex-col gap-3 mt-8">
            <Link
              href="/auth/signup"
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-[#737373] hover:text-[#262626] font-medium"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <header className="bg-white border-b border-[#EFEFEF]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#262626]">
            PRESSFORGE<span className="text-instagram-pink">.AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-semibold text-[#737373] hover:text-[#262626]">
              Log In
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-semibold bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white px-4 py-2 rounded-full"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center py-12 px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-50 text-instagram-pink mb-4">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#262626]">
            Create New Workspace
          </h1>
          <p className="text-slate-500 mt-2 max-w-lg mx-auto">
            Set up your brand workspace in seconds. No account required — sign up later to save your
            progress.
          </p>
        </div>

        <div className="max-w-md w-full mx-auto bg-white border border-[#EFEFEF] rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#737373]" htmlFor="brand-name">
                Brand / Workspace Name
              </label>
              <input
                id="brand-name"
                type="text"
                required
                placeholder="e.g. Acme Clothing Co"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#E1306C] outline-none transition duration-150"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#737373]" htmlFor="website">
                Website URL <span className="font-normal">(optional)</span>
              </label>
              <input
                id="website"
                type="url"
                placeholder="https://yourbrand.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#E1306C] outline-none transition duration-150"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Creating...' : 'Create Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
