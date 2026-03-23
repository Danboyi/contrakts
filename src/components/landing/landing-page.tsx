'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  Check,
  CheckCircle,
  ChevronRight,
  Clock3,
  DollarSign,
  FileText,
  Globe,
  Lock,
  Scale,
  Shield,
  Users,
  Zap,
} from 'lucide-react'
import { HeroMock } from './hero-mock'
import { NavBar } from './nav-bar'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

function FadeInWhenVisible({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SectionHeader({
  badge,
  title,
  subtitle,
}: {
  badge: string
  title: React.ReactNode
  subtitle: string
}) {
  return (
    <FadeInWhenVisible className="mb-14 text-center md:mb-16">
      <span
        className={cn(
          'mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
          'bg-[hsl(var(--color-surface))] border-[hsl(var(--color-border))]',
          'text-xs font-medium text-[hsl(var(--color-text-3))]'
        )}
      >
        {badge}
      </span>
      <h2
        className={cn(
          'mb-5 text-3xl font-semibold leading-[1.1] tracking-[-0.5px]',
          'text-[hsl(var(--color-text-1))] sm:text-4xl md:text-[44px]'
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          'mx-auto max-w-[520px] text-base leading-relaxed md:text-lg',
          'text-[hsl(var(--color-text-2))]'
        )}
      >
        {subtitle}
      </p>
    </FadeInWhenVisible>
  )
}

function SectionDivider() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-4">
      <div className="h-px w-full bg-[hsl(var(--color-border))]" />
    </div>
  )
}

function Section({
  id,
  children,
  className,
}: {
  id?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'mx-auto max-w-[1200px] scroll-mt-28 px-6 py-20 md:py-28',
        className
      )}
    >
      {children}
    </section>
  )
}

function LogoMark({ index }: { index: number }) {
  const shapes = [
    <circle key="circle" cx="28" cy="28" r="18" />,
    <rect key="rect" x="12" y="12" width="32" height="32" rx="10" />,
    <path key="diamond" d="M28 10 46 28 28 46 10 28Z" />,
    <path key="triangle" d="M28 10 46 42H10Z" />,
    <path key="bars" d="M11 15h10v26H11zm13-6h10v38H24zm13 11h10v16H37z" />,
    <path
      key="rings"
      d="M28 10c10 0 18 8 18 18s-8 18-18 18S10 38 10 28 18 10 28 10Zm0 10c-4 0-8 4-8 8s4 8 8 8 8-4 8-8-4-8-8-8Z"
    />,
  ]

  return (
    <svg
      viewBox="0 0 56 56"
      className="h-10 w-10 fill-[hsl(var(--color-text-3)/0.3)]"
      aria-hidden="true"
    >
      {shapes[index % shapes.length]}
    </svg>
  )
}

function SocialProof() {
  const trustPillars = [
    {
      title: 'Escrow held until approval',
      body: 'Funds stay locked until agreed work is delivered or a ruling is issued.',
    },
    {
      title: 'AI-assisted dispute review',
      body: 'Evidence and contract terms are analysed before human escalation.',
    },
    {
      title: 'No subscription pricing',
      body: 'Create and send contracts free. Fees apply only when money moves.',
    },
  ]

  return (
    <Section className="py-14 md:py-20">
      <FadeInWhenVisible className="text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--color-text-3))]">
          Trusted by freelancers, contractors, and businesses across Africa
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-7 sm:gap-10">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-[hsl(var(--color-border)/0.55)] bg-[hsl(var(--color-surface)/0.4)]"
            >
              <LogoMark index={index} />
            </div>
          ))}
        </div>
      </FadeInWhenVisible>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {trustPillars.map((pillar, index) => (
          <FadeInWhenVisible key={pillar.title} delay={index * 0.1}>
            <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
              <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                {pillar.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-[hsl(var(--color-text-2))]">
                {pillar.body}
              </p>
            </div>
          </FadeInWhenVisible>
        ))}
      </div>
    </Section>
  )
}

function Features() {
  const features = [
    {
      icon: Shield,
      title: 'Escrow protection',
      body: 'Funds are locked until each milestone is approved. Neither party can access the money without completing their obligations.',
      color: 'text-[hsl(var(--color-success))]',
      bg: 'bg-[hsl(var(--color-success)/0.1)]',
    },
    {
      icon: Brain,
      title: 'AI contract drafter',
      body: 'Describe your deal in plain English. AI generates professional terms, milestones, amounts, and risk flags in 30 seconds.',
      color: 'text-[hsl(var(--color-accent))]',
      bg: 'bg-[hsl(var(--color-accent)/0.1)]',
    },
    {
      icon: DollarSign,
      title: 'Milestone payments',
      body: 'Pay only for completed work. Each milestone releases independently. 72-hour auto-release protects service providers from silent service receivers.',
      color: 'text-[hsl(var(--color-warning))]',
      bg: 'bg-[hsl(var(--color-warning)/0.1)]',
    },
    {
      icon: Scale,
      title: 'Dispute arbitration',
      body: 'When things go wrong, AI analyses the evidence and recommends a ruling. Human arbitrators handle complex cases. Fair resolution guaranteed.',
      color: 'text-[hsl(var(--color-danger))]',
      bg: 'bg-[hsl(var(--color-danger)/0.1)]',
    },
    {
      icon: Globe,
      title: 'Global payments',
      body: 'Paystack for Africa. Flutterwave for multi-currency. USDC stablecoin for anywhere. One platform, every payment rail.',
      color: 'text-[hsl(var(--color-accent))]',
      bg: 'bg-[hsl(var(--color-accent)/0.1)]',
    },
    {
      icon: Lock,
      title: 'Trust scores',
      body: 'Every completed contract builds your reputation. Verified identity, dispute history, and completion rate are visible to counterparties.',
      color: 'text-[hsl(var(--color-gold))]',
      bg: 'bg-[hsl(var(--color-gold)/0.1)]',
    },
  ]

  return (
    <Section id="features">
      <SectionHeader
        badge="Core features"
        title={
          <>
            Built for trust.
            <br className="hidden sm:block" /> Built for execution.
          </>
        }
        subtitle="Everything two parties need to do a deal with confidence - from first handshake to final payment."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FadeInWhenVisible key={feature.title} delay={index * 0.08}>
            <div
              className={cn(
                'group h-full rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] p-6',
                'bg-[hsl(var(--color-surface))] transition-all duration-300',
                'hover:border-[hsl(var(--color-border-2))] hover:bg-[hsl(var(--color-surface-2)/0.4)]'
              )}
            >
              <div
                className={cn(
                  'mb-5 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]',
                  'transition-transform duration-300 group-hover:scale-110',
                  feature.bg
                )}
              >
                <feature.icon size={18} className={feature.color} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-[hsl(var(--color-text-1))]">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                {feature.body}
              </p>
            </div>
          </FadeInWhenVisible>
        ))}
      </div>
    </Section>
  )
}

function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Create your contract',
      body: 'Describe your deal or use AI to draft it. Add milestones, amounts, deadlines, and terms. Send an invite link to the other party.',
      icon: FileText,
      accent: 'text-[hsl(var(--color-accent))]',
      border: 'border-[hsl(var(--color-accent)/0.3)]',
      glow: 'bg-[hsl(var(--color-accent)/0.06)]',
    },
    {
      number: '02',
      title: 'Both parties sign',
      body: 'The counterparty reviews the terms, creates an account if needed, and signs with a typed signature. Both signatures are timestamped and immutable.',
      icon: Users,
      accent: 'text-[hsl(var(--color-warning))]',
      border: 'border-[hsl(var(--color-warning)/0.3)]',
      glow: 'bg-[hsl(var(--color-warning)/0.06)]',
    },
    {
      number: '03',
      title: 'Fund the escrow',
      body: 'The service receiver deposits the full contract value into escrow. Card, bank transfer, or USDC stablecoin. The money is locked and safe from both parties until milestones approve.',
      icon: Shield,
      accent: 'text-[hsl(var(--color-success))]',
      border: 'border-[hsl(var(--color-success)/0.3)]',
      glow: 'bg-[hsl(var(--color-success)/0.06)]',
    },
    {
      number: '04',
      title: 'Deliver and get paid',
      body: 'The service provider submits deliverables per milestone. The service receiver reviews and approves. Payment releases instantly to the service provider. If no review happens in 72 hours, payment auto-releases.',
      icon: Zap,
      accent: 'text-[hsl(var(--color-gold))]',
      border: 'border-[hsl(var(--color-gold)/0.3)]',
      glow: 'bg-[hsl(var(--color-gold)/0.06)]',
    },
  ]

  return (
    <Section id="how-it-works">
      <SectionHeader
        badge="How it works"
        title={
          <>
            Four steps to a
            <br className="hidden sm:block" /> protected deal
          </>
        }
        subtitle="From handshake to payment in minutes. No lawyers. No blind trust. No chasing invoices."
      />

      <div className="relative">
        <div className="absolute left-[39px] top-10 bottom-10 hidden w-px bg-[hsl(var(--color-border))] lg:block" />

        <div className="flex flex-col gap-6 lg:gap-0">
          {steps.map((step, index) => (
            <FadeInWhenVisible key={step.number} delay={index * 0.12}>
              <div className="flex flex-col items-start gap-5 lg:flex-row lg:gap-8 lg:py-8">
                <div
                  className={cn(
                    'relative z-10 flex h-[78px] w-[78px] flex-shrink-0 items-center justify-center rounded-full border-2',
                    step.border,
                    step.glow
                  )}
                >
                  <span className={cn('text-xl font-bold', step.accent)}>
                    {step.number}
                  </span>
                </div>

                <div className="flex-1 rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)]',
                        step.glow
                      )}
                    >
                      <step.icon size={16} className={step.accent} />
                    </div>
                    <div>
                      <h3 className="mb-2 text-base font-semibold text-[hsl(var(--color-text-1))]">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInWhenVisible>
          ))}
        </div>
      </div>
    </Section>
  )
}

function ProductMockup() {
  const milestones = [
    {
      title: 'Discovery and architecture',
      amount: '$2,000',
      state: 'paid',
      icon: CheckCircle,
      color: 'text-[hsl(var(--color-success))]',
    },
    {
      title: 'UI and UX design',
      amount: '$3,000',
      state: 'paid',
      icon: CheckCircle,
      color: 'text-[hsl(var(--color-success))]',
    },
    {
      title: 'Core development',
      amount: '$5,000',
      state: 'in review',
      icon: Clock3,
      color: 'text-[hsl(var(--color-warning))]',
    },
    {
      title: 'Testing and deployment',
      amount: '$2,000',
      state: 'pending',
      icon: Lock,
      color: 'text-[hsl(var(--color-text-3))]',
    },
  ]

  return (
    <Section>
      <SectionHeader
        badge="See it in action"
        title={
          <>
            Contracts that
            <br className="hidden sm:block" /> execute themselves
          </>
        }
        subtitle="A real contract on Contrakts looks like this. Every element is live, interactive, and protected by escrow."
      />

      <FadeInWhenVisible>
        <div
          className={cn(
            'mx-auto max-w-[640px] overflow-hidden rounded-[var(--radius-xl)]',
            'border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
            'shadow-[0_8px_40px_hsl(0_0%_0%/0.3)]'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-between border-b border-[hsl(var(--color-border))]',
              'bg-[hsl(var(--color-surface-2))] px-5 py-3'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--color-accent))]" />
              <span className="text-xs font-medium text-[hsl(var(--color-text-3))]">
                Contrakts
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-danger)/0.5)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-warning)/0.5)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-success)/0.5)]" />
            </div>
          </div>

          <div className="p-6">
            <p className="mb-1 text-[11px] font-mono text-[hsl(var(--color-text-3))]">
              CTR-2025-04821
            </p>
            <h3 className="mb-1 text-lg font-semibold text-[hsl(var(--color-text-1))]">
              Mobile app development - Rider tracking
            </h3>
            <div className="mb-5 flex items-center gap-3">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-medium',
                  'bg-[hsl(var(--color-success)/0.12)] text-[hsl(var(--color-success))]'
                )}
              >
                Active
              </span>
              <span className="text-xs text-[hsl(var(--color-text-3))]">
                Software and Tech
              </span>
            </div>

            <div
              className={cn(
                'mb-5 flex gap-4 rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] p-3'
              )}
            >
              <div className="flex-1">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                  Service Receiver
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full',
                      'bg-[hsl(var(--color-accent)/0.2)] text-[9px] font-bold text-[hsl(var(--color-accent))]'
                    )}
                  >
                    CA
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--color-text-1))]">
                    Caleb A.
                  </span>
                </div>
              </div>
              <div className="w-px bg-[hsl(var(--color-border))]" />
              <div className="flex-1">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-[hsl(var(--color-text-3))]">
                  Service Provider
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full',
                      'bg-[hsl(var(--color-success)/0.15)] text-[9px] font-bold text-[hsl(var(--color-success))]'
                    )}
                  >
                    BR
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--color-text-1))]">
                    BuildRight Ltd
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-[hsl(var(--color-text-3))]">Escrow</span>
                <span className="font-semibold text-[hsl(var(--color-text-1))]">
                  $12,000.00
                </span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-[hsl(var(--color-border))]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '50%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full bg-[hsl(var(--color-success))]"
                />
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '16.7%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
                  className="h-full bg-[hsl(var(--color-warning))]"
                />
              </div>
              <div className="mt-2 flex gap-4">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--color-success))]" />
                  <span className="text-[10px] text-[hsl(var(--color-text-3))]">
                    $6,000 released
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--color-warning))]" />
                  <span className="text-[10px] text-[hsl(var(--color-text-3))]">
                    $2,000 in review
                  </span>
                </div>
              </div>
            </div>

            <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
              Milestones
            </p>
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 border-b border-[hsl(var(--color-border))] py-2.5 last:border-0',
                  milestone.state === 'pending' && 'opacity-50'
                )}
              >
                <milestone.icon size={14} className={milestone.color} />
                <span
                  className={cn(
                    'flex-1 text-sm',
                    milestone.state === 'pending'
                      ? 'text-[hsl(var(--color-text-3))]'
                      : 'text-[hsl(var(--color-text-1))]'
                  )}
                >
                  {milestone.title}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    milestone.state === 'paid'
                      ? 'text-[hsl(var(--color-success))]'
                      : 'text-[hsl(var(--color-text-2))]'
                  )}
                >
                  {milestone.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </FadeInWhenVisible>
    </Section>
  )
}

function WhoItsFor() {
  const audiences = [
    {
      emoji: 'DES',
      title: 'Freelancers and creatives',
      body: 'Designers, developers, writers, videographers. Never deliver work and not get paid. Never chase an invoice again.',
    },
    {
      emoji: 'BLD',
      title: 'Contractors and trades',
      body: 'Construction, renovation, fit-outs. Protect your materials investment. Service receivers fund before you lift a hammer.',
    },
    {
      emoji: 'ADV',
      title: 'Consultants and advisors',
      body: 'Strategy, legal, finance. Structured milestone payments for advisory engagements. Clear scope, clear pay.',
    },
    {
      emoji: 'BUS',
      title: 'Businesses and SMEs',
      body: 'Service provider management at any scale. API integration into your CRM. Templates for repeat contract types.',
    },
  ]

  return (
    <Section>
      <SectionHeader
        badge="Built for everyone"
        title={
          <>
            From freelancers
            <br className="hidden sm:block" /> to enterprises
          </>
        }
        subtitle="If two parties are doing a deal, Contrakts protects it. Any industry. Any scale. Any currency."
      />

      <div className="mx-auto grid max-w-[800px] grid-cols-1 gap-5 sm:grid-cols-2">
        {audiences.map((audience, index) => (
          <FadeInWhenVisible key={audience.title} delay={index * 0.1}>
            <div className="h-full rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6">
              <span className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--color-accent)/0.08)] px-3 text-xs font-semibold tracking-[0.12em] text-[hsl(var(--color-accent))]">
                {audience.emoji}
              </span>
              <h3 className="mt-5 text-base font-semibold text-[hsl(var(--color-text-1))]">
                {audience.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[hsl(var(--color-text-2))]">
                {audience.body}
              </p>
            </div>
          </FadeInWhenVisible>
        ))}
      </div>
    </Section>
  )
}

function AiSpotlight() {
  const bullets = [
    'Draft full contract terms, milestones, values, and risk flags from one plain-English brief.',
    'Analyse dispute evidence against the signed contract and surface a confidence-scored recommendation.',
    'Keep both parties aligned with clear milestone expectations before work begins.',
  ]

  return (
    <Section id="developer-api">
      <SectionHeader
        badge="AI spotlight"
        title={
          <>
            AI that understands
            <br className="hidden sm:block" /> the deal
          </>
        }
        subtitle="ContraktsAI does more than autocomplete. It drafts, reviews, and arbitrates using the actual contract structure."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <FadeInWhenVisible>
          <div className="rounded-[28px] border border-[hsl(var(--color-border))] bg-[linear-gradient(180deg,hsl(var(--color-surface)),hsl(var(--color-surface-2)))] p-7">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[hsl(var(--color-accent)/0.12)] text-[hsl(var(--color-accent))]">
              <Brain size={22} />
            </div>
            <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-[hsl(var(--color-text-1))]">
              One prompt in. A protected workflow out.
            </h3>
            <p className="mt-4 text-sm leading-8 text-[hsl(var(--color-text-2))]">
              The same AI layer that drafts contracts also helps resolve disputes. It keeps the platform fast for simple deals and rigorous when money is at stake.
            </p>
            <div className="mt-6 space-y-4">
              {bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--color-success)/0.14)] text-[hsl(var(--color-success))]">
                    <Check size={14} />
                  </span>
                  <p className="text-sm leading-7 text-[hsl(var(--color-text-2))]">
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}>
              Start with AI
            </Link>
          </div>
        </FadeInWhenVisible>

        <div className="grid gap-5">
          <FadeInWhenVisible delay={0.08}>
            <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--color-text-3))]">
                AI draft output
              </p>
              <h4 className="mt-2 text-lg font-semibold text-[hsl(var(--color-text-1))]">
                Website redesign retainer
              </h4>
              <div className="mt-5 space-y-3">
                <div className="rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] p-3">
                  <p className="text-xs text-[hsl(var(--color-text-3))]">Milestone 1</p>
                  <p className="mt-1 text-sm text-[hsl(var(--color-text-1))]">
                    Strategy and discovery - $2,500 - due in 7 days
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] p-3">
                  <p className="text-xs text-[hsl(var(--color-text-3))]">Milestone 2</p>
                  <p className="mt-1 text-sm text-[hsl(var(--color-text-1))]">
                    Design system and prototypes - $4,000 - due in 21 days
                  </p>
                </div>
              </div>
            </div>
          </FadeInWhenVisible>

          <FadeInWhenVisible delay={0.16}>
            <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--color-text-3))]">
                AI dispute review
              </p>
              <h4 className="mt-2 text-lg font-semibold text-[hsl(var(--color-text-1))]">
                Preliminary ruling: partial release
              </h4>
              <div className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-[hsl(var(--color-text-3))]">Confidence</span>
                  <span className="font-semibold text-[hsl(var(--color-text-1))]">87%</span>
                </div>
                <div className="h-2 rounded-full bg-[hsl(var(--color-border))]">
                  <div className="h-full w-[87%] rounded-full bg-[linear-gradient(90deg,hsl(var(--color-warning)),hsl(var(--color-success)))]" />
                </div>
                <p className="mt-4 text-sm leading-7 text-[hsl(var(--color-text-2))]">
                  Delivery met scope for the approved prototype work, but the payment trigger language on final QA is ambiguous. Recommend partial release and targeted revision notes.
                </p>
              </div>
            </div>
          </FadeInWhenVisible>
        </div>
      </div>
    </Section>
  )
}

function Pricing() {
  const included = [
    'Unlimited contracts',
    'AI contract drafter',
    'Milestone escrow',
    'Counterparty invitations',
    'Evidence-based dispute system',
    'AI dispute arbitration',
    'Trust score and verification',
    'In-app and email notifications',
    'Contract templates library',
    'REST API access',
    'Webhook integrations',
  ]
  const comparisons = [
    {
      label: 'Contrakts',
      value: '2%',
      note: 'Only on funded escrow',
      highlight: true,
    },
    {
      label: 'Escrow.com',
      value: '3.25%+',
      note: 'Plus wire fees',
      highlight: false,
    },
    {
      label: 'Traditional escrow',
      value: '5-10%',
      note: 'Plus legal fees',
      highlight: false,
    },
  ]

  return (
    <Section id="pricing">
      <SectionHeader
        badge="Simple pricing"
        title={
          <>
            Free to start.
            <br className="hidden sm:block" /> Pay only when money moves.
          </>
        }
        subtitle="No monthly fees. No tiers. No feature gates. You pay only when funds enter escrow."
      />

      <FadeInWhenVisible>
        <div className="mx-auto max-w-[480px] overflow-hidden rounded-[20px] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
          <div className="border-b border-[hsl(var(--color-border))] px-8 pb-6 pt-8 text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-accent))]">
              One plan. Everything included.
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold tracking-tight text-[hsl(var(--color-text-1))] md:text-6xl">
                2%
              </span>
              <span className="ml-1 text-base text-[hsl(var(--color-text-3))]">
                per contract
              </span>
            </div>
            <p className="mt-3 text-sm text-[hsl(var(--color-text-2))]">
              Charged only when escrow is funded. Nothing until then.
            </p>
          </div>

          <div className="px-8 py-6">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
              Everything included
            </p>
            {included.map((item) => (
              <div key={item} className="flex items-center gap-3 py-2">
                <CheckCircle
                  size={14}
                  className="flex-shrink-0 text-[hsl(var(--color-success))]"
                />
                <span className="text-sm text-[hsl(var(--color-text-2))]">
                  {item}
                </span>
              </div>
            ))}

            <div className="mt-5 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-4 py-3">
              <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                <span className="font-semibold text-[hsl(var(--color-text-1))]">
                  Dispute filing:
                </span>{' '}
                $15 fee paid by the party raising the dispute. Fee is refunded to
                the winning party after resolution.
              </p>
            </div>

            <Link
              href="/signup"
              className={cn(
                'mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] px-6 py-3.5',
                'bg-[hsl(var(--color-accent))] text-sm font-semibold text-white',
                'shadow-[0_4px_24px_hsl(var(--color-accent)/0.25)] transition-all duration-200',
                'hover:brightness-110 active:scale-[0.98]'
              )}
            >
              Get started free
              <ArrowRight size={16} />
            </Link>
            <p className="mt-3 text-center text-[11px] text-[hsl(var(--color-text-3))]">
              No credit card required
            </p>
          </div>
        </div>
      </FadeInWhenVisible>

      <FadeInWhenVisible delay={0.15}>
        <div className="mx-auto mt-12 grid max-w-[700px] grid-cols-1 gap-4 sm:grid-cols-3">
          {comparisons.map((comparison) => (
            <div
              key={comparison.label}
              className={cn(
                'rounded-[var(--radius-xl)] border p-5 text-center',
                comparison.highlight
                  ? 'border-[hsl(var(--color-accent)/0.2)] bg-[hsl(var(--color-accent)/0.06)]'
                  : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]'
              )}
            >
              <p
                className={cn(
                  'mb-2 text-xs font-medium',
                  comparison.highlight
                    ? 'text-[hsl(var(--color-accent))]'
                    : 'text-[hsl(var(--color-text-3))]'
                )}
              >
                {comparison.label}
              </p>
              <p
                className={cn(
                  'mb-1 text-2xl font-bold',
                  comparison.highlight
                    ? 'text-[hsl(var(--color-text-1))]'
                    : 'text-[hsl(var(--color-text-2))]'
                )}
              >
                {comparison.value}
              </p>
              <p className="text-[11px] text-[hsl(var(--color-text-3))]">
                {comparison.note}
              </p>
            </div>
          ))}
        </div>
      </FadeInWhenVisible>
    </Section>
  )
}

function ApiSection() {
  const codeSnippet = `// Create a contract via API
const contract = await fetch(
  'https://api.contrakts.co/v1/contracts',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ctk_v1_...',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Logo design project',
      counterparty_email: 'designer@studio.co',
      milestones: [
        { title: 'Concepts', amount: 500 },
        { title: 'Final delivery', amount: 1500 },
      ],
    }),
  }
);`

  return (
    <Section id="api">
      <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
        <FadeInWhenVisible className="w-full min-w-0 flex-1">
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(220_15%_8%)]">
            <div className="flex items-center gap-2 border-b border-[hsl(var(--color-border))] bg-[hsl(220_15%_10%)] px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-danger)/0.5)]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-warning)/0.5)]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-success)/0.5)]" />
              </div>
              <span className="ml-2 text-[10px] text-[hsl(var(--color-text-3))]">
                create-contract.js
              </span>
            </div>

            <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-relaxed text-[hsl(var(--color-text-2))] md:text-[13px]">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        </FadeInWhenVisible>

        <FadeInWhenVisible delay={0.15} className="min-w-0 flex-1">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--color-text-3))]">
            {'</'} Developer API
          </div>

          <h2 className="mb-5 text-2xl font-semibold leading-[1.15] tracking-[-0.5px] text-[hsl(var(--color-text-1))] md:text-3xl lg:text-4xl">
            Build contracts
            <br />
            into your product
          </h2>

          <p className="mb-6 max-w-[440px] text-base leading-relaxed text-[hsl(var(--color-text-2))]">
            RESTful API with webhook notifications. Create contracts, fund
            escrow, release milestones, and resolve disputes -
            all programmatically.
          </p>

          <div className="mb-8 flex flex-col gap-3">
            {[
              'REST API with full CRUD operations',
              'Webhook subscriptions for real-time events',
              'API key management with scoped permissions',
              'Comprehensive developer documentation',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle
                  size={14}
                  className="flex-shrink-0 text-[hsl(var(--color-success))]"
                />
                <span className="text-sm text-[hsl(var(--color-text-2))]">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/developers"
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] px-5 py-2.5',
              'text-sm font-medium text-[hsl(var(--color-text-2))] transition-all duration-200',
              'hover:border-[hsl(var(--color-border-2))] hover:text-[hsl(var(--color-text-1))]'
            )}
          >
            View API docs
            <ChevronRight size={15} />
          </Link>
        </FadeInWhenVisible>
      </div>
    </Section>
  )
}

function FinalCta() {
  return (
    <section className="px-6 py-20 md:py-28">
      <FadeInWhenVisible>
        <div className="relative mx-auto max-w-[800px] text-center">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                'radial-gradient(ellipse, hsl(var(--color-accent)/0.08) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <h2 className="mb-5 text-3xl font-semibold leading-[1.1] tracking-[-0.5px] text-[hsl(var(--color-text-1))] sm:text-4xl md:text-5xl">
              Stop doing deals
              <br />
              on blind trust
            </h2>

            <p className="mx-auto mb-10 max-w-[480px] text-base leading-relaxed text-[hsl(var(--color-text-2))] md:text-lg">
              Your next contract should be protected by escrow, powered by AI,
              and backed by dispute resolution. It takes 30 seconds.
            </p>

            <Link
              href="/signup"
              className={cn(
                'inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-[hsl(var(--color-accent))] px-8 py-4',
                'text-base font-semibold text-white transition-all duration-200',
                'shadow-[0_8px_32px_hsl(var(--color-accent)/0.3)] hover:brightness-110 active:scale-[0.98]'
              )}
            >
              Create your first contract
              <ArrowRight size={18} />
            </Link>

            <p className="mt-4 text-xs text-[hsl(var(--color-text-3))]">
              Free forever - pay 2% only when escrow is funded
            </p>
          </div>
        </div>
      </FadeInWhenVisible>
    </section>
  )
}

function Footer() {
  const currentYear = new Date().getFullYear()
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Templates', href: '/templates' },
      ],
    },
    {
      title: 'Developers',
      links: [
        { label: 'API docs', href: '/developers' },
        { label: 'Webhooks', href: '/developers' },
        { label: 'Status', href: '#' },
        { label: 'Changelog', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy policy', href: '#' },
        { label: 'Terms of service', href: '#' },
        { label: 'Escrow terms', href: '#' },
        { label: 'Dispute policy', href: '#' },
      ],
    },
  ] as const

  return (
    <footer className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-bg))]">
      <div className="mx-auto max-w-[1200px] px-6 py-12 md:py-16">
        <div className="mb-12 flex flex-col gap-10 lg:flex-row lg:gap-16">
          <div className="flex-shrink-0 lg:w-[240px]">
            <Link href="/" className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[hsl(var(--color-accent))]" />
              <span className="text-base font-semibold tracking-tight text-[hsl(var(--color-text-1))]">
                Contrakts
              </span>
            </Link>
            <p className="max-w-[200px] text-sm leading-relaxed text-[hsl(var(--color-text-3))]">
              Contract execution and escrow protection for any two parties doing
              business.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--color-text-1))]">
                  {column.title}
                </p>
                <div className="flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-sm text-[hsl(var(--color-text-3))] transition-colors duration-200 hover:text-[hsl(var(--color-text-1))]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[hsl(var(--color-border))] pt-8 sm:flex-row">
          <p className="text-xs text-[hsl(var(--color-text-3))]">
            © {currentYear} Contrakts. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-[hsl(var(--color-text-3))] transition-colors duration-200 hover:text-[hsl(var(--color-text-1))]"
                aria-label={social}
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const scrollToSection = (selector: string) => {
    const target = document.querySelector(selector)
    if (!(target instanceof HTMLElement)) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const trustSignals = [
    'No credit card required',
    '2% platform fee',
    'Disputes resolved in 48hrs',
  ]

  return (
    <div className="min-h-screen bg-[hsl(var(--color-bg))] text-[hsl(var(--color-text-1))]">
      <NavBar />

      <main className="overflow-x-clip">
        <Section className="relative overflow-hidden pb-16 pt-28 sm:pt-32 lg:min-h-screen lg:pb-24 lg:pt-36">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--color-accent)/0.06),transparent_60%)]" />
          <div className="relative mx-auto flex max-w-[1140px] flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--color-accent)/0.18)] bg-[hsl(var(--color-accent)/0.08)] px-3 py-1.5 text-xs font-medium text-[hsl(var(--color-accent))]">
                <Shield size={14} />
                Contract execution & escrow protection
              </div>

              <h1 className="mx-auto mt-6 max-w-[720px] text-balance text-[38px] font-semibold leading-[1.02] tracking-[-0.05em] text-[hsl(var(--color-text-1))] sm:text-[48px] lg:text-[56px]">
                Every deal. Protected.
              </h1>

              <p className="mx-auto mt-6 max-w-[560px] text-balance text-base leading-8 text-[hsl(var(--color-text-2))] sm:text-lg">
                Create contracts in seconds with AI. Fund escrow. Deliver
                milestones. Get paid - guaranteed.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ size: 'lg' }), 'min-w-[184px]')}
                >
                  Start for free
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToSection('#how-it-works')}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'lg' }),
                    'min-w-[184px] bg-[hsl(var(--color-surface)/0.8)] backdrop-blur-sm'
                  )}
                >
                  See how it works
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[hsl(var(--color-text-3))]">
                {trustSignals.map((signal, index) => (
                  <div key={signal} className="flex items-center gap-4">
                    <span>{signal}</span>
                    {index < trustSignals.length - 1 ? (
                      <span className="hidden sm:inline">.</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease: 'easeOut' }}
              className="mt-14 w-full lg:mt-16"
            >
              <HeroMock />
            </motion.div>
          </div>
        </Section>

        <SectionDivider />
        <SocialProof />
        <SectionDivider />
        <Features />
        <SectionDivider />
        <HowItWorks />
        <SectionDivider />
        <ProductMockup />
        <SectionDivider />
        <AiSpotlight />
        <SectionDivider />
        <WhoItsFor />
        <SectionDivider />
        <Pricing />
        <SectionDivider />
        <ApiSection />
        <SectionDivider />
        <FinalCta />
      </main>

      <Footer />
    </div>
  )
}
