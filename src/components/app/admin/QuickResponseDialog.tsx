'use client'

import { useState, useEffect } from 'react'
import { Zap, Send, Gift, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CaseOption {
  id: string
  case_number: string
  title: string
  total_score: number | null
  classification: string | null
}

interface QuickResponseDialogProps {
  ticketId: string
  ticketEmail: string
  ticketName: string
  userId: string | null
}

export function QuickResponseDialog({
  ticketId,
  ticketEmail,
  ticketName,
  userId,
}: QuickResponseDialogProps) {
  const [open, setOpen] = useState(false)
  const [cases, setCases] = useState<CaseOption[]>([])
  const [loadingCases, setLoadingCases] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [recipientEmail, setRecipientEmail] = useState(ticketEmail)
  const [creditAmount, setCreditAmount] = useState(1)
  const [sendingReport, setSendingReport] = useState(false)
  const [grantingCredit, setGrantingCredit] = useState(false)
  const [reportResult, setReportResult] = useState<'success' | 'error' | null>(null)
  const [creditResult, setCreditResult] = useState<'success' | 'error' | null>(null)
  const [reportError, setReportError] = useState('')
  const [creditError, setCreditError] = useState('')

  // Load cases when dialog opens
  useEffect(() => {
    if (!open) return
    setLoadingCases(true)
    const params = new URLSearchParams()
    if (userId) params.set('userId', userId)
    else params.set('email', ticketEmail)

    fetch(`/api/admin/support/cases?${params}`)
      .then((r) => r.json())
      .then(({ cases: data }) => {
        setCases(data ?? [])
        if (data?.length === 1) setSelectedCaseId(data[0].id)
      })
      .catch(() => setCases([]))
      .finally(() => setLoadingCases(false))
  }, [open, userId, ticketEmail])

  const handleSendReport = async () => {
    if (!selectedCaseId || !recipientEmail.trim()) return
    setSendingReport(true)
    setReportResult(null)
    setReportError('')
    try {
      const res = await fetch('/api/admin/support/quick-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          resend: {
            caseId: selectedCaseId,
            recipientEmail: recipientEmail.trim(),
            recipientName: ticketName,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || data.errors?.length) {
        setReportError(data.errors?.[0] ?? data.error ?? 'Failed')
        setReportResult('error')
      } else {
        setReportResult('success')
      }
    } catch {
      setReportError('Network error')
      setReportResult('error')
    } finally {
      setSendingReport(false)
    }
  }

  const handleGrantCredit = async () => {
    if (!userId) return
    setGrantingCredit(true)
    setCreditResult(null)
    setCreditError('')
    try {
      const res = await fetch('/api/admin/support/quick-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          grantCredit: { userId, amount: creditAmount },
        }),
      })
      const data = await res.json()
      if (!res.ok || data.errors?.length) {
        setCreditError(data.errors?.[0] ?? data.error ?? 'Failed')
        setCreditResult('error')
      } else {
        setCreditResult('success')
      }
    } catch {
      setCreditError('Network error')
      setCreditResult('error')
    } finally {
      setGrantingCredit(false)
    }
  }

  const selectedCase = cases.find((c) => c.id === selectedCaseId)
  const shortId = ticketId.slice(0, 8).toUpperCase()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:border-blue-400/50 hover:bg-blue-500/20 hover:text-blue-300" />
        }
      >
        <Zap className="size-3.5" />
        Quick Response
      </DialogTrigger>

      <DialogContent
        className="max-w-md border-[#1E293B] bg-[#0A1628] text-white sm:max-w-md"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Zap className="size-4 text-blue-400" />
            Quick Response
            <span className="ml-auto font-mono text-[11px] text-[#475569]">#{shortId}</span>
          </DialogTitle>
          <p className="text-xs text-[#64748B]">
            {ticketName} · {ticketEmail}
          </p>
        </DialogHeader>

        {/* ── Section 1: Send Report ── */}
        <div className="rounded-xl border border-[#1E293B] bg-[#060E1C] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Send className="size-3.5 text-[#64748B]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Send Report
            </span>
          </div>

          {loadingCases ? (
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Loader2 className="size-3.5 animate-spin" />
              Loading cases…
            </div>
          ) : cases.length === 0 ? (
            <p className="text-xs text-[#475569]">No completed reports found for this user.</p>
          ) : (
            <>
              <div className="relative">
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[#1E293B] bg-[#0F1E33] px-3 py-2 pr-8 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="" disabled>Select a case…</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#475569]" />
              </div>

              {selectedCase && (
                <p className="text-[11px] text-[#475569]">
                  Score: {selectedCase.total_score ?? '—'} · {selectedCase.classification ?? '—'}
                </p>
              )}

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Send to
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#1E293B] bg-[#0F1E33] px-3 py-2 text-sm text-white placeholder-[#475569] outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {reportResult === 'success' ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-400">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  Report sent to {recipientEmail}
                </div>
              ) : reportResult === 'error' ? (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {reportError}
                </div>
              ) : (
                <button
                  onClick={handleSendReport}
                  disabled={sendingReport || !selectedCaseId || !recipientEmail.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingReport ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      Send Report
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Section 2: Grant Credit ── */}
        <div className="rounded-xl border border-[#1E293B] bg-[#060E1C] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="size-3.5 text-[#64748B]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Grant Free Credit
            </span>
          </div>

          {!userId ? (
            <p className="text-xs text-[#475569]">
              Only available for registered users. This ticket was submitted anonymously.
            </p>
          ) : creditResult === 'success' ? (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-400">
              <CheckCircle2 className="size-3.5 shrink-0" />
              {creditAmount} free credit{creditAmount > 1 ? 's' : ''} granted to {ticketName}
            </div>
          ) : (
            <>
              {creditResult === 'error' && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {creditError}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="w-20 rounded-lg border border-[#1E293B] bg-[#0F1E33] px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors text-center"
                  />
                </div>
                <button
                  onClick={handleGrantCredit}
                  disabled={grantingCredit}
                  className="mt-5 flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {grantingCredit ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Granting…
                    </>
                  ) : (
                    <>
                      <Gift className="size-3.5" />
                      Grant Credit{creditAmount > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#334155]">
                Credits are added to the client's account balance and can be used for any new analysis.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
