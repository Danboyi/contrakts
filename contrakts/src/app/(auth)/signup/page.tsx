import type { Metadata } from 'next'
import { SignupClient } from './signup-client'

export const metadata: Metadata = {
  title: 'Create account',
}

export default function SignupPage() {
  return <SignupClient />
}
