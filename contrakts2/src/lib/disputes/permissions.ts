function parseIdList(value?: string) {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function isArbitratorUser(userId: string) {
  const allowlist = [
    ...parseIdList(process.env.ARBITRATOR_USER_IDS),
    ...parseIdList(process.env.ADMIN_USER_IDS),
  ]

  if (allowlist.length === 0) {
    return process.env.NODE_ENV !== 'production'
  }

  return allowlist.includes(userId)
}
