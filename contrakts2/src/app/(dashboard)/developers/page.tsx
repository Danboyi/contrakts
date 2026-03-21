'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

function CodeBlock({
  code,
  language = 'json',
}: {
  code: string
  language?: string
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied.')
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'relative my-4 overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
        'bg-[hsl(var(--color-surface-2))]'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between border-b border-[hsl(var(--color-border))] px-4 py-2'
        )}
      >
        <span className="text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 text-xs text-[hsl(var(--color-text-3))]',
            'transition-colors duration-150 hover:text-[hsl(var(--color-text-2))]'
          )}
        >
          {copied ? (
            <>
              <Check size={12} />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre
        className={cn(
          'overflow-x-auto px-4 py-4 text-xs font-mono leading-relaxed',
          'text-[hsl(var(--color-text-2))]'
        )}
      >
        {code}
      </pre>
    </div>
  )
}

function SectionHeading({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <h2
      id={id}
      className={cn(
        'mt-10 mb-3 border-b border-[hsl(var(--color-border))] pb-3 text-lg font-semibold',
        'first:mt-0 text-[hsl(var(--color-text-1))]'
      )}
    >
      {children}
    </h2>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-6 mb-2 text-sm font-semibold text-[hsl(var(--color-text-1))]">
      {children}
    </h3>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
      {children}
    </p>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      className={cn(
        'rounded border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))]',
        'px-1.5 py-0.5 text-xs font-mono text-[hsl(var(--color-accent))]'
      )}
    >
      {children}
    </code>
  )
}

function EndpointBadge({
  method,
  path,
}: {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
}) {
  const colors: Record<string, string> = {
    GET: 'bg-[hsl(var(--color-success)/0.1)] text-[hsl(var(--color-success))]',
    POST: 'bg-[hsl(var(--color-accent)/0.1)] text-[hsl(var(--color-accent))]',
    PATCH: 'bg-[hsl(var(--color-warning)/0.1)] text-[hsl(var(--color-warning))]',
    DELETE: 'bg-[hsl(var(--color-danger)/0.1)] text-[hsl(var(--color-danger))]',
  }

  return (
    <div
      className={cn(
        'my-3 flex items-center gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
        'bg-[hsl(var(--color-surface))] p-3 font-mono'
      )}
    >
      <span className={cn('rounded px-2 py-0.5 text-xs font-bold', colors[method])}>
        {method}
      </span>
      <span className="text-sm text-[hsl(var(--color-text-2))]">{path}</span>
    </div>
  )
}

const NAV_SECTIONS = [
  { id: 'getting-started', label: 'Getting started' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'contracts', label: 'Contracts API' },
  { id: 'milestones', label: 'Milestones API' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'events', label: 'Events reference' },
  { id: 'rate-limits', label: 'Rate limits' },
] as const

export default function DevelopersPage() {
  const router = useRouter()
  const [active, setActive] = useState('getting-started')

  function scrollTo(id: string) {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="flex min-h-screen gap-8">
      <aside
        className={cn(
          'sticky top-8 hidden w-[200px] shrink-0 self-start lg:flex lg:flex-col',
          'gap-0.5'
        )}
      >
        <p
          className={cn(
            'mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest',
            'text-[hsl(var(--color-text-3))]'
          )}
        >
          API Reference
        </p>
        {NAV_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollTo(section.id)}
            className={cn(
              'rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-all duration-150',
              active === section.id
                ? 'bg-[hsl(var(--color-accent)/0.1)] font-medium text-[hsl(var(--color-accent))]'
                : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]'
            )}
          >
            {section.label}
          </button>
        ))}
        <div className="mt-2 px-3 py-2 text-sm text-[hsl(var(--color-text-3))] opacity-60">
          SDKs (coming soon)
        </div>
        <div className="mt-4 px-3">
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => router.push('/settings')}
          >
            Get API key
          </Button>
        </div>
      </aside>

      <div className="min-w-0 max-w-[720px] flex-1">
        <SectionHeading id="getting-started">Getting started</SectionHeading>
        <Prose>
          The Contrakts API lets you create contracts, manage milestones, and
          receive webhook events from your own systems. All API requests must be
          authenticated with an API key. The base URL for all requests is:
        </Prose>
        <CodeBlock language="text" code="https://contrakts.io/api/v1" />
        <Prose>
          Generate an API key from your{' '}
          <button
            type="button"
            onClick={() => router.push('/settings')}
            className="text-[hsl(var(--color-accent))] hover:underline"
          >
            Settings page
          </button>{' '}
          under API keys.
        </Prose>

        <SectionHeading id="authentication">Authentication</SectionHeading>
        <Prose>
          Authenticate by passing your API key in the{' '}
          <InlineCode>Authorization</InlineCode> header:
        </Prose>
        <CodeBlock
          language="bash"
          code={`curl https://contrakts.io/api/v1/contracts \\
  -H "Authorization: Bearer ctk_v1_your_api_key_here" \\
  -H "Content-Type: application/json"`}
        />
        <Prose>
          API keys begin with <InlineCode>ctk_v1_</InlineCode>. Keys are
          scoped, and each key can only perform actions within its assigned
          scopes.
        </Prose>
        <CodeBlock
          language="text"
          code={`contracts:read    - Read contract details and status
contracts:write   - Create and update contracts
milestones:read   - Read milestone details
milestones:write  - Update milestone status
payments:read     - Read payment and escrow data
webhooks:manage   - Create and manage webhook subscriptions`}
        />

        <SectionHeading id="contracts">Contracts API</SectionHeading>
        <SubHeading>List contracts</SubHeading>
        <EndpointBadge method="GET" path="/api/v1/contracts" />
        <Prose>
          Returns all contracts where you are a party. Optional query params:
          <InlineCode>state</InlineCode>, <InlineCode>limit</InlineCode>{' '}
          (max 100), and <InlineCode>offset</InlineCode>.
        </Prose>
        <CodeBlock
          language="json"
          code={`{
  "data": {
    "contracts": [
      {
        "id": "uuid",
        "ref_code": "CTR-2025-00441",
        "title": "Brand identity project",
        "state": "active",
        "currency": "USD",
        "total_value": 600000,
        "created_at": "2025-01-15T10:00:00Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  },
  "success": true
}`}
        />

        <SubHeading>Get contract</SubHeading>
        <EndpointBadge method="GET" path="/api/v1/contracts/:id" />

        <SubHeading>Create contract</SubHeading>
        <EndpointBadge method="POST" path="/api/v1/contracts" />
        <CodeBlock
          language="json"
          code={`{
  "title": "Website redesign",
  "industry": "creative",
  "currency": "USD",
  "counterparty_email": "vendor@example.com",
  "terms": "Scope limited to deliverables in milestones...",
  "milestones": [
    {
      "title": "Design mockups",
      "amount": 2000,
      "deadline": "2025-02-01"
    },
    {
      "title": "Development and launch",
      "amount": 4000,
      "deadline": "2025-03-01"
    }
  ]
}`}
        />

        <SectionHeading id="milestones">Milestones API</SectionHeading>
        <SubHeading>Get milestone</SubHeading>
        <EndpointBadge method="GET" path="/api/v1/milestones/:id" />

        <SubHeading>Submit delivery</SubHeading>
        <EndpointBadge method="PATCH" path="/api/v1/milestones/:id" />
        <CodeBlock
          language="json"
          code={`{ "action": "submit", "note": "Delivery complete." }`}
        />

        <SubHeading>Approve milestone</SubHeading>
        <EndpointBadge method="PATCH" path="/api/v1/milestones/:id" />
        <CodeBlock language="json" code={`{ "action": "approve" }`} />

        <SectionHeading id="webhooks">Webhooks</SectionHeading>
        <Prose>
          Subscribe to contract events via webhooks. Contrakts sends a signed
          POST request to your endpoint whenever a subscribed event fires.
        </Prose>

        <SubHeading>Verify webhook signatures</SubHeading>
        <Prose>
          Every webhook request includes{' '}
          <InlineCode>X-Contrakts-Signature</InlineCode> and{' '}
          <InlineCode>X-Contrakts-Timestamp</InlineCode> headers. Verify the
          signature to ensure the request came from Contrakts:
        </Prose>
        <CodeBlock
          language="typescript"
          code={`import crypto from 'crypto'

function verifyWebhook(
  rawBody: string,
  signature: string,
  timestamp: string,
  secret: string,
): boolean {
  const signed = \`\${timestamp}.\${rawBody}\`
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signed)
    .digest('hex')

  return expected === signature
}`}
        />

        <SubHeading>Create subscription</SubHeading>
        <EndpointBadge method="POST" path="/api/v1/webhooks" />
        <CodeBlock
          language="json"
          code={`{
  "url": "https://yourdomain.com/webhooks/contrakts",
  "events": [
    "contract.funded",
    "milestone.submitted",
    "payment.released"
  ]
}`}
        />
        <Prose>
          The response includes a <InlineCode>secret</InlineCode> field. Store
          it securely because it is shown only once and cannot be retrieved
          again.
        </Prose>

        <SubHeading>List subscriptions</SubHeading>
        <EndpointBadge method="GET" path="/api/v1/webhooks" />

        <SubHeading>Delete subscription</SubHeading>
        <EndpointBadge method="DELETE" path="/api/v1/webhooks/:id" />

        <SectionHeading id="events">Events reference</SectionHeading>
        <CodeBlock
          language="text"
          code={`contract.created      Contract created via API or web app
contract.signed       A party has signed the contract
contract.funded       Escrow deposit confirmed
contract.complete     All milestones paid and contract complete
contract.voided       Contract voided before funding

milestone.submitted   Vendor submitted a delivery
milestone.approved    Client approved and payout queued

payment.released      Milestone payment sent to vendor
payment.failed        Transfer failed and needs manual review

dispute.raised        Dispute opened on a milestone
dispute.resolved      Arbitrator issued a ruling`}
        />

        <SectionHeading id="rate-limits">Rate limits</SectionHeading>
        <Prose>
          The API is rate limited to 60 requests per minute per API key. Rate
          limit information is returned in response headers:
        </Prose>
        <CodeBlock
          language="text"
          code={`X-RateLimit-Limit:     60
X-RateLimit-Remaining: 58
X-RateLimit-Reset:     1706270460`}
        />
        <Prose>
          When the limit is exceeded, the API returns{' '}
          <InlineCode>429 Too Many Requests</InlineCode> with a{' '}
          <InlineCode>Retry-After</InlineCode> header indicating how many
          seconds to wait before retrying.
        </Prose>
      </div>
    </div>
  )
}
