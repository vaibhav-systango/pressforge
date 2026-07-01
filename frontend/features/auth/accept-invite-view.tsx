'use client';

import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { Mail, Lock, Building, Check, ArrowRight, Sparkles, User, ShieldAlert } from 'lucide-react';

export function AcceptInviteView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') || '';
  const password = searchParams.get('password') || '';
  const workspaceId = searchParams.get('workspaceId') || '';

  const assignedWorkspace = workspaceId
    ? { id: workspaceId, name: workspaceId === 'acme-brand' ? 'Acme Brand' : workspaceId === 'ecolife' ? 'EcoLife Co' : 'Your Brand', website: 'https://example.com' }
    : { id: '', name: 'Your Brand', website: 'https://example.com' };

  const handleProceed = () => {
    // Redirect to login page with parameters so the login page can prefill them
    router.push(`/auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
  };

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-[500px] bg-bg-card border border-border-primary rounded-3xl p-8 shadow-lg flex flex-col gap-6 relative overflow-hidden transition-colors duration-200">
        
        {/* Visual background accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F58529]/10 to-[#DD2A7B]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-[#515BD4]/10 to-[#DD2A7B]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center relative z-10 space-y-2">
          <div className="inline-flex p-3 rounded-full bg-pink-50 dark:bg-pink-950/20 text-instagram-pink border border-pink-100 dark:border-pink-900/30 mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Invitation Accepted!
          </h1>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            You've been invited to review and collaborate on content campaigns.
          </p>
        </div>

        {/* Organization / Workspace details */}
        <div className="bg-bg-app border border-border-primary rounded-2xl p-4.5 space-y-3 relative z-10">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Assigned Workspace</span>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white font-extrabold text-base shadow-sm">
              {assignedWorkspace?.name?.charAt(0) || 'W'}
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{assignedWorkspace?.name || 'Your Brand'}</p>
              <a 
                href={assignedWorkspace?.website} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-instagram-pink font-semibold hover:underline flex items-center gap-1 mt-0.5"
              >
                {assignedWorkspace?.website || 'https://website.com'}
              </a>
            </div>
          </div>
          
          <div className="border-t border-dashed border-border-primary pt-3 mt-1.5 flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-xs text-text-secondary">
              Organization: <span className="font-semibold text-text-primary">Forge Agencies</span>
            </span>
          </div>
        </div>

        {/* Credentials Box */}
        <div className="border border-border-primary rounded-2xl p-5 bg-bg-app/40 space-y-4 relative z-10">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">Your Portal Login Details</h3>
            <p className="text-[11px] text-text-secondary mt-0.5">Please save these credentials to access your client dashboard.</p>
          </div>

          <div className="space-y-2.5">
            {/* Email field */}
            <div className="flex items-center justify-between bg-bg-card border border-border-primary rounded-xl px-3.5 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail className="w-4 h-4 text-text-secondary shrink-0" />
                <span className="text-xs text-text-primary font-medium truncate">{email}</span>
              </div>
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-text-secondary px-1.5 py-0.5 rounded font-bold uppercase">Username</span>
            </div>

            {/* Password field */}
            <div className="flex items-center justify-between bg-bg-card border border-border-primary rounded-xl px-3.5 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Lock className="w-4 h-4 text-text-secondary shrink-0" />
                <span className="text-xs font-mono font-semibold text-instagram-pink select-all">{password}</span>
              </div>
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-text-secondary px-1.5 py-0.5 rounded font-bold uppercase">Password</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[10px] text-text-secondary leading-relaxed bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <span>
              This is a secure, limited-access client portal. You will only have permissions related to <strong>{assignedWorkspace?.name}</strong>.
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleProceed}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3.5 rounded-full text-sm font-bold hover:opacity-95 transition shadow-md relative z-10 cursor-pointer"
        >
          <span>Acknowledge & Proceed to Login</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}

