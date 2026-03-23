type UserAvatarProps = {
  name?: string | null
  avatarUrl?: string | null
  size?: number
}

export default function UserAvatar({
  name,
  avatarUrl,
  size = 36,
}: UserAvatarProps) {
  const initials = (name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? 'User avatar'}
        width={size}
        height={size}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '0.5px solid hsl(var(--color-border))',
        }}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'hsl(var(--color-accent) / 0.14)',
        color: 'hsl(var(--color-accent))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size <= 32 ? '11px' : '12px',
        fontWeight: 600,
        border: '0.5px solid hsl(var(--color-accent) / 0.2)',
      }}
    >
      {initials || 'U'}
    </div>
  )
}
