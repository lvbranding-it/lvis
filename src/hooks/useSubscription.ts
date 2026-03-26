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
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [loading, setLoading] = useState(true)
  const [analysesUsed, setAnalysesUsed] = useState(0)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Fetch subscription
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setSubscription(data as Subscription)
          setTier(data.tier as SubscriptionTier)
        }
        setLoading(false)
      })

    // Count analyses this month
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    supabase
      .from('forensic_reviews')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(({ count }) => {
        setAnalysesUsed(count ?? 0)
      })
  }, [user])

  const limits = TIER_LIMITS[tier]
  const analysesLimit = limits.analyses_per_month
  const canAnalyze = analysesLimit === Infinity || analysesUsed < analysesLimit
  const percentUsed = analysesLimit === Infinity ? 0 : Math.round((analysesUsed / analysesLimit) * 100)

  return {
    subscription,
    tier,
    loading,
    analysesUsedThisMonth: analysesUsed,
    analysesLimit,
    canAnalyze,
    percentUsed,
  }
}
