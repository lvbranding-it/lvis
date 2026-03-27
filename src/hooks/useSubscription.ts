'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import { TIER_LIMITS } from '@/lib/constants'
import type { Subscription, SubscriptionTier } from '@/types'

interface UseSubscriptionReturn {
  subscription: Subscription | null
  tier: SubscriptionTier
  loading: boolean
  analysesUsedThisMonth: number
  analysesLimit: number
  canAnalyze: boolean
  percentUsed: number
  periodStart: string | null
  periodEnd: string | null
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [analysesOverride, setAnalysesOverride] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysesUsed, setAnalysesUsed] = useState(0)
  const [periodStart, setPeriodStart] = useState<string | null>(null)
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Fetch profile for tier + admin override
    supabase
      .from('profiles')
      .select('subscription_tier, analyses_override')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setTier((data.subscription_tier as SubscriptionTier) ?? 'free')
          setAnalysesOverride(data.analyses_override ?? null)
        }
      })

    // Fetch active subscription for billing period dates
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setSubscription(data as Subscription)
        }

        // Determine period start: subscription date or 1st of current month
        const start = data?.current_period_start ?? (() => {
          const d = new Date()
          d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0)
          return d.toISOString()
        })()
        const end = data?.current_period_end ?? (() => {
          const d = new Date()
          d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0)
          return d.toISOString()
        })()
        setPeriodStart(start)
        setPeriodEnd(end)

        // Count analyses via cases join
        supabase
          .from('cases')
          .select('id')
          .eq('client_id', user.id)
          .then(({ data: userCases }) => {
            const ids = (userCases ?? []).map((c) => c.id)
            if (ids.length === 0) {
              setAnalysesUsed(0)
              setLoading(false)
              return
            }
            supabase
              .from('forensic_reviews')
              .select('id', { count: 'exact', head: true })
              .in('case_id', ids)
              .gte('created_at', start)
              .then(({ count }) => {
                setAnalysesUsed(count ?? 0)
                setLoading(false)
              })
          })
      })
  }, [user])

  const tierLimit = TIER_LIMITS[tier]?.analyses_per_month ?? 1
  const analysesLimit = analysesOverride ?? tierLimit
  const canAnalyze = analysesLimit === Infinity || analysesUsed < analysesLimit
  const percentUsed = analysesLimit === Infinity ? 0 : Math.min(100, Math.round((analysesUsed / analysesLimit) * 100))

  return {
    subscription,
    tier,
    loading,
    analysesUsedThisMonth: analysesUsed,
    analysesLimit,
    canAnalyze,
    percentUsed,
    periodStart,
    periodEnd,
  }
}
