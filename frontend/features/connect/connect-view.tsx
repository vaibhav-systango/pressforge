'use client';


import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { Plus, Trash, Link as LinkIcon, ChevronLeft, Check } from 'lucide-react';
import { Select } from '@/components/common/select';
import { useSocialConnection } from '@/lib/hooks/queries/use-social-connection';

function ChannelRow({ channel, onRemove }: { channel: { id: string; name: string; platform: string }; onRemove: (id: string) => void }) {
  const { connect, isConnecting, connection } = useSocialConnection(channel.platform);
  const isConnected = connection?.connected;

  return (
    <div className="flex items-center justify-between p-3 border border-border-primary bg-bg-card rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-pink-50 text-instagram-pink flex items-center justify-center font-bold">{channel.name.charAt(0)}</div>
        <div>
          <div className="font-semibold text-text-primary text-sm">{channel.name}</div>
          <div className="text-xs text-text-secondary capitalize">{channel.platform}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isConnected && (
          <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" /> Connected
          </span>
        )}
        <button
          onClick={() => connect('/app/connect')}
          disabled={isConnecting}
          className="text-instagram-pink hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <LinkIcon className="w-4 h-4"/>
          {isConnecting ? 'Opening...' : isConnected ? 'Re-connect OAuth' : 'Configure OAuth'}
        </button>
        <button onClick={() => onRemove(channel.id)} className="text-red-500 hover:opacity-80 p-1 cursor-pointer">
          <Trash className="w-4 h-4"/>
        </button>
      </div>
    </div>
  );
}

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
        <h2 className="text-lg font-bold text-text-primary">Connect Channels</h2>
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
            <ChannelRow key={c.id} channel={c} onRemove={removeChannel} />
          ))
        )}
      </div>
    </div>
  );
}

