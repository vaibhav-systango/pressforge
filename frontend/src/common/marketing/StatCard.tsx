'use client';

import React from 'react';

export type StatCardProps = {
  value: string;
  label: string;
};

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="text-center">
      <div className="font-display text-4xl font-semibold text-gradient md:text-5xl">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default StatCard;
