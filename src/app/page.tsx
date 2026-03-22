import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Shield,
  Scale,
  Zap,
  Lock,
  Users,
  Star,
  ChevronRight,
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'AI-powered contracts',
    description:
      'Draft professional contracts in minutes. Our AI understands your industry and generates bulletproof terms tailored to your deal.',
  },
  {
    icon: Shield,
    title: 'Milestone escrow',
    description:
      'Funds are held securely and released automatically when milestones are approved. Both parties are protected at every stage.',
  },
  {
    icon: Scale,
    title: 'Fair dispute resolution',
    description:
      'When things go wrong, our AI-assisted arbitration reviews all evidence and delivers impartial decisions in days, not months.',
  },
  {
    icon: Zap,
    title: 'Instant payments',
    description:
      'Release milestone payments instantly via bank transfer, mobile money, or crypto. Global coverage, zero friction.',
  },
  {
    icon: Lock,
    title: 'Bank-grade security',
    description:
      'End-to-end encrypted, SOC 2 compliant, with full audit logs of every action taken on every contract.',
  },
  {
    icon: Users,
    title: 'Multi-party contracts',
    description:
      'Bring multiple vendors, clients, and stakeholders into a single contract with fine-grained role permissions.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Draft your contract',
    description:
      'Describe the project, milestones, and payment terms. Our AI builds a contract in seconds.',
  },
  {
    number: '02',
    title: 'Both parties sign',
    description:
      'The counterparty reviews, negotiates if needed, and signs. Everything is recorded on the audit log.',
  },
  {
    number: '03',
    title: 'Fund the escrow',
    description:
      'The client deposits funds into escrow. Work begins only when the contract is fully funded.',
  },
  {
    number: '04',
    title: 'Complete & get paid',
    description:
      'Submit work, get it approved, and receive payment instantly. Every milestone, every time.',
  },
]

const testimonials = [
  {
    quote:
      "We've closed over $2M in freelance contracts through Contrakts. The escrow gives our clients confidence and we always get paid on time.",
    author: 'Amara Osei',
    role: 'Creative Director',
    initials: 'AO',
  },
  {
    quote:
      "As a startup, we were getting burned by contractors who'd vanish. Contrakts milestone escrow changed everything — now we only pay for delivered work.",
    author: 'Kofi Mensah',
    role: 'CTO, BuildFast',
    initials: 'KM',
  },
  {
    quote:
      'The dispute resolution saved a $45,000 deal that would have gone to litigation. We had a resolution in 72 hours.',
    author: 'Ngozi Adeyemi',
    role: 'Agency Owner',
    initials: 'NA',
  },
]

const stats = [
  { value: '$120M+', label: 'Escrow processed' },
  { value: '18,000+', label: 'Contracts executed' },
  { value: '99.2%', label: 'Dispute resolution rate' },
  { value: '40+', label: 'Countries supported' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--color-bg))] text-[hsl(var(--color-text-1))]">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-bg)/0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-[hsl(var(--color-text-1))]">
            Contrakts
          </span>
          <nav className="hidden items-center gap-8 md:flex">
            {[
              ['#features', 'Features'],
              ['#how-it-works', 'How it works'],
              ['#testimonials', 'Testimonials'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm text-[hsl(var(--color-text-3))] transition-colors hover:text-[hsl(var(--color-text-1))]"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[hsl(var(--color-text-2))] transition-colors hover:text-[hsl(var(--color-text-1))]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[hsl(var(--color-accent))] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Get started free
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-24 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[600px] w-[600px] rounded-full bg-[hsl(var(--color-accent)/0.06)] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--color-accent)/0.3)] bg-[hsl(var(--color-accent)/0.08)] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--color-accent))]" />
            <span className="text-xs font-medium text-[hsl(var(--color-accent))]">
              AI-powered contract management
            </span>
          </div>

          <h1 className="mb-6 text-5xl font-semibold leading-[1.1] tracking-tight text-[hsl(var(--color-text-1))] md:text-7xl">
            Every deal.{' '}
            <span className="bg-gradient-to-r from-[hsl(var(--color-accent))] to-[hsl(239,84%,80%)] bg-clip-text text-transparent">
              Protected.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[hsl(var(--color-text-2))]">
            Draft contracts with AI, hold payments in escrow, and resolve
            disputes fairly. The all-in-one platform for freelancers, agencies,
            and startups.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-[hsl(var(--color-accent))] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--color-accent)/0.25)] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Start for free
              <ArrowRight size={15} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-7 py-3.5 text-sm font-medium text-[hsl(var(--color-text-2))] transition-all hover:border-[hsl(var(--color-border-2))] hover:text-[hsl(var(--color-text-1))]"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-xs text-[hsl(var(--color-text-3))]">
            No credit card required · Free for first 3 contracts
          </p>
        </div>

        {/* Hero card mockup */}
        <div className="relative mx-auto mt-20 max-w-2xl">
          <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6 shadow-2xl shadow-black/40">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="mb-1 text-[11px] text-[hsl(var(--color-text-3))]">
                  CTR-2025-00441
                </p>
                <p className="text-base font-semibold text-[hsl(var(--color-text-1))]">
                  Brand Identity Project
                </p>
              </div>
              <span className="rounded-full bg-[hsl(var(--color-success)/0.12)] px-3 py-1 text-xs font-medium text-[hsl(var(--color-success))]">
                Funded
              </span>
            </div>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  ['AC', 'accent'],
                  ['BR', 'success'],
                ].map(([initials, color]) => (
                  <div
                    key={initials}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[hsl(var(--color-surface))] text-[10px] font-bold"
                    style={{
                      background: `hsl(var(--color-${color}) / 0.2)`,
                      color: `hsl(var(--color-${color}))`,
                    }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-xs text-[hsl(var(--color-text-3))]">
                Amara Osei · Brand Republic
              </span>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex justify-between">
                <span className="text-xs text-[hsl(var(--color-text-3))]">
                  Milestones
                </span>
                <span className="text-xs text-[hsl(var(--color-text-2))]">
                  2 of 3 complete
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(var(--color-border))]">
                <div
                  className="h-full rounded-full bg-[hsl(var(--color-success))]"
                  style={{ width: '66%' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] px-4 py-3">
              <div>
                <p className="text-[11px] text-[hsl(var(--color-text-3))]">
                  Escrow held
                </p>
                <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                  $12,500.00
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle
                  size={13}
                  className="text-[hsl(var(--color-success))]"
                />
                <span className="text-xs text-[hsl(var(--color-success))]">
                  Secured
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 -top-4 flex items-center gap-2 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-3 py-2 shadow-lg">
            <Shield
              size={14}
              className="text-[hsl(var(--color-accent))]"
            />
            <span className="text-xs font-medium text-[hsl(var(--color-text-1))]">
              Escrow protected
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface)/0.5)] px-6 py-14">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="mb-1 text-3xl font-semibold tracking-tight text-[hsl(var(--color-text-1))]">
                {stat.value}
              </p>
              <p className="text-sm text-[hsl(var(--color-text-3))]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--color-accent))]">
              Features
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[hsl(var(--color-text-1))] md:text-4xl">
              Everything you need to close deals safely
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6 transition-all duration-200 hover:border-[hsl(var(--color-border-2))] hover:bg-[hsl(var(--color-surface-2)/0.5)]"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[hsl(var(--color-accent)/0.1)]">
                    <Icon
                      size={18}
                      className="text-[hsl(var(--color-accent))]"
                    />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-[hsl(var(--color-text-1))]">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[hsl(var(--color-text-3))]">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-[hsl(var(--color-surface)/0.3)] px-6 py-24"
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--color-accent))]">
              How it works
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[hsl(var(--color-text-1))] md:text-4xl">
              From agreement to payment in 4 steps
            </h2>
          </div>

          <div className="flex flex-col gap-10">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex gap-6 md:gap-8">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] text-sm font-semibold text-[hsl(var(--color-accent))]">
                  {step.number}
                  {index < steps.length - 1 && (
                    <div className="absolute -bottom-10 left-1/2 h-10 w-0.5 -translate-x-1/2 bg-[hsl(var(--color-border))]" />
                  )}
                </div>
                <div className="pt-3">
                  <h3 className="mb-2 text-base font-semibold text-[hsl(var(--color-text-1))]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[hsl(var(--color-text-3))]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--color-accent))]">
              Testimonials
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[hsl(var(--color-text-1))] md:text-4xl">
              Trusted by teams across Africa and beyond
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className="fill-[hsl(var(--color-gold))] text-[hsl(var(--color-gold))]"
                    />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-accent)/0.12)] text-xs font-semibold text-[hsl(var(--color-accent))]">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                      {testimonial.author}
                    </p>
                    <p className="text-xs text-[hsl(var(--color-text-3))]">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-xl)] border border-[hsl(var(--color-accent)/0.2)] bg-gradient-to-b from-[hsl(var(--color-accent)/0.08)] to-transparent p-12 text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-[hsl(var(--color-text-1))]">
            Start protecting your deals today
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
            Free for your first 3 contracts. No credit card required. Set up in
            under 5 minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-[hsl(var(--color-accent))] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--color-accent)/0.25)] transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Create your free account
            <ChevronRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--color-border))] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-sm font-medium text-[hsl(var(--color-text-1))]">
            Contrakts
          </span>
          <div className="flex gap-6">
            {['Terms', 'Privacy', 'Security', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs text-[hsl(var(--color-text-3))] transition-colors hover:text-[hsl(var(--color-text-2))]"
              >
                {item}
              </a>
            ))}
          </div>
          <p className="text-xs text-[hsl(var(--color-text-3))]">
            © {new Date().getFullYear()} Contrakts. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
