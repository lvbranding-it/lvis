'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AnalysisStatus, ForensicReview } from '@/types'

interface UseAnalysisReturn {
  status: AnalysisStatus | null
  review: ForensicReview | null
  error: string | null
  elapsedSeconds: number
  triggerAnalysis: (caseFileId: string) => Promise<void>
}

export function useAnalysis(caseId: string): UseAnalysisReturn {
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [review, setReview] = useState<ForensicReview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // Elapsed timer
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  // Subscribe to forensic_reviews changes via Supabase Realtime
  useEffect(() => {
    const supabase = createClient()

    // Check existing review first
    supabase
      .from('forensic_reviews')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        if (data) {
          setReview(data as ForensicReview)
          setStatus(data.analysis_status as AnalysisStatus)
          if (data.analysis_status === 'running') setIsRunning(true)
        }
      })

    // Realtime subscription
    const channel = supabase
      .channel(`forensic-review-${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forensic_reviews',
          filter: `case_id=eq.${caseId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const updated = payload.new as ForensicReview
          setReview(updated)
          setStatus(updated.analysis_status)
          if (updated.analysis_status === 'complete' || updated.analysis_status === 'failed') {
            setIsRunning(false)
            if (updated.analysis_status === 'failed') {
              setError(updated.error_message ?? 'Analysis failed')
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [caseId])

  // Polling fallback (every 5 seconds while running)
  useEffect(() => {
    if (status !== 'running' && status !== 'pending') return

    const supabase = createClient()
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('forensic_reviews')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setReview(data as ForensicReview)
        setStatus(data.analysis_status as AnalysisStatus)
        if (data.analysis_status === 'complete' || data.analysis_status === 'failed') {
          setIsRunning(false)
          clearInterval(interval)
          if (data.analysis_status === 'failed') {
            setError(data.error_message ?? 'Analysis failed')
          }
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [caseId, status])

  const triggerAnalysis = useCallback(async (caseFileId: string) => {
    setError(null)
    setStatus('pending')
    setIsRunning(true)
    setElapsedSeconds(0)

    try {
      const response = await fetch(`/api/cases/${caseId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseFileId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Analysis request failed')
      }
    } catch (err) {
      setError(String(err))
      setStatus('failed')
      setIsRunning(false)
    }
  }, [caseId])

  return { status, review, error, elapsedSeconds, triggerAnalysis }
}
