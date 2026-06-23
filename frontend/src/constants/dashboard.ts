export const DASHBOARD = {
  TITLE: 'System Workspace',
  SUBTITLE: 'A production-grade, secure, and role-guarded framework for your brand operations.',
  WELCOME_BADGE: 'Ready for Figma integration',
  WELCOME_DESC: 'This repository is structured and optimized for rapid frontend development. All core capabilities—State Management, Route Guarding, Mantine Styling, and Tailwind CSS v4—are fully pre-configured.',
  WELCOME_PREFIX: 'Welcome back, ',
  WELCOME_FALLBACK_USER: 'Developer',
  BOILERPLATE: {
    TITLE: 'Boilerplate Configuration',
    DESC: 'This frontend implements clean architecture best practices that make it highly maintainable and clean:',
    ITEMS: [
      { term: 'Framework:', detail: 'Next.js 15+ App Router with client/server routing.' },
      { term: 'Styling:', detail: 'Tailwind CSS v4 alongside Mantine UI theme mapping.' },
      { term: 'State Management:', detail: 'TanStack React Query + React Context.' },
      { term: 'Types & Safety:', detail: 'Zod Schemas + TypeScript strict type-checking.' },
    ],
  },
  RBAC: {
    TITLE: 'Role-Based Access Controls (RBAC)',
    DESC: 'Access permissions are dynamically checked based on the active session role:',
    ITEMS: [
      { role: 'Administrator Account', badge: 'Full Control', color: 'red' },
      { role: 'Editor Account', badge: 'Modify Content', color: 'blue' },
      { role: 'Viewer Account', badge: 'Read-Only', color: 'gray' },
    ],
  },
  DYNAMIC_GUARD: {
    TITLE: 'Dynamic Component Guard Test',
    ADMIN_MSG: '✔ You are viewing this text because you are logged in as an Administrator.',
    EDITOR_MSG: '✔ You are viewing this text because you are logged in as an Editor.',
    VIEWER_MSG: '✔ You are viewing this text because you are logged in as a Viewer.',
  },
  CANVAS: {
    TITLE: 'Design Canvas Ready',
    DESC: 'Import components, hooks, and pages matching your Figma mockups directly into the src/features directory.',
    CONFIG_BTN: 'Configure Layout',
    DOCS_BTN: 'View Boilerplate Docs',
  },
} as const;
