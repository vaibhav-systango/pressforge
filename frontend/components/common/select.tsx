'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
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
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to objects
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Find currently selected option
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (val: string) => {
    if (disabled) return;
    setIsOpen(false);
    
    // Construct a mock change event so that it is drop-in compatible with standard onChange handlers
    const mockEvent = {
      target: {
        value: val,
        name: name || '',
      },
    };
    onChange(mockEvent as SelectChangeEvent);
  };

  const hasWidth = containerClassName && /\bw-\S+/.test(containerClassName);

  return (
    <div className={cn("flex flex-col gap-1.5", !hasWidth && "w-full", containerClassName)} ref={containerRef}>
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
            "w-full flex items-center justify-between border border-border-primary bg-bg-card text-text-primary rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            isOpen && "border-instagram-pink shadow-[0_0_0_1px_var(--color-instagram-pink)]",
            className
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-text-secondary")}>
            {selectedOption ? selectedOption.label : (placeholder || 'Select an option')}
          </span>
          <ChevronDown className={cn("w-4 h-4 text-text-secondary transition-transform duration-200 shrink-0 ml-2", isOpen && "transform rotate-180")} />
        </button>

        {/* Dropdown Options List */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-border-primary bg-bg-card shadow-lg max-h-60 overflow-y-auto animate-fade-in py-1">
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
                    "w-full flex items-center justify-between text-left px-3.5 py-2 text-xs md:text-sm text-text-primary hover:bg-bg-hover transition duration-100 cursor-pointer",
                    isSelected && "bg-bg-hover font-semibold text-instagram-pink"
                  )}
                >
                  <span className="truncate pr-4">{opt.label}</span>
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
