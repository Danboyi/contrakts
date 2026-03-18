'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useTransition } from 'react'
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react'
import { login, sendMagicLink } from '@/lib/auth/actions'

function getInputFocusStyles(target: HTMLInputElement) {
  target.style.borderColor = 'hsl(var(--color-accent))'
  target.style.boxShadow = '0 0 0 3px hsl(var(--color-accent) / 0.12)'
}

function resetInputFocusStyles(target: HTMLInputElement) {
  target.style.borderColor = 'hsl(var(--color-border))'
  target.style.boxShadow = 'none'
}

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
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const email = new FormData(event.currentTarget).get('email') as string

    startTransition(async () => {
      const result = await sendMagicLink(email)
      if (result?.error) {
        setError(result.error)
      } else {
        setMagicOk(true)
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

  const fieldStyle: React.CSSProperties = {
    position: 'relative',
    marginBottom: '12px',
  }

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'hsl(var(--color-text-3))',
    pointerEvents: 'none',
  }

  const buttonStyle: React.CSSProperties = {
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
        Welcome back
      </h2>
      <p
        style={{
          fontSize: '14px',
          color: 'hsl(var(--color-text-2))',
          marginBottom: '32px',
        }}
      >
        Sign in to your Contrakts account.
      </p>

      {rateLimited && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: 'hsl(var(--color-danger)/0.1)',
            border: '0.5px solid hsl(var(--color-danger)/0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'hsl(var(--color-danger))',
          }}
        >
          Too many login attempts. Please wait 15 minutes before trying again.
        </div>
      )}

      <div
        style={{
          display: 'flex',
          background: 'hsl(var(--color-surface))',
          border: '0.5px solid hsl(var(--color-border))',
          borderRadius: 'var(--radius-md)',
          padding: '3px',
          marginBottom: '24px',
          gap: '3px',
        }}
      >
        {(['password', 'magic'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value)
              setError(null)
              setMagicOk(false)
            }}
            style={{
              flex: 1,
              height: '34px',
              fontSize: '13px',
              fontWeight: mode === value ? 500 : 400,
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              background:
                mode === value
                  ? 'hsl(var(--color-surface-2))'
                  : 'transparent',
              color:
                mode === value
                  ? 'hsl(var(--color-text-1))'
                  : 'hsl(var(--color-text-3))',
            }}
          >
            {value === 'password' ? 'Password' : 'Magic link'}
          </button>
        ))}
      </div>

      {mode === 'password' ? (
        <form onSubmit={handleLogin}>
          <div style={fieldStyle}>
            <Mail size={15} style={iconStyle} />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              required
              autoFocus
              style={inputStyle}
              onFocus={(event) => getInputFocusStyles(event.target)}
              onBlur={(event) => resetInputFocusStyles(event.target)}
            />
          </div>
          <div style={fieldStyle}>
            <Lock size={15} style={iconStyle} />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              style={inputStyle}
              onFocus={(event) => getInputFocusStyles(event.target)}
              onBlur={(event) => resetInputFocusStyles(event.target)}
            />
          </div>

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
            style={buttonStyle}
            className="hover:brightness-110 active:scale-[0.98]"
          >
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
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                background: 'hsl(var(--color-success) / 0.08)',
                border: '0.5px solid hsl(var(--color-success) / 0.25)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: 'hsl(var(--color-success))',
                  fontWeight: 500,
                  marginBottom: '6px',
                }}
              >
                Check your email
              </p>
              <p style={{ fontSize: '13px', color: 'hsl(var(--color-text-2))' }}>
                We sent a sign-in link to your inbox. It expires in 10 minutes.
              </p>
            </div>
          ) : (
            <>
              <div style={fieldStyle}>
                <Mail size={15} style={iconStyle} />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  required
                  autoFocus
                  style={inputStyle}
                  onFocus={(event) => getInputFocusStyles(event.target)}
                  onBlur={(event) => resetInputFocusStyles(event.target)}
                />
              </div>

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
                style={buttonStyle}
                className="hover:brightness-110 active:scale-[0.98]"
              >
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

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={{ fontSize: '13px', color: 'hsl(var(--color-text-3))' }}>
          Don&apos;t have an account?{' '}
        </span>
        <Link
          href="/signup"
          style={{
            fontSize: '13px',
            color: 'hsl(var(--color-accent))',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Sign up
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
        By continuing you agree to the{' '}
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}
