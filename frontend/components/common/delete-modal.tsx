'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useMounted } from '@/lib/hooks/use-mounted';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isPending = false,
}: DeleteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isPending]);

  // Prevent background scrolling when modal is open
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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node) && !isPending) {
      onClose();
    }
  };

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/10 dark:bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-bg-card border border-border-primary rounded-3xl w-full max-w-md p-6 shadow-2xl relative flex flex-col gap-4 text-text-primary transition-all duration-200 transform scale-100"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 p-1.5 text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-hover transition disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Body */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          {/* Destructive Warning Icon container */}
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-100 dark:border-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 id="delete-modal-title" className="text-lg font-bold tracking-tight text-text-primary">
            {title}
          </h3>

          <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
            {description}
          </p>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 border border-border-primary bg-bg-card text-text-primary rounded-xl text-xs font-bold hover:bg-bg-hover transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-red-600/60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
