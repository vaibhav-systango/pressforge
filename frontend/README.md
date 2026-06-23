# PressForge Frontend Portal Architecture

PressForge is a production-grade, secure, and highly optimized frontend boilerplate designed with a modular, feature-based architecture. This repository serves as a fresh, pre-configured codebase ready to start implementing Figma design mockups directly.

---

## 🚀 Tech Stack & Design System

The portal is built on a modern, high-performance technology stack, maximizing type safety, development speed, and maintainability:

*   **Core Framework:** [Next.js 15+](https://nextjs.org/) using the **App Router** for optimized routing, server-side pre-rendering (SSR), and layouts.
*   **Language:** [TypeScript](https://www.typescriptlang.org/) configured with strict type-checking and clean alias mapping (`@/*` -> `./src/*`).
*   **UI Components:** [Mantine UI v7](https://mantine.dev/) for high-fidelity component primitives, custom notifications, accessibility, and interactive utilities.
*   **CSS Styling:** [Tailwind CSS v4](https://tailwindcss.com/) for fluid utility-first layout styling, seamlessly integrated with the Mantine design tokens.
*   **State Management & Data Fetching:** [TanStack React Query v5](https://tanstack.com/query/latest) for robust caching, refetching, and query mutations.
*   **Form Orchestration:** [React Hook Form](https://react-hook-form.com/) combined with [Zod](https://zod.dev/) for type-safe validation schemas.
*   **Testing Suite:** [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) with custom render providers pre-configured.

---

## 📂 Directory Structure

We adhere to a **feature-based structure**. Instead of grouping files strictly by technical role (e.g., all components in one folder, all queries in another), files are grouped by logical business domains inside `src/features/`.

```text
frontend/
├── .husky/                 # Pre-commit git hooks for code quality
├── src/
│   ├── app/                # Next.js App Router (Layouts, routes, metadata)
│   │   ├── (public)/       # Public routes (Landing Page, Login, Signup)
│   │   ├── (dashboard)/    # Guarded routes (Dashboard, Unauthorized)
│   │   ├── globals.css     # Global CSS rules (Tailwind v4 imports & theme links)
│   │   └── layout.tsx      # Root HTML shell wrapping all AppProviders
│   ├── assets/             # Global static resources (images, SVGs, illustrations)
│   ├── common/             # Reusable UI component wrappers (tables, inputs, layout components)
│   ├── components/         # Shared global application components (e.g., RoleGuard)
│   ├── constants/          # Global application-wide constants and config tokens
│   ├── features/           # Modular domain directories (Figma view implementations go here)
│   │   └── dashboard/      # Premium system workspace overview (showcase page)
│   │       ├── components/ # Local components (DashboardScreen, etc.)
│   │       └── api/        # Mock queries, state actions, endpoints
│   ├── hooks/              # Global custom hooks (responsive viewports, local storage)
│   ├── lib/                # Technical utility functions (cookies, testing wrappers)
│   ├── providers/          # Global React Context Wrappers (Auth, Mantine, Query client)
│   ├── theme/              # Custom design tokens, typography, and Mantine overrides
│   └── types/              # Core domain TypeScript type/interface files
├── tsconfig.json           # Strict TypeScript configuration
├── jest.config.ts          # Jest testing suite configuration
├── eslint.config.mjs       # ESLint rules and style checks
└── package.json            # Scripts, dependency allocations, configuration metadata
```

---

## 🛡️ Authentication & Role-Based Access Control (RBAC)

The portal incorporates standard, high-security authentication routing logic:

1.  **Session Security:** Active user sessions are stored securely in cookie-based states (`pressforge-session`), accessible from both server and client.
2.  **Next.js Middleware Routing:** `src/middleware.ts` intercepts and audits routing requests automatically:
    *   Unauthenticated users attempting to access `/dashboard` paths are immediately redirected to `/login`.
    *   Authenticated users attempting to visit `/login` or `/signup` are redirected to `/dashboard` to avoid duplicate logins.
3.  **Client-Side Guarding (`RoleGuard` Component):** Custom component wrapper `src/components/auth/RoleGuard.tsx` enforces visibility limits and route permissions:
    *   **Administrator (`admin`):** Full control over system modifications, simulation controls, and configurations.
    *   **Editor (`editor`):** Authorized to modify mock layouts and sandbox controls.
    *   **Viewer (`viewer`):** Read-only user access.

```tsx
// Example usage of component-level RoleGuard:
import { RoleGuard } from '@/components/auth/RoleGuard';

<RoleGuard allowedRoles={['admin', 'editor']}>
  <button>Configure Brand Workspace</button>
</RoleGuard>
```

---

## 🛠️ CLI Development Commands

Run these terminal scripts inside the `/frontend` directory to develop, check, and test:

*   **Start Local Dev Server:** `npm run dev`
*   **Compile Production Build:** `npm run build`
*   **Start Production Server:** `npm run start`
*   **Execute Test Suite:** `npm run test` or `npm run test:watch`
*   **Check Code Formatting:** `npm run format:check` and auto-format with `npm run format`
*   **Lint for Syntax & Rules:** `npm run lint`
*   **Run Strict Type-Checking:** `npm run typecheck`
