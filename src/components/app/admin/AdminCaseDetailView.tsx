'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CaseStatusBadge } from '@/components/app/CaseStatusBadge'
import { AnalysisProgress } from '@/components/app/AnalysisProgress'
import { LVISScoreCard } from '@/components/app/LVISScoreCard'
import { SendReportModal } from '@/components/app/admin/SendReportModal'
import {
  ArrowLeft, FileText, Download, FilePlus, Save,
  Loader2, Calendar, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize, formatDateTime } from '@/lib/utils'
import {
  CASE_STATUS_LABELS, CASE_STATUS_COLORS,
  PRIORITY_COLORS,
} from '@/lib/constants'
import type { Case, ForensicReview, ClaudeFindings, TechnicalEvidence, CaseStatus, CasePriority } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminCaseDetailViewProps {
  caseData: Case & {
    client?: { id: string; full_name: string | null; company_name: string | null } | null
    case_files?: Array<{
      id: string
      file_name: string
      file_type: string
      file_size: number
      storage_path: string
    }>
    forensic_reviews?: ForensicReview[]
    reports?: Array<{ id: string; storage_path: string | null; created_at: string }>
  }
  metadata: {
    exif_json: Record<string, unknown>
    xmp_json: Record<string, unknown>
    iptc_json: Record<string, unknown>
    raw_metadata: Record<string, unknown>
  } | null
  clientEmail: string | null
}

const PRIORITY_LABELS: Record<CasePriority, string> = {
  low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent',
}

// ── Lazy loaders (same pattern as CaseDetailView) ─────────────────────────────

function EvidencePanelLazy({ technicalEvidence, claudeFindings }: {
  technicalEvidence: TechnicalEvidence
  claudeFindings: ClaudeFindings
}) {
  const [EvidencePanel, setPanel] = useState<React.ComponentType<any> | null>(null)
  useState(() => {
    import('@/components/app/EvidencePanel').then((m) => setPanel(() => m.EvidencePanel))
  })
  if (!EvidencePanel) return <div className="h-32 animate-pulse bg-muted rounded-lg" />
  return <EvidencePanel technicalEvidence={technicalEvidence} claudeFindings={claudeFindings} />
}

function MetadataViewerLazy(props: {
  exifData: Record<string, unknown>
  xmpData: Record<string, unknown>
  iptcData: Record<string, unknown>
  rawData: Record<string, unknown>
}) {
  const [MetadataViewer, setViewer] = useState<React.ComponentType<any> | null>(null)
  useState(() => {
    import('@/components/app/MetadataViewer').then((m) => setViewer(() => m.MetadataViewer))
  })
  if (!MetadataViewer) return <div className="h-32 animate-pulse bg-muted rounded-lg" />
  return <MetadataViewer {...props} />
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminCaseDetailView({ caseData, metadata, clientEmail }: AdminCaseDetailViewProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus]     = useState<CaseStatus>(caseData.status)
  const [priority, setPriority] = useState<CasePriority>(caseData.priority)
  const [adminNotes, setAdminNotes] = useState(caseData.admin_notes ?? '')
  const [savingStatus, setSavingStatus]     = useState(false)
  const [savingPriority, setSavingPriority] = useState(false)
  const [savingNotes, setSavingNotes]       = useState(false)
  const [isGenerating, setIsGenerating]     = useState(false)
  const [isDownloading, setIsDownloading]   = useState(false)
  const [reportExists, setReportExists]     = useState(!!caseData.reports?.[0]?.storage_path)

  const review   = caseData.forensic_reviews?.[0]
  const caseFile = caseData.case_files?.[0]
  const isComplete = review?.analysis_status === 'complete'
  const clientId   = caseData.client?.id ?? caseData.client_id

  // ── API helpers ────────────────────────────────────────────────────────────
  async function patchCase(fields: Record<string, unknown>) {
    const res = await fetch(`/api/admin/cases/${caseData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error ?? 'Failed to update')
    }
  }

  async function handleStatusChange(val: CaseStatus) {
    setSavingStatus(true)
    try {
      await patchCase({ status: val })
      setStatus(val)
      toast.success(`Status → "${CASE_STATUS_LABELS[val]}"`)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error') }
    finally { setSavingStatus(false) }
  }

  async function handlePriorityChange(val: CasePriority) {
    setSavingPriority(true)
    try {
      await patchCase({ priority: val })
      setPriority(val)
      toast.success(`Priority → "${PRIORITY_LABELS[val]}"`)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error') }
    finally { setSavingPriority(false) }
  }

  async function handleNotesSave() {
    setSavingNotes(true)
    try {
      await patchCase({ admin_notes: adminNotes })
      toast.success('Notes saved')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error') }
    finally { setSavingNotes(false) }
  }

  async function handleGenerateReport() {
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}/report`, { method: 'POST' })
      if (res.ok) { setReportExists(true); toast.success('PDF generated') }
      else {
        const { error } = await res.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(`Generation failed: ${error}`)
      }
    } finally { setIsGenerating(false) }
  }

  async function handleDownloadReport() {
    setIsDownloading(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}/report`)
      if (res.ok) {
        const { url } = await res.json()
        if (url) window.open(url, '_blank')
        else toast.error('No URL returned')
      } else toast.error('Could not load report')
    } finally { setIsDownloading(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Link
          href="/app/admin/cases"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          All Cases
        </Link>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-xs font-mono text-muted-foreground">{caseData.case_number}</code>
              {caseData.client && (
                <Link
                  href={`/app/admin/clients/${clientId}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {caseData.client.full_name ?? 'Unknown Client'}
                  {caseData.client.company_name && (
                    <span className="ml-1 opacity-60">· {caseData.client.company_name}</span>
                  )}
                </Link>
              )}
            </div>
            <h1 className="text-xl font-bold leading-tight">{caseData.title}</h1>
            {caseData.purpose && (
              <p className="text-sm text-muted-foreground">{caseData.purpose}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <CaseStatusBadge status={status} />
            <span className={`text-xs font-semibold ${PRIORITY_COLORS[priority]}`}>
              {priority.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Two-column body ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">

        {/* ── LEFT: case content ──────────────────────────────────────────── */}
        <div className="min-w-0 space-y-5">

          {/* Score card */}
          {isComplete && review && (
            <LVISScoreCard
              caseNumber={caseData.case_number}
              status={status}
              totalScore={review.total_score}
              classification={review.classification}
              confidenceLevel={review.confidence_level}
              analyzedAt={review.analyzed_at ?? null}
              categories={[
                { label: 'Provenance',         score: review.provenance_score },
                { label: 'File Integrity',     score: review.file_integrity_score },
                { label: 'Visual Consistency', score: review.visual_consistency_score },
                { label: 'Manipulation',       score: review.manipulation_score },
                { label: 'Synthetic Risk',     score: review.synthetic_risk_score },
              ]}
            />
          )}

          {/* Tabs */}
          <Tabs defaultValue="analysis">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="details">Case Details</TabsTrigger>
            </TabsList>

            {/* Analysis */}
            <TabsContent value="analysis" className="space-y-4 mt-4">
              {!caseFile ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-4 py-12">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No image uploaded yet.</p>
                  </CardContent>
                </Card>
              ) : caseData.status === 'analyzing' || review?.analysis_status === 'pending' || review?.analysis_status === 'running' ? (
                <AnalysisProgress
                  caseId={caseData.id}
                  initialStatus={review?.analysis_status ?? 'pending'}
                  onComplete={() => window.location.reload()}
                />
              ) : review?.analysis_status === 'failed' ? (
                <Card className="border-red-500/20">
                  <CardContent className="py-6">
                    <div className="flex items-start gap-3">
                      <div className="size-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium text-red-500">Analysis Failed</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {review.error_message ?? 'An unexpected error occurred.'}
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                        >
                          <RefreshCw className="size-3" /> Retry
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : isComplete ? (
                <EvidencePanelLazy
                  technicalEvidence={review.technical_evidence as TechnicalEvidence}
                  claudeFindings={review.claude_findings as ClaudeFindings}
                />
              ) : (
                <Card>
                  <CardContent className="py-6 text-center text-sm text-muted-foreground">
                    Awaiting analysis.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Metadata */}
            <TabsContent value="metadata" className="mt-4">
              {metadata ? (
                <MetadataViewerLazy
                  exifData={metadata.exif_json ?? {}}
                  xmpData={metadata.xmp_json ?? {}}
                  iptcData={metadata.iptc_json ?? {}}
                  rawData={metadata.raw_metadata ?? {}}
                />
              ) : (
                <Card>
                  <CardContent className="py-6 text-center text-sm text-muted-foreground">
                    Metadata available after analysis.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Case Details */}
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Case Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider">Case Number</dt>
                      <dd className="mt-1 font-mono text-sm">{caseData.case_number}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider">Client</dt>
                      <dd className="mt-1 text-sm">
                        {caseData.client ? (
                          <Link href={`/app/admin/clients/${clientId}`} className="hover:text-primary transition-colors">
                            {caseData.client.full_name ?? '—'}
                          </Link>
                        ) : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider">Submitted</dt>
                      <dd className="mt-1 text-sm flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDateTime(caseData.created_at)}
                      </dd>
                    </div>
                    {caseFile && (
                      <div>
                        <dt className="text-xs text-muted-foreground uppercase tracking-wider">Image File</dt>
                        <dd className="mt-1 text-sm">
                          <span className="font-mono">{caseFile.file_name}</span>
                          <span className="text-muted-foreground ml-2">({formatFileSize(caseFile.file_size)})</span>
                        </dd>
                      </div>
                    )}
                    {caseData.purpose && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-muted-foreground uppercase tracking-wider">Purpose</dt>
                        <dd className="mt-1 text-sm">{caseData.purpose}</dd>
                      </div>
                    )}
                  </dl>
                  {caseData.description && (
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</dt>
                      <dd className="text-sm">{caseData.description}</dd>
                    </div>
                  )}
                  {caseData.client_notes && (
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Client Notes</dt>
                      <dd className="text-sm">{caseData.client_notes}</dd>
                    </div>
                  )}
                  {adminNotes && (
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Admin Notes</dt>
                      <dd className="text-sm italic text-muted-foreground">{adminNotes}</dd>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── RIGHT: sticky admin sidebar ─────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">

          {/* Admin Controls */}
          <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin Controls</p>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <div className="relative">
                <select
                  value={status}
                  disabled={savingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  {(Object.keys(CASE_STATUS_LABELS) as CaseStatus[]).map((s) => (
                    <option key={s} value={s}>{CASE_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                {savingStatus && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />}
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CASE_STATUS_COLORS[status]}`}>
                {CASE_STATUS_LABELS[status]}
              </span>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <div className="relative">
                <select
                  value={priority}
                  disabled={savingPriority}
                  onChange={(e) => handlePriorityChange(e.target.value as CasePriority)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  {(Object.keys(PRIORITY_LABELS) as CasePriority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
                {savingPriority && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />}
              </div>
              <span className={`text-xs font-medium ${PRIORITY_COLORS[priority]}`}>
                {PRIORITY_LABELS[priority]} Priority
              </span>
            </div>

            {/* Admin Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleNotesSave() }}
                rows={4}
                placeholder="Internal notes (admin only)…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">⌘↵ to save</span>
                <button
                  onClick={handleNotesSave}
                  disabled={savingNotes}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {savingNotes ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Send Report */}
          <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Report</p>

            {isComplete ? (
              <div className="space-y-2">
                <SendReportModal
                  caseId={caseData.id}
                  caseNumber={caseData.case_number}
                  clientName={caseData.client?.full_name ?? 'Client'}
                  clientEmail={clientEmail}
                />

                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-input px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <FilePlus className="size-3.5" />}
                  {isGenerating ? 'Generating…' : reportExists ? 'Regenerate PDF' : 'Generate PDF'}
                </button>

                {reportExists && (
                  <button
                    onClick={handleDownloadReport}
                    disabled={isDownloading}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-input px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {isDownloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                    {isDownloading ? 'Loading…' : 'Download Report'}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Analysis must be complete to send or generate a report.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
