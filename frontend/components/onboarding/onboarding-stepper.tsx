'use client';

import { useAppState } from '@/lib/queries/use-app-state';
import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
}

export function OnboardingStepper({ currentStep }: StepperProps) {
  const { state } = useAppState();

  const steps = state.accountType === 'individual' ? [
    { number: 1, label: 'Account & Insta' },
    { number: 2, label: 'Workspace' },
    { number: 3, label: 'Brand Voice' },
    { number: 4, label: 'KYC' }
  ] : [
    { number: 1, label: 'Organization' },
    { number: 2, label: 'KYC' }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mb-10 px-4">
      <div className="relative flex items-center justify-between">
        {/* Progress Bar Background */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0"></div>
        {/* Active Progress Bar */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#F58529] to-[#DD2A7B] transition-all duration-500 z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <div key={step.number} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition duration-300 font-semibold text-sm ${
                  isCompleted
                    ? 'bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white shadow-sm'
                    : isActive
                    ? 'bg-white border-2 border-instagram-pink text-instagram-pink ring-4 ring-pink-50'
                    : 'bg-white border border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  isActive
                    ? 'text-instagram-pink'
                    : isCompleted
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

