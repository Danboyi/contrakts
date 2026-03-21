'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useTransition } from 'react'
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-[hsl(var(--color-text-1))]">
        Welcome back
      </h2>
      <p className="mb-8 text-sm text-[hsl(var(--color-text-2))]">
        Sign in to your Contrakts account.
      </p>

      {rateLimited && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger-dim))] px-4 py-3 text-sm text-[hsl(var(--color-danger))]">
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
            className={`flex-1 rounded-[calc(var(--radius-md)-3px)] py-2 text-sm transition-all duration-200 ${
              mode === value
                ? 'bg-[hsl(var(--color-surface-2))] font-medium text-[hsl(var(--color-text-1))] shadow-sm'
                : 'text-[hsl(var(--color-text-3))] hover:text-[hsl(var(--color-text-2))]'
            }`}
          >
            {value === 'password' ? 'Password' : 'Magic link'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'password' ? (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleLogin}
          >
            <div className="relative mb-3">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--color-text-3))]" />
              <input
                name="email"
                type="email"
                placeholder="Email address"
                required
                autoFocus
                className="auth-input"
              />
            </div>
            <div className="relative mb-3">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--color-text-3))]" />
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                className="auth-input"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger-dim))] px-3.5 py-2.5 text-sm text-[hsl(var(--color-danger))]"
              >
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={isPending} className="auth-btn">
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
          </motion.form>
        ) : (
          <motion.form
            key="magic"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleMagicLink}
          >
            {magicOk ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-success)/0.25)] bg-[hsl(var(--color-success)/0.08)] p-6 text-center"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--color-success-dim))]">
                  <Mail size={18} className="text-[hsl(var(--color-success))]" />
                </div>
                <p className="mb-1.5 text-sm font-medium text-[hsl(var(--color-success))]">
                  Check your email
                </p>
                <p className="text-sm text-[hsl(var(--color-text-2))]">
                  We sent a sign-in link to your inbox. It expires in 10 minutes.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--color-text-3))]" />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email address"
                    required
                    autoFocus
                    className="auth-input"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger-dim))] px-3.5 py-2.5 text-sm text-[hsl(var(--color-danger))]"
                  >
                    {error}
                  </motion.div>
                )}

                <button type="submit" disabled={isPending} className="auth-btn">
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
          </motion.form>
        )}
      </AnimatePresence>

      <p className="mb-6 text-center text-sm text-[hsl(var(--color-text-3))]">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-[hsl(var(--color-accent))] transition-colors hover:text-[hsl(var(--color-accent-hover))]"
        >
          Sign up
        </Link>
      </p>

      <p className="text-center text-xs leading-relaxed text-[hsl(var(--color-text-3))]">
        By continuing you agree to the{' '}
        <a href="#" className="text-[hsl(var(--color-text-2))] transition-colors hover:text-[hsl(var(--color-text-1))]">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-[hsl(var(--color-text-2))] transition-colors hover:text-[hsl(var(--color-text-1))]">
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
