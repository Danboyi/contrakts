import type { Metadata } from 'next'
// Inter loaded via system font stack — see globals.css font-family
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/shared/query-provider'
import './globals.css'


export const metadata: Metadata = {
  title: {
    default: 'Contrakts',
    template: '%s \u00b7 Contrakts',
  },
  description:
    'Contract execution and escrow protection platform. ' +
    'Create contracts, protect payments, resolve disputes.',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'hsl(var(--color-surface-2))',
                  border: '0.5px solid hsl(var(--color-border))',
                  color: 'hsl(var(--color-text-1))',
                  fontSize: '13px',
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
