'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Edit3,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { refineContractDraft } from '@/lib/ai/generate'
import type { AiContractDraft, AiRiskFlag } from '@/lib/ai/types'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'

const EXAMPLE_PROMPTS = [
  "I'm hiring a developer to build a food delivery mobile app with rider tracking. Budget around $12,000, timeline 3 months.",
  'A contractor is renovating my kitchen in Lagos. New cabinets, countertops, tiling, and plumbing fixtures. Budget around NGN 4,500,000.',
  "I'm commissioning a full brand identity with logo, guidelines, typography, and social assets. Budget about $6,000.",
  "I'm hiring a consultant to restructure our sales team and build a go-to-market plan over 6 weeks for about $8,000.",
] as const

const INDUSTRIES = [
  { value: 'software', label: 'Software' },
  { value: 'creative', label: 'Creative' },
  { value: 'construction', label: 'Construction' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'events', label: 'Events' },
  { value: 'logistics', label: 'Logistics' },
] as const

type Phase = 'input' | 'generating' | 'review'

function extractValue(source: string, key: string) {
  const token = `"${key}"`
  const start = source.indexOf(token)
  if (start === -1) {
    return ''
  }

  const colon = source.indexOf(':', start + token.length)
  const quote = source.indexOf('"', colon)
  if (colon === -1 || quote === -1) {
    return ''
  }

  let result = ''
  let escaped = false
  for (let index = quote + 1; index < source.length; index += 1) {
    const char = source[index]

    if (escaped) {
      result += `\\${char}`
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '"') {
      break
    }

    result += char
  }

  return result
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
}

function extractMilestones(source: string) {
  const start = source.indexOf('"milestones"')
  if (start === -1) {
    return []
  }

  const section = source.slice(start)
  const matches = section.matchAll(
    /"title"\s*:\s*"([^"]*)"\s*,\s*"description"\s*:\s*"([^"]*)"/g
  )

  return Array.from(matches)
    .slice(0, 6)
    .map((match) => ({
      title: match[1]?.replace(/\\"/g, '"') ?? '',
      description: match[2]?.replace(/\\"/g, '"') ?? '',
    }))
}

function StreamingText({ text }: { text: string }) {
  return (
    <div className="font-mono text-xs leading-relaxed text-[hsl(var(--color-text-2))] whitespace-pre-wrap break-words">
      {text}
      <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse-soft bg-[hsl(var(--color-accent))] align-middle" />
    </div>
  )
}

function RiskFlag({ flag }: { flag: AiRiskFlag }) {
  const [open, setOpen] = useState(flag.severity === 'high')
  const tone =
    flag.severity === 'high'
      ? 'border-[hsl(var(--color-danger)/0.28)] bg-[hsl(var(--color-danger)/0.08)] text-[hsl(var(--color-danger))]'
      : flag.severity === 'medium'
        ? 'border-[hsl(var(--color-warning)/0.28)] bg-[hsl(var(--color-warning)/0.08)] text-[hsl(var(--color-warning))]'
        : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-2))]'

  return (
    <div className={cn('rounded-[var(--radius-md)] border p-3', tone)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 text-left"
      >
        <AlertTriangle size={13} />
        <span className="flex-1 text-xs font-medium">{flag.title}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-2 border-t border-[hsl(var(--color-border))] pt-2">
          <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
            {flag.description}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--color-accent))]">
            Suggestion: {flag.suggestion}
          </p>
        </div>
      )}
    </div>
  )
}

export function ContractDrafter({
  onUseDraft,
}: {
  onUseDraft: (draft: AiContractDraft, targetStep?: number) => void
}) {
  const [phase, setPhase] = useState<Phase>('input')
  const [description, setDescription] = useState('')
  const [industry, setIndustry] = useState('')
  const [streamText, setStreamText] = useState('')
  const [draft, setDraft] = useState<AiContractDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exampleIndex, setExampleIndex] = useState(0)
  const [termsOpen, setTermsOpen] = useState(false)
  const [refineOpen, setRefineOpen] = useState(false)
  const [refineFeedback, setRefineFeedback] = useState('')
  const [isPending, startTransition] = useTransition()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (phase !== 'input' || description.trim()) {
      return
    }

    const interval = window.setInterval(() => {
      setExampleIndex((current) => (current + 1) % EXAMPLE_PROMPTS.length)
    }, 3500)

    return () => window.clearInterval(interval)
  }, [description, phase])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  async function generate() {
    if (description.trim().length < 20) {
      setError('Describe your deal in at least 20 characters.')
      return
    }

    setError(null)
    setDraft(null)
    setStreamText('')
    setPhase('generating')
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch('/api/ai/generate-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          industry: industry || undefined,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(body?.error ?? 'Generation failed.')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream was returned.')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let completed = false

      const processChunk = (chunk: string) => {
        const trimmed = chunk.trim()
        if (!trimmed.startsWith('data:')) {
          return false
        }

        const payload = JSON.parse(trimmed.slice(5).trim()) as
          | { type: 'delta'; content: string }
          | { type: 'complete'; data: AiContractDraft }
          | { type: 'error'; content: string }

        if (payload.type === 'delta') {
          setStreamText((current) => current + payload.content)
          return false
        }

        if (payload.type === 'complete') {
          setDraft(payload.data)
          setTermsOpen(true)
          setPhase('review')
          return true
        }

        throw new Error(payload.content)
      }

      while (!completed) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const segments = buffer.split('\n\n')
        buffer = segments.pop() ?? ''

        for (const segment of segments) {
          completed = processChunk(segment)
          if (completed) {
            break
          }
        }
      }

      if (!completed && buffer.trim()) {
        processChunk(buffer)
      }
    } catch (generationError) {
      if (
        generationError instanceof Error &&
        generationError.name === 'AbortError'
      ) {
        return
      }

      setPhase('input')
      setStreamText('')
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Something went wrong. Please try again.'
      )
    }
  }

  function handleRefine() {
    if (!draft || !refineFeedback.trim()) {
      return
    }

    startTransition(async () => {
      const result = await refineContractDraft(
        description,
        refineFeedback,
        industry || undefined
      )

      if (!result.success || !result.draft) {
        toast.error(result.error ?? 'Refinement failed.')
        return
      }

      setDraft(result.draft)
      setRefineFeedback('')
      setRefineOpen(false)
      setTermsOpen(true)
    })
  }

  const preview = {
    title: extractValue(streamText, 'title'),
    description: extractValue(streamText, 'description'),
    terms: extractValue(streamText, 'terms'),
    milestones: streamText.includes('"milestones"') ? extractMilestones(streamText) : [],
  }
  const progress = [
    Boolean(preview.title || preview.description),
    Boolean(preview.milestones.length > 0 || streamText.includes('"milestones"')),
    Boolean(preview.terms || streamText.includes('"terms"')),
  ].filter(Boolean).length

  return (
    <div className="w-full max-w-full">
      <AnimatePresence mode="wait">
        {phase === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-5"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--color-accent)/0.12)]">
                <Sparkles size={22} className="text-[hsl(var(--color-accent))]" />
              </div>
              <h2 className="text-xl font-semibold text-[hsl(var(--color-text-1))]">
                Describe your deal
              </h2>
              <p className="mx-auto mt-2 max-w-[560px] text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                Tell us what you are agreeing to in plain English. Contrakts AI
                will draft the structure, milestones, terms, and risks in seconds.
              </p>
            </div>

            <div className="relative">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={EXAMPLE_PROMPTS[exampleIndex]}
                rows={6}
                autoFocus
                className="min-h-[176px] w-full resize-none rounded-[var(--radius-xl)] border-2 border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] px-4 py-4 text-sm leading-relaxed text-[hsl(var(--color-text-1))] outline-none transition-all duration-200 placeholder:text-[hsl(var(--color-text-3))] focus:border-[hsl(var(--color-accent)/0.6)] focus:shadow-[0_0_0_4px_hsl(var(--color-accent)/0.08)]"
              />
              <div className="absolute bottom-3 right-3 text-[11px] text-[hsl(var(--color-text-3))]">
                {description.length}/2000
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextIndex = (exampleIndex + 1) % EXAMPLE_PROMPTS.length
                setExampleIndex(nextIndex)
                setDescription(EXAMPLE_PROMPTS[nextIndex])
                setError(null)
              }}
              className="inline-flex min-h-[44px] items-center text-left text-xs text-[hsl(var(--color-text-3))] transition-colors hover:text-[hsl(var(--color-accent))]"
            >
              Try an example
            </button>

            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setIndustry((current) =>
                      current === option.value ? '' : option.value
                    )
                  }
                  className={cn(
                    'min-h-[40px] rounded-full border px-3 py-1.5 text-xs transition-all duration-150',
                    industry === option.value
                      ? 'border-[hsl(var(--color-accent)/0.35)] bg-[hsl(var(--color-accent)/0.12)] font-medium text-[hsl(var(--color-accent))]'
                      : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-2))] hover:border-[hsl(var(--color-border-2))]'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.1)] px-4 py-3">
                <AlertTriangle
                  size={14}
                  className="text-[hsl(var(--color-danger))]"
                />
                <p className="text-xs text-[hsl(var(--color-danger))]">
                  {error}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => void generate()}
              disabled={description.trim().length < 20}
              className={cn(
                'inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-[var(--radius-xl)] px-5 text-base font-semibold transition-all duration-200 sm:w-auto',
                'active:scale-[0.98]',
                description.trim().length >= 20
                  ? 'bg-[hsl(var(--color-accent))] text-white shadow-[0_4px_20px_hsl(var(--color-accent)/0.3)] hover:brightness-110'
                  : 'cursor-not-allowed bg-[hsl(var(--color-surface-2))] text-[hsl(var(--color-text-3))]'
              )}
            >
              <Sparkles size={18} />
              Draft my contract
            </button>
          </motion.div>
        )}

        {phase === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--color-accent)/0.12)]">
                <Sparkles
                  size={18}
                  className="animate-pulse-soft text-[hsl(var(--color-accent))]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                  Drafting your contract live
                </p>
                <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                  Watching the structure form in real time
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-all duration-200',
                      index < progress
                        ? 'bg-[hsl(var(--color-accent))]'
                        : 'bg-[hsl(var(--color-border-2))]'
                    )}
                  />
                ))}
              </div>
            </div>

            {(preview.title || preview.description) && (
              <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--color-text-3))]">
                  Contract overview
                </p>
                <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                  {preview.title || 'Building title...'}
                </p>
                {preview.description && (
                  <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                    {preview.description}
                  </p>
                )}
              </div>
            )}

            {(preview.milestones.length > 0 || streamText.includes('"milestones"')) && (
              <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--color-text-3))]">
                  Milestones
                </p>
                <div className="space-y-2">
                  {preview.milestones.length > 0 ? (
                    preview.milestones.map((milestone, index) => (
                      <div
                        key={`${milestone.title}-${index}`}
                        className="rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] p-3"
                      >
                        <p className="text-xs font-medium text-[hsl(var(--color-text-1))]">
                          {milestone.title}
                        </p>
                        {milestone.description && (
                          <p className="mt-1 text-[11px] leading-relaxed text-[hsl(var(--color-text-3))]">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-12 animate-pulse-soft rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))]" />
                  )}
                </div>
              </div>
            )}

            <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-5">
              {preview.terms ? (
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                  {preview.terms}
                </p>
              ) : (
                <StreamingText text={streamText} />
              )}
            </div>
          </motion.div>
        )}

        {phase === 'review' && draft && (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            <div className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-accent)/0.25)] bg-[hsl(var(--color-accent)/0.06)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                    Contract drafted
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                    Confidence {draft.confidence}% | Language {draft.language_used}
                  </p>
                </div>
                <span className="rounded-full border border-[hsl(var(--color-accent)/0.25)] bg-[hsl(var(--color-accent)/0.1)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--color-accent))]">
                  {draft.risk_flags.length} flags
                </span>
              </div>
            </div>

            <section className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
              <div className="flex flex-col gap-3 border-b border-[hsl(var(--color-border))] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                    Contract overview
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                    Title, summary and estimated value
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUseDraft(draft, 0)}
                  className="min-h-[44px] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))] px-3 py-2 text-xs font-medium text-[hsl(var(--color-text-2))] transition hover:border-[hsl(var(--color-accent)/0.35)] hover:text-[hsl(var(--color-accent))]"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-4 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-[hsl(var(--color-text-1))]">
                    {draft.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
                    {draft.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] p-3">
                    <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                      {formatCurrency(draft.estimated_value, draft.currency)}
                    </p>
                    <p className="text-[11px] text-[hsl(var(--color-text-3))]">
                      Estimated total
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] p-3">
                    <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                      {draft.duration_days} days
                    </p>
                    <p className="text-[11px] text-[hsl(var(--color-text-3))]">
                      Suggested duration
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] p-3">
                    <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                      {draft.milestones.length}
                    </p>
                    <p className="text-[11px] text-[hsl(var(--color-text-3))]">
                      Milestones
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
              <div className="flex flex-col gap-3 border-b border-[hsl(var(--color-border))] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                    Milestones
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                    Payment releases and acceptance checkpoints
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUseDraft(draft, 1)}
                  className="min-h-[44px] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))] px-3 py-2 text-xs font-medium text-[hsl(var(--color-text-2))] transition hover:border-[hsl(var(--color-accent)/0.35)] hover:text-[hsl(var(--color-accent))]"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-3 px-5 py-4">
                {draft.milestones.map((milestone, index) => (
                  <div
                    key={`${milestone.title}-${index}`}
                    className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-3 sm:flex-row sm:items-start"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-accent)/0.12)] text-[11px] font-semibold text-[hsl(var(--color-accent))]">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                        {milestone.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--color-text-3))]">
                        {milestone.description}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                        {formatCurrency(milestone.amount, draft.currency)}
                      </p>
                      <p className="text-[11px] text-[hsl(var(--color-text-3))]">
                        {milestone.percentage}% | day {milestone.deadline_days}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]">
              <div className="flex flex-col gap-3 border-b border-[hsl(var(--color-border))] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">
                    Terms
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                    Plain-language contract terms ready for review
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUseDraft(draft, 2)}
                  className="min-h-[44px] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))] px-3 py-2 text-xs font-medium text-[hsl(var(--color-text-2))] transition hover:border-[hsl(var(--color-accent)/0.35)] hover:text-[hsl(var(--color-accent))]"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setTermsOpen((value) => !value)}
                  className="flex min-h-[44px] w-full items-center justify-between rounded-[var(--radius-md)] bg-[hsl(var(--color-surface-2))] px-3 py-2 text-left text-sm font-medium text-[hsl(var(--color-text-2))]"
                >
                  <span>{termsOpen ? 'Hide terms draft' : 'Show terms draft'}</span>
                  {termsOpen ? (
                    <ChevronUp size={14} className="text-[hsl(var(--color-text-3))]" />
                  ) : (
                    <ChevronDown size={14} className="text-[hsl(var(--color-text-3))]" />
                  )}
                </button>
                {termsOpen && (
                  <div className="rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] p-4">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                      {draft.terms}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {draft.risk_flags.length > 0 && (
              <div className="flex flex-col gap-2">
                {draft.risk_flags.map((flag, index) => (
                  <RiskFlag key={`${flag.title}-${index}`} flag={flag} />
                ))}
              </div>
            )}

            {refineOpen && (
              <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-4">
                <p className="mb-2 text-xs font-medium text-[hsl(var(--color-text-2))]">
                  What should change in the next draft?
                </p>
                <textarea
                  value={refineFeedback}
                  onChange={(event) => setRefineFeedback(event.target.value)}
                  rows={3}
                  placeholder="Example: increase the budget, add a QA milestone, and make the revision limit explicit."
                  className="w-full resize-none rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] px-3 py-2.5 text-sm text-[hsl(var(--color-text-1))] outline-none transition-all duration-150 placeholder:text-[hsl(var(--color-text-3))] focus:border-[hsl(var(--color-accent))] focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]"
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleRefine}
                    disabled={!refineFeedback.trim() || isPending}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[hsl(var(--color-accent))] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    Refine draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefineOpen(false)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] px-4 text-sm text-[hsl(var(--color-text-3))] transition hover:text-[hsl(var(--color-text-1))]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-success)/0.18)] bg-[hsl(var(--color-success)/0.06)] px-4 py-3">
              <Shield size={15} className="shrink-0 text-[hsl(var(--color-success))]" />
              <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
                Contrakts escrow holds the funds and releases each payment only
                after milestone approval.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onUseDraft(draft, 3)}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[hsl(var(--color-accent))] px-5 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
              >
                Use this contract
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => setRefineOpen((value) => !value)}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border-2))] px-4 text-sm text-[hsl(var(--color-text-2))] transition hover:border-[hsl(var(--color-accent)/0.35)] hover:text-[hsl(var(--color-accent))]"
              >
                <Edit3 size={14} />
                Refine
              </button>
              <button
                type="button"
                onClick={() => void generate()}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] px-4 text-sm text-[hsl(var(--color-text-3))] transition hover:text-[hsl(var(--color-text-1))]"
              >
                <RefreshCw size={14} />
                Regenerate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
