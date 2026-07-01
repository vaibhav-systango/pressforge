#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = '/home/ubox91/Desktop/press-ai/src';
const TARGET_ROOT = '/home/ubox91/Desktop/NextPress/next-press';

const ROUTE_MAP = [
  { source: 'pages/LandingPage.tsx', target: 'features/marketing/landing-page.tsx', exportName: 'LandingPage' },
  { source: 'routes/auth/login.tsx', target: 'features/auth/login-view.tsx', exportName: 'LoginView' },
  { source: 'routes/auth/signup.tsx', target: 'features/auth/signup-view.tsx', exportName: 'SignupView' },
  { source: 'routes/auth/accept-invite.tsx', target: 'features/auth/accept-invite-view.tsx', exportName: 'AcceptInviteView' },
  { source: 'routes/onboarding/organization.tsx', target: 'features/onboarding/organization-view.tsx', exportName: 'OrganizationView' },
  { source: 'routes/onboarding/workspace.tsx', target: 'features/onboarding/workspace-view.tsx', exportName: 'WorkspaceView' },
  { source: 'routes/onboarding/brand-voice.tsx', target: 'features/onboarding/brand-voice-view.tsx', exportName: 'BrandVoiceView' },
  { source: 'routes/onboarding/kyc.tsx', target: 'features/onboarding/kyc-view.tsx', exportName: 'KycView' },
  { source: 'routes/onboarding/connect.tsx', target: 'features/onboarding/connect-view.tsx', exportName: 'OnboardingConnectView' },
  { source: 'routes/app/index.tsx', target: 'features/dashboard/dashboard-view.tsx', exportName: 'DashboardView' },
  { source: 'routes/app/analytics.tsx', target: 'features/analytics/analytics-view.tsx', exportName: 'AnalyticsView' },
  { source: 'routes/app/monitoring.tsx', target: 'features/monitoring/monitoring-view.tsx', exportName: 'MonitoringView' },
  { source: 'routes/app/publishing.tsx', target: 'features/publishing/publishing-view.tsx', exportName: 'PublishingView' },
  { source: 'routes/app/settings.tsx', target: 'features/settings/settings-view.tsx', exportName: 'SettingsView' },
  { source: 'routes/app/clients.tsx', target: 'features/clients/clients-view.tsx', exportName: 'ClientsView' },
  { source: 'routes/app/workspaces.tsx', target: 'features/workspaces/workspaces-view.tsx', exportName: 'WorkspacesView' },
  { source: 'routes/app/content/index.tsx', target: 'features/content/content-list-view.tsx', exportName: 'ContentListView' },
  { source: 'routes/app/content/new.tsx', target: 'features/content/content-new-view.tsx', exportName: 'ContentNewView' },
  { source: 'routes/app/content/$id.tsx', target: 'features/content/content-detail-view.tsx', exportName: 'ContentDetailView' },
  { source: 'routes/app/approvals/index.tsx', target: 'features/approvals/approvals-list-view.tsx', exportName: 'ApprovalsListView' },
  { source: 'routes/app/approvals/$id.tsx', target: 'features/approvals/approval-detail-view.tsx', exportName: 'ApprovalDetailView' },
  { source: 'routes/app/connect.tsx', target: 'features/connect/connect-view.tsx', exportName: 'ConnectView' },
  { source: 'routes/app/pr/index.tsx', target: 'features/pr/pr-list-view.tsx', exportName: 'PrListView' },
  { source: 'routes/app/pr/new.tsx', target: 'features/pr/pr-new-view.tsx', exportName: 'PrNewView' },
  { source: 'routes/app/pr/$id.tsx', target: 'features/pr/pr-detail-view.tsx', exportName: 'PrDetailView' },
];

const COMPONENT_MAP = [
  { source: 'components/AppShell.tsx', target: 'components/layout/app-shell.tsx', exportName: 'AppShell' },
  { source: 'components/OnboardingStepper.tsx', target: 'components/onboarding/onboarding-stepper.tsx', exportName: 'OnboardingStepper' },
  { source: 'components/Header.tsx', target: 'components/layout/marketing-header.tsx', exportName: 'MarketingHeader' },
  { source: 'components/Footer.tsx', target: 'components/layout/marketing-footer.tsx', exportName: 'MarketingFooter' },
];

function convertContent(content, exportName) {
  let result = content;

  result = result.replace(/export default function \w+/, `export function ${exportName}`);
  result = result.replace(/^import .+ from ['"]react-router-dom['"];?\n/gm, '');
  result = result.replace(/from ['"]\.\.\/(?:\.\.\/)*lib\/state-context['"]/g, "from '@/lib/store/app-store'");
  result = result.replace(/from ['"]\.\.\/(?:\.\.\/)*lib\/mock-data['"]/g, "from '@/lib/data/mock-data'");
  result = result.replace(/from ['"]\.\.\/(?:\.\.\/)*components\//g, "from '@/components/");
  result = result.replace(/from ['"]\.\.\/components\//g, "from '@/components/");

  result = result.replace(/\bconst navigate = useNavigate\(\)/g, 'const router = useRouter()');
  result = result.replace(/\bnavigate\(([^,]+), \{ replace: true \}\)/g, 'router.replace($1)');
  result = result.replace(/\bnavigate\(/g, 'router.push(');

  result = result.replace(/\bconst location = useLocation\(\)/g, 'const pathname = usePathname()');
  result = result.replace(/\blocation\.pathname\b/g, 'pathname');

  result = result.replace(/\bto=/g, 'href=');

  const needs = {
    link: /\bLink\b/.test(result),
    navLink: /\bNavLink\b/.test(result),
    router: /\buseRouter\b/.test(result),
    searchParams: /\buseSearchParams\b/.test(result),
    params: /\buseParams\b/.test(result),
    pathname: /\busePathname\b/.test(result),
    appState: /\buseAppState\b/.test(result),
  };

  result = result.replace(/^'use client';\s*/m, '');

  const imports = ["'use client';", ''];
  if (needs.link) imports.push("import Link from 'next/link';");
  if (needs.navLink) imports.push("import { NavLink } from '@/components/navigation/nav-link';");
  if (needs.router) imports.push("import { useRouter } from 'next/navigation';");
  if (needs.searchParams) imports.push("import { useSearchParams } from 'next/navigation';");
  if (needs.params) imports.push("import { useParams } from 'next/navigation';");
  if (needs.pathname) imports.push("import { usePathname } from 'next/navigation';");
  if (needs.appState) imports.push("import { useAppState } from '@/lib/store/app-store';");

  return `${imports.join('\n')}\n${result.trimStart()}\n`;
}

function convertFile(sourceRel, targetRel, exportName) {
  const sourcePath = path.join(SOURCE_ROOT, sourceRel);
  const targetPath = path.join(TARGET_ROOT, targetRel);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const raw = fs.readFileSync(sourcePath, 'utf8');
  fs.writeFileSync(targetPath, convertContent(raw, exportName));
  console.log(`Converted ${sourceRel} -> ${targetRel}`);
}

for (const route of ROUTE_MAP) {
  convertFile(route.source, route.target, route.exportName);
}

for (const component of COMPONENT_MAP) {
  convertFile(component.source, component.target, component.exportName);
}

console.log('Done.');
