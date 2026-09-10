'use client';

import { useAppState } from '@/lib/queries/use-app-state';
import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
}

export function OnboardingStepper({ currentStep }: StepperProps) {
  const { state } = useAppState();

  const steps =
    state.accountType === 'individual'
      ? [
          { number: 1, label: 'Profile', sublabel: 'Tell us about your brand' },
          { number: 2, label: 'Workspace', sublabel: 'Create your home base' },
          { number: 3, label: 'Voice', sublabel: 'Shape your tone' },
          { number: 4, label: 'KYC', sublabel: 'Verify your account' },
        ]
      : [
          { number: 1, label: 'Organization', sublabel: 'Set team details' },
          { number: 2, label: 'KYC', sublabel: 'Verify your account' },
        ];

  return (
    <div className="w-full max-w-3xl mx-auto mb-10 px-4">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#F58529] to-[#DD2A7B] transition-all duration-500 z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <div
              key={step.number}
              className="relative z-10 flex flex-col items-center gap-2 min-w-0 flex-1"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition duration-300 font-semibold text-sm shadow-sm ${
                  isCompleted
                    ? 'bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white'
                    : isActive
                      ? 'bg-white border-2 border-instagram-pink text-instagram-pink ring-4 ring-pink-50'
                      : 'bg-white border border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <div className="flex flex-col items-center text-center">
                <span
                  className={`text-[11px] font-semibold hidden sm:inline ${
                    isActive
                      ? 'text-instagram-pink'
                      : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">{step.sublabel}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs font-semibold text-instagram-pink mt-3 sm:hidden">
        Step {currentStep} of {steps.length}: {steps.find((s) => s.number === currentStep)?.label}
      </p>
    </div>
  );
}
