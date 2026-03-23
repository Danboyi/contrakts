import Link from 'next/link'

const footerGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Templates', href: '/login' },
      { label: 'Developer API', href: '/#developer-api' },
      { label: 'API Documentation', href: '/login' },
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
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Escrow Agreement', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
      <div className="mx-auto grid w-full max-w-[1140px] gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.35fr_repeat(3,0.8fr)] lg:px-8">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--color-text-1))]">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--color-accent))]" />
            Contrakts
          </div>
          <p className="mt-4 text-sm leading-7 text-[hsl(var(--color-text-2))]">
            Contract execution and escrow protection for every deal.
          </p>
          <p className="mt-6 text-sm text-[hsl(var(--color-text-3))]">
            © 2025 Contrakts. All rights reserved.
          </p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
              {group.title}
            </p>
            <ul className="mt-4 space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[hsl(var(--color-text-2))] transition-colors duration-150 hover:text-[hsl(var(--color-text-1))]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  )
}
