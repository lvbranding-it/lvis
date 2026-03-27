'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Send, Loader2, Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

interface SendReportModalProps {
  caseId: string
  caseNumber: string
  clientName: string
  clientEmail: string | null
}

export function SendReportModal({
  caseId,
  caseNumber,
  clientName,
  clientEmail,
}: SendReportModalProps) {
  const [open, setOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState(clientEmail ?? '')
  const [message, setMessage] = useState(
    `Dear ${clientName},\n\nPlease find attached the LVIS™ Forensic Report for case #${caseNumber}.\n\nShould you have any questions regarding the findings, please don't hesitate to reach out.\n\nBest regards,\nThe LVIS™ Team`
  )
  const [adminNote, setAdminNote] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!recipientEmail.trim()) { toast.error('Recipient email is required'); return }
    if (!message.trim())        { toast.error('Message is required');         return }

    setSending(true)
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          message: message.trim(),
          adminNote: adminNote.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to send report')
        return
      }
      toast.success(`Report sent to ${data.sentTo}`)
      setOpen(false)
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Send className="size-4" />
        Send Report
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-4" />
            Send Report — Case #{caseNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Recipient */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recipient Email *
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Personal message */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Expert note for PDF */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Forensic Expert Note <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="This note will appear as a highlighted callout in the PDF…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              Appears as an amber-highlighted "Forensic Expert Note" section in the PDF report.
            </p>
          </div>
        </div>

        <DialogFooter showCloseButton>
          <button
            onClick={handleSend}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {sending ? 'Generating & Sending…' : 'Send Report'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
