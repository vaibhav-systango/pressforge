import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label className="text-xs font-semibold text-text-secondary" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={cn(
          'border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150',
          className,
        )}
        {...props}
      />
    </div>
  );
}
