'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowRight, Check, Loader2, Lock, Mail, User } from 'lucide-react'
import { signUp } from '@/lib/auth/actions'

const passwordRules = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'Contains a number', test: (v: string) => /\d/.test(v) },
]

type AccountType = 'freelancer' | 'client' | 'agency'

const accountTypes: { value: AccountType; label: string; description: string }[] =
  [
    {
      value: 'freelancer',
      label: 'Freelancer',
      description: 'I offer services',
    },
    {
      value: 'client',
      label: 'Client',
      description: 'I hire talent',
    },
    {
      value: 'agency',
      label: 'Agency',
      description: 'We do both',
    },
  ]

export function SignupClient() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('freelancer')
  const [isPending, startTransition] = useTransition()

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    formData.set('account_type', accountType)
    startTransition(async () => {
      const result = await signUp(formData)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(true)
    })
  }

  const inputClass =
    'h-11 w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] pl-10 pr-4 text-sm text-[hsl(var(--color-text-1))] outline-none placeholder:text-[hsl(var(--color-text-3))] transition-all focus:border-[hsl(var(--color-accent))] focus:ring-2 focus:ring-[hsl(var(--color-accent)/0.12)]'

  const iconClass =
    'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-text-3))]'

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--color-success)/0.12)]">
          <Check size={24} className="text-[hsl(var(--color-success))]" />
        </div>
        <h2 className="mb-2.5 text-[22px] font-semibold text-[hsl(var(--color-text-1))]">
          Verify your email
        </h2>
        <p className="mb-7 text-sm leading-relaxed text-[hsl(var(--color-text-2))]">
          We sent a confirmation link to your inbox. Click it to activate your
          account, then sign in.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--color-accent))] hover:underline"
        >
          Go to sign in
          <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl font-semibold text-[hsl(var(--color-text-1))]">
        Create your account
      </h2>
      <p className="mb-6 text-sm text-[hsl(var(--color-text-2))]">
        Start protecting every deal you make.
      </p>

      {/* Account type selector */}
      <div className="mb-6">
        <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-text-3))]">
          I am a...
        </p>
        <div className="grid grid-cols-3 gap-2">
          {accountTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setAccountType(type.value)}
              className={[
                'flex flex-col items-center gap-1 rounded-[var(--radius-lg)] border px-3 py-3 text-center transition-all duration-150',
                accountType === type.value
                  ? 'border-[hsl(var(--color-accent)/0.5)] bg-[hsl(var(--color-accent)/0.06)] shadow-[0_0_0_1px_hsl(var(--color-accent)/0.2)]'
                  : 'border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-2))] hover:border-[hsl(var(--color-border-2))]',
              ].join(' ')}
            >
              <span
                className={[
                  'text-[13px] font-semibold',
                  accountType === type.value
                    ? 'text-[hsl(var(--color-accent))]'
                    : 'text-[hsl(var(--color-text-1))]',
                ].join(' ')}
              >
                {type.label}
              </span>
              <span className="text-[11px] text-[hsl(var(--color-text-3))]">
                {type.description}
              </span>
              {accountType === type.value && (
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--color-accent))]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSignUp}>
        <div className="relative mb-3">
          <User size={15} className={iconClass} />
          <input
            name="full_name"
            type="text"
            placeholder="Full name"
            required
            autoFocus
            className={inputClass}
          />
        </div>

        <div className="relative mb-3">
          <Mail size={15} className={iconClass} />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            required
            className={inputClass}
          />
        </div>

        <div className="relative mb-2">
          <Lock size={15} className={iconClass} />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {password.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-4 pl-0.5">
            {passwordRules.map((rule) => {
              const passed = rule.test(password)
              return (
                <div
                  key={rule.label}
                  className="flex items-center gap-1.5"
                >
                  <div
                    className={[
                      'flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors duration-200',
                      passed
                        ? 'bg-[hsl(var(--color-success)/0.15)]'
                        : 'bg-[hsl(var(--color-border))]',
                    ].join(' ')}
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
                    className={[
                      'text-[12px] transition-colors duration-200',
                      passed
                        ? 'text-[hsl(var(--color-success))]'
                        : 'text-[hsl(var(--color-text-3))]',
                    ].join(' ')}
                  >
                    {rule.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-danger)/0.3)] bg-[hsl(var(--color-danger)/0.1)] px-4 py-2.5 text-[13px] text-[hsl(var(--color-danger))]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mb-4 mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[hsl(var(--color-accent))] text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
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

      <p className="mb-6 text-center text-[13px] text-[hsl(var(--color-text-3))]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-[hsl(var(--color-accent))] hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs leading-relaxed text-[hsl(var(--color-text-3))]">
        By creating an account you agree to the{' '}
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
