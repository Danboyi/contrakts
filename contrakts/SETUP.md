# Contrakts - Production Setup

## Required API Keys

### Anthropic (AI Features)
- Get key: https://console.anthropic.com
- Env var: `ANTHROPIC_API_KEY=sk-ant-...`
- Used for: AI contract drafting, dispute analysis

### Paystack (Payments)
- Get key: https://dashboard.paystack.com
- Test public: `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...`
- Test secret: `PAYSTACK_SECRET_KEY=sk_test_...`
- Webhook secret: `PAYSTACK_WEBHOOK_SECRET=any_string`
- Used for: Escrow funding, milestone releases

### Resend (Email)
- Get key: https://resend.com
- Env var: `RESEND_API_KEY=re_...`
- From address: `EMAIL_FROM=noreply@yourdomain.com`
- Used for: Contract invites, payment notifications

### Upstash Redis (Rate Limiting)
- Get key: https://upstash.com
- URL: `UPSTASH_REDIS_REST_URL=https://...upstash.io`
- Token: `UPSTASH_REDIS_REST_TOKEN=...`
- Used for: API and login rate limiting

### Supabase (Already configured)
- URL: `NEXT_PUBLIC_SUPABASE_URL`
- Anon key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role: `SUPABASE_SERVICE_ROLE_KEY`

## Deployment Checklist
- [ ] All API keys configured in Vercel env vars
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Supabase Auth redirect URLs updated
- [ ] Email confirmation disabled in Supabase Auth
- [ ] Admin user created and verified
