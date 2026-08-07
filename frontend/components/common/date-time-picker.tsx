'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DateTimePickerProps {
  value?: string; // ISO string format: YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  align?: 'left' | 'right' | 'auto';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MINUTE_OPTIONS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date & time',
  className,
  disabled = false,
  required = false,
  error,
  align = 'auto',
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverAlign, setPopoverAlign] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto calculate popover alignment to prevent clipping off screen edges
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (align === 'right') {
        setPopoverAlign('right');
      } else if (align === 'left') {
        setPopoverAlign('left');
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const popoverWidth = 480;
        // If placing left-aligned extends beyond viewport right edge (or in right half), align right
        if (rect.left + popoverWidth > window.innerWidth - 20 || rect.left > window.innerWidth / 2) {
          setPopoverAlign('right');
        } else {
          setPopoverAlign('left');
        }
      }
    }
  }, [isOpen, align]);

  // Parse current selected date or fallback to now
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Calendar view state (year & month being viewed)
  const [viewYear, setViewYear] = useState<number>(() => {
    return selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return selectedDate ? selectedDate.getMonth() : new Date().getMonth();
  });

  // Time state (12h format internally for intuitive UI)
  const [hour12, setHour12] = useState<number>(() => {
    if (!selectedDate) return 9;
    const h = selectedDate.getHours();
    if (h === 0) return 12;
    if (h > 12) return h - 12;
    return h;
  });

  const [minute, setMinute] = useState<string>(() => {
    if (!selectedDate) return '00';
    const m = selectedDate.getMinutes();
    return m < 10 ? `0${m}` : `${Math.floor(m / 5) * 5}`.padStart(2, '0');
  });

  const [ampm, setAmpm] = useState<'AM' | 'PM'>(() => {
    if (!selectedDate) return 'AM';
    return selectedDate.getHours() >= 12 ? 'PM' : 'AM';
  });

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
      
      const h = selectedDate.getHours();
      setHour12(h === 0 ? 12 : h > 12 ? h - 12 : h);
      setAmpm(h >= 12 ? 'PM' : 'AM');
      const m = selectedDate.getMinutes();
      setMinute(m < 10 ? `0${m}` : `${m}`.padStart(2, '0'));
    }
  }, [selectedDate]);

  // Close popup on click outside
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

  // Format ISO output string (YYYY-MM-DDTHH:mm)
  const formatISO = (year: number, month: number, day: number, h12: number, minStr: string, period: 'AM' | 'PM') => {
    let h24 = h12;
    if (period === 'PM' && h12 < 12) h24 += 12;
    if (period === 'AM' && h12 === 12) h24 = 0;

    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const hh = String(h24).padStart(2, '0');
    const mm = String(parseInt(minStr, 10) || 0).padStart(2, '0');

    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  const handleDaySelect = (day: number) => {
    const iso = formatISO(viewYear, viewMonth, day, hour12, minute, ampm);
    onChange(iso);
  };

  const handleTimeChange = (newHour: number, newMin: string, newAmpm: 'AM' | 'PM') => {
    setHour12(newHour);
    setMinute(newMin);
    setAmpm(newAmpm);

    if (selectedDate) {
      const day = selectedDate.getDate();
      const iso = formatISO(selectedDate.getFullYear(), selectedDate.getMonth(), day, newHour, newMin, newAmpm);
      onChange(iso);
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Quick Preset Handlers
  const applyPreset = (preset: 'now' | 'today_9am' | 'tomorrow_9am' | 'in_1h' | 'next_monday_9am') => {
    const now = new Date();
    let target = new Date();

    if (preset === 'now') {
      target = now;
    } else if (preset === 'today_9am') {
      target.setHours(9, 0, 0, 0);
    } else if (preset === 'tomorrow_9am') {
      target.setDate(now.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else if (preset === 'in_1h') {
      target.setHours(now.getHours() + 1);
    } else if (preset === 'next_monday_9am') {
      const day = now.getDay();
      const diff = (8 - (day === 0 ? 7 : day)) % 7 || 7;
      target.setDate(now.getDate() + diff);
      target.setHours(9, 0, 0, 0);
    }

    const y = target.getFullYear();
    const m = target.getMonth();
    const d = target.getDate();
    const h = target.getHours();
    const minVal = target.getMinutes();

    const roundedMin = `${Math.floor(minVal / 5) * 5}`.padStart(2, '0');
    const h12Val = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampmVal = h >= 12 ? 'PM' : 'AM';

    setViewYear(y);
    setViewMonth(m);
    setHour12(h12Val);
    setMinute(roundedMin);
    setAmpm(ampmVal);

    const iso = formatISO(y, m, d, h12Val, roundedMin, ampmVal);
    onChange(iso);
  };

  // Calculate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 is Mon
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPrevMonth: true });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true, isPrevMonth: false });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      days.push({ day: n, isCurrentMonth: false, isPrevMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Display label formatting
  const displayFormatted = useMemo(() => {
    if (!selectedDate) return null;
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = selectedDate.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = selectedDate.getDate();
    const year = selectedDate.getFullYear();
    const timeStr = selectedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return `${dayName}, ${monthName} ${dayNum}, ${year} at ${timeStr}`;
  }, [selectedDate]);

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const isSelectedDay = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      {label && (
        <label className="text-[10px] text-text-secondary font-bold uppercase block tracking-wider">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs outline-none transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group hover:border-instagram-pink/60",
          isOpen && "border-instagram-pink shadow-[0_0_0_1px_var(--color-instagram-pink)] ring-2 ring-instagram-pink/20",
          className
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <CalendarIcon className={cn("w-4 h-4 shrink-0 transition-colors", selectedDate ? "text-instagram-pink" : "text-text-secondary group-hover:text-instagram-pink")} />
          <span className={cn("truncate font-medium", !selectedDate && "text-text-secondary")}>
            {displayFormatted || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selectedDate && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 hover:bg-bg-hover rounded-full text-text-secondary hover:text-red-500 transition cursor-pointer"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <Clock className="w-3.5 h-3.5 text-text-secondary group-hover:text-instagram-pink transition" />
        </div>
      </button>

      {/* Custom Date & Time Picker Popover */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 top-full mt-2 w-[320px] sm:w-[480px] max-w-[calc(100vw-2rem)] bg-bg-card border border-border-primary rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 text-text-primary",
            popoverAlign === 'right' ? 'right-0' : 'left-0'
          )}
        >
          
          {/* Quick Presets Bar */}
          <div className="bg-bg-app/50 border-b border-border-primary p-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold uppercase text-text-secondary flex items-center gap-1 shrink-0 px-1">
              <Sparkles className="w-3 h-3 text-instagram-pink" />
              Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('now')}
              className="px-2.5 py-1 text-[11px] font-medium bg-bg-card hover:bg-instagram-pink hover:text-white border border-border-primary rounded-lg transition shrink-0 cursor-pointer"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => applyPreset('today_9am')}
              className="px-2.5 py-1 text-[11px] font-medium bg-bg-card hover:bg-instagram-pink hover:text-white border border-border-primary rounded-lg transition shrink-0 cursor-pointer"
            >
              Today 9 AM
            </button>
            <button
              type="button"
              onClick={() => applyPreset('tomorrow_9am')}
              className="px-2.5 py-1 text-[11px] font-medium bg-bg-card hover:bg-instagram-pink hover:text-white border border-border-primary rounded-lg transition shrink-0 cursor-pointer"
            >
              Tomorrow 9 AM
            </button>
            <button
              type="button"
              onClick={() => applyPreset('in_1h')}
              className="px-2.5 py-1 text-[11px] font-medium bg-bg-card hover:bg-instagram-pink hover:text-white border border-border-primary rounded-lg transition shrink-0 cursor-pointer"
            >
              +1 Hour
            </button>
            <button
              type="button"
              onClick={() => applyPreset('next_monday_9am')}
              className="px-2.5 py-1 text-[11px] font-medium bg-bg-card hover:bg-instagram-pink hover:text-white border border-border-primary rounded-lg transition shrink-0 cursor-pointer"
            >
              Next Mon 9 AM
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-border-primary">
            
            {/* Left: Calendar View (7 cols on sm) */}
            <div className="sm:col-span-7 p-3.5 flex flex-col justify-between">
              
              {/* Calendar Navigation Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-text-primary">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg border border-border-primary hover:bg-bg-hover text-text-primary transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg border border-border-primary hover:bg-bg-hover text-text-primary transition cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAYS_OF_WEEK.map((d) => (
                  <span key={d} className="text-[10px] font-bold text-text-secondary uppercase">
                    {d}
                  </span>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  if (!item.isCurrentMonth) {
                    return (
                      <div
                        key={idx}
                        className="h-8 flex items-center justify-center text-[11px] text-text-secondary/30 pointer-events-none"
                      >
                        {item.day}
                      </div>
                    );
                  }

                  const selected = isSelectedDay(item.day);
                  const today = isToday(item.day);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDaySelect(item.day)}
                      className={cn(
                        "h-8 rounded-xl text-xs font-medium transition-all duration-150 flex items-center justify-center cursor-pointer relative",
                        selected
                          ? "bg-instagram-pink text-white font-bold shadow-md shadow-instagram-pink/20 scale-105"
                          : "hover:bg-bg-hover text-text-primary",
                        today && !selected && "border border-instagram-pink/60 font-bold text-instagram-pink"
                      )}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Time Selector (5 cols on sm) */}
            <div className="sm:col-span-5 p-3.5 flex flex-col justify-between bg-bg-app/30">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-instagram-pink" />
                    Set Time
                  </span>
                  
                  {/* AM/PM Toggle */}
                  <div className="flex items-center p-0.5 bg-bg-app border border-border-primary rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleTimeChange(hour12, minute, 'AM')}
                      className={cn(
                        "px-2 py-0.5 rounded-md transition cursor-pointer",
                        ampm === 'AM' ? "bg-instagram-pink text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTimeChange(hour12, minute, 'PM')}
                      className={cn(
                        "px-2 py-0.5 rounded-md transition cursor-pointer",
                        ampm === 'PM' ? "bg-instagram-pink text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      PM
                    </button>
                  </div>
                </div>

                {/* Hour Select Grid */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">Hour</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleTimeChange(h, minute, ampm)}
                        className={cn(
                          "py-1 rounded-lg text-xs font-medium transition cursor-pointer border",
                          hour12 === h
                            ? "bg-instagram-pink text-white font-bold border-instagram-pink"
                            : "border-border-primary bg-bg-card text-text-primary hover:bg-bg-hover"
                        )}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minute Select Grid */}
                <div className="space-y-2 mt-3">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">Minute</span>
                  <div className="grid grid-cols-4 gap-1">
                    {MINUTE_OPTIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleTimeChange(hour12, m, ampm)}
                        className={cn(
                          "py-1 rounded-lg text-xs font-medium transition cursor-pointer border",
                          minute === m
                            ? "bg-instagram-pink text-white font-bold border-instagram-pink"
                            : "border-border-primary bg-bg-card text-text-primary hover:bg-bg-hover"
                        )}
                      >
                        :{m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="bg-bg-app border-t border-border-primary px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div className="text-[11px] text-text-secondary truncate">
              {selectedDate ? (
                <span className="font-semibold text-text-primary">{displayFormatted}</span>
              ) : (
                <span>No date selected</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-red-500 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-bold bg-instagram-pink text-white rounded-xl shadow hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
