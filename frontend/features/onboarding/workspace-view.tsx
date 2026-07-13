'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState, useEffect } from 'react';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { ArrowRight } from 'lucide-react';
import { FileUpload } from '@/components/common/file-upload';

export function WorkspaceView() {
  const router = useRouter();
  const { state, addWorkspace, updateWorkspace, updateState } = useAppState();
  
  const activeWs = state.workspaces.find((w) => w.id === state.activeWorkspaceId) || state.workspaces[0];

  const [brandName, setBrandName] = useState(
    activeWs?.name || (state.accountType === 'individual' ? state.organizationName : '') || '',
  );
  const [website, setWebsite] = useState(
    activeWs?.website || state.individualWebsite || '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<string | null>(activeWs?.brandAsset || null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  useEffect(() => {
    if (activeWs?.brandAsset) {
      try {
        const parsed = JSON.parse(activeWs.brandAsset);
        setUploadedFile(activeWs.brandAsset);
        setFilePreview(parsed.secureUrl || null);
        setFileType(parsed.resourceType === 'raw' ? 'application/pdf' : 'image/png');
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeWs]);

  const handleFileChange = (name: string | null, preview: string | null, type: string | null) => {
    setUploadedFile(name);
    setFilePreview(preview);
    setFileType(type);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      alert('Please enter a workspace brand name.');
      return;
    }
 setIsSubmitting(true);
    try {
    if (state.accountType === 'individual' && activeWs) {
      updateWorkspace({
        ...activeWs,
        name: brandName,
        website: website || 'https://example.com',
        brandAsset: uploadedFile || undefined,
      });
      updateState({ activeWorkspaceId: activeWs.id, currentStep: 3 });
    } else {
      const newId = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      addWorkspace({
        id: newId,
        name: brandName,
        website: website || 'https://example.com',
        tone: 'casual',
        keywords: [],
        rules: [],
        schedules: [],
        brandAsset: uploadedFile || undefined,
      });
      updateState({ activeWorkspaceId: newId, currentStep: 3 });
    }

      router.push('/onboarding/brand-voice');
    } catch {
      alert('Failed to save workspace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#262626]">
          Create a Brand Workspace
        </h1>
        <p className="text-slate-500 mt-2">
          Workspaces house individual clients, custom brand assets, and platform connections.
        </p>
      </div>

      <OnboardingStepper currentStep={2} />

      <div className="max-w-md w-full mx-auto bg-white border border-[#EFEFEF] rounded-2xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#737373]" htmlFor="brand-name">
              Brand / Client Name
            </label>
            <input
              id="brand-name"
              type="text"
              required
              placeholder="e.g. Acme Clothing Co"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#E1306C] outline-none transition duration-150"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#737373]" htmlFor="website">
              Website URL
            </label>
            <input
              id="website"
              type="url"
              placeholder="https://acmeclothing.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#E1306C] outline-none transition duration-150"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FileUpload
              label="Brand Assets"
              value={uploadedFile}
              previewUrl={filePreview}
              fileType={fileType}
              onChange={handleFileChange}
              uploadUrl="/api/uploads/brand-assets"
              maxSize={20 * 1024 * 1024} // 20MB
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm mt-2 disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Saving...' : 'Configure Brand Voice'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>


      </div>
    </div>
  );
}
