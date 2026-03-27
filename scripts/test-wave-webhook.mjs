/**
 * Wave Webhook Test Script
 * Usage:
 *   WAVE_WEBHOOK_SECRET=your_secret WAVE_INVOICE_ID=your_invoice_id node scripts/test-wave-webhook.mjs
 *
 * Optional env vars:
 *   WEBHOOK_URL  — defaults to https://www.thelvis.com/api/webhooks/wave
 *   EVENT_TYPE   — defaults to "invoice.paid" (can also try "merchant.payment_received")
 */

import { createHmac } from 'crypto'

const secret    = process.env.WAVE_WEBHOOK_SECRET
const invoiceId = process.env.WAVE_INVOICE_ID
const target    = process.env.WEBHOOK_URL ?? 'https://www.thelvis.com/api/webhooks/wave'
const eventType = process.env.EVENT_TYPE   ?? 'invoice.paid'

if (!secret)    { console.error('❌  Set WAVE_WEBHOOK_SECRET env var'); process.exit(1) }
if (!invoiceId) { console.error('❌  Set WAVE_INVOICE_ID env var');     process.exit(1) }

const timestamp = Math.floor(Date.now() / 1000).toString()

const payload = JSON.stringify({
  type: eventType,
  data: {
    invoice: { id: invoiceId },
  },
})

const signature = createHmac('sha256', secret)
  .update(`${timestamp}.${payload}`)
  .digest('hex')

const sigHeader = `t=${timestamp},v1=${signature}`

console.log('─'.repeat(50))
console.log('Wave Webhook Test')
console.log('─'.repeat(50))
console.log('Target:    ', target)
console.log('Event:     ', eventType)
console.log('Invoice ID:', invoiceId)
console.log('Signature: ', sigHeader)
console.log('─'.repeat(50))

const res = await fetch(target, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Wave-Signature': sigHeader,
  },
  body: payload,
})

const text = await res.text()
console.log(`Status: ${res.status}`)
console.log(`Body:   ${text}`)
console.log('─'.repeat(50))

if (res.status === 200) {
  console.log('✅  Webhook accepted!')
  console.log('    → Check Supabase: profiles.subscription_tier should be "pro" (or "enterprise")')
  console.log('    → subscriptions.status should be "active"')
  console.log('    → subscriptions.current_period_end should be ~30 days from now')
} else {
  console.log('❌  Webhook rejected — see status/body above')
}
