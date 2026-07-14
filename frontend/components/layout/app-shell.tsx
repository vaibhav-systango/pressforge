"use client";

import { NavLink } from "@/components/navigation/nav-link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/queries/use-app-state";
import { useAuth } from "@/lib/hooks/queries/use-auth";
import React, { useState, useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { InfiniteScroll } from "@/components/common/infinite-scroll";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { formatAccountTypeLabel } from "@/lib/auth/me-user";
import { formatOrganizationRole } from "@/lib/invitations/role-hierarchy";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Send,
  MailOpen,
  Search,
  BarChart3,
  Settings,
  ChevronDown,
  Plus,
  Bell,
  Sparkles,
  RefreshCw,
  LogOut,
  Building,
  ShieldAlert,
  Users,
  User,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, setActiveWorkspace, resetState, logout, updateState, refetch } = useAppState();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const router = useRouter();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showClientMenu, setShowClientMenu] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const debouncedClientSearch = useDebounce(clientSearch, 200);
console.log(state)
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
      return res.json() as Promise<any[]>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const LIMIT = 10;
      if (lastPage.length < LIMIT) return undefined;
      const totalLoaded = allPages.reduce((sum, page) => sum + page.length, 0);
      return totalLoaded;
    },
    enabled: Boolean(user?.organizationId),
  });

  const activeClients = clientsData ? clientsData.pages.flatMap((page) => page) : [];

  const handleClientSelect = useCallback(async (c: any) => {
    setShowClientMenu(false);

    // 1. Set the activeClientId in session state
    await updateState({ activeClientId: c.id });

    // 2. Fetch workspaces filtered by this client from backend
    try {
      const res = await fetch(`/api/workspaces?clientId=${encodeURIComponent(c.id)}`);
      if (res.ok) {
        const wsData = await res.json() as { workspaces: any[]; activeWorkspaceId: string | null };
        const clientWorkspaces = wsData.workspaces || [];

        // 3. Update the app-state cache with client-filtered workspaces
        queryClient.setQueryData(['app-state'], (old: any) => ({
          state: {
            ...(old?.state ?? {}),
            activeClientId: c.id,
            workspaces: clientWorkspaces,
            activeWorkspaceId: clientWorkspaces[0]?.id ?? null,
          },
        }));

        // 4. Set the first workspace as active on backend
        if (clientWorkspaces.length > 0) {
          await setActiveWorkspace(clientWorkspaces[0].id);
        } else {
          await setActiveWorkspace(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspaces for client:', err);
      // Fallback: set the client's single workspace if available
      await setActiveWorkspace(c.workspaceId || null);
    }
  }, [updateState, setActiveWorkspace, queryClient]);

  const isClient =
    user?.userType === "client" || state.currentUserType === "client";
  const isIndividual =
    user?.userType === "individual" ||
    state.currentUserType === "individual" ||
    state.accountType === "individual";
  const displayUserName = user?.name || state.currentUserName || "User";
  const displayOrgName = state.organizationName || "Forge Agencies";
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

  // When a client is selected, state.workspaces is already filtered by that client
  // (set by handleClientSelect or mergeBackendWorkspaces in state API).
  // So we just use state.workspaces directly.
  const filteredWorkspaces = state.workspaces;

  // Get active workspace details
  const activeWorkspace =
    filteredWorkspaces.find((w) => w.id === state.activeWorkspaceId) ||
    filteredWorkspaces[0];

  // Get active client details if any
  const currentClient = isClient
    ? state.clients.find((c) => c.id === state.activeClientId)
    : null;

  // Selected client for organization header dropdown based on activeClientId
  const selectedClient =
    state.clients.find((c) => c.id === state.activeClientId) ||
    activeClients.find((c) => c.id === state.activeClientId);

  // Calculate pending approvals count
  const pendingApprovalsCount = state.drafts.filter(
    (d) =>
      d.workspaceId === state.activeWorkspaceId &&
      d.status === "pending_approval",
  ).length;

  const handleWorkspaceChange = async (id: string) => {
    if (isClient) return; // Clients cannot change workspaces
    await setActiveWorkspace(id);
    setShowWorkspaceMenu(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-screen bg-bg-app text-text-primary transition-colors duration-200">
      {/* Sidebar Nav */}
      <aside className="w-64 border-r border-border-primary bg-bg-card flex flex-col justify-between fixed h-screen z-10 transition-colors duration-200">
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-text-primary flex items-center">
              PRESSFORGE<span className="text-instagram-pink ml-0.5">.AI</span>
            </span>
          </div>

          {/* Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() =>
                !isClient && setShowWorkspaceMenu(!showWorkspaceMenu)
              }
              disabled={isClient}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border border-border-primary transition duration-200 text-left ${
                isClient ? "opacity-85 cursor-not-allowed" : "hover:bg-bg-hover"
              }`}
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
              {!isClient && (
                <ChevronDown className="w-4 h-4 text-text-secondary shrink-0 ml-1" />
              )}
            </button>

            {showWorkspaceMenu && !isClient && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-bg-card border border-border-primary rounded-xl shadow-lg z-20 py-1.5 transition-colors duration-200">
                {filteredWorkspaces.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-text-secondary text-center">
                    No workspaces assigned to client
                  </div>
                ) : (
                  filteredWorkspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => handleWorkspaceChange(ws.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-bg-hover transition duration-150 ${
                        ws.id === state.activeWorkspaceId
                          ? "bg-bg-app font-medium"
                          : ""
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-text-secondary text-xs font-bold">
                        {ws.name.charAt(0)}
                      </div>
                      <span className="text-sm text-text-primary truncate">
                        {ws.name}
                      </span>
                    </button>
                  ))
                )}
                <div className="border-t border-border-primary mt-1.5 pt-1.5 px-3">
                  <NavLink
                    href="/app/workspaces?new=true"
                    className="flex items-center gap-2 text-xs text-instagram-pink font-semibold hover:opacity-80 transition duration-150 py-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Workspace
                  </NavLink>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {isClient ? (
              // Restricted client navigation view
              <>
                <div className="px-3 py-1.5 mb-1 text-[10px] font-bold text-instagram-pink uppercase tracking-wider bg-pink-50/40 dark:bg-pink-950/20 rounded-lg flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Client Access Portal</span>
                </div>

                <NavLink
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
                </NavLink>

                <NavLink
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
                </NavLink>

                <NavLink
                  href="/app/approvals"
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
                    <span>Client Approvals</span>
                  </div>
                  {pendingApprovalsCount > 0 && (
                    <span className="bg-instagram-pink text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </NavLink>

                <NavLink
                  href="/app/analytics"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Performance Stats</span>
                </NavLink>

                <NavLink
                  href="/app/settings"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </NavLink>

                <NavLink
                  href="/app/workspaces"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <Building className="w-4 h-4" />
                  <span>Workspace Profile</span>
                </NavLink>
              </>
            ) : (
              // Agency / Full navigation view
              <>
                <NavLink
                  href="/app/content"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <Calendar className="w-4 h-4" />
                  <span>Content Planner</span>
                </NavLink>

                <NavLink
                  href="/app/approvals"
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
                  {pendingApprovalsCount > 0 && (
                    <span className="bg-instagram-pink text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </NavLink>

                <NavLink
                  href="/app/publishing"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <Send className="w-4 h-4" />
                  <span>Publishing Queue</span>
                </NavLink>


                <NavLink
                  href="/app/analytics"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`
                  }
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </NavLink>

                <div className="border-t border-border-primary my-2 pt-2 flex flex-col gap-1.5">
                  <NavLink
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
                  </NavLink>

                  {!isIndividual && (
                    <NavLink
                      href="/app/clients"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                          isActive
                            ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                            : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                        }`
                      }
                    >
                      <Users className="w-4 h-4" />
                      <span>Client Portals</span>
                    </NavLink>
                  )}

                  <NavLink
                    href="/app/workspaces"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                        isActive
                          ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                      }`
                    }
                  >
                    <Building className="w-4 h-4" />
                    <span>Workspaces</span>
                  </NavLink>

                  <NavLink
                    href="/app/settings"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                        isActive
                          ? "bg-bg-hover text-instagram-pink font-semibold border-l-2 border-instagram-pink"
                          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                      }`
                    }
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
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
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border-primary bg-bg-card px-8 flex items-center justify-between sticky top-0 z-9 transition-colors duration-200">
          <div className="flex items-center gap-4">
            {/* Org Switcher & Client Selector */}
            {!isClient ? (
              isIndividual ? (
                /* Individual: Only user's name selected, no org dropdown, no client dropdown */
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-primary text-xs font-semibold text-text-primary bg-bg-app">
                  <User className="w-3.5 h-3.5 text-instagram-pink" />
                  <span>{displayUserName}</span>
                </div>
              ) : (
                /* Organization: Org dropdown + Client dropdown */
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setShowOrgMenu(!showOrgMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-primary text-xs font-semibold text-text-primary hover:bg-bg-hover transition duration-150"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>{displayOrgName}</span>
                      <ChevronDown className="w-3 h-3 text-text-secondary" />
                    </button>

                    {showOrgMenu && (
                      <div className="absolute top-full left-0 mt-1 bg-bg-card border border-border-primary rounded-lg shadow-lg z-20 py-1 w-48 transition-colors duration-200">
                        <div className="px-3 py-1 text-[10px] text-text-secondary font-semibold tracking-wider uppercase">
                          Brand Org
                        </div>
                        <button className="w-full text-left px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-hover bg-bg-app">
                          {displayOrgName}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Client Switcher */}
                  <div className="relative">
                    <button
                      onClick={() => setShowClientMenu(!showClientMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-primary text-xs font-semibold text-text-primary hover:bg-bg-hover transition duration-150"
                    >
                      <Users className="w-3.5 h-3.5 text-text-secondary" />
                      <span>
                        {selectedClient ? (selectedClient.name || selectedClient.fullName) : "Select Client"}
                      </span>
                      <ChevronDown className="w-3 h-3 text-text-secondary" />
                    </button>

                    {showClientMenu && (
                      <div className="absolute top-full left-0 mt-1 bg-bg-card border border-border-primary rounded-lg shadow-lg z-20 py-1 w-64 transition-colors duration-200">
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
                            {activeClients.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => handleClientSelect(c)}
                                className={`w-full text-left px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-hover transition duration-150 ${
                                  state.activeClientId === c.id || (c.workspaceId && activeWorkspace?.id === c.workspaceId)
                                    ? "bg-bg-app font-bold text-instagram-pink"
                                    : ""
                                }`}
                              >
                                {c.name || c.fullName}
                              </button>
                            ))}
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pink-200 dark:border-pink-900 bg-pink-50/50 dark:bg-pink-950/20 text-xs font-bold text-instagram-pink">
                <Building className="w-3.5 h-3.5" />
                <span>{displayOrgName}</span>
              </div>
            )}

            <div className="h-4 w-[1px] bg-border-primary"></div>

            {/* Quick Stats Summary */}
            <p className="text-xs text-text-secondary hidden sm:block">
              Active Workspace:{" "}
              <span className="font-semibold text-text-primary">
                {activeWorkspace?.name}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Notifications Indicator - Hide for clients */}
            {!isClient && (
              <button className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-text-primary relative transition duration-150">
                <Bell className="w-4 h-4" />
                {pendingApprovalsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-instagram-pink"></span>
                )}
              </button>
            )}

            {/* Quick Create AI Draft Button - Hide for clients */}
            {!isClient && (
              <NavLink
                href="/app/content/new"
                className="flex items-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white px-4 py-2 rounded-full text-xs font-semibold hover:opacity-95 transition duration-150 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create AI Draft</span>
              </NavLink>
            )}
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="p-8 flex-1 flex flex-col bg-bg-app transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
