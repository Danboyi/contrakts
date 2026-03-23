export type PreviewMode =
  | 'iframe'
  | 'image'
  | 'gallery'
  | 'pdf'
  | 'code_link'
  | 'download'

export function detectPreviewMode(params: {
  submissionType: string
  externalUrl?: string | null
  fileType?: string | null
}): PreviewMode {
  const { submissionType, externalUrl, fileType } = params

  if ((submissionType === 'link' || submissionType === 'code') && externalUrl) {
    if (isCodeRepoUrl(externalUrl)) {
      return 'code_link'
    }

    return 'iframe'
  }

  if (fileType) {
    if (fileType.startsWith('image/')) {
      return 'image'
    }

    if (fileType === 'application/pdf') {
      return 'pdf'
    }
  }

  return 'download'
}

export function isCodeRepoUrl(url: string): boolean {
  const patterns = [
    /github\.com\/[\w.-]+\/[\w.-]+/i,
    /gitlab\.com\/[\w.-]+\/[\w.-]+/i,
    /bitbucket\.org\/[\w.-]+\/[\w.-]+/i,
    /codepen\.io\//i,
    /codesandbox\.io\//i,
    /stackblitz\.com\//i,
    /replit\.com\//i,
  ]

  return patterns.some((pattern) => pattern.test(url))
}

export function isEmbeddableUrl(url: string): boolean {
  const embeddable = [
    'vercel.app',
    'netlify.app',
    'pages.dev',
    'github.io',
    'codesandbox.io',
    'stackblitz.com',
    'codepen.io',
    'figma.com',
    'framer.com',
  ]

  try {
    const hostname = new URL(url).hostname
    return embeddable.some((domain) => hostname.endsWith(domain))
  } catch {
    return false
  }
}

export function getRepoProvider(url: string): {
  provider: string
  icon: string
  owner: string
  repo: string
} | null {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.replace(/^\/+/, '')
    const [owner, repo] = pathname.split('/')

    if (!owner || !repo) {
      return null
    }

    if (parsed.hostname === 'github.com') {
      return {
        provider: 'GitHub',
        icon: 'GH',
        owner,
        repo,
      }
    }

    if (parsed.hostname === 'gitlab.com') {
      return {
        provider: 'GitLab',
        icon: 'GL',
        owner,
        repo,
      }
    }

    if (parsed.hostname === 'bitbucket.org') {
      return {
        provider: 'Bitbucket',
        icon: 'BB',
        owner,
        repo,
      }
    }

    return null
  } catch {
    return null
  }
}

export function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = reject
    image.src = url
  })
}
