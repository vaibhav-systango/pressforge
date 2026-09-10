'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectChangeEvent {
  target: {
    value: string;
    name: string;
  };
}

export interface SelectProps {
  options: (SelectOption | string)[];
  value?: string;
  onChange: (e: SelectChangeEvent) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact' | 'pill';
}

export function Select({
  options,
  value,
  onChange,
  placeholder,
  label,
  error,
  className,
  containerClassName,
  id,
  name,
  disabled = false,
  required = false,
  icon,
  variant = 'default',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to objects
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Find currently selected option
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (val: string) => {
    if (disabled) return;
    setIsOpen(false);

    // Construct a mock change event drop-in compatible with standard onChange handlers
    const mockEvent = {
      target: {
        value: val,
        name: name || '',
      },
    };
    onChange(mockEvent as SelectChangeEvent);
  };

  const hasWidth = containerClassName && /\bw-\S+/.test(containerClassName);

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'px-3 py-1.5 text-xs rounded-lg bg-bg-app border-border-primary';
      case 'pill':
        return 'px-3.5 py-1.5 text-xs rounded-full bg-bg-app border-border-primary font-bold';
      case 'default':
      default:
        return 'px-3.5 py-2.5 text-sm rounded-xl bg-bg-card border-border-primary';
    }
  };

  return (
    <div
      className={cn('flex flex-col gap-1.5', !hasWidth && 'w-full', containerClassName)}
      ref={containerRef}
    >
      {label && (
        <label className="text-xs font-semibold text-text-secondary select-none" htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative w-full">
        {/* Trigger Button */}
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between border text-text-primary focus:border-instagram-pink outline-none transition duration-150 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
            getVariantStyles(),
            isOpen && 'border-instagram-pink ring-1 ring-instagram-pink shadow-xs',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            {icon && <span className="text-text-secondary shrink-0">{icon}</span>}
            {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
            <span className={cn('truncate', !selectedOption && 'text-text-secondary')}>
              {selectedOption ? selectedOption.label : placeholder || 'Select an option'}
            </span>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-text-secondary transition-transform duration-200 shrink-0 ml-1.5',
              isOpen && 'transform rotate-180'
            )}
          />
        </button>

        {/* Dropdown Options List */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-border-primary bg-bg-card shadow-lg max-h-60 overflow-y-auto animate-fade-in py-1 min-w-[140px]">
            {placeholder && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full text-left px-3.5 py-2 text-xs md:text-sm text-text-secondary hover:bg-bg-hover transition duration-100 cursor-pointer"
              >
                {placeholder}
              </button>
            )}
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'w-full flex items-center justify-between text-left px-3.5 py-2 text-xs md:text-sm text-text-primary hover:bg-bg-hover transition duration-100 cursor-pointer',
                    isSelected && 'bg-bg-hover font-semibold text-instagram-pink'
                  )}
                >
                  <div className="flex items-center gap-2 truncate pr-3">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-instagram-pink shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
