'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowRight, Check, Loader2, Lock, Mail, User } from 'lucide-react'
import { signUp } from '@/lib/auth/actions'

const passwordRules = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'Contains a number', test: (value: string) => /\d/.test(value) },
]

function getInputFocusStyles(target: HTMLInputElement) {
  target.style.borderColor = 'hsl(var(--color-accent))'
  target.style.boxShadow = '0 0 0 3px hsl(var(--color-accent) / 0.12)'
}

function resetInputFocusStyles(target: HTMLInputElement) {
  target.style.borderColor = 'hsl(var(--color-border))'
  target.style.boxShadow = 'none'
}

export default function SignUpPage() {
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
      if (result?.error) {
        setError(result.error)
      }
      if (result?.success) {
        setSuccess(true)
      }
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '44px',
    padding: '0 14px 0 40px',
    background: 'hsl(var(--color-surface-2))',
    border: '0.5px solid hsl(var(--color-border))',
    borderRadius: 'var(--radius-md)',
    color: 'hsl(var(--color-text-1))',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  }

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'hsl(var(--color-text-3))',
    pointerEvents: 'none',
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'hsl(var(--color-success) / 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Check size={24} color="hsl(var(--color-success))" />
        </div>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 600,
            color: 'hsl(var(--color-text-1))',
            marginBottom: '10px',
          }}
        >
          Verify your email
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'hsl(var(--color-text-2))',
            lineHeight: '1.6',
            marginBottom: '28px',
          }}
        >
          We sent a confirmation link to your inbox. Click it to activate your
          account, then sign in.
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'hsl(var(--color-accent))',
            textDecoration: 'none',
          }}
        >
          Go to sign in
          <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: 'hsl(var(--color-text-1))',
          marginBottom: '8px',
        }}
      >
        Create your account
      </h2>
      <p
        style={{
          fontSize: '14px',
          color: 'hsl(var(--color-text-2))',
          marginBottom: '32px',
        }}
      >
        Start protecting every deal you make.
      </p>

      <form onSubmit={handleSignUp}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <User size={15} style={iconStyle} />
          <input
            name="full_name"
            type="text"
            placeholder="Full name"
            required
            autoFocus
            style={inputStyle}
            onFocus={(event) => getInputFocusStyles(event.target)}
            onBlur={(event) => resetInputFocusStyles(event.target)}
          />
        </div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Mail size={15} style={iconStyle} />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            required
            style={inputStyle}
            onFocus={(event) => getInputFocusStyles(event.target)}
            onBlur={(event) => resetInputFocusStyles(event.target)}
          />
        </div>

        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <Lock size={15} style={iconStyle} />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={inputStyle}
            onFocus={(event) => getInputFocusStyles(event.target)}
            onBlur={(event) => resetInputFocusStyles(event.target)}
          />
        </div>

        {password.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '16px',
              paddingLeft: '2px',
              flexWrap: 'wrap',
            }}
          >
            {passwordRules.map((rule) => {
              const passed = rule.test(password)
              return (
                <div
                  key={rule.label}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: passed
                        ? 'hsl(var(--color-success) / 0.15)'
                        : 'hsl(var(--color-border))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 200ms ease',
                    }}
                  >
                    {passed && (
                      <Check
                        size={8}
                        color="hsl(var(--color-success))"
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: passed
                        ? 'hsl(var(--color-success))'
                        : 'hsl(var(--color-text-3))',
                      transition: 'color 200ms ease',
                    }}
                  >
                    {rule.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '10px 14px',
              marginBottom: '16px',
              background: 'hsl(var(--color-danger) / 0.1)',
              border: '0.5px solid hsl(var(--color-danger) / 0.3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'hsl(var(--color-danger))',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          style={{
            width: '100%',
            height: '44px',
            marginBottom: '16px',
            background: isPending
              ? 'hsl(var(--color-accent) / 0.6)'
              : 'hsl(var(--color-accent))',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 150ms ease',
          }}
          className="hover:brightness-110 active:scale-[0.98]"
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

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={{ fontSize: '13px', color: 'hsl(var(--color-text-3))' }}>
          Already have an account?{' '}
        </span>
        <Link
          href="/login"
          style={{
            fontSize: '13px',
            color: 'hsl(var(--color-accent))',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Sign in
        </Link>
      </div>

      <p
        style={{
          fontSize: '12px',
          color: 'hsl(var(--color-text-3))',
          textAlign: 'center',
          lineHeight: '1.6',
        }}
      >
        By creating an account you agree to the{' '}
        <a
          href="#"
          style={{ color: 'hsl(var(--color-text-2))', textDecoration: 'none' }}
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          href="#"
          style={{ color: 'hsl(var(--color-text-2))', textDecoration: 'none' }}
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  )
}
