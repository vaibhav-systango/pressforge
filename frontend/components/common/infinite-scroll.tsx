'use client';

import React, { useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  loader?: React.ReactNode;
}

export function InfiniteScroll({
  hasMore,
  onLoadMore,
  isLoading,
  children,
  className = '',
  loader,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const findScrollParent = (node: HTMLElement | null): HTMLElement | null => {
      if (!node) return null;
      const style = window.getComputedStyle(node);
      const overflowY = style.overflowY;
      const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
      if (isScrollable && node.scrollHeight > node.clientHeight) {
        return node;
      }
      return findScrollParent(node.parentElement);
    };

    const scrollParent = findScrollParent(sentinelRef.current);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { 
        root: scrollParent,
        threshold: 0.05,
        rootMargin: '50px'
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, onLoadMore, isLoading]);

  return (
    <div className={className}>
      {children}
      
      {/* Sentinel for triggering load more */}
      {hasMore && (
        <div ref={sentinelRef} className="py-3 flex justify-center items-center w-full">
          {loader || (
            <div className="flex items-center gap-2 text-[11px] text-text-secondary">
              <div className="w-3.5 h-3.5 border-2 border-instagram-pink border-t-transparent rounded-full animate-spin"></div>
              <span>Loading more...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
