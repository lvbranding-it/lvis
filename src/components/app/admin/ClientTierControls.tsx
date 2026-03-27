'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { SubscriptionTier } from '@/types'

interface ClientTierControlsProps {
  userId: string
  currentTier: SubscriptionTier
  currentOverride: number | null
  analysesUsed: number
}

const TIER_BADGE: Record<string, string> = {
  free:       'bg-muted text-muted-foreground',
  pro:        'bg-primary/10 text-primary',
  enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

export function ClientTierControls({
  userId,
  currentTier,
  currentOverride,
  analysesUsed,
}: ClientTierControlsProps) {
  const [tier, setTier] = useState<SubscriptionTier>(currentTier)
  const [override, setOverride] = useState<string>(currentOverride !== null ? String(currentOverride) : '')
  const [savingTier, setSavingTier] = useState(false)
  const [savingOverride, setSavingOverride] = useState(false)

  async function handleTierChange(newTier: SubscriptionTier) {
    setSavingTier(true)
    try {
      const res = await fetch(`/api/admin/clients/${userId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to update tier')
        return
      }
      setTier(newTier)
      toast.success(`Tier updated to ${newTier}`)
    } finally {
      setSavingTier(false)
    }
  }

  async function handleOverrideSave() {
    const parsed = override.trim() === '' ? null : parseInt(override, 10)
    if (override.trim() !== '' && (isNaN(parsed!) || parsed! < 0)) {
      toast.error('Override must be a non-negative integer, or empty to clear.')
      return
    }
    setSavingOverride(true)
    try {
      const res = await fetch(`/api/admin/clients/${userId}/quota-override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ override: parsed }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to update override')
        return
      }
      toast.success(parsed === null ? 'Override cleared' : `Quota override set to ${parsed}`)
    } finally {
      setSavingOverride(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Tier selector */}
      <select
        value={tier}
        disabled={savingTier}
        onChange={(e) => handleTierChange(e.target.value as SubscriptionTier)}
        className={`rounded-full border-0 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-opacity ${savingTier ? 'opacity-50' : ''} ${TIER_BADGE[tier] ?? TIER_BADGE.free}`}
      >
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="enterprise">Enterprise</option>
      </select>

      {/* Usage + override */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground tabular-nums">{analysesUsed} used</span>
        <span className="text-[10px] text-muted-foreground">/</span>
        <input
          type="number"
          min={0}
          placeholder="—"
          value={override}
          onChange={(e) => setOverride(e.target.value)}
          onBlur={handleOverrideSave}
          onKeyDown={(e) => { if (e.key === 'Enter') handleOverrideSave() }}
          disabled={savingOverride}
          title="Override monthly quota (leave blank to use tier default)"
          className="w-14 rounded border border-input bg-transparent px-1.5 py-0.5 text-[10px] text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
      </div>
    </div>
  )
}
