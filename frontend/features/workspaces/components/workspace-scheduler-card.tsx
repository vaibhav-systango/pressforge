'use client';

import React from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { DateTimePicker } from '@/components/common/date-time-picker';
import { Select } from '@/components/common/select';
import type { Workspace } from '@/lib/types';

interface WorkspaceSchedulerCardProps {
  currentWorkspace: Workspace;
  scheduleError: string | null;
  newScheduleLabel: string;
  setNewScheduleLabel: (val: string) => void;
  newScheduleDatetime: string;
  setNewScheduleDatetime: (val: string) => void;
  newScheduleRecurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  setNewScheduleRecurrence: (val: 'none' | 'daily' | 'weekly' | 'monthly') => void;
  newSchedulePublishDraft: boolean;
  setNewSchedulePublishDraft: (val: boolean) => void;
  isAddingSchedule: boolean;
  onAddSchedule: () => void;
  onDeleteClick: (id: string) => void;
}

export function WorkspaceSchedulerCard({
  currentWorkspace,
  scheduleError,
  newScheduleLabel,
  setNewScheduleLabel,
  newScheduleDatetime,
  setNewScheduleDatetime,
  newScheduleRecurrence,
  setNewScheduleRecurrence,
  newSchedulePublishDraft,
  setNewSchedulePublishDraft,
  isAddingSchedule,
  onAddSchedule,
  onDeleteClick,
}: WorkspaceSchedulerCardProps) {
  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-primary pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-instagram-pink" />
            <span>Workspace Scheduler</span>
          </h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Configure automated publishing schedule windows for this brand workspace.
          </p>
        </div>
      </div>

      {scheduleError && (
        <div className="text-xs text-red-500 font-semibold text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 py-2.5 rounded-xl">
          {scheduleError}
        </div>
      )}

      <div className="space-y-2">
        {(currentWorkspace.schedules || []).length === 0 && (
          <p className="text-xs text-text-secondary italic">No schedules configured for this workspace.</p>
        )}

        {(currentWorkspace.schedules || []).map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 bg-bg-app/30 border border-border-primary rounded-lg px-3 py-2 text-xs">
            <div>
              <div className="font-bold text-text-primary">{s.label}</div>
              <div className="text-[11px] text-text-secondary">
                {s.nextRun ? new Date(s.nextRun).toLocaleString() : (s.datetime ? new Date(s.datetime).toLocaleString() : '—')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded bg-bg-hover text-text-secondary uppercase font-semibold">
                {s.recurrence || 'one-time'}
              </span>
              {s.publishAsDraft && (
                <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">
                  Draft Mode
                </span>
              )}
              <button 
                onClick={() => onDeleteClick(s.id)} 
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600 transition flex items-center gap-1 border border-red-200/50 dark:border-red-900/30 ml-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-border-primary pt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="text-[10px] text-text-secondary font-bold uppercase block mb-1">Label</label>
          <input 
            value={newScheduleLabel} 
            onChange={(e) => setNewScheduleLabel(e.target.value)} 
            placeholder="e.g. Monday Morning Post" 
            className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs outline-none focus:border-instagram-pink transition" 
          />
        </div>

        <div>
          <DateTimePicker
            label="When"
            value={newScheduleDatetime}
            onChange={(val) => setNewScheduleDatetime(val)}
            placeholder="Select date & time"
          />
        </div>

        <div>
          <Select
            label="Recurrence"
            value={newScheduleRecurrence}
            onChange={(e) => setNewScheduleRecurrence(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
            options={[
              { value: 'none', label: 'None (one-time)' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' }
            ]}
            className="py-2.5 text-xs"
          />
        </div>

        <div className="md:col-span-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 pt-2 border-t border-dashed border-border-primary">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="publish-draft-agency"
              checked={newSchedulePublishDraft} 
              onChange={(e) => setNewSchedulePublishDraft(e.target.checked)} 
              className="rounded border-border-primary text-instagram-pink focus:ring-instagram-pink"
            />
            <label htmlFor="publish-draft-agency" className="text-xs text-text-secondary select-none">
              Publish scheduled posts as <strong>Draft</strong> for review
            </label>
          </div>
          <button 
            type="button"
            disabled={isAddingSchedule}
            onClick={onAddSchedule} 
            className={`w-full sm:w-auto bg-instagram-pink text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shrink-0 ${isAddingSchedule ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}
          >
            {isAddingSchedule ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Schedule Window</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
