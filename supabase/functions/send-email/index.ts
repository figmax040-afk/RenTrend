// SETUP REQUIRED:
// 1. Sign up free at resend.com (3,000 emails/month free)
// 2. Get your API key from resend.com/api-keys
// 3. Run: supabase secrets set RESEND_API_KEY=re_xxxx
// 4. Deploy: supabase functions deploy send-email
// 5. In Resend dashboard, verify your domain or use onboarding@resend.dev for testing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { to, subject, html } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'RenTrend <noreply@rentrend.app>',
      to,
      subject,
      html,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})
