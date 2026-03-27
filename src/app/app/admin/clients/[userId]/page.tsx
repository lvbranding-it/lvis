import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ClientTierControls } from '@/components/app/admin/ClientTierControls'
import { CaseStatusBadge } from '@/components/app/CaseStatusBadge'
import { formatDate } from '@/lib/utils'
import { TIER_LIMITS } from '@/lib/constants'
import { ArrowLeft, Building2, Mail, Phone, Calendar, ExternalLink } from 'lucide-react'
import type { SubscriptionTier } from '@/types'

interface Props {
  params: Promise<{ userId: string }>
}

const TIER_BADGE: Record<string, string> = {
  free:       'bg-muted text-muted-foreground',
  pro:        'bg-primary/10 text-primary',
  enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

export default async function AdminClientDetailPage({ params }: Props) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const serviceClient = createServiceClient()

  // Fetch profile
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .eq('role', 'client')
    .single()

  if (!profile) notFound()

  // Fetch auth user email
  const { data: { user: authUser } } = await serviceClient.auth.admin.getUserById(userId)
  const email = authUser?.email ?? null

  // Fetch subscription
  const { data: subscription } = await serviceClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch all cases
  const { data: cases } = await serviceClient
    .from('cases')
    .select('id, case_number, title, status, priority, created_at, forensic_reviews(total_score, analysis_status)')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })

  // Compute quota usage
  const tier = (profile.subscription_tier ?? 'free') as SubscriptionTier
  const tierLimit = TIER_LIMITS[tier]?.analyses_per_month ?? 1
  const effectiveLimit = profile.analyses_override ?? tierLimit

  const periodStart = subscription?.current_period_start ?? (() => {
    const d = new Date(); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); return d.toISOString()
  })()

  const caseIds = (cases ?? []).map((c) => c.id)
  const { count: analysesUsed } = caseIds.length > 0
    ? await serviceClient
        .from('forensic_reviews')
        .select('id', { count: 'exact', head: true })
        .in('case_id', caseIds)
        .gte('created_at', periodStart)
    : { count: 0 }

  const usedCount = analysesUsed ?? 0

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/app/admin/clients"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to Clients
      </Link>

      {/* Client header */}
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold">{profile.full_name ?? 'Unnamed Client'}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3" />
                  {email}
                </span>
              )}
              {profile.company_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="size-3" />
                  {profile.company_name}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3" />
                  {profile.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Joined {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
          <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${TIER_BADGE[tier]}`}>
            {tier}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tier & quota controls */}
        <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold">Plan & Quota</h2>
          <ClientTierControls
            userId={userId}
            currentTier={tier}
            currentOverride={profile.analyses_override ?? null}
            analysesUsed={usedCount}
          />
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Analyses this period: <span className="font-medium text-foreground">{usedCount} / {effectiveLimit === Infinity ? '∞' : effectiveLimit}</span></p>
            {periodStart && <p>Period start: <span className="font-medium text-foreground">{formatDate(periodStart)}</span></p>}
            {subscription?.current_period_end && <p>Period end: <span className="font-medium text-foreground">{formatDate(subscription.current_period_end)}</span></p>}
          </div>
        </div>

        {/* Subscription info */}
        <div className="rounded-xl border bg-card shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold">Subscription</h2>
          {subscription ? (
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    subscription.status === 'active'   ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    subscription.status === 'pending'  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {subscription.status}
                  </span>
                </dd>
              </div>
              {subscription.wave_invoice_id && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Wave Invoice</dt>
                  <dd className="font-mono text-[10px] text-muted-foreground">{subscription.wave_invoice_id.slice(0, 16)}…</dd>
                </div>
              )}
              {subscription.wave_customer_id && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Wave Customer</dt>
                  <dd className="font-mono text-[10px] text-muted-foreground">{subscription.wave_customer_id.slice(0, 16)}…</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground">No subscription record.</p>
          )}
        </div>
      </div>

      {/* Cases table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">Cases ({cases?.length ?? 0})</h2>
        </div>
        {cases && cases.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Case #</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground" />
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const review = Array.isArray(c.forensic_reviews) ? c.forensic_reviews[0] : c.forensic_reviews
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.case_number}</td>
                    <td className="px-4 py-3">
                      <p className="max-w-[200px] truncate text-xs font-medium">{c.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <CaseStatusBadge status={c.status as any} />
                    </td>
                    <td className="px-4 py-3">
                      {review?.total_score != null ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                          {review.total_score}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/app/admin/cases/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="size-3" />
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-10 text-center text-xs text-muted-foreground">No cases yet.</div>
        )}
      </div>
    </div>
  )
}
