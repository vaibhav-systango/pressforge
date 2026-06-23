import React from 'react';
import Header from '@/common/layout/Header';
import Footer from '@/common/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground flex flex-col justify-between">
      {/* Aurora Background Orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-brand opacity-10 blur-3xl" />
      </div>

      <Header />

      <main className="flex-grow mx-auto max-w-4xl px-6 py-16 w-full">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl text-foreground mb-4">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">Last updated: June 23, 2026</p>

        <div className="glass rounded-2xl p-8 border border-border/40 space-y-8 text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us when creating a workspace, setting up client portals,
              or configuring automated messaging workflows. This may include your name, email address, password,
              company details, and communication metadata processed via WhatsApp or other integration partners.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>
              Your data is utilized solely to operate, maintain, and improve the core PressForge loops, including:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-4">
              <li>Generating brand-voice aligned content suggestions.</li>
              <li>Routing content approvals to clients via WhatsApp interfaces.</li>
              <li>Publishing to linked social media accounts on your schedule.</li>
              <li>Monitoring brand mentions and feeding health metrics back into the system.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Security</h2>
            <p>
              PressForge utilizes industry-standard administrative, technical, and physical security measures to safeguard
              your data against unauthorized access, loss, or alteration. All integrations, database storage, and cookie-based
              session tokens follow strict production-grade security guidelines.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Cookies and Session Management</h2>
            <p>
              We use functional cookies to manage active user sessions and secure dashboard authentication. Clearing your
              browser cookies will log you out of the secure dashboard workspaces.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Contact Us</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy, please contact our support team at{' '}
              <a href="mailto:support@pressforge.com" className="text-violet-400 hover:underline">
                support@pressforge.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
