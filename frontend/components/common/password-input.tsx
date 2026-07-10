'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export function PasswordInput({
  label,
  error,
  leftIcon,
  className,
  id,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-text-secondary" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-text-secondary">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'w-full border border-border-primary bg-bg-app text-text-primary rounded-xl py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150',
            leftIcon ? 'pl-10' : 'pl-3.5',
            'pr-10',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none flex items-center justify-center cursor-pointer"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
