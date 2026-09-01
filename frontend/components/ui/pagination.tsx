'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  isLoading = false,
  className = '',
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Helper to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(safeTotalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < safeTotalPages - 2) pages.push('...');
      pages.push(safeTotalPages);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-primary text-xs text-text-secondary select-none ${className}`}
    >
      {/* Left: Item range info */}
      <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
        <div>
          Showing{' '}
          <span className="font-bold text-text-primary">
            {startItem}–{endItem}
          </span>{' '}
          of <span className="font-bold text-text-primary">{totalItems}</span> results
        </div>
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
          title="First Page"
          className="p-1.5 rounded-lg border border-border-primary bg-bg-app text-text-secondary hover:text-text-primary hover:border-text-secondary transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          title="Previous Page"
          className="p-1.5 rounded-lg border border-border-primary bg-bg-app text-text-secondary hover:text-text-primary hover:border-text-secondary transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-text-secondary font-bold">
                ...
              </span>
            ) : (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p as number)}
                disabled={isLoading}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  currentPage === p
                    ? 'bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white shadow-xs'
                    : 'bg-bg-app border border-border-primary text-text-secondary hover:text-text-primary hover:border-text-secondary'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === safeTotalPages || isLoading}
          title="Next Page"
          className="p-1.5 rounded-lg border border-border-primary bg-bg-app text-text-secondary hover:text-text-primary hover:border-text-secondary transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(safeTotalPages)}
          disabled={currentPage === safeTotalPages || isLoading}
          title="Last Page"
          className="p-1.5 rounded-lg border border-border-primary bg-bg-app text-text-secondary hover:text-text-primary hover:border-text-secondary transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
