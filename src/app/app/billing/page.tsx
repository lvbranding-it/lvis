import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BillingClient } from './BillingClient'
import { TIER_LIMITS } from '@/lib/constants'
import type { Profile, Subscription } from '@/types'

interface BillingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string; plan?: string }>
}

const TIER_FEATURES = {
  free: {
    label: 'Free',
    price: '$0',
    period: 'forever',
    color: 'text-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground',
    features: [
      '1 analysis per month',
      'Score & classification preview',
      'Low & Normal priority only',
      'Email support',
    ],
  },
  unit: {
    label: 'By Unit',
    price: '$9.99',
    period: 'per report',
    color: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    features: [
      '1 analysis credit',
      'All priority levels',
      'Branded PDF report',
      'Full score breakdown',
      'Credit never expires',
    ],
  },
  pro: {
    label: 'Pro',
    price: '$49',
    period: 'per month',
    color: 'text-primary',
    badgeClass: 'bg-primary/10 text-primary',
    features: [
      '10 analyses per month',
      'All priority levels',
      'Branded PDF reports',
      'Priority email support',
      'Full score breakdown',
    ],
  },
  enterprise: {
    label: 'Enterprise',
    price: '$199',
    period: 'per month',
    color: 'text-purple-600 dark:text-purple-400',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    features: [
      'Unlimited analyses',
      'All priority levels',
      'Branded PDF reports',
      'Dedicated support',
      'Full score breakdown',
      'API access (coming soon)',
      'Custom SLA',
    ],
  },
} as const

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Determine billing period start (subscription date or 1st of current month)
  const periodStart = subscription?.current_period_start ?? (() => {
    const d = new Date(); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); return d.toISOString()
  })()

  // Count analyses this billing period via cases join (correct filter: client_id = user.id)
  const { data: userCases } = await supabase
    .from('cases')
    .select('id')
    .eq('client_id', user.id)
  const caseIds = (userCases ?? []).map((c: { id: string }) => c.id)

  const { count: analysesUsed } = caseIds.length > 0
    ? await supabase
        .from('forensic_reviews')
        .select('id', { count: 'exact', head: true })
        .in('case_id', caseIds)
        .gte('created_at', periodStart)
    : { count: 0 }

  const currentTier = (profile?.subscription_tier ?? 'free') as keyof typeof TIER_LIMITS
  // TIER_FEATURES has all tiers; fall back to 'free' if somehow not found
  const tierConfig = TIER_FEATURES[currentTier as keyof typeof TIER_FEATURES] ?? TIER_FEATURES.free
  const tierLimits = TIER_LIMITS[currentTier]
  const analysisLimit = tierLimits.analyses_per_month
  const usedCount = analysesUsed ?? 0
  const analysisCredits = (profile as { analysis_credits?: number } | null)?.analysis_credits ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your plan and usage for LVIS™.
        </p>
      </div>

      {/* Flash messages */}
      {params.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400">
          Your subscription has been activated successfully. Welcome to LVIS™ {tierConfig.label}!
        </div>
      )}
      {params.canceled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-400">
          Checkout was canceled. No changes were made to your subscription.
        </div>
      )}

      {/* Current plan summary */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Current Plan</h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tierConfig.badgeClass}`}
              >
                {tierConfig.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {tierConfig.price}{' '}
              <span className="text-xs">{tierConfig.period}</span>
            </p>
            {subscription?.current_period_end && (
              <p className="text-xs text-muted-foreground">
                {subscription.cancel_at_period_end
                  ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                  : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
              </p>
            )}
          </div>

          {/* Usage */}
          <div className="min-w-48 space-y-2 rounded-lg border bg-muted/30 p-4">
            {currentTier === 'unit' ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Analysis Credits
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold">{analysisCredits}</span>
                  <span className="mb-0.5 text-sm text-muted-foreground">remaining</span>
                </div>
                <p className="text-xs text-muted-foreground">Buy more below</p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Analyses this month
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold">{usedCount}</span>
                  <span className="mb-0.5 text-sm text-muted-foreground">
                    / {analysisLimit === Infinity ? '∞' : analysisLimit}
                  </span>
                </div>
                {analysisLimit !== Infinity && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((usedCount / analysisLimit) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* BillingClient — handles checkout + portal buttons */}
      <BillingClient
        currentTier={currentTier}
        hasWaveCustomer={!!profile?.wave_customer_id}
        pendingInvoiceUrl={subscription?.wave_invoice_id ? `/api/billing/invoice` : undefined}
        highlightPlan={params.plan}
      />

      {/* Feature comparison table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Plan Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Feature</th>
                {Object.entries(TIER_FEATURES).map(([key, t]) => (
                  <th key={key} className="px-6 py-3 text-center font-medium">
                    <span className={t.color}>{t.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: 'Analyses',
                  free: '1 / month',
                  unit: '1 credit',
                  pro: '10 / month',
                  enterprise: 'Unlimited',
                },
                {
                  label: 'Priority levels',
                  free: 'Low, Normal',
                  unit: 'All',
                  pro: 'All',
                  enterprise: 'All',
                },
                {
                  label: 'Branded PDF reports',
                  free: '—',
                  unit: '✓',
                  pro: '✓',
                  enterprise: '✓',
                },
                {
                  label: 'Full score breakdown',
                  free: '—',
                  unit: '✓',
                  pro: '✓',
                  enterprise: '✓',
                },
                {
                  label: 'Priority support',
                  free: '—',
                  unit: '—',
                  pro: '✓',
                  enterprise: '✓',
                },
                {
                  label: 'Dedicated support',
                  free: '—',
                  unit: '—',
                  pro: '—',
                  enterprise: '✓',
                },
                {
                  label: 'API access',
                  free: '—',
                  unit: '—',
                  pro: '—',
                  enterprise: 'Coming soon',
                },
                {
                  label: 'Custom SLA',
                  free: '—',
                  unit: '—',
                  pro: '—',
                  enterprise: '✓',
                },
              ].map((row, i) => (
                <tr
                  key={row.label}
                  className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                >
                  <td className="px-6 py-3 font-medium">{row.label}</td>
                  <td className="px-6 py-3 text-center text-muted-foreground">{row.free}</td>
                  <td className="px-6 py-3 text-center text-amber-600 dark:text-amber-400">{row.unit}</td>
                  <td className="px-6 py-3 text-center text-primary">{row.pro}</td>
                  <td className="px-6 py-3 text-center text-purple-600 dark:text-purple-400">
                    {row.enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
