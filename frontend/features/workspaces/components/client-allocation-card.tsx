'use client';

import React from 'react';
import { Users, X } from 'lucide-react';
import { Select } from '@/components/ui/select';
import type { ClientUser } from '@/lib/types';

interface ClientAllocationCardProps {
  unallocatedClients: ClientUser[];
  allocatedClients: ClientUser[];
  selectedClientToAllocate: string;
  setSelectedClientToAllocate: (val: string) => void;
  isAddingClient: boolean;
  isDeallocatingClientId: string | null;
  clientAllocationError: string | null;
  onAllocate: () => void;
  onDeallocate: (client: ClientUser) => void;
}

export function ClientAllocationCard({
  unallocatedClients,
  allocatedClients,
  selectedClientToAllocate,
  setSelectedClientToAllocate,
  isAddingClient,
  isDeallocatingClientId,
  clientAllocationError,
  onAllocate,
  onDeallocate,
}: ClientAllocationCardProps) {
  const clientOptions = unallocatedClients.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.email})`,
  }));

  return (
    <div className="md:col-span-12 bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2 flex items-center gap-1.5">
        <Users className="w-4 h-4 text-instagram-pink" />
        <span>Client Portal Access</span>
      </h3>
      <p className="text-[11px] text-text-secondary">
        Manage client portal accounts that have access to this brand workspace. A workspace can be assigned to multiple clients.
      </p>

      {clientAllocationError && (
        <div className="text-xs text-red-500 font-semibold text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 py-2.5 rounded-xl">
          {clientAllocationError}
        </div>
      )}

      {/* Add Client dropdown */}
      {unallocatedClients.length > 0 ? (
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Select
            value={selectedClientToAllocate}
            onChange={(e) => setSelectedClientToAllocate(e.target.value)}
            options={clientOptions}
            placeholder="Select client to add..."
            variant="compact"
            containerClassName="w-full sm:flex-1 min-w-0"
          />
          <button
            type="button"
            disabled={isAddingClient}
            onClick={onAllocate}
            className={`w-full sm:w-auto bg-instagram-pink hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 ${isAddingClient ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isAddingClient ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Add'
            )}
          </button>
        </div>
      ) : (
        <p className="text-[10px] text-text-secondary italic">All active clients are assigned to this workspace.</p>
      )}

      {/* List of allocated clients */}
      <div className="space-y-2 pt-2">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
          Assigned Clients ({allocatedClients.length})
        </span>
        {allocatedClients.length === 0 ? (
          <p className="text-xs text-text-secondary italic">No clients assigned to this workspace.</p>
        ) : (
          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
            {allocatedClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between gap-2 p-2 bg-bg-app/40 rounded-xl border border-border-primary text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text-primary truncate">{client.name}</p>
                  <p className="text-text-secondary text-[10px] truncate">{client.email}</p>
                </div>
                <button
                  type="button"
                  disabled={isDeallocatingClientId !== null}
                  onClick={() => onDeallocate(client)}
                  className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1 border ${
                    isDeallocatingClientId === client.id 
                      ? 'bg-red-50/50 border-red-200 text-red-400 cursor-not-allowed' 
                      : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 border-red-200/50 dark:border-red-900/30 text-red-500 hover:text-red-600 cursor-pointer'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isDeallocatingClientId === client.id ? (
                    <span className="w-3 h-3 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      <X className="w-2.5 h-2.5" />
                      <span>Remove</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
