'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Workspace, ClientUser } from '@/lib/types';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  setSelectedWorkspaceId: (id: string) => void;
  clients: ClientUser[];
  accountType: string;
  onDeleteClick: (id: string) => void;
  onSelectWorkspace?: (id: string) => void;
}

export function WorkspaceSelector({
  workspaces,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
  clients,
  accountType,
  onDeleteClick,
  onSelectWorkspace,
}: WorkspaceSelectorProps) {
  return (
    <div className="lg:col-span-3 bg-bg-card border border-border-primary rounded-2xl p-4 shadow-sm space-y-3">
      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-border-primary pb-2 block">
        Workspaces ({workspaces.length})
      </span>

      <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-1">
        {workspaces.map((ws) => {
          const isSelected = ws.id === selectedWorkspaceId;
          const wsClients = (clients || []).filter(c => {
            const wsIds = c.workspaceIds || (c.workspaceId ? [c.workspaceId] : []);
            return wsIds.includes(ws.id);
          });

          return (
            <div key={ws.id} className="relative group/item">
              <button
                onClick={() => {
                  setSelectedWorkspaceId(ws.id);
                  if (onSelectWorkspace) {
                    onSelectWorkspace(ws.id);
                  }
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                  isSelected 
                    ? 'border-instagram-pink bg-pink-50/20 text-text-primary' 
                    : 'border-border-primary hover:bg-bg-hover text-text-secondary'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden pr-6">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0 text-text-primary">
                    {ws.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold truncate">{ws.name}</p>
                    {accountType !== 'individual' && (
                      <p className="text-[10px] text-text-secondary mt-0.5">{wsClients.length} portal users</p>
                    )}
                  </div>
                </div>
              </button>

              {/* Delete button shown on hover/select */}
              {workspaces.length > 1 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition duration-150">
                  <button
                    onClick={() => onDeleteClick(ws.id)}
                    title="Delete Workspace"
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
