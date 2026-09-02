"use client";

import { NavLink } from "@/components/navigation/nav-link";
import { usePathname } from "next/navigation";
import { useAppState } from "@/lib/queries/use-app-state";
import { useAuth } from "@/lib/hooks/queries/use-auth";
import { usePaginatedDrafts } from "@/lib/hooks/queries/use-paginated-drafts";
import type { AppState, ClientUser, Workspace } from "@/lib/types";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { InfiniteScroll } from "@/components/common/infinite-scroll";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { formatAccountTypeLabel } from "@/lib/auth/me-user";
import { formatOrganizationRole } from "@/lib/invitations/role-hierarchy";
import {
  Calendar,
  MessageSquare,
  Send,
  Settings,
  ChevronDown,
  Plus,
  RefreshCw,
  LogOut,
  Building,
  Users,
  User,
  Menu,
  X,
  Loader2,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, setActiveWorkspace, resetState, logout, updateState } = useAppState();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const pathname = usePathname();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showHeaderWorkspaceMenu, setShowHeaderWorkspaceMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showClientMenu, setShowClientMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth loading state for workspace / client switching
  const [isSwitching, setIsSwitching] = useState(false);
  const [, setSwitchingTargetName] = useState<string>('');
  const [switchingType, setSwitchingType] = useState<'workspace' | 'client' | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Smooth loading state for sidebar route navigation
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingPageTitle, setNavigatingPageTitle] = useState<string>('');

  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setNavigatingPageTitle('');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, isNavigating]);

  const handleNavClick = (targetHref: string, pageTitle: string) => {
    if (pathname !== targetHref && !pathname.startsWith(`${targetHref}/`)) {
      setIsNavigating(true);
      setNavigatingPageTitle(pageTitle);
    }
    setMobileMenuOpen(false);
  };

  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const headerWorkspaceMenuRef = useRef<HTMLDivElement>(null);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const clientMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(target)) {
        setShowWorkspaceMenu(false);
      }
      if (headerWorkspaceMenuRef.current && !headerWorkspaceMenuRef.current.contains(target)) {
        setShowHeaderWorkspaceMenu(false);
      }
      if (orgMenuRef.current && !orgMenuRef.current.contains(target)) {
        setShowOrgMenu(false);
      }
      if (clientMenuRef.current && !clientMenuRef.current.contains(target)) {
        setShowClientMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const [clientSearch, setClientSearch] = useState("");
  const debouncedClientSearch = useDebounce(clientSearch, 200);

  const {
    data: clientsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["header-clients", user?.organizationId, debouncedClientSearch],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.organizationId) return [];
      const queryParams = new URLSearchParams();
      if (debouncedClientSearch) queryParams.set("search", debouncedClientSearch);
      queryParams.set("status_filter", "active");
      queryParams.set("role_filter", "client");
      queryParams.set("skip", String(pageParam));
      queryParams.set("limit", "10");

      const res = await fetch(`/api/organizations/${user.organizationId}/clients?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json() as Promise<ClientUser[]>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: ClientUser[], allPages: ClientUser[][]) => {
      const LIMIT = 10;
      if (lastPage.length < LIMIT) return undefined;
      const totalLoaded = allPages.reduce((sum, page) => sum + page.length, 0);
      return totalLoaded;
    },
    enabled: Boolean(user?.organizationId),
  });

  const activeClients = clientsData ? clientsData.pages.flatMap((page) => page) : [];

  const handleClientSelect = useCallback(
    async (c: ClientUser) => {
      if (isSwitching) return;

      setIsSwitching(true);
      setSwitchingType("client");
      setSwitchingTargetName(c.name);
      setSwitchingId(c.id);
      setShowClientMenu(false);

      const startTime = Date.now();

      try {
        // 1. Set the activeClientId in session state
        await updateState({ activeClientId: c.id });

        // 2. Fetch workspaces filtered by this client from backend
        const res = await fetch(`/api/workspaces?clientId=${encodeURIComponent(c.id)}`);
        if (res.ok) {
          const wsData = (await res.json()) as { workspaces: Workspace[]; activeWorkspaceId: string | null };
          const clientWorkspaces = wsData.workspaces || [];

          // 3. Update the app-state cache with client-filtered workspaces
          queryClient.setQueryData(["app-state"], (old: { state: AppState } | undefined) => {
            if (!old?.state) return old;
            return {
              state: {
                ...old.state,
                activeClientId: c.id,
                workspaces: clientWorkspaces,
                activeWorkspaceId: clientWorkspaces[0]?.id ?? null,
              },
            };
          });

          // 4. Set the first workspace as active on backend
          if (clientWorkspaces.length > 0) {
            await setActiveWorkspace(clientWorkspaces[0].id);
          } else {
            await setActiveWorkspace(null);
          }
        }
        await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      } catch (err) {
        console.error("Failed to fetch workspaces for client:", err);
        try {
          await setActiveWorkspace(c.workspaceId || null);
        } catch {}
      } finally {
        const elapsed = Date.now() - startTime;
        if (elapsed < 350) {
          await new Promise((resolve) => setTimeout(resolve, 350 - elapsed));
        }

        setIsSwitching(false);
        setSwitchingType(null);
        setSwitchingTargetName("");
        setSwitchingId(null);
      }
    },
    [isSwitching, updateState, setActiveWorkspace, queryClient]
  );

  const isClient =
    user?.userType === "client" || state.currentUserType === "client";
  const isIndividual =
    user?.userType === "individual" ||
    state.currentUserType === "individual" ||
    state.accountType === "individual";

  const availableClients = activeClients.length > 0 ? activeClients : state.clients;

  useEffect(() => {
    if (user && !isClient && !isIndividual && availableClients.length > 0) {
      const isSelectedValid = availableClients.some((c) => c.id === state.activeClientId);
      if (!state.activeClientId || !isSelectedValid) {
        const firstClient = availableClients[0];
        const timer = setTimeout(() => {
          handleClientSelect(firstClient);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isClient, isIndividual, availableClients, state.activeClientId, handleClientSelect]);

  const displayUserName = user?.name || state.currentUserName || "User";
  const displayOrgName = user?.organizationName || state.organizationName || "Forge Agencies";
  const userInitials = displayUserName
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  const displayRole = user
    ? user.organizationRole
      ? formatOrganizationRole(user.organizationRole)
      : formatAccountTypeLabel(user.accountType)
    : (isClient ? "Client Reviewer" : "Brand Manager");

  const filteredWorkspaces = state.workspaces;

  const activeWorkspace =
    filteredWorkspaces.find((w) => w.id === state.activeWorkspaceId) ||
    filteredWorkspaces[0];

  const selectedClient =
    availableClients.find((c) => c.id === state.activeClientId) ||
    availableClients[0];

  const { counts: draftCounts, isInitialLoading: isDraftsLoading } = usePaginatedDrafts({
    workspaceId: activeWorkspace?.id ?? state.activeWorkspaceId,
    limit: 1,
  });

  const pendingApprovalsCount = draftCounts.pending;

  const handleWorkspaceChange = useCallback(
    async (id: string, name?: string) => {
      if (isSwitching) return;
      const wsName = name || filteredWorkspaces.find((w) => w.id === id)?.name || "Workspace";

      setIsSwitching(true);
      setSwitchingType("workspace");
      setSwitchingTargetName(wsName);
      setSwitchingId(id);
      const startTime = Date.now();

      try {
        await setActiveWorkspace(id);
        await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      } catch (err) {
        console.error("Failed to change workspace:", err);
      } finally {
        setShowWorkspaceMenu(false);
        setShowHeaderWorkspaceMenu(false);

        const elapsed = Date.now() - startTime;
        if (elapsed < 350) {
          await new Promise((resolve) => setTimeout(resolve, 350 - elapsed));
        }

        setIsSwitching(false);
        setSwitchingType(null);
        setSwitchingTargetName("");
        setSwitchingId(null);
      }
    },
    [isSwitching, filteredWorkspaces, setActiveWorkspace, queryClient]
  );

  const handleLogout = async () => {
    await logout();
    window.location.href = "/auth/login";
  };

  return (
    <div className="flex min-h-screen bg-bg-app text-text-primary transition-colors duration-200">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Nav */}
      <aside
        className={`w-64 border-r border-border-primary bg-bg-card flex flex-col justify-between fixed top-0 bottom-0 left-0 h-screen z-50 lg:z-10 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Logo & Mobile Close */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight text-text-primary flex items-center">
              PRESSFORGE<span className="text-instagram-pink ml-0.5">.AI</span>
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-bg-hover text-text-secondary lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="relative" ref={workspaceMenuRef}>
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              disabled={isSwitching}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border-primary hover:bg-bg-hover transition duration-200 text-left cursor-pointer disabled:opacity-80"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {activeWorkspace?.name?.charAt(0) || "W"}
                </div>
                <div className="truncate">
                  <p className="text-xs text-text-secondary font-medium leading-none">
                    Workspace
                  </p>
                  <p className="text-sm font-semibold text-text-primary truncate mt-0.5">
                    {activeWorkspace?.name || "No Workspace"}
                  </p>
                </div>
              </div>
              {isSwitching && switchingType === "workspace" ? (
                <Loader2 className="w-4 h-4 text-instagram-pink animate-spin shrink-0 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-secondary shrink-0 ml-1" />
              )}
            </button>

            {showWorkspaceMenu && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-bg-card border border-border-primary rounded-xl shadow-lg z-20 py-1.5 transition-colors duration-200">
                {filteredWorkspaces.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-text-secondary text-center">
                    No workspaces assigned to client
                  </div>
                ) : (
                  filteredWorkspaces.map((ws) => {
                    const isTarget = switchingId === ws.id;
                    return (
                      <button
                        key={ws.id}
                        disabled={isSwitching}
                        onClick={() => handleWorkspaceChange(ws.id, ws.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-bg-hover transition duration-150 cursor-pointer ${
                          ws.id === (activeWorkspace?.id || state.activeWorkspaceId)
                            ? "bg-bg-app font-semibold text-instagram-pink"
                            : ""
                        } ${isTarget ? "opacity-75" : ""}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-text-secondary text-xs font-bold shrink-0">
                            {ws.name.charAt(0)}
                          </div>
                          <span className="text-sm text-text-primary truncate">
                            {ws.name}
                          </span>
                        </div>
                        {isTarget && (
                          <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })
                )}
                {!isClient && (
                  <div className="border-t border-border-primary mt-1.5 pt-1.5 px-3">
                    <NavLink
                      href="/app/workspaces?new=true"
                      className="flex items-center gap-2 text-xs text-instagram-pink font-semibold hover:opacity-80 transition duration-150 py-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Workspace
                    </NavLink>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {isClient ? (
              // Restricted client navigation view
              <>
                {/* <div className="px-3 py-1.5 mb-1 text-[10px] font-bold text-instagram-pink uppercase tracking-wider bg-pink-50/40 dark:bg-pink-950/20 rounded-lg flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Client Access Portal</span>
                </div> */}

                {/* <NavLink
                  href="/app"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink> */}

                {/* <NavLink
                  href="/app/connect"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <MailOpen className="w-4 h-4 text-instagram-pink" />
                  <span className="font-semibold text-instagram-pink">
                    Connect Channels
                  </span>
                </NavLink> */}

                <NavLink
                  href="/app/approvals"
                  onClick={() => handleNavClick("/app/approvals", isClient ? "My Approvals" : "Client Approvals")}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4" />
                    <span>{isClient ? "My Approvals" : "Client Approvals"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isNavigating && navigatingPageTitle === (isClient ? "My Approvals" : "Client Approvals") && (
                      <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0" />
                    )}
                    {isDraftsLoading ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-instagram-pink animate-pulse shrink-0" />
                    ) : pendingApprovalsCount > 0 ? (
                      <span className="bg-instagram-pink text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {pendingApprovalsCount}
                      </span>
                    ) : null}
                  </div>
                </NavLink>

                <NavLink
                  href="/app/settings"
                  onClick={() => handleNavClick("/app/settings", "Account Settings")}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </div>
                  {isNavigating && navigatingPageTitle === "Account Settings" && (
                    <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0" />
                  )}
                </NavLink>

                <NavLink
                  href="/app/workspaces"
                  onClick={() => handleNavClick("/app/workspaces", "Workspace Profile")}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4" />
                    <span>Workspace Profile</span>
                  </div>
                  {isNavigating && navigatingPageTitle === "Workspace Profile" && (
                    <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0" />
                  )}
                </NavLink>
              </>
            ) : (
              // Agency / Full navigation view
              <>
                <NavLink
                  href="/app/content"
                  onClick={() => handleNavClick("/app/content", "Content Planner")}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4" />
                    <span>Content Planner</span>
                  </div>
                  {isNavigating && navigatingPageTitle === "Content Planner" && (
                    <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0" />
                  )}
                </NavLink>

                <NavLink
                  href="/app/approvals"
                  onClick={() => handleNavClick("/app/approvals", "Approvals")}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4" />
                    <span>Approvals</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isNavigating && navigatingPageTitle === "Approvals" && (
                      <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0" />
                    )}
                    {isDraftsLoading ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-instagram-pink animate-pulse shrink-0" />
                    ) : pendingApprovalsCount > 0 ? (
                      <span className="bg-instagram-pink text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {pendingApprovalsCount}
                      </span>
                    ) : null}
                  </div>
                </NavLink>

                <NavLink
                  href="/app/publishing"
                  onClick={() => handleNavClick("/app/publishing", "Publishing Queue")}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Send className="w-4 h-4" />
                    <span>Publishing Queue</span>
                  </div>
                  {isNavigating && navigatingPageTitle === "Publishing Queue" && (
                    <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0" />
                  )}
                </NavLink>

                <div className="border-t border-border-primary my-2 pt-2 flex flex-col gap-1.5">
                  {!isIndividual && (
                    <NavLink
                      href="/app/clients"
                      onClick={() => handleNavClick("/app/clients", "Client Portals")}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                          isActive
                            ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                            : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4" />
                        <span>Client Portals</span>
                      </div>
                      {isNavigating && navigatingPageTitle === "Client Portals" && (
                        <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0" />
                      )}
                    </NavLink>
                  )}

                  <NavLink
                    href="/app/workspaces"
                    onClick={() => handleNavClick("/app/workspaces", "Workspaces")}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                        isActive
                          ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4" />
                      <span>Workspaces</span>
                    </div>
                    {isNavigating && navigatingPageTitle === "Workspaces" && (
                      <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0" />
                    )}
                  </NavLink>

                  <NavLink
                    href="/app/settings"
                    onClick={() => handleNavClick("/app/settings", "Settings")}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                        isActive
                          ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </div>
                    {isNavigating && navigatingPageTitle === "Settings" && (
                      <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0" />
                    )}
                  </NavLink>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-primary flex flex-col gap-2 bg-bg-card transition-colors duration-200">
          <div className="flex items-center gap-3 p-1.5">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-text-primary text-sm">
              {userInitials}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary leading-none">
                {displayUserName}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {displayRole}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-primary">
            {!isClient && (
              <button
                onClick={resetState}
                title="Reset Application State"
                className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-instagram-pink transition duration-150 py-1 px-1.5 rounded-lg hover:bg-bg-hover"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition duration-150 py-1 px-1.5 rounded-lg hover:bg-bg-hover font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Portal</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-0 lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Top Header Bar */}
        <header className="min-h-16 py-2 border-b border-border-primary bg-bg-card px-3 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
          <div className="flex items-center gap-1.5 sm:gap-4 py-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg hover:bg-bg-hover text-text-primary lg:hidden shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Org Switcher & Client Selector */}
            {!isClient ? (
              isIndividual ? (
                /* Individual: Only user's name selected, no org dropdown, no client dropdown */
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-primary text-xs font-semibold text-text-primary bg-bg-app shrink-0">
                  <User className="w-3.5 h-3.5 text-instagram-pink" />
                  <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none">{displayUserName}</span>
                </div>
              ) : (
                /* Organization: Org dropdown + Client dropdown */
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                  <div className="relative" ref={orgMenuRef}>
                    <button
                      onClick={() => {
                        setShowOrgMenu((prev) => !prev);
                        setShowClientMenu(false);
                      }}
                      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-border-primary text-xs font-semibold text-text-primary hover:bg-bg-hover transition duration-150 shrink-0"
                    >
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">{displayOrgName}</span>
                      <ChevronDown className="w-3 h-3 text-text-secondary shrink-0" />
                    </button>

                    {showOrgMenu && (
                      <div className="absolute top-full left-0 mt-1 bg-bg-card border border-border-primary rounded-lg shadow-xl z-50 py-1 w-48 max-w-[calc(100vw-2rem)] transition-colors duration-200">
                        <div className="px-3 py-1 text-[10px] text-text-secondary font-semibold tracking-wider uppercase">
                          Brand Org
                        </div>
                        <button 
                          onClick={() => setShowOrgMenu(false)}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-hover bg-bg-app"
                        >
                          {displayOrgName}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Client Switcher */}
                  <div className="relative" ref={clientMenuRef}>
                    <button
                      onClick={() => {
                        setShowClientMenu((prev) => !prev);
                        setShowOrgMenu(false);
                      }}
                      disabled={isSwitching}
                      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-border-primary text-xs font-semibold text-text-primary hover:bg-bg-hover transition duration-150 shrink-0 cursor-pointer disabled:opacity-80"
                    >
                      <Users className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                      <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">
                        {selectedClient ? selectedClient.name : "Select Client"}
                      </span>
                      {isSwitching && switchingType === "client" ? (
                        <Loader2 className="w-3 h-3 text-instagram-pink animate-spin shrink-0 ml-1" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-text-secondary shrink-0 ml-1" />
                      )}
                    </button>

                    {showClientMenu && (
                      <div className="absolute top-full right-0 sm:left-auto sm:right-0 mt-1 bg-bg-card border border-border-primary rounded-lg shadow-xl z-50 py-1 w-64 max-w-[calc(100vw-2rem)] transition-colors duration-200">
                        <div className="px-3 py-1 text-[10px] text-text-secondary font-semibold tracking-wider uppercase">
                          Select Client
                        </div>
                        {/* Search Input */}
                        <div className="px-3 py-1.5 border-b border-border-primary">
                          <input
                            type="text"
                            placeholder="Search active clients..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2 py-1 border border-border-primary bg-bg-app text-text-primary rounded-md text-xs focus:border-instagram-pink outline-none"
                          />
                        </div>
                        {/* Scrollable list */}
                        <div className="max-h-60 overflow-y-auto mt-1">
                          <InfiniteScroll
                            hasMore={hasNextPage}
                            onLoadMore={fetchNextPage}
                            isLoading={isFetchingNextPage}
                          >
                            {activeClients.map((c) => {
                              const isTarget = switchingId === c.id;
                              return (
                                <button
                                  key={c.id}
                                  disabled={isSwitching}
                                  onClick={() => handleClientSelect(c)}
                                  className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-hover transition duration-150 cursor-pointer ${
                                    state.activeClientId === c.id || (c.workspaceId && activeWorkspace?.id === c.workspaceId)
                                      ? "bg-bg-app font-bold text-instagram-pink"
                                      : ""
                                  } ${isTarget ? "opacity-75" : ""}`}
                                >
                                  <span className="truncate">{c.name}</span>
                                  {isTarget && (
                                    <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                            {activeClients.length === 0 && (
                              <div className="px-3 py-2 text-xs text-text-secondary italic">
                                No clients available
                              </div>
                            )}
                          </InfiniteScroll>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pink-200 dark:border-pink-900 bg-pink-50/50 dark:bg-pink-950/20 text-xs font-bold text-instagram-pink shrink-0">
                <Building className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{displayOrgName}</span>
              </div>
            )}

            <div className="h-4 w-[1px] bg-border-primary shrink-0 hidden md:block"></div>

            {/* Active Workspace Selector Header Dropdown */}
            <div className="relative hidden md:block" ref={headerWorkspaceMenuRef}>
              <button
                onClick={() => setShowHeaderWorkspaceMenu(!showHeaderWorkspaceMenu)}
                disabled={isSwitching}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-primary text-xs text-text-secondary hover:bg-bg-hover transition duration-150 shrink-0 cursor-pointer disabled:opacity-80"
              >
                <span>Active Workspace:</span>
                <span className="font-semibold text-text-primary">
                  {activeWorkspace?.name || "Select Workspace"}
                </span>
                {isSwitching && switchingType === "workspace" ? (
                  <Loader2 className="w-3 h-3 text-instagram-pink animate-spin shrink-0 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-text-secondary shrink-0 ml-1" />
                )}
              </button>

              {showHeaderWorkspaceMenu && (
                <div className="absolute top-full left-0 mt-1 bg-bg-card border border-border-primary rounded-xl shadow-lg z-50 py-1.5 w-56 transition-colors duration-200">
                  <div className="px-3 py-1 text-[10px] text-text-secondary font-semibold tracking-wider uppercase">
                    Select Workspace
                  </div>
                  {filteredWorkspaces.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-text-secondary text-center">
                      No workspaces assigned
                    </div>
                  ) : (
                    filteredWorkspaces.map((ws) => {
                      const isTarget = switchingId === ws.id;
                      return (
                        <button
                          key={ws.id}
                          disabled={isSwitching}
                          onClick={() => handleWorkspaceChange(ws.id, ws.name)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-bg-hover transition duration-150 cursor-pointer ${
                            ws.id === (activeWorkspace?.id || state.activeWorkspaceId)
                              ? "bg-bg-app font-semibold text-instagram-pink"
                              : "text-text-primary"
                          } ${isTarget ? "opacity-75" : ""}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-text-secondary text-[10px] font-bold shrink-0">
                              {ws.name.charAt(0)}
                            </div>
                            <span className="text-xs truncate">{ws.name}</span>
                          </div>
                          {isTarget && (
                            <Loader2 className="w-3.5 h-3.5 text-instagram-pink animate-spin shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
            {/* Theme Toggle Button */}
            <ThemeToggle />
          </div>

          {/* Top Progress Loading Bar */}
          {(isSwitching || isNavigating) && (
            <div className="fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden bg-pink-100 dark:bg-pink-950/40">
              <div className="h-full bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#515BD4] animate-pulse w-full" />
            </div>
          )}
        </header>

        {/* Dynamic Route Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col bg-bg-app transition-colors duration-200 min-w-0 overflow-x-hidden relative">
          {/* Main Circle Loader with subtle background blur */}
          {(isSwitching || isNavigating) && (
            <div className="absolute inset-0 z-40 backdrop-blur-[2px] bg-bg-app/20 flex items-center justify-center pointer-events-none transition-all duration-200">
              <Loader2 className="w-8 h-8 text-instagram-pink animate-spin" />
            </div>
          )}

          <div className={`flex-1 flex flex-col transition-all duration-200 ${(isSwitching || isNavigating) ? 'blur-[1px] opacity-90 pointer-events-none' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
