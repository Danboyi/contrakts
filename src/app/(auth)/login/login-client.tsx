'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useTransition } from 'react'
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react'
import { login, sendMagicLink } from '@/lib/auth/actions'

function LoginPageContent() {
  const searchParams = useSearchParams()
  const rateLimited = searchParams.get('error') === 'too_many_attempts'
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [magicOk, setMagicOk] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'auth_callback_failed') {
      setError('We could not complete sign-in. Please request a new magic link.')
    }
  }, [])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) setError(result.error)
    })
  }

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const email = new FormData(event.currentTarget).get('email') as string
    startTransition(async () => {
      const result = await sendMagicLink(email)
      if (result?.error) setError(result.error)
      else setMagicOk(true)
    })
  }

  const inputClass =
    'h-11 w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] pl-10 pr-4 text-sm text-[hsl(var(--color-text-1))] outline-none placeholder:text-[hsl(var(--color-text-3))] transition-all focus:border-[hsl(var(--color-accent))] focus:ring-2 focus:ring-[hsl(var(--color-accent)/0.12)]'

  const iconClass =
    'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-text-3))]'

  const submitClass =
    'mb-4 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[hsl(var(--color-accent))] text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60'

  return (
    <div>
      <h2 className="mb-2 text-2xl font-semibold text-[hsl(var(--color-text-1))]">
        Welcome back
      </h2>
      <p className="mb-8 text-sm text-[hsl(var(--color-text-2))]">
        Sign in to your Contrakts account.
      </p>

      {rateLimited && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.1)] px-4 py-3 text-sm text-[hsl(var(--color-danger))]">
          Too many login attempts. Please wait 15 minutes before trying again.
        </div>
      )}

      {/* Mode toggle */}
      <div className="mb-6 flex gap-1 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-1">
        {(['password', 'magic'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value)
              setError(null)
              setMagicOk(false)
            }}
            className={[
              'flex-1 rounded-[calc(var(--radius-md)-2px)] py-2 text-[13px] transition-all duration-150',
              mode === value
                ? 'bg-[hsl(var(--color-surface-2))] font-medium text-[hsl(var(--color-text-1))]'
                : 'font-normal text-[hsl(var(--color-text-3))]',
            ].join(' ')}
          >
            {value === 'password' ? 'Password' : 'Magic link'}
          </button>
        ))}
      </div>

      {mode === 'password' ? (
        <form onSubmit={handleLogin}>
          <div className="relative mb-3">
            <Mail size={15} className={iconClass} />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              required
              autoFocus
              className={inputClass}
            />
          </div>
          <div className="relative mb-4">
            <Lock size={15} className={iconClass} />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              className={inputClass}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.1)] px-4 py-2.5 text-[13px] text-[hsl(var(--color-danger))]">
              {error}
            </div>
          )}

          <button type="submit" disabled={isPending} className={submitClass}>
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Please wait...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleMagicLink}>
          {magicOk ? (
            <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-success)/0.25)] bg-[hsl(var(--color-success)/0.08)] p-5 text-center">
              <p className="mb-1.5 text-sm font-medium text-[hsl(var(--color-success))]">
                Check your email
              </p>
              <p className="text-[13px] text-[hsl(var(--color-text-2))]">
                We sent a sign-in link to your inbox. It expires in 10 minutes.
              </p>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Mail size={15} className={iconClass} />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  required
                  autoFocus
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="mb-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.1)] px-4 py-2.5 text-[13px] text-[hsl(var(--color-danger))]">
                  {error}
                </div>
              )}

              <button type="submit" disabled={isPending} className={submitClass}>
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send magic link
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </>
          )}
        </form>
      )}

      <p className="mb-6 text-center text-[13px] text-[hsl(var(--color-text-3))]">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-[hsl(var(--color-accent))] hover:underline"
        >
          Sign up
        </Link>
      </p>

      <p className="text-center text-xs leading-relaxed text-[hsl(var(--color-text-3))]">
        By continuing you agree to the{' '}
        <a href="#" className="text-[hsl(var(--color-text-2))] hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-[hsl(var(--color-text-2))] hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  )
}

export function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}
