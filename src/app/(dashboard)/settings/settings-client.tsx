'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Bell,
  Bitcoin,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Key,
  Mail,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { createApiKey, revokeApiKey } from '@/lib/api/key-actions'
import {
  ALL_SCOPES,
  SCOPE_DESCRIPTIONS,
} from '@/lib/api/keys'
import {
  saveWalletAddress,
  setupBankAccount,
  updateProfile,
} from '@/lib/profile/actions'
import { createClient } from '@/lib/supabase/client'
import { NOTIFICATION_REGISTRY } from '@/lib/notifications/registry'
import { formatRelative } from '@/lib/utils/format-date'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils/cn'
import type { NotificationPreference, User } from '@/types'
import type { ApiScope } from '@/lib/api/keys'

const NG_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '050', name: 'EcoBank Nigeria' },
  { code: '011', name: 'First Bank Nigeria' },
  { code: '214', name: 'First City Monument' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Parallex Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'SunTrust Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'United Bank Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
] as const

type PreferenceMap = Record<string, NotificationPreference>

function preferenceState(
  preferences: PreferenceMap,
  notificationType: string,
  channel: 'in_app' | 'email'
) {
  return preferences[notificationType]?.[channel] ?? true
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        'mb-4 overflow-hidden rounded-[var(--radius-xl)] border border-[hsl(var(--color-border))]',
        'bg-[hsl(var(--color-surface))]'
      )}
    >
      <button
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex w-full items-center gap-4 p-5 transition-colors duration-150',
          'hover:bg-[hsl(var(--color-surface-2)/0.5)]'
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]',
            'bg-[hsl(var(--color-surface-2))]'
          )}
        >
          <Icon size={16} className="text-[hsl(var(--color-text-2))]" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-[hsl(var(--color-text-1))]">{title}</p>
          <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
            {description}
          </p>
        </div>
        {open ? (
          <ChevronUp size={15} className="text-[hsl(var(--color-text-3))]" />
        ) : (
          <ChevronDown size={15} className="text-[hsl(var(--color-text-3))]" />
        )}
      </button>

      {open && (
        <>
          <Separator />
          <div className="p-5">{children}</div>
        </>
      )}
    </div>
  )
}

function PersonalInfoForm({ profile }: { profile: User }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile({
        full_name: fullName,
        phone: phone || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Profile updated.')
      router.refresh()
    })
  }

  return (
    <div className="grid max-w-md grid-cols-1 gap-4">
      <Input
        label="Full name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
      />
      <Input
        label="Phone number (optional)"
        type="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="+1 234 567 8900"
      />
      <div>
        <Button loading={isPending} onClick={handleSave} size="sm">
          Save changes
        </Button>
      </div>
    </div>
  )
}

function BankAccountForm({ profile }: { profile: User }) {
  const router = useRouter()
  const [accountNumber, setAccountNumber] = useState(profile.bank_account_number ?? '')
  const [bankCode, setBankCode] = useState(profile.bank_code ?? '')
  const [bankName, setBankName] = useState(profile.bank_name ?? '')
  const [accountName, setAccountName] = useState(profile.full_name)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasBankSetup = Boolean(profile.paystack_recipient_code)

  function handleSave() {
    setError(null)

    startTransition(async () => {
      const selectedBank = NG_BANKS.find((bank) => bank.code === bankCode)
      const result = await setupBankAccount({
        account_number: accountNumber,
        bank_code: bankCode,
        bank_name: selectedBank?.name ?? bankName,
        account_name: accountName,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      toast.success('Bank account saved. You can now receive fiat payouts.')
      router.refresh()
    })
  }

  return (
    <div>
      {hasBankSetup && (
        <div
          className={cn(
            'mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-success)/0.2)]',
            'bg-[hsl(var(--color-success)/0.08)] px-3 py-2'
          )}
        >
          <CheckCircle size={13} className="text-[hsl(var(--color-success))]" />
          <p className="text-xs text-[hsl(var(--color-success))]">
            Bank account verified - {profile.bank_name} ...
            {profile.bank_account_number?.slice(-4)}
            {profile.preferred_payout === 'fiat' && ' - Current payout method'}
          </p>
        </div>
      )}

      <div className="grid max-w-md grid-cols-1 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--color-text-2))]">
            Bank
          </label>
          <select
            value={bankCode}
            onChange={(event) => {
              const selectedBank = NG_BANKS.find((bank) => bank.code === event.target.value)
              setBankCode(event.target.value)
              setBankName(selectedBank?.name ?? '')
            }}
            className={cn(
              'h-[44px] w-full rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
              'bg-[hsl(var(--color-surface-2))] px-4 text-sm text-[hsl(var(--color-text-1))]',
              'outline-none transition-all duration-150 focus:border-[hsl(var(--color-accent))]',
              'focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.12)]'
            )}
          >
            <option value="">Select bank...</option>
            {NG_BANKS.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Account number"
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
          placeholder="0123456789"
          hint="10-digit NUBAN account number"
        />
        <Input
          label="Account name"
          value={accountName}
          onChange={(event) => setAccountName(event.target.value)}
          placeholder="As it appears on your bank account"
        />
        {error && <p className="text-xs text-[hsl(var(--color-danger))]">{error}</p>}
        <div>
          <Button loading={isPending} onClick={handleSave} size="sm">
            {hasBankSetup ? 'Update bank account' : 'Save bank account'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function WalletForm({ profile }: { profile: User }) {
  const router = useRouter()
  const [address, setAddress] = useState(profile.wallet_address ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError(null)

    startTransition(async () => {
      const result = await saveWalletAddress(address)
      if (result.error) {
        setError(result.error)
        return
      }

      toast.success('Wallet address saved.')
      router.refresh()
    })
  }

  return (
    <div className="max-w-md">
      {profile.wallet_address && (
        <div
          className={cn(
            'mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-success)/0.2)]',
            'bg-[hsl(var(--color-success)/0.08)] px-3 py-2'
          )}
        >
          <CheckCircle size={13} className="text-[hsl(var(--color-success))]" />
          <p className="text-xs text-[hsl(var(--color-success))]">
            Wallet saved - {profile.wallet_address.slice(0, 6)}...
            {profile.wallet_address.slice(-4)}
            {profile.preferred_payout === 'crypto' && ' - Current payout method'}
          </p>
        </div>
      )}

      <div
        className={cn(
          'mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-warning)/0.15)]',
          'bg-[hsl(var(--color-warning)/0.06)] p-3'
        )}
      >
        <AlertTriangle
          size={13}
          className="mt-0.5 shrink-0 text-[hsl(var(--color-warning))]"
        />
        <p className="text-xs leading-relaxed text-[hsl(var(--color-text-2))]">
          Only EVM-compatible wallet addresses are supported (Ethereum, Base,
          Polygon). Saving a wallet address switches your payout preference to
          crypto for supported contracts.
        </p>
      </div>

      <Input
        label="Wallet address"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        placeholder="0x..."
        hint="EVM-compatible address (Ethereum, Base, Polygon)"
        error={error ?? undefined}
      />
      <div className="mt-4">
        <Button loading={isPending} onClick={handleSave} disabled={!address} size="sm">
          Save wallet address
        </Button>
      </div>
    </div>
  )
}

function PreferenceSwitch({
  label,
  enabled,
  onClick,
}: {
  label: string
  enabled: boolean
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2">
      <span className="text-xs text-[hsl(var(--color-text-3))]">{label}</span>
      <span
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-150',
          enabled ? 'bg-[hsl(var(--color-accent))]' : 'bg-[hsl(var(--color-border))]'
        )}
      >
        <span
          className={cn(
            'absolute h-4 w-4 rounded-full bg-white transition-transform duration-150',
            enabled ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </span>
    </button>
  )
}

function NotificationPreferencesSection({
  userId,
  initialPreferences,
}: {
  userId: string
  initialPreferences: NotificationPreference[]
}) {
  const notificationEntries = useMemo(
    () =>
      Object.entries(NOTIFICATION_REGISTRY).sort((left, right) =>
        left[1].label.localeCompare(right[1].label)
      ),
    []
  )

  const [preferences, setPreferences] = useState<PreferenceMap>(() =>
    Object.fromEntries(
      initialPreferences.map((preference) => [preference.notification_type, preference])
    )
  )
  const [savingKey, setSavingKey] = useState<string | null>(null)

  async function togglePreference(
    notificationType: string,
    channel: 'in_app' | 'email'
  ) {
    const current = preferences[notificationType]
    const nextValue = !(current?.[channel] ?? true)
    const nextRow: NotificationPreference = {
      id: current?.id ?? '',
      user_id: userId,
      notification_type: notificationType,
      in_app: channel === 'in_app' ? nextValue : current?.in_app ?? true,
      email: channel === 'email' ? nextValue : current?.email ?? true,
      created_at: current?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setPreferences((previous) => ({
      ...previous,
      [notificationType]: nextRow,
    }))

    setSavingKey(`${notificationType}:${channel}`)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: userId,
          notification_type: notificationType,
          in_app: nextRow.in_app,
          email: nextRow.email,
        },
        { onConflict: 'user_id,notification_type' }
      )
      .select()
      .single()

    setSavingKey(null)

    if (error) {
      setPreferences((previous) => {
        const rollback = { ...previous }
        if (current) {
          rollback[notificationType] = current
        } else {
          delete rollback[notificationType]
        }
        return rollback
      })
      toast.error('Could not save notification preference.')
      return
    }

    if (data) {
      setPreferences((previous) => ({
        ...previous,
        [notificationType]: data as NotificationPreference,
      }))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {notificationEntries.map(([notificationType, config]) => (
        <div
          key={notificationType}
          className={cn(
            'rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface-2))] p-4'
          )}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                {config.label}
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--color-text-3))]">
                {config.emailSubject({})}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2">
                <Bell size={12} className="text-[hsl(var(--color-text-3))]" />
                <PreferenceSwitch
                  label="In-app"
                  enabled={preferenceState(preferences, notificationType, 'in_app')}
                  onClick={() => void togglePreference(notificationType, 'in_app')}
                />
              </div>
              <div className="inline-flex items-center gap-2">
                <Mail size={12} className="text-[hsl(var(--color-text-3))]" />
                <PreferenceSwitch
                  label="Email"
                  enabled={preferenceState(preferences, notificationType, 'email')}
                  onClick={() => void togglePreference(notificationType, 'email')}
                />
              </div>
              {savingKey?.startsWith(`${notificationType}:`) && (
                <span className="text-[11px] text-[hsl(var(--color-text-3))]">
                  Saving...
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-[hsl(var(--color-text-3))]">
        Notification preferences are saved to your account immediately.
      </p>
    </div>
  )
}

type ApiKeyRecord = {
  id: string
  name: string
  key_prefix: string
  scopes: ApiScope[]
  created_at: string
  last_used_at: string | null
}

function ApiKeysSection({ profile }: { profile: User }) {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [showNew, setShowNew] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [scopes, setScopes] = useState<ApiScope[]>(['contracts:read'])
  const [newKey, setNewKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loadingKeys, setLoadingKeys] = useState(true)

  async function loadKeys() {
    const supabase = createClient()
    const { data } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, scopes, created_at, last_used_at')
      .is('revoked_at', null)
      .order('created_at', { ascending: false })

    setKeys((data ?? []) as ApiKeyRecord[])
    setLoadingKeys(false)
  }

  useEffect(() => {
    void loadKeys()
  }, [profile.id])

  function handleCreate() {
    if (!keyName.trim()) {
      toast.error('Enter a key name.')
      return
    }

    if (scopes.length === 0) {
      toast.error('Select at least one scope.')
      return
    }

    startTransition(async () => {
      const result = await createApiKey(keyName.trim(), scopes)
      if (result.error) {
        toast.error(result.error)
        return
      }

      setNewKey(result.key ?? null)
      setShowNew(false)
      setKeyName('')
      setScopes(['contracts:read'])
      await loadKeys()
    })
  }

  function handleRevoke(keyId: string) {
    startTransition(async () => {
      const result = await revokeApiKey(keyId)
      if (result.error) {
        toast.error(result.error)
        return
      }

      setKeys((previous) => previous.filter((key) => key.id !== keyId))
      toast.success('API key revoked.')
    })
  }

  function toggleScope(scope: ApiScope) {
    setScopes((previous) =>
      previous.includes(scope)
        ? previous.filter((value) => value !== scope)
        : [...previous, scope]
    )
  }

  return (
    <div>
      {newKey && (
        <div
          className={cn(
            'mb-4 flex items-start gap-3 rounded-[var(--radius-lg)] border border-[hsl(var(--color-success)/0.2)]',
            'bg-[hsl(var(--color-success)/0.08)] p-4'
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs font-semibold text-[hsl(var(--color-success))]">
              Copy your API key now. It will not be shown again.
            </p>
            <code
              className={cn(
                'block break-all rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
                'bg-[hsl(var(--color-surface))] px-3 py-2 text-xs font-mono text-[hsl(var(--color-text-1))]'
              )}
            >
              {newKey}
            </code>
          </div>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(newKey)
              toast.success('Copied!')
            }}
            className={cn(
              'shrink-0 rounded-[var(--radius-sm)] p-2 text-[hsl(var(--color-success))]',
              'transition-colors duration-150 hover:bg-[hsl(var(--color-success)/0.1)]'
            )}
          >
            <Copy size={14} />
          </button>
        </div>
      )}

      {!loadingKeys && keys.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className={cn(
                'flex items-center gap-4 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]',
                'bg-[hsl(var(--color-surface-2))] p-3'
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[hsl(var(--color-text-1))]">
                  {key.name}
                </p>
                <p className="mt-0.5 text-xs font-mono text-[hsl(var(--color-text-3))]">
                  {key.key_prefix}••••••••
                  {` · Created ${formatRelative(key.created_at)}`}
                  {key.last_used_at
                    ? ` · Last used ${formatRelative(key.last_used_at)}`
                    : ' · Never used'}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {key.scopes.slice(0, 2).map((scope) => (
                  <span
                    key={scope}
                    className={cn(
                      'rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))]',
                      'px-1.5 py-0.5 text-[10px] text-[hsl(var(--color-text-3))]'
                    )}
                  >
                    {scope}
                  </span>
                ))}
                {key.scopes.length > 2 && (
                  <span className="text-[10px] text-[hsl(var(--color-text-3))]">
                    +{key.scopes.length - 2}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(key.id)}
                className={cn(
                  'shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[hsl(var(--color-text-3))]',
                  'transition-all duration-150 hover:bg-[hsl(var(--color-danger)/0.08)] hover:text-[hsl(var(--color-danger))]'
                )}
                title="Revoke key"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showNew ? (
        <div
          className={cn(
            'rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]',
            'bg-[hsl(var(--color-surface-2))] p-4'
          )}
        >
          <Input
            label="Key name"
            value={keyName}
            onChange={(event) => setKeyName(event.target.value)}
            placeholder="e.g. Production CRM integration"
            className="mb-4"
          />
          <p className="mb-2 text-xs font-medium text-[hsl(var(--color-text-2))]">
            Scopes
          </p>
          <div className="mb-4 flex flex-col gap-2">
            {ALL_SCOPES.map((scope) => (
              <label key={scope} className="flex cursor-pointer items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleScope(scope)}
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-150',
                    scopes.includes(scope)
                      ? 'border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent))]'
                      : 'border-[hsl(var(--color-border-2))] bg-transparent'
                  )}
                >
                  {scopes.includes(scope) && (
                    <Check size={10} color="white" strokeWidth={3} />
                  )}
                </button>
                <div className="min-w-0">
                  <span className="text-xs font-mono font-medium text-[hsl(var(--color-text-1))]">
                    {scope}
                  </span>
                  <span className="ml-2 text-xs text-[hsl(var(--color-text-3))]">
                    - {SCOPE_DESCRIPTIONS[scope]}
                  </span>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" loading={isPending} onClick={handleCreate}>
              Generate key
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Plus size={14} />}
          onClick={() => {
            setNewKey(null)
            setShowNew(true)
          }}
        >
          Generate new key
        </Button>
      )}
    </div>
  )
}

export function SettingsClient({
  profile,
  initialPreferences,
}: {
  profile: User
  initialPreferences: NotificationPreference[]
}) {
  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader
        title="Settings"
        subtitle="Manage your personal details, payout setup, and notification channels."
      />

      <SettingsSection
        icon={UserRound}
        title="Personal info"
        description="Update the name and phone number shown on your profile"
      >
        <PersonalInfoForm profile={profile} />
      </SettingsSection>

      <SettingsSection
        icon={Building2}
        title="Bank account"
        description="Receive fiat milestone payments directly to your bank"
        defaultOpen={!profile.paystack_recipient_code}
      >
        <BankAccountForm profile={profile} />
      </SettingsSection>

      <SettingsSection
        icon={Bitcoin}
        title="Crypto wallet"
        description="Receive USDC payouts for crypto-funded contracts"
        defaultOpen={false}
      >
        <WalletForm profile={profile} />
      </SettingsSection>

      <SettingsSection
        icon={Bell}
        title="Notification preferences"
        description="Choose which events trigger in-app and email notifications"
        defaultOpen={false}
      >
        <NotificationPreferencesSection
          userId={profile.id}
          initialPreferences={initialPreferences}
        />
      </SettingsSection>

      <SettingsSection
        icon={Key}
        title="API keys"
        description="Authenticate API requests and integrate Contrakts into your own systems"
        defaultOpen={false}
      >
        <ApiKeysSection profile={profile} />
      </SettingsSection>

      <SettingsSection
        icon={AlertTriangle}
        title="Danger zone"
        description="Irreversible account actions"
        defaultOpen={false}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[hsl(var(--color-danger)/0.3)]',
            'bg-[hsl(var(--color-danger)/0.04)] p-4'
          )}
        >
          <div>
            <p className="text-sm font-medium text-[hsl(var(--color-danger))]">
              Delete account
            </p>
            <p className="mt-0.5 text-xs text-[hsl(var(--color-text-3))]">
              Permanently delete your account and all data. This cannot be undone
              and is only available when you have no active contracts.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => toast.error('Contact support to delete your account.')}
          >
            Delete
          </Button>
        </div>
      </SettingsSection>
    </div>
  )
}
