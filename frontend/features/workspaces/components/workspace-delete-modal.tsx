'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

interface WorkspaceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string | undefined;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

export function WorkspaceDeleteModal({
  isOpen,
  onClose,
  workspaceName,
  onConfirm,
  isDeleting,
  error,
}: WorkspaceDeleteModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      onClick={() => { if (!isDeleting) onClose(); }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-card border border-border-primary w-full max-w-sm rounded-2xl shadow-xl animate-scale-up"
      >
        <div className="flex items-center gap-3 p-5 border-b border-border-primary">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-sm">Delete Workspace</h3>
            <p className="text-xs text-text-secondary mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-text-secondary">
            Are you sure you want to delete <strong className="text-text-primary">{workspaceName}</strong>? All associated data will be permanently removed.
          </p>

          {error && (
            <div className="text-xs text-red-500 font-semibold text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 py-2 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-border-primary text-text-primary hover:bg-bg-hover transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 ${isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 cursor-pointer'}`}
            >
              {isDeleting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ScheduleDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleLabel: string | undefined;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

export function ScheduleDeleteModal({
  isOpen,
  onClose,
  scheduleLabel,
  onConfirm,
  isDeleting,
  error,
}: ScheduleDeleteModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      onClick={() => { if (!isDeleting) onClose(); }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-card border border-border-primary w-full max-w-sm rounded-2xl shadow-xl animate-scale-up"
      >
        <div className="flex items-center gap-3 p-5 border-b border-border-primary">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-sm">Remove Schedule</h3>
            <p className="text-xs text-text-secondary mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-text-secondary">
            Are you sure you want to remove the schedule <strong className="text-text-primary">{scheduleLabel}</strong>?
          </p>

          {error && (
            <div className="text-xs text-red-500 font-semibold text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 py-2 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-border-primary text-text-primary hover:bg-bg-hover transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 ${isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 cursor-pointer'}`}
            >
              {isDeleting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
