"use client";

import type { Workspace } from "@/lib/types";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/queries/use-app-state";
import React, { useState } from "react";
import {
  Sparkles,
  Instagram,
  Send,
  Save,
  RefreshCw,
  X,
  Plus,
  Heart,
  MessageCircle,
  Send as ShareIcon,
  Bookmark,
  Building,
  Edit3,
  Link2,
  Undo,
  Check,
  Linkedin,
  Share2,
  ThumbsUp,
  MoreHorizontal,
} from "lucide-react";
import { Select } from "@/components/common/select";

const TONES = [
  "professional",
  "friendly",
  "witty",
  "bold",
  "empathetic",
  "casual",
  "formal",
];
const GOALS = [
  "Product Spotlight",
  "Behind the Scenes",
  "Educational / Tips",
  "Customer Story / Testimonial",
  "Event / Launch Announcement",
  "General Brand Awareness",
];
const CTAS = [
  "Link in Bio",
  "Comment below",
  "Save for later",
  "Share this post",
  "Visit Website",
  "No CTA",
];
const VISUAL_STYLES = [
  "Warm & Organic",
  "Bold & Vibrant",
  "Minimalist & Clean",
  "Dark & Moody",
  "Professional & Corporate",
];

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
  const { state, addDraft, updateWorkspace } = useAppState();

  const activeWorkspace =
    state.workspaces.find((w) => w.id === state.activeWorkspaceId) ||
    state.workspaces[0];

  // Local Brand/Workspace Guideline States (edited only locally for this content generation run)
  const [localBrandName, setLocalBrandName] = useState("");
  const [localWebsite, setLocalWebsite] = useState("");
  const [localTargetAudience, setLocalTargetAudience] = useState("");
  const [localBrandVoice, setLocalBrandVoice] = useState("");
  const [localTone, setLocalTone] = useState<Workspace["tone"]>("professional");
  const [localKeywords, setLocalKeywords] = useState<string[]>([]);
  const [localRules, setLocalRules] = useState<string[]>([]);

  // Synchronize local states when activeWorkspace changes
  React.useEffect(() => {
    if (activeWorkspace) {
      setLocalBrandName(activeWorkspace.name || "");
      setLocalWebsite(activeWorkspace.website || "");
      setLocalTargetAudience(activeWorkspace.targetAudience || "");
      setLocalBrandVoice(activeWorkspace.brandVoice || "");
      setLocalTone(activeWorkspace.tone || "professional");
      setLocalKeywords(activeWorkspace.keywords || []);
      setLocalRules(activeWorkspace.rules || []);
    } else {
      setLocalBrandName("");
      setLocalWebsite("");
      setLocalTargetAudience("");
      setLocalBrandVoice("");
      setLocalTone("professional");
      setLocalKeywords([]);
      setLocalRules([]);
    }
  }, [activeWorkspace?.id, activeWorkspace]);

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
  const [urlInput, setUrlInput] = useState("");
  const [referenceText, setReferenceText] = useState("");

  // Brand Voice Active Guidelines
  const [keywordInput, setKeywordInput] = useState("");
  const [ruleInput, setRuleInput] = useState("");

  // Generation & State
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Active Draft Content (Instagram)
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [imageBrief, setImageBrief] = useState("");
  const [newHashtag, setNewHashtag] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");

  // Active Draft Content (LinkedIn)
  const [liCaption, setLinkedinCaption] = useState("");
  const [liHashtags, setLinkedinHashtags] = useState<string[]>([]);
  const [liImageBrief, setLinkedinImageBrief] = useState("");
  const [newLiHashtag, setNewLinkedinHashtag] = useState("");

  // Variations & Tweak state
  const [variations, setVariations] = useState<Variation[]>([]);
  const [activeVarIdx, setActiveVarIdx] = useState(0);
  const [tweakInstruction, setTweakInstruction] = useState("");
  const [tweaking, setTweaking] = useState(false);
  const [tweakScope, setTweakScope] = useState<"active" | "both">("active");

  // Version History list
  const [history, setHistory] = useState<LocalHistoryItem[]>([]);

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

  // Add Reference URL
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    if (!referenceUrls.includes(url)) {
      setReferenceUrls([...referenceUrls, url]);
    }
    setUrlInput("");
  };

  // Remove Reference URL
  const handleRemoveUrl = (target: string) => {
    setReferenceUrls(referenceUrls.filter((u) => u !== target));
  };

  // Active Tone Change
  const handleToneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalTone(e.target.value as Workspace["tone"]);
  };

  // Add workspace keyword
  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    const clean = keywordInput.trim().toLowerCase();
    if (!localKeywords.includes(clean)) {
      setLocalKeywords([...localKeywords, clean]);
    }
    setKeywordInput("");
  };

  // Remove workspace keyword
  const handleRemoveKeyword = (kw: string) => {
    setLocalKeywords(localKeywords.filter((k) => k !== kw));
  };

  // Add local rule
  const handleAddRule = () => {
    if (!ruleInput.trim()) return;
    const clean = ruleInput.trim();
    if (!localRules.includes(clean)) {
      setLocalRules([...localRules, clean]);
    }
    setRuleInput("");
  };

  // Remove local rule
  const handleRemoveRule = (rule: string) => {
    setLocalRules(localRules.filter((r) => r !== rule));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert("Please enter a brief or prompt to guide the AI.");
      return;
    }
    if (!state.activeWorkspaceId) {
      alert("Select or create a workspace before generating content.");
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
    } catch (err) {
      alert(err instanceof Error ? err.message : "Content generation failed");
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

  // Instagram Hashtags
  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };
  const handleAddHashtag = () => {
    const normalized = newHashtag.trim().replace(/^#/, "");
    if (normalized && !hashtags.includes(normalized)) {
      setHashtags([...hashtags, normalized]);
      setNewHashtag("");
    }
  };

  // LinkedIn Hashtags
  const handleRemoveLinkedinHashtag = (tag: string) => {
    setLinkedinHashtags(liHashtags.filter((t) => t !== tag));
  };
  const handleAddLinkedinHashtag = () => {
    const normalized = newLiHashtag.trim().replace(/^#/, "");
    if (normalized && !liHashtags.includes(normalized)) {
      setLinkedinHashtags([...liHashtags, normalized]);
      setNewLinkedinHashtag("");
    }
  };

  // Save draft
  const handleSave = async (
    status: "draft" | "pending_approval" | "approved",
  ) => {
    if (!state.activeWorkspaceId) {
      alert("Select or create a workspace before saving.");
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
      alert(err instanceof Error ? err.message : "Failed to save draft");
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Settings & references (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-primary pb-2">
              <Sparkles className="w-4.5 h-4.5 text-instagram-pink" />
              <span>Generation Settings</span>
            </h3>

            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Prompt */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  Social Post Brief / Prompt
                </label>
                <textarea
                  required
                  placeholder="Describe your post concept. E.g., 'Teaser about organic summer clothing launch.'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition min-h-[80px]"
                />
              </div>

              {/* Target Platforms */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">
                  Target Platforms
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Instagram Button */}
                  <button
                    type="button"
                    onClick={() => handleTogglePlatform("instagram")}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
                      targetPlatforms.includes("instagram")
                        ? "border-instagram-pink bg-pink-500/5 text-instagram-pink"
                        : "border-border-primary bg-bg-app text-text-secondary hover:text-text-primary hover:border-border-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      <span>Instagram Feed</span>
                    </div>
                    {targetPlatforms.includes("instagram") ? (
                      <div className="w-4.5 h-4.5 rounded-full bg-instagram-pink text-white flex items-center justify-center shadow-sm shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-full border border-border-primary shrink-0" />
                    )}
                  </button>

                  {/* LinkedIn Button */}
                  <button
                    type="button"
                    onClick={() => handleTogglePlatform("linkedin")}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
                      targetPlatforms.includes("linkedin")
                        ? "border-blue-600 bg-blue-600/5 text-blue-600"
                        : "border-border-primary bg-bg-app text-text-secondary hover:text-text-primary hover:border-border-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn Post</span>
                    </div>
                    {targetPlatforms.includes("linkedin") ? (
                      <div className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-full border border-border-primary shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Select
                    label="Objective"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    options={GOALS}
                    className="py-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Select
                    label="Call to Action (CTA)"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    options={CTAS}
                    className="py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Select
                  label="Visual Aesthetic / Image Style"
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value)}
                  options={VISUAL_STYLES}
                  className="py-2 text-xs"
                />
              </div>

              {/* References & Inspiration */}
              <div className="border-t border-border-primary pt-4 space-y-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-text-secondary" />
                  <span>Inspiration & References</span>
                </h4>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary">
                    Reference URLs / Links
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. competitor posts"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                      className="flex-1 border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1 text-xs focus:border-instagram-pink outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="bg-bg-hover hover:bg-slate-200 border border-border-primary px-3 py-1 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {referenceUrls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {referenceUrls.map((u, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 bg-bg-app border border-border-primary rounded-full px-2 py-0.5 text-[10px] text-text-secondary max-w-[200px] truncate"
                        >
                          <Link2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {u.replace(/^https?:\/\/(www\.)?/, "")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUrl(u)}
                          >
                            <X className="w-2.5 h-2.5 hover:text-text-primary" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary">
                    Copy inspiration text / transcripts
                  </label>
                  <textarea
                    placeholder="Paste competitor text, copy drafts, or transcripts for context..."
                    value={referenceText}
                    onChange={(e) => setReferenceText(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-2 text-xs focus:border-instagram-pink outline-none transition min-h-[60px]"
                  />
                </div>
              </div>

              {/* Brand Guidelines */}
              <div className="border-t border-border-primary pt-4 space-y-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-text-secondary" />
                  <span>Workspace Brand Voice</span>
                </h4>

                {activeWorkspace ? (
                  <div className="bg-bg-app border border-border-primary rounded-xl p-3.5 space-y-3 text-xs">
                    {/* Brand Name */}
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-text-secondary">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={localBrandName}
                        onChange={(e) => setLocalBrandName(e.target.value)}
                        className="border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none"
                      />
                    </div>

                    {/* Website */}
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-text-secondary">
                        Website URL
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. https://example.com"
                        value={localWebsite}
                        onChange={(e) => setLocalWebsite(e.target.value)}
                        className="border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none"
                      />
                    </div>

                    {/* Target Audience */}
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-text-secondary">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Eco-conscious millennials"
                        value={localTargetAudience}
                        onChange={(e) => setLocalTargetAudience(e.target.value)}
                        className="border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none"
                      />
                    </div>

                    {/* Brand Voice / Description */}
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-text-secondary">
                        Brand Voice Description
                      </label>
                      <textarea
                        placeholder="Describe the overall personality and style..."
                        value={localBrandVoice}
                        onChange={(e) => setLocalBrandVoice(e.target.value)}
                        className="border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none min-h-[60px] resize-y"
                      />
                    </div>

                    {/* Active Tone */}
                    <div className="flex flex-col gap-1">
                      <Select
                        label="Active Tone"
                        value={localTone}
                        onChange={handleToneChange}
                        options={TONES.map((t) => ({
                          value: t,
                          label: t.charAt(0).toUpperCase() + t.slice(1),
                        }))}
                        className="py-1.5 text-xs"
                      />
                    </div>

                    {/* Active Keywords */}
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-text-secondary">
                        Active Keywords
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. organic"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                          className="flex-1 border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1 text-xs focus:border-instagram-pink outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddKeyword}
                          className="bg-bg-hover hover:bg-slate-200 border border-border-primary px-3 py-1 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                      {localKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 max-h-[80px] overflow-y-auto pr-1">
                          {localKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="inline-flex items-center gap-0.5 bg-bg-card border border-border-primary rounded-full px-2 py-0.5 text-[10px] text-text-primary"
                            >
                              <span>#{kw}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyword(kw)}
                              >
                                <X className="w-2.5 h-2.5 text-text-secondary hover:text-text-primary" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Writing Rules */}
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-text-secondary">
                        Writing Rules
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. No passive voice"
                          value={ruleInput}
                          onChange={(e) => setRuleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddRule();
                            }
                          }}
                          className="flex-1 border border-border-primary bg-bg-card text-text-primary rounded-xl px-2.5 py-1 text-xs focus:border-instagram-pink outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddRule}
                          className="bg-bg-hover hover:bg-slate-200 border border-border-primary px-3 py-1 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                      {localRules.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1.5 max-h-[100px] overflow-y-auto pr-1">
                          {localRules.map((rule, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-1.5 bg-bg-card border border-border-primary rounded-lg px-2.5 py-1 text-[10px] text-text-primary"
                            >
                              <span className="truncate">{rule}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRule(rule)}
                              >
                                <X className="w-2.5 h-2.5 text-text-secondary hover:text-text-primary shrink-0" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary italic">
                    No workspace active.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-xs font-bold hover:opacity-95 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing references & generating copies...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Content</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Middle Column: Live Platform Previews (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
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
              <div className="bg-bg-card border border-border-primary rounded-xl p-1 flex gap-1 shadow-xs">
                {variations.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVariation(idx)}
                    className={`flex-1 text-[9px] font-bold py-1.5 rounded-lg transition text-center cursor-pointer ${
                      activeVarIdx === idx
                        ? "bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white"
                        : "text-text-secondary hover:text-text-primary bg-bg-app border border-transparent"
                    }`}
                  >
                    {v.name.split(" ")[0]}
                  </button>
                ))}
              </div>

              {/* Render Selected Preview Layout */}
              {activePlatformTab === "instagram" ? (
                /* INSTAGRAM CARD */
                <div className="bg-bg-card border border-border-primary rounded-2xl overflow-hidden shadow-md max-w-md mx-auto">
                  <div className="flex items-center justify-between p-3 border-b border-border-primary">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white font-black text-[10px]">
                        {localBrandName?.charAt(0) || "W"}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-text-primary">
                          {localBrandName || "Brand Name"}
                        </p>
                        <p className="text-[9px] text-text-secondary">
                          Sponsored • AI Mockup
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full aspect-square bg-bg-app flex items-center justify-center overflow-hidden border-b border-border-primary relative">
                    {generatedImageUrl && (
                      <img
                        src={generatedImageUrl}
                        alt="Mockup"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
                      {goal}
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-text-primary">
                      <Heart className="w-4.5 h-4.5 hover:text-red-500 transition cursor-pointer" />
                      <MessageCircle className="w-4.5 h-4.5 hover:opacity-80 transition cursor-pointer" />
                      <ShareIcon className="w-4.5 h-4.5 hover:opacity-80 transition cursor-pointer" />
                    </div>
                    <Bookmark className="w-4.5 h-4.5 text-text-primary hover:opacity-80 transition cursor-pointer" />
                  </div>

                  <div className="px-3 pb-3 space-y-1 text-[11px] text-text-primary">
                    <p className="leading-relaxed">
                      <span className="font-bold mr-1">
                        {localBrandName || "brand"}
                      </span>
                      {caption}
                    </p>
                    <p className="text-instagram-pink font-semibold">
                      {hashtags.map((h) => `#${h}`).join(" ")}
                    </p>
                  </div>
                </div>
              ) : (
                /* LINKEDIN CARD */
                <div className="bg-bg-card border border-border-primary rounded-2xl overflow-hidden shadow-md max-w-md mx-auto p-4 space-y-3 text-xs">
                  {/* LinkedIn Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-sm bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs">
                        {localBrandName?.charAt(0) || "W"}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary text-xs leading-snug flex items-center gap-1">
                          <span>{localBrandName || "Brand Name"}</span>
                          <span className="text-[9px] font-normal text-text-secondary bg-bg-app border border-border-primary px-1 rounded-sm">
                            2nd
                          </span>
                        </p>
                        <p className="text-[10px] text-text-secondary leading-none mt-0.5">
                          15,240 followers
                        </p>
                        <p className="text-[9px] text-text-secondary mt-0.5">
                          1h • Edited • 🌐
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-text-secondary hover:text-text-primary"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* LinkedIn Copy */}
                  <div className="space-y-2 text-text-primary text-[11px] leading-relaxed whitespace-pre-wrap">
                    <p>{liCaption}</p>
                    <p className="text-blue-700 dark:text-blue-400 font-semibold">
                      {liHashtags.map((h) => `#${h}`).join(" ")}
                    </p>
                  </div>

                  {/* Attachment card */}
                  {generatedImageUrl && (
                    <div className="border border-border-primary rounded-lg overflow-hidden bg-bg-app">
                      <img
                        src={generatedImageUrl}
                        alt="Attachment"
                        className="w-full object-cover max-h-56"
                      />
                      <div className="p-2 border-t border-border-primary">
                        <p className="font-bold text-[10px] truncate text-text-primary">
                          {goal} Update
                        </p>
                        <p className="text-[9px] text-text-secondary truncate">
                          {localWebsite
                            ? localWebsite.replace(/^https?:\/\/(www\.)?/, "")
                            : (localBrandName || "brand")
                                .toLowerCase()
                                .replace(/\s+/g, "") + ".com"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* LinkedIn Footer Actions */}
                  <div className="border-t border-border-primary pt-2 flex items-center justify-between text-text-secondary text-[10px] font-bold">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Like</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Comment</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Repost</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-blue-600 py-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 animate-none rotate-0" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Save / Launch Actions */}
              <div className="flex flex-col gap-2 pt-2">
                {state.accountType !== "individual" ? (
                  <button
                    onClick={() => handleSave("pending_approval")}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-xs font-bold hover:opacity-95 transition shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via Email & Telegram for Client Approval</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSave("approved")}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-xs font-bold hover:opacity-95 transition shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve & Schedule Post</span>
                  </button>
                )}
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
              {/* Tweak with AI */}
              <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-border-primary pb-2">
                  <Sparkles className="w-4 h-4 text-instagram-pink" />
                  <span>Polish & Tweak with AI</span>
                </h3>

                {/* Scope selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-semibold text-text-secondary">
                    Tweak Scope
                  </label>
                  <div className="flex gap-1.5 bg-bg-app p-1 border border-border-primary rounded-lg text-[9px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTweakScope("active")}
                      className={`flex-1 py-1 rounded transition cursor-pointer ${
                        tweakScope === "active"
                          ? "bg-bg-card shadow-xs text-text-primary"
                          : "text-text-secondary"
                      }`}
                    >
                      Active Tab Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setTweakScope("both")}
                      className={`flex-1 py-1 rounded transition cursor-pointer ${
                        tweakScope === "both"
                          ? "bg-bg-card shadow-xs text-text-primary"
                          : "text-text-secondary"
                      }`}
                    >
                      Both Channels
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-text-secondary">
                    Custom Tweak Directive
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. 'make it shorter'"
                      value={tweakInstruction}
                      onChange={(e) => setTweakInstruction(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyTweak(tweakInstruction);
                        }
                      }}
                      className="flex-1 border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyTweak(tweakInstruction)}
                      className="bg-instagram-pink text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
                    >
                      Tweak
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-semibold text-text-secondary block">
                    Quick Presets
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleApplyTweak("Make Shorter")}
                      className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
                    >
                      📝 Shorten Copy
                    </button>
                    <button
                      onClick={() => handleApplyTweak("Add More Emojis")}
                      className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
                    >
                      🌟 Add Emojis
                    </button>
                    <button
                      onClick={() =>
                        handleApplyTweak("Stronger Call to Action")
                      }
                      className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
                    >
                      🚀 Emphasize CTA
                    </button>
                    <button
                      onClick={() => handleApplyTweak("Exciting Bold Tone")}
                      className="text-[10px] bg-bg-app hover:bg-bg-hover border border-border-primary py-1 px-2 rounded-lg text-left text-text-primary transition truncate cursor-pointer"
                    >
                      🔥 Make Tone Bold
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual Fine-Tuning depending on active platform */}
              <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-border-primary pb-2">
                  <Edit3 className="w-4 h-4 text-text-secondary" />
                  <span>
                    Manual Edits:{" "}
                    {activePlatformTab === "instagram"
                      ? "Instagram"
                      : "LinkedIn"}
                  </span>
                </h3>

                {activePlatformTab === "instagram" ? (
                  /* Instagram Form */
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-text-secondary">
                        Instagram Caption
                      </label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none transition min-h-[80px]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-text-secondary">
                        Instagram Hashtags
                      </label>
                      <div className="flex flex-wrap gap-1 p-1.5 border border-border-primary bg-bg-app rounded-xl min-h-[35px] max-h-[100px] overflow-y-auto">
                        {hashtags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 bg-bg-card border border-border-primary rounded-full px-1.5 py-0.5 text-[9px] text-text-primary"
                          >
                            <span>#{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveHashtag(tag)}
                            >
                              <X className="w-2.5 h-2.5 hover:text-text-primary" />
                            </button>
                          </span>
                        ))}
                        <div className="flex items-center gap-1 border-l border-border-primary pl-1.5 ml-1">
                          <input
                            type="text"
                            placeholder="Tag"
                            value={newHashtag}
                            onChange={(e) => setNewHashtag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddHashtag();
                              }
                            }}
                            className="text-[9px] text-text-primary bg-transparent outline-none w-10"
                          />
                          <button type="button" onClick={handleAddHashtag}>
                            <Plus className="w-2.5 h-2.5 hover:text-instagram-pink" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* LinkedIn Form */
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-text-secondary">
                        LinkedIn Post Text
                      </label>
                      <textarea
                        value={liCaption}
                        onChange={(e) => setLinkedinCaption(e.target.value)}
                        className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none transition min-h-[90px]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-text-secondary">
                        LinkedIn Hashtags
                      </label>
                      <div className="flex flex-wrap gap-1 p-1.5 border border-border-primary bg-bg-app rounded-xl min-h-[35px] max-h-[100px] overflow-y-auto">
                        {liHashtags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 bg-bg-card border border-border-primary rounded-full px-1.5 py-0.5 text-[9px] text-text-primary"
                          >
                            <span>#{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLinkedinHashtag(tag)}
                            >
                              <X className="w-2.5 h-2.5 hover:text-text-primary" />
                            </button>
                          </span>
                        ))}
                        <div className="flex items-center gap-1 border-l border-border-primary pl-1.5 ml-1">
                          <input
                            type="text"
                            placeholder="Tag"
                            value={newLiHashtag}
                            onChange={(e) =>
                              setNewLinkedinHashtag(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddLinkedinHashtag();
                              }
                            }}
                            className="text-[9px] text-text-primary bg-transparent outline-none w-10"
                          />
                          <button
                            type="button"
                            onClick={handleAddLinkedinHashtag}
                          >
                            <Plus className="w-2.5 h-2.5 hover:text-instagram-pink" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Visual Concept Brief */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-text-secondary">
                    Visual Concept Brief
                  </label>
                  <textarea
                    value={
                      activePlatformTab === "instagram"
                        ? imageBrief
                        : liImageBrief
                    }
                    onChange={(e) => {
                      if (activePlatformTab === "instagram") {
                        setImageBrief(e.target.value);
                      } else {
                        setLinkedinImageBrief(e.target.value);
                      }
                    }}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-2.5 py-1.5 text-xs focus:border-instagram-pink outline-none transition min-h-[60px]"
                  />
                </div>
              </div>

              {/* Version History & Restoration */}
              <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-border-primary pb-2">
                  <Undo className="w-4 h-4 text-text-secondary" />
                  <span>Version History</span>
                </h3>

                <div className="relative border-l-2 border-border-primary pl-3 ml-1.5 space-y-4 py-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {history.map((hist, index) => (
                    <div key={index} className="relative text-[10px]">
                      <span
                        className={`absolute -left-[18.5px] top-1 w-2 h-2 rounded-full border border-bg-card ${
                          index === 0 ? "bg-instagram-pink" : "bg-slate-300"
                        }`}
                      />

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-text-primary">
                            v{hist.version}.0
                          </span>
                          <span className="text-[8px] text-text-secondary">
                            {new Date(hist.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-instagram-pink font-semibold">
                          {hist.action}
                        </p>
                        <p className="text-[9px] text-text-secondary line-clamp-1 italic">
                          "
                          {(activePlatformTab === "instagram"
                            ? hist.caption
                            : hist.liCaption) || hist.caption}
                          "
                        </p>

                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(hist)}
                            className="mt-1 text-[9px] font-bold text-blue-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Undo className="w-2.5 h-2.5" /> Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
