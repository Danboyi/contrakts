'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowRight, Check, Loader2, Lock, Mail, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { signUp } from '@/lib/auth/actions'

const passwordRules = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'Contains a number', test: (value: string) => /\d/.test(value) },
]

export function SignupClient() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await signUp(formData)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(true)
    })
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--color-success-dim))]">
          <Check size={24} className="text-[hsl(var(--color-success))]" />
        </div>
        <h2 className="mb-2.5 text-xl font-semibold text-[hsl(var(--color-text-1))]">
          Verify your email
        </h2>
        <p className="mb-7 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
          We sent a confirmation link to your inbox. Click it to activate your
          account, then sign in.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--color-accent))] transition-colors hover:text-[hsl(var(--color-accent-hover))]"
        >
          Go to sign in
          <ArrowRight size={14} />
        </Link>
      </motion.div>
    )
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-[hsl(var(--color-text-1))]">
        Create your account
      </h2>
      <p className="mb-8 text-sm text-[hsl(var(--color-text-2))]">
        Start protecting every deal you make.
      </p>

      <form onSubmit={handleSignUp}>
        <div className="relative mb-3">
          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--color-text-3))]" />
          <input
            name="full_name"
            type="text"
            placeholder="Full name"
            required
            autoFocus
            className="auth-input"
          />
        </div>

        <div className="relative mb-3">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--color-text-3))]" />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            required
            className="auth-input"
          />
        </div>

        <div className="relative mb-2">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--color-text-3))]" />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
        </div>

        {password.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 flex flex-wrap gap-4 pl-0.5"
          >
            {passwordRules.map((rule) => {
              const passed = rule.test(password)
              return (
                <div key={rule.label} className="flex items-center gap-1.5">
                  <div
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors duration-200 ${
                      passed
                        ? 'bg-[hsl(var(--color-success-dim))]'
                        : 'bg-[hsl(var(--color-border))]'
                    }`}
                  >
                    {passed && (
                      <Check
                        size={8}
                        className="text-[hsl(var(--color-success))]"
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs transition-colors duration-200 ${
                      passed
                        ? 'text-[hsl(var(--color-success))]'
                        : 'text-[hsl(var(--color-text-3))]'
                    }`}
                  >
                    {rule.label}
                  </span>
                </div>
              )
            })}
          </motion.div>
        )}

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
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <p className="mb-6 text-center text-sm text-[hsl(var(--color-text-3))]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-[hsl(var(--color-accent))] transition-colors hover:text-[hsl(var(--color-accent-hover))]"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs leading-relaxed text-[hsl(var(--color-text-3))]">
        By creating an account you agree to the{' '}
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
