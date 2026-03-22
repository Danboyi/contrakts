import Link from 'next/link'
import {
  ArrowRight,
  DollarSign,
  FileText,
  Scale,
  Shield,
  Zap,
  Lock,
  Globe,
  Sparkles,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  AnimatedHeroBadge,
  AnimatedHeadline,
  AnimatedHeroCtas,
  AnimatedSection,
  AnimatedFeatureGrid,
  AnimatedStepGrid,
  AnimatedCounter,
} from '@/components/landing/animated-sections'

const features = [
  {
    icon: FileText,
    title: 'Smart Contracts',
    description:
      'AI-powered contract drafting with milestone tracking. Define deliverables, deadlines, and payment terms in minutes.',
  },
  {
    icon: Shield,
    title: 'Escrow Protection',
    description:
      'Funds are held securely until deliverables are approved. No more chasing payments or worrying about fraud.',
  },
  {
    icon: Scale,
    title: 'AI Dispute Resolution',
    description:
      'Automated analysis flags risks early. When disputes arise, AI-assisted arbitration resolves them fairly.',
  },
  {
    icon: DollarSign,
    title: 'Multi-Currency Payments',
    description:
      'Accept payments in NGN, USD, or crypto. Paystack, Flutterwave, and Coinbase integrations built in.',
  },
  {
    icon: Zap,
    title: 'Milestone Payouts',
    description:
      'Progressive funding tied to deliverables. Funds release automatically when milestones are approved.',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description:
      'End-to-end encryption, rate limiting, audit logging, and role-based access. SOC 2 compliant architecture.',
  },
]

const stats = [
  { value: '10K+', label: 'Contracts created' },
  { value: '$2.4M', label: 'In escrow protected' },
  { value: '99.8%', label: 'Dispute resolution rate' },
  { value: '4.9/5', label: 'User satisfaction' },
]

const paymentProviders = ['Paystack', 'Flutterwave', 'Coinbase']

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[hsl(var(--color-bg))]">
      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[hsl(var(--color-border)/0.5)]">
        <div className="glass-strong mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--color-accent))]">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[hsl(var(--color-text-1))]">
              Contrakts
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-[hsl(var(--color-text-2))] transition-colors hover:text-[hsl(var(--color-text-1))]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-[var(--radius-md)] bg-[hsl(var(--color-accent))] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[hsl(var(--color-accent-hover))] hover:shadow-md"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-32">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,hsl(var(--color-accent)/0.12)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] bg-[radial-gradient(circle,hsl(var(--color-accent)/0.06)_0%,transparent_70%)]" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          {/* Badge */}
          <AnimatedHeroBadge>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-4 py-1.5">
              <Sparkles size={14} className="text-[hsl(var(--color-accent))]" />
              <span className="text-xs font-medium text-[hsl(var(--color-text-2))]">
                AI-powered contract management
              </span>
            </div>
          </AnimatedHeroBadge>

          {/* Headline */}
          <AnimatedHeadline>
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-[hsl(var(--color-text-1))] md:text-5xl lg:text-[56px]">
              Every deal.{' '}
              <span className="text-[hsl(var(--color-accent))]">Protected.</span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-md leading-relaxed text-[hsl(var(--color-text-2))] md:text-lg">
              Create contracts, escrow payments, track milestones, and resolve disputes —
              all in one platform. Powered by AI, protected by escrow.
            </p>
          </AnimatedHeadline>

          {/* CTAs */}
          <AnimatedHeroCtas>
            <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-[hsl(var(--color-accent))] px-8 py-3.5 text-md font-semibold text-white transition-all hover:bg-[hsl(var(--color-accent-hover))] hover:shadow-md"
              >
                Start for free
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border-2))] bg-[hsl(var(--color-surface))] px-8 py-3.5 text-md font-medium text-[hsl(var(--color-text-1))] transition-all hover:bg-[hsl(var(--color-surface-2))]"
              >
                See how it works
              </Link>
            </div>
          </AnimatedHeroCtas>

          {/* Trust stats */}
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <AnimatedCounter key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-[hsl(var(--color-border)/0.5)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--color-accent))]">
              Features
            </p>
            <h2 className="mb-4 text-2xl font-bold text-[hsl(var(--color-text-1))] md:text-3xl">
              Everything you need to close deals safely
            </h2>
            <p className="mx-auto max-w-lg text-sm text-[hsl(var(--color-text-2))]">
              From contract creation to final payment — every step is protected,
              tracked, and transparent.
            </p>
          </AnimatedSection>

          <AnimatedFeatureGrid>
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6 transition-all duration-300 hover:border-[hsl(var(--color-border-2))] hover:shadow-card-hover"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--color-accent-dim))] transition-colors group-hover:bg-[hsl(var(--color-accent)/0.18)]">
                  <Icon size={18} className="text-[hsl(var(--color-accent))]" />
                </div>
                <h3 className="mb-2 text-md font-semibold text-[hsl(var(--color-text-1))]">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                  {description}
                </p>
              </div>
            ))}
          </AnimatedFeatureGrid>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[hsl(var(--color-border)/0.5)] py-24">
        <div className="mx-auto max-w-4xl px-6">
          <AnimatedSection className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--color-accent))]">
              How it works
            </p>
            <h2 className="text-2xl font-bold text-[hsl(var(--color-text-1))] md:text-3xl">
              Four steps to a protected deal
            </h2>
          </AnimatedSection>

          <AnimatedStepGrid>
            {[
              { step: '01', title: 'Create', desc: 'Draft a contract with AI assistance or use a template' },
              { step: '02', title: 'Fund', desc: 'Deposit escrow via bank, card, or crypto' },
              { step: '03', title: 'Deliver', desc: 'Track milestones and submit deliverables' },
              { step: '04', title: 'Release', desc: 'Approve work and release funds automatically' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--color-accent)/0.3)] bg-[hsl(var(--color-accent-dim))]">
                  <span className="text-sm font-bold text-[hsl(var(--color-accent))]">{step}</span>
                </div>
                <h3 className="mb-2 text-md font-semibold text-[hsl(var(--color-text-1))]">
                  {title}
                </h3>
                <p className="text-sm text-[hsl(var(--color-text-2))]">{desc}</p>
              </div>
            ))}
          </AnimatedStepGrid>
        </div>
      </section>

      {/* Payment providers */}
      <AnimatedSection>
        <section className="border-t border-[hsl(var(--color-border)/0.5)] py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="mb-6 text-xs font-medium uppercase tracking-widest text-[hsl(var(--color-text-3))]">
              Integrated payment providers
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              {paymentProviders.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-6 py-3 transition-all duration-200 hover:border-[hsl(var(--color-border-2))] hover:shadow-sm"
                >
                  <Globe size={16} className="text-[hsl(var(--color-text-3))]" />
                  <span className="text-sm font-medium text-[hsl(var(--color-text-2))]">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection>
        <section className="border-t border-[hsl(var(--color-border)/0.5)] py-24">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[var(--radius-2xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-8 py-16 text-center md:px-16">
            <div className="pointer-events-none absolute inset-0 bg-[hsl(var(--color-accent)/0.03)]" />
            <div className="relative z-10">
              <h2 className="mb-4 text-2xl font-bold text-[hsl(var(--color-text-1))] md:text-3xl">
                Ready to protect your next deal?
              </h2>
              <p className="mx-auto mb-8 max-w-md text-sm text-[hsl(var(--color-text-2))]">
                Join thousands of professionals using Contrakts to execute contracts
                with confidence.
              </p>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-[hsl(var(--color-accent))] px-8 py-3.5 text-md font-semibold text-white transition-all hover:bg-[hsl(var(--color-accent-hover))] hover:shadow-md"
              >
                Get started free
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--color-border)/0.5)] py-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] bg-[hsl(var(--color-accent))]">
              <Shield size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
              Contrakts
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--color-text-3))]">
            &copy; {new Date().getFullYear()} Contrakts. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
