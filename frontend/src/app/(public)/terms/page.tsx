import React from 'react';
import Header from '@/common/layout/Header';
import Footer from '@/common/layout/Footer';

export default function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground flex flex-col justify-between">
      {/* Aurora Background Orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-brand opacity-10 blur-3xl" />
      </div>

      <Header />

      <main className="flex-grow mx-auto max-w-4xl px-6 py-16 w-full">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl text-foreground mb-4">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">Last updated: June 23, 2026</p>

        <div className="glass rounded-2xl p-8 border border-border/40 space-y-8 text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the PressForge AI platform and associated workflows, you agree to comply with and be bound by
              these Terms of Service. If you do not agree, you are not authorized to use the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. User Account and Workspaces</h2>
            <p>
              You must register for an account to manage client workspaces. You are solely responsible for maintaining the
              confidentiality of your login credentials and for all actions taken under your account or workspaces.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Usage Permissions and AI Outputs</h2>
            <p>
              Our platform uses advanced AI systems to generate drafts of captions, articles, and PR distribution materials.
              While we strive to align suggestions with your brand voice, you are fully responsible for final review and approval
              before publishing or distributing any content to public channels.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the platform at any time, without prior notice, if you
              violate these terms or engage in misuse of the automated communication channels.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Limitation of Liability</h2>
            <p>
              PressForge shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
              including loss of profits, data, use, goodwill, or other intangible losses resulting from the use of or
              inability to use our service.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Contact Us</h2>
            <p>
              If you have any questions regarding these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@pressforge.com" className="text-violet-400 hover:underline">
                legal@pressforge.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
