'use client';


import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { Plus, Trash, Link as LinkIcon, ChevronLeft } from 'lucide-react';
import { Select } from '@/components/common/select';

export function ConnectView() {
  const router = useRouter();
  const { state, updateState } = useAppState();


  const channels = state.connectedChannels || [];
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState('instagram');

  const addChannel = () => {
    if (!newName) return;
    const ch = { id: 'chan-' + Date.now(), name: newName, platform: newPlatform };
    const next = [...channels, ch];
    updateState({ connectedChannels: next });
    setNewName('');
  };

  const removeChannel = (id: string) => {
    const next = channels.filter((c: { id: string }) => c.id !== id);
    updateState({ connectedChannels: next });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Connect Channels</h2>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-4">Connect multiple social channels. Add Instagram, LinkedIn, or other accounts to publish posts.</p>

      <div className="mb-4 flex gap-2 items-end">
        <input className="px-3 py-2.5 border border-border-primary bg-bg-card text-text-primary rounded-xl text-sm focus:border-instagram-pink outline-none transition" placeholder="Account display name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Select
          value={newPlatform}
          onChange={(e) => setNewPlatform(e.target.value)}
          options={[
            { value: 'instagram', label: 'Instagram' },
            { value: 'twitter', label: 'Twitter/X' },
            { value: 'linkedin', label: 'LinkedIn' },
            { value: 'facebook', label: 'Facebook' }
          ]}
          className="py-2.5 px-3 text-sm"
          containerClassName="w-40"
        />
        <button onClick={addChannel} className="px-4 py-2.5 bg-instagram-pink text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer hover:opacity-90 transition"><Plus className="w-4 h-4"/>Add</button>
      </div>

      <div className="grid gap-3">
        {channels.length === 0 ? (
          <div className="text-sm text-text-secondary italic">No channels connected yet.</div>
        ) : (
          channels.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold">{c.name.charAt(0)}</div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-text-secondary">{c.platform}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => removeChannel(c.id)} className="text-red-500"><Trash className="w-4 h-4"/></button>
                <button className="text-instagram-pink flex items-center gap-1"><LinkIcon className="w-4 h-4"/>Configure OAuth</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

