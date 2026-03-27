'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { CASE_STATUS_LABELS, CASE_STATUS_COLORS, PRIORITY_COLORS } from '@/lib/constants'
import type { CaseStatus, CasePriority } from '@/types'

interface CaseAdminControlsProps {
  caseId: string
  initialStatus: CaseStatus
  initialPriority: CasePriority
  initialAdminNotes: string | null
}

const PRIORITY_LABELS: Record<CasePriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

export function CaseAdminControls({
  caseId,
  initialStatus,
  initialPriority,
  initialAdminNotes,
}: CaseAdminControlsProps) {
  const [status, setStatus] = useState<CaseStatus>(initialStatus)
  const [priority, setPriority] = useState<CasePriority>(initialPriority)
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes ?? '')
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingPriority, setSavingPriority] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  async function patchCase(fields: Record<string, unknown>) {
    const res = await fetch(`/api/admin/cases/${caseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error ?? 'Failed to update case')
    }
  }

  async function handleStatusChange(newStatus: CaseStatus) {
    setSavingStatus(true)
    try {
      await patchCase({ status: newStatus })
      setStatus(newStatus)
      toast.success(`Status updated to "${CASE_STATUS_LABELS[newStatus]}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setSavingStatus(false)
    }
  }

  async function handlePriorityChange(newPriority: CasePriority) {
    setSavingPriority(true)
    try {
      await patchCase({ priority: newPriority })
      setPriority(newPriority)
      toast.success(`Priority updated to "${PRIORITY_LABELS[newPriority]}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update priority')
    } finally {
      setSavingPriority(false)
    }
  }

  async function handleNotesSave() {
    setSavingNotes(true)
    try {
      await patchCase({ admin_notes: adminNotes })
      toast.success('Admin notes saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 space-y-5">
      <h3 className="text-sm font-semibold">Admin Controls</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Status
          </label>
          <div className="relative">
            <select
              value={status}
              disabled={savingStatus}
              onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 appearance-none cursor-pointer"
            >
              {(Object.keys(CASE_STATUS_LABELS) as CaseStatus[]).map((s) => (
                <option key={s} value={s}>{CASE_STATUS_LABELS[s]}</option>
              ))}
            </select>
            {savingStatus && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CASE_STATUS_COLORS[status]}`}>
            {CASE_STATUS_LABELS[status]}
          </span>
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Priority
          </label>
          <div className="relative">
            <select
              value={priority}
              disabled={savingPriority}
              onChange={(e) => handlePriorityChange(e.target.value as CasePriority)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 appearance-none cursor-pointer"
            >
              {(Object.keys(PRIORITY_LABELS) as CasePriority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
            {savingPriority && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <span className={`text-xs font-medium ${PRIORITY_COLORS[priority]}`}>
            {PRIORITY_LABELS[priority]} Priority
          </span>
        </div>
      </div>

      {/* Admin notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Admin Notes
        </label>
        <textarea
          ref={notesRef}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleNotesSave()
          }}
          rows={4}
          placeholder="Internal notes visible only to admins…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{adminNotes.length} chars · ⌘↵ to save</span>
          <button
            onClick={handleNotesSave}
            disabled={savingNotes}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {savingNotes ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            Save Notes
          </button>
        </div>
      </div>
    </div>
  )
}
