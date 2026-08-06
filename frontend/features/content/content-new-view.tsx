'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { notifications } from '@mantine/notifications';
import type { Workspace } from '@/lib/types';
import { Sparkles, Instagram, Send, Save, RefreshCw, Linkedin } from 'lucide-react';

// Sub-components
import { GenerationSettingsForm } from './components/generation-settings-form';
import { VariationSelector } from './components/variation-selector';
import { PostPreview } from './components/post-preview';
import { TweakInstructionPanel } from './components/tweak-instruction-panel';
import { ManualEditPanel } from './components/manual-edit-panel';
import { VersionHistoryPanel } from './components/version-history-panel';

interface Variation {
  id: string;
  name: string;
  caption: string;
  hashtags: string[];
  imageBrief: string;
  liCaption: string;
  liHashtags: string[];
  liImageBrief: string;
  imageUrl: string;
}

interface LocalHistoryItem {
  version: number;
  timestamp: string;
  action: string;
  caption: string;
  hashtags: string[];
  imageBrief: string;
  liCaption: string;
  liHashtags: string[];
  liImageBrief: string;
  imageUrl: string;
}

export function ContentNewView() {
  const router = useRouter();
  const { state, addDraft } = useAppState();
  const { user } = useAuth();

  const activeWorkspace =
    state.workspaces.find((w) => w.id === state.activeWorkspaceId) ||
    state.workspaces[0];

  const isClient =
    user?.userType === "client" || state.currentUserType === "client";
  const isIndividual =
    user?.userType === "individual" ||
    state.currentUserType === "individual" ||
    state.accountType === "individual";

  // Local Brand/Workspace Guideline States (edited only locally for this content generation run)
  const [localBrandName, setLocalBrandName] = useState(activeWorkspace?.name || "");
  const [localWebsite, setLocalWebsite] = useState(activeWorkspace?.website || "");
  const [localTargetAudience, setLocalTargetAudience] = useState(activeWorkspace?.targetAudience || "");
  const [localBrandVoice, setLocalBrandVoice] = useState(activeWorkspace?.brandVoice || "");
  const [localTone, setLocalTone] = useState<Workspace["tone"]>(activeWorkspace?.tone || "professional");
  const [localKeywords, setLocalKeywords] = useState<string[]>(activeWorkspace?.keywords || []);
  const [localRules, setLocalRules] = useState<string[]>(activeWorkspace?.rules || []);

  // Primary Prompt & Preferences
  const [prompt, setPrompt] = useState("");
  const [goal, setGoal] = useState("Product Spotlight");
  const [cta, setCta] = useState("Link in Bio");
  const [visualStyle, setVisualStyle] = useState("Warm & Organic");

  // Platform selection state
  const [targetPlatforms, setTargetPlatforms] = useState<
    ("instagram" | "linkedin")[]
  >(["instagram"]);
  const [activePlatformTab, setActivePlatformTab] = useState<
    "instagram" | "linkedin"
  >("instagram");

  // References & Inspiration
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [referenceText, setReferenceText] = useState("");

  // Generation & State
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Active Draft Content (Instagram)
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [imageBrief, setImageBrief] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");

  // Active Draft Content (LinkedIn)
  const [liCaption, setLinkedinCaption] = useState("");
  const [liHashtags, setLinkedinHashtags] = useState<string[]>([]);
  const [liImageBrief, setLinkedinImageBrief] = useState("");

  // Variations & Tweak state
  const [variations, setVariations] = useState<Variation[]>([]);
  const [activeVarIdx, setActiveVarIdx] = useState(0);
  const [tweakInstruction, setTweakInstruction] = useState("");
  const [tweaking, setTweaking] = useState(false);
  const [tweakScope, setTweakScope] = useState<"active" | "both">("active");

  // Version History list
  const [history, setHistory] = useState<LocalHistoryItem[]>([]);

  // Mobile Step State for responsive view switcher
  const [mobileStep, setMobileStep] = useState<'form' | 'preview'>('form');

  // Toggle platform checkbox
  const handleTogglePlatform = (platform: "instagram" | "linkedin") => {
    if (targetPlatforms.includes(platform)) {
      if (targetPlatforms.length === 1) return; // Must select at least one
      setTargetPlatforms(targetPlatforms.filter((p) => p !== platform));
      // Reset active tab to the remaining platform
      const remaining = targetPlatforms.find((p) => p !== platform);
      if (remaining) setActivePlatformTab(remaining);
    } else {
      setTargetPlatforms([...targetPlatforms, platform]);
      setActivePlatformTab(platform); // focus new platform
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    const isClient =
      user?.userType === "client" || state.currentUserType === "client";
    const isIndividual =
      user?.userType === "individual" ||
      state.currentUserType === "individual" ||
      state.accountType === "individual";

    if (!state.activeWorkspaceId) {
      notifications.show({
        title: 'Validation error',
        message: 'Select or create a workspace before generating content.',
        color: 'red',
      });
      return;
    }

    if (!isClient && !isIndividual && !state.activeClientId) {
      notifications.show({
        title: 'Validation error',
        message: 'Select a client before generating content.',
        color: 'red',
      });
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: state.activeWorkspaceId,
          prompt,
          platforms: targetPlatforms,
          goal,
          cta,
          visualStyle,
          referenceUrls,
          referenceText,
          brandName: localBrandName,
          tone: localTone,
          keywords: localKeywords,
          targetAudience: localTargetAudience,
          brandVoice: localBrandVoice,
          rules: localRules,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(err?.error ?? "Content generation failed");
      }

      const data = (await res.json()) as {
        variations: Variation[];
        prompt: string;
      };

      const updatedVars = (data.variations || []).map((v) => ({
        ...v,
        imageUrl: v.imageUrl || "",
        hashtags: v.hashtags || [],
        liHashtags: v.liHashtags || [],
      }));

      if (updatedVars.length === 0) {
        throw new Error("No variations returned from AI");
      }

      setVariations(updatedVars);

      // Load Instagram states
      setCaption(updatedVars[0].caption);
      setHashtags(updatedVars[0].hashtags);
      setImageBrief(updatedVars[0].imageBrief);
      setGeneratedImageUrl(updatedVars[0].imageUrl);

      // Load LinkedIn states
      setLinkedinCaption(updatedVars[0].liCaption);
      setLinkedinHashtags(updatedVars[0].liHashtags);
      setLinkedinImageBrief(updatedVars[0].liImageBrief);

      setActiveVarIdx(0);

      // Create Version 1
      const initialHistoryItem: LocalHistoryItem = {
        version: 1,
        timestamp: new Date().toISOString(),
        action: `Generated AI Draft (${updatedVars[0].name})`,
        caption: updatedVars[0].caption,
        hashtags: updatedVars[0].hashtags,
        imageBrief: updatedVars[0].imageBrief,
        liCaption: updatedVars[0].liCaption,
        liHashtags: updatedVars[0].liHashtags,
        liImageBrief: updatedVars[0].liImageBrief,
        imageUrl: updatedVars[0].imageUrl,
      };
      setHistory([initialHistoryItem]);

      setGenerated(true);
      setMobileStep('preview');
    } catch (err) {
      notifications.show({
        title: 'Generation failed',
        message: err instanceof Error ? err.message : 'Content generation failed',
        color: 'red',
      });
    } finally {
      setGenerating(false);
    }
  };

  // Switch Variation
  const handleSelectVariation = (idx: number) => {
    if (!variations[idx]) return;
    const target = variations[idx];

    setCaption(target.caption);
    setHashtags(target.hashtags);
    setImageBrief(target.imageBrief);
    setGeneratedImageUrl(target.imageUrl);

    setLinkedinCaption(target.liCaption);
    setLinkedinHashtags(target.liHashtags);
    setLinkedinImageBrief(target.liImageBrief);

    setActiveVarIdx(idx);

    // Add version log
    const nextVer = history.length + 1;
    const item: LocalHistoryItem = {
      version: nextVer,
      timestamp: new Date().toISOString(),
      action: `Selected Variation: ${target.name}`,
      caption: target.caption,
      hashtags: target.hashtags,
      imageBrief: target.imageBrief,
      liCaption: target.liCaption,
      liHashtags: target.liHashtags,
      liImageBrief: target.liImageBrief,
      imageUrl: target.imageUrl,
    };
    setHistory([item, ...history]);
  };

  // Apply AI Polish / Tweak
  const handleApplyTweak = (instructionText: string) => {
    if (!instructionText.trim()) return;
    setTweaking(true);

    setTimeout(() => {
      let tweakedCaption = caption;
      const tweakedHashtags = [...hashtags];
      const tweakedBrief = imageBrief;

      let tweakedLiCaption = liCaption;
      const tweakedLiHashtags = [...liHashtags];
      const tweakedLiBrief = liImageBrief;

      let actionLabel = `AI Tweak: ${instructionText}`;
      const lowerText = instructionText.toLowerCase();

      const applyToInst =
        tweakScope === "both" || activePlatformTab === "instagram";
      const applyToLi =
        tweakScope === "both" || activePlatformTab === "linkedin";

      if (
        lowerText.includes("shorter") ||
        lowerText.includes("summarize") ||
        lowerText.includes("brief")
      ) {
        if (applyToInst)
          tweakedCaption =
            tweakedCaption.split(".").slice(0, 2).join(".") + ".";
        if (applyToLi)
          tweakedLiCaption =
            tweakedLiCaption.split(".").slice(0, 2).join(".") + ".";
        actionLabel = "AI Tweak: Shortened caption";
      } else if (lowerText.includes("emoji")) {
        if (applyToInst)
          tweakedCaption = "✨ " + tweakedCaption.replace(/!/g, "! 🚀") + " 💖";
        if (applyToLi)
          tweakedLiCaption =
            "🌟 " + tweakedLiCaption.replace(/!/g, "! 🚀") + " ✨";
        actionLabel = "AI Tweak: Added emojis";
      } else if (
        lowerText.includes("cta") ||
        lowerText.includes("call to action") ||
        lowerText.includes("action")
      ) {
        if (applyToInst) tweakedCaption += " 👇 Tap the link in bio right now!";
        if (applyToLi)
          tweakedLiCaption += "\n\n👇 Click the link in comments to read more!";
        actionLabel = "AI Tweak: Emphasized CTA";
      } else if (
        lowerText.includes("bold") ||
        lowerText.includes("exciting") ||
        lowerText.includes("hype")
      ) {
        if (applyToInst)
          tweakedCaption =
            "🔥 SPECIAL ANNOUNCEMENT! " + tweakedCaption.toUpperCase();
        if (applyToLi)
          tweakedLiCaption =
            "📢 IMPORTANT LOGISTICS UPDATE: " + tweakedLiCaption;
        actionLabel = "AI Tweak: Changed tone to Bold";
      } else {
        if (applyToInst) tweakedCaption = `📢 [AI UPDATE] - ${tweakedCaption}`;
        if (applyToLi)
          tweakedLiCaption = `💡 [AI UPDATE] - ${tweakedLiCaption}`;
      }

      if (applyToInst) {
        setCaption(tweakedCaption);
        setHashtags(tweakedHashtags);
        setImageBrief(tweakedBrief);
      }

      if (applyToLi) {
        setLinkedinCaption(tweakedLiCaption);
        setLinkedinHashtags(tweakedLiHashtags);
        setLinkedinImageBrief(tweakedLiBrief);
      }

      // Create new version
      const nextVer = history.length + 1;
      const item: LocalHistoryItem = {
        version: nextVer,
        timestamp: new Date().toISOString(),
        action: actionLabel,
        caption: applyToInst ? tweakedCaption : caption,
        hashtags: applyToInst ? tweakedHashtags : hashtags,
        imageBrief: applyToInst ? tweakedBrief : imageBrief,
        liCaption: applyToLi ? tweakedLiCaption : liCaption,
        liHashtags: applyToLi ? tweakedLiHashtags : liHashtags,
        liImageBrief: applyToLi ? tweakedLiBrief : liImageBrief,
        imageUrl: generatedImageUrl,
      };
      setHistory([item, ...history]);

      setTweakInstruction("");
      setTweaking(false);
    }, 850);
  };

  // Restore Version
  const handleRestoreVersion = (histItem: LocalHistoryItem) => {
    setCaption(histItem.caption);
    setHashtags(histItem.hashtags);
    setImageBrief(histItem.imageBrief);
    setGeneratedImageUrl(histItem.imageUrl);

    setLinkedinCaption(histItem.liCaption);
    setLinkedinHashtags(histItem.liHashtags);
    setLinkedinImageBrief(histItem.liImageBrief);

    const nextVer = history.length + 1;
    const restoreLog: LocalHistoryItem = {
      version: nextVer,
      timestamp: new Date().toISOString(),
      action: `Restored Version ${histItem.version}.0`,
      caption: histItem.caption,
      hashtags: histItem.hashtags,
      imageBrief: histItem.imageBrief,
      liCaption: histItem.liCaption,
      liHashtags: histItem.liHashtags,
      liImageBrief: histItem.liImageBrief,
      imageUrl: histItem.imageUrl,
    };
    setHistory([restoreLog, ...history]);
  };

  // Save draft
  const handleSave = async (
    status: "draft" | "pending_approval" | "approved",
  ) => {
    if (!state.activeWorkspaceId) {
      notifications.show({
        title: 'Validation error',
        message: 'Select or create a workspace before saving.',
        color: 'red',
      });
      return;
    }

    const id = "draft-" + Date.now();
    let finalPlatform: "instagram" | "linkedin" | "both" = "instagram";
    if (
      targetPlatforms.includes("instagram") &&
      targetPlatforms.includes("linkedin")
    ) {
      finalPlatform = "both";
    } else if (targetPlatforms.includes("linkedin")) {
      finalPlatform = "linkedin";
    }

    const latestHistory = history[0];
    const hasUnsavedChanges =
      !latestHistory ||
      latestHistory.caption !== caption ||
      latestHistory.hashtags.join(",") !== hashtags.join(",") ||
      latestHistory.imageBrief !== imageBrief ||
      latestHistory.liCaption !== liCaption ||
      latestHistory.liHashtags.join(",") !== liHashtags.join(",") ||
      latestHistory.liImageBrief !== liImageBrief ||
      latestHistory.imageUrl !== generatedImageUrl;

    const finalHistory = hasUnsavedChanges
      ? [
          {
            version: (latestHistory?.version ?? 0) + 1,
            timestamp: new Date().toISOString(),
            action: "Saved changes manually",
            caption,
            hashtags,
            imageBrief,
            liCaption,
            liHashtags,
            liImageBrief,
            imageUrl: generatedImageUrl,
          },
          ...history,
        ]
      : history;

    try {
      await addDraft({
        id,
        workspaceId: state.activeWorkspaceId,
        prompt,
        caption,
        hashtags,
        imageBrief,
        status,
        scheduledAt:
          status === "pending_approval" ? undefined : new Date().toISOString(),
        version: finalHistory.length > 0 ? finalHistory[0].version : 1,
        history: finalHistory.map((h) => ({
          version: h.version,
          timestamp: h.timestamp,
          action: h.action,
          caption: h.caption,
          feedback: undefined,
          hashtags: h.hashtags,
          imageBrief: h.imageBrief,
          liCaption: h.liCaption,
          liHashtags: h.liHashtags,
          liImageBrief: h.liImageBrief,
          imageUrl: h.imageUrl,
        })),
        referenceUrls,
        referenceText,
        goal,
        cta,
        visualStyle,
        imageUrl: generatedImageUrl,
        platform: finalPlatform,
        liCaption,
        liHashtags,
        liImageBrief,
      });
    } catch (err) {
      notifications.show({
        title: 'Save failed',
        message: err instanceof Error ? err.message : 'Failed to save draft',
        color: 'red',
      });
      return;
    }

    if (status === "pending_approval") {
      router.push("/app/approvals");
    } else {
      router.push(state.currentUserType === "client" ? "/app" : "/app/content");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto w-full text-text-primary pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          AI Social Content Draft Generator
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Create premium cross-platform posts aligned to your target voice
          guidelines and references.
        </p>
      </div>

      {generated && (
        <div className="flex bg-bg-card border border-border-primary rounded-xl p-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileStep('form')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              mobileStep === 'form' ? 'bg-bg-app text-instagram-pink border border-border-primary shadow-xs' : 'text-text-secondary'
            }`}
          >
            1. Prompt & Options
          </button>
          <button
            type="button"
            onClick={() => setMobileStep('preview')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              mobileStep === 'preview' ? 'bg-bg-app text-instagram-pink border border-border-primary shadow-xs' : 'text-text-secondary'
            }`}
          >
            2. Live Preview & Actions
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Settings & references (lg:col-span-5) */}
        <div className={`lg:col-span-5 space-y-6 ${generated && mobileStep === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <GenerationSettingsForm
            prompt={prompt}
            setPrompt={setPrompt}
            goal={goal}
            setGoal={setGoal}
            cta={cta}
            setCta={setCta}
            visualStyle={visualStyle}
            setVisualStyle={setVisualStyle}
            targetPlatforms={targetPlatforms}
            handleTogglePlatform={handleTogglePlatform}
            referenceUrls={referenceUrls}
            setReferenceUrls={setReferenceUrls}
            referenceText={referenceText}
            setReferenceText={setReferenceText}
            activeWorkspace={activeWorkspace}
            localBrandName={localBrandName}
            setLocalBrandName={setLocalBrandName}
            localWebsite={localWebsite}
            setLocalWebsite={setLocalWebsite}
            localTargetAudience={localTargetAudience}
            setLocalTargetAudience={setLocalTargetAudience}
            localBrandVoice={localBrandVoice}
            setLocalBrandVoice={setLocalBrandVoice}
            localTone={localTone}
            setLocalTone={setLocalTone}
            localKeywords={localKeywords}
            setLocalKeywords={setLocalKeywords}
            localRules={localRules}
            setLocalRules={setLocalRules}
            generating={generating}
            onGenerateSubmit={handleGenerate}
          />
        </div>

        {/* Middle Column: Live Platform Previews (lg:col-span-4) */}
        <div className={`lg:col-span-4 space-y-6 ${generated && mobileStep === 'form' ? 'hidden lg:block' : 'block'}`}>
          {!generated && !generating ? (
            <div className="bg-bg-card border border-border-primary rounded-2xl p-10 text-center space-y-3 min-h-[450px] flex flex-col items-center justify-center">
              <Sparkles className="w-10 h-10 text-border-primary" />
              <p className="text-sm font-bold text-text-primary">
                Cross-Platform Feed Previews
              </p>
              <p className="text-xs text-text-secondary max-w-xs">
                Configure your target channels and prompt specifications, then
                generate content.
              </p>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in relative">
              {tweaking && (
                <div className="absolute inset-0 bg-bg-card/75 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-2 rounded-2xl">
                  <RefreshCw className="w-8 h-8 text-instagram-pink animate-spin" />
                  <p className="text-xs text-text-primary font-bold">
                    Applying AI Tweak instruction...
                  </p>
                </div>
              )}

              {/* Platform Preview Toggle Tabs */}
              <div className="border-b border-border-primary flex gap-2">
                {targetPlatforms.includes("instagram") && (
                  <button
                    onClick={() => setActivePlatformTab("instagram")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border-b-2 text-xs font-bold transition cursor-pointer ${
                      activePlatformTab === "instagram"
                        ? "border-instagram-pink text-instagram-pink font-extrabold"
                        : "border-transparent text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Instagram</span>
                  </button>
                )}
                {targetPlatforms.includes("linkedin") && (
                  <button
                    onClick={() => setActivePlatformTab("linkedin")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border-b-2 text-xs font-bold transition cursor-pointer ${
                      activePlatformTab === "linkedin"
                        ? "border-blue-600 text-blue-600 font-extrabold"
                        : "border-transparent text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </button>
                )}
              </div>

              {/* Variations Selector Tabs */}
              <VariationSelector
                variations={variations}
                activeVarIdx={activeVarIdx}
                onSelectVariation={handleSelectVariation}
              />

              <PostPreview
                activePlatformTab={activePlatformTab}
                localBrandName={localBrandName}
                generatedImageUrl={generatedImageUrl}
                goal={goal}
                caption={caption}
                hashtags={hashtags}
                liCaption={liCaption}
                liHashtags={liHashtags}
                localWebsite={localWebsite}
                generating={generating}
              />

              {/* Save / Launch Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handleSave("pending_approval")}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-xs font-bold hover:opacity-95 transition shadow-sm cursor-pointer border-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isIndividual ? "Send for Approval" : "Send via Email Approval"}</span>
                </button>
                <button
                  onClick={() => handleSave("draft")}
                  className="w-full flex items-center justify-center gap-2 bg-bg-app hover:bg-bg-hover border border-border-primary text-text-primary py-2.5 rounded-full text-xs font-bold transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft in Content Planner</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Tweak Options & History (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          {generated && (
            <div className="space-y-6 animate-fade-in">
              {/* <TweakInstructionPanel
                tweakScope={tweakScope}
                setTweakScope={setTweakScope}
                tweakInstruction={tweakInstruction}
                setTweakInstruction={setTweakInstruction}
                onApplyTweak={handleApplyTweak}
              /> */}

              {/* <ManualEditPanel
                activePlatformTab={activePlatformTab}
                caption={caption}
                setCaption={setCaption}
                hashtags={hashtags}
                setHashtags={setHashtags}
                imageBrief={imageBrief}
                setImageBrief={setImageBrief}
                liCaption={liCaption}
                setLinkedinCaption={setLinkedinCaption}
                liHashtags={liHashtags}
                setLinkedinHashtags={setLinkedinHashtags}
                liImageBrief={liImageBrief}
                setLinkedinImageBrief={setLinkedinImageBrief}
              /> */}

              {/* <VersionHistoryPanel
                history={history}
                activePlatformTab={activePlatformTab}
                onRestoreVersion={handleRestoreVersion}
              /> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
