#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/home/ubox91/Desktop/NextPress/next-press/app';

const routes = [
  { path: 'auth/login/page.tsx', importPath: '@/features/auth/login-view', component: 'LoginView' },
  { path: 'auth/signup/page.tsx', importPath: '@/features/auth/signup-view', component: 'SignupView' },
  { path: 'auth/accept-invite/page.tsx', importPath: '@/features/auth/accept-invite-view', component: 'AcceptInviteView' },
  { path: 'onboarding/organization/page.tsx', importPath: '@/features/onboarding/organization-view', component: 'OrganizationView' },
  { path: 'onboarding/workspace/page.tsx', importPath: '@/features/onboarding/workspace-view', component: 'WorkspaceView' },
  { path: 'onboarding/brand-voice/page.tsx', importPath: '@/features/onboarding/brand-voice-view', component: 'BrandVoiceView' },
  { path: 'onboarding/kyc/page.tsx', importPath: '@/features/onboarding/kyc-view', component: 'KycView' },
  { path: 'onboarding/connect/page.tsx', importPath: '@/features/onboarding/connect-view', component: 'OnboardingConnectView' },
  { path: 'app/page.tsx', importPath: '@/features/dashboard/dashboard-view', component: 'DashboardView' },
  { path: 'app/analytics/page.tsx', importPath: '@/features/analytics/analytics-view', component: 'AnalyticsView' },
  { path: 'app/monitoring/page.tsx', importPath: '@/features/monitoring/monitoring-view', component: 'MonitoringView' },
  { path: 'app/publishing/page.tsx', importPath: '@/features/publishing/publishing-view', component: 'PublishingView' },
  { path: 'app/settings/page.tsx', importPath: '@/features/settings/settings-view', component: 'SettingsView' },
  { path: 'app/clients/page.tsx', importPath: '@/features/clients/clients-view', component: 'ClientsView' },
  { path: 'app/workspaces/page.tsx', importPath: '@/features/workspaces/workspaces-view', component: 'WorkspacesView' },
  { path: 'app/content/page.tsx', importPath: '@/features/content/content-list-view', component: 'ContentListView' },
  { path: 'app/content/new/page.tsx', importPath: '@/features/content/content-new-view', component: 'ContentNewView' },
  { path: 'app/content/[id]/page.tsx', importPath: '@/features/content/content-detail-view', component: 'ContentDetailView' },
  { path: 'app/approvals/page.tsx', importPath: '@/features/approvals/approvals-list-view', component: 'ApprovalsListView' },
  { path: 'app/approvals/[id]/page.tsx', importPath: '@/features/approvals/approval-detail-view', component: 'ApprovalDetailView' },
  { path: 'app/connect/page.tsx', importPath: '@/features/connect/connect-view', component: 'ConnectView' },
  { path: 'app/pr/page.tsx', importPath: '@/features/pr/pr-list-view', component: 'PrListView' },
  { path: 'app/pr/new/page.tsx', importPath: '@/features/pr/pr-new-view', component: 'PrNewView' },
  { path: 'app/pr/[id]/page.tsx', importPath: '@/features/pr/pr-detail-view', component: 'PrDetailView' },
];

for (const route of routes) {
  const filePath = path.join(APP_ROOT, route.path);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const needsSuspense = route.component.includes('Login') || route.component.includes('Accept') || route.component.includes('Workspaces');

  const content = needsSuspense
    ? `import { Suspense } from 'react';\nimport { ${route.component} } from '${route.importPath}';\n\nexport default function Page() {\n  return (\n    <Suspense fallback={null}>\n      <${route.component} />\n    </Suspense>\n  );\n}\n`
    : `import { ${route.component} } from '${route.importPath}';\n\nexport default function Page() {\n  return <${route.component} />;\n}\n`;

  fs.writeFileSync(filePath, content);
  console.log(`Created ${route.path}`);
}
