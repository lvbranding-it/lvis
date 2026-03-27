'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CaseStatusBadge } from '@/components/app/CaseStatusBadge'
import { AnalysisProgress } from '@/components/app/AnalysisProgress'
import { ArrowLeft, FileText, Download, RefreshCw, Calendar, Mail, FilePlus } from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize, formatDateTime } from '@/lib/utils'
import { PRIORITY_COLORS } from '@/lib/constants'
import { LVISScoreCard } from '@/components/app/LVISScoreCard'
import type { Case, ForensicReview, ClaudeFindings, TechnicalEvidence } from '@/types'

interface CaseDetailViewProps {
  caseData: Case & {
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
  isAdmin: boolean
}

export function CaseDetailView({ caseData, metadata, isAdmin }: CaseDetailViewProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [reportExists, setReportExists] = useState(!!caseData.reports?.[0]?.storage_path)

  const review = caseData.forensic_reviews?.[0]
  const caseFile = caseData.case_files?.[0]
  const isComplete = review?.analysis_status === 'complete'

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}/report`)
      if (response.ok) {
        const { url } = await response.json()
        if (url) window.open(url, '_blank')
        else toast.error('No report URL returned')
      } else {
        toast.error('Could not load report')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}/report`, { method: 'POST' })
      if (response.ok) {
        setReportExists(true)
        toast.success('Report generated — you can now download or preview it')
      } else {
        const { error } = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(`Generation failed: ${error}`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}/send-report`, { method: 'POST' })
      if (response.ok) {
        toast.success('Report email sent to client')
      } else {
        const { error } = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(`Email failed: ${error}`)
      }
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/app/cases">
            <Button variant="ghost" size="sm" className="mt-0.5 shrink-0">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Cases
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <code className="text-sm font-mono text-muted-foreground">{caseData.case_number}</code>
              <CaseStatusBadge status={caseData.status} />
              <span className={`text-xs font-medium ${PRIORITY_COLORS[caseData.priority]}`}>
                {caseData.priority.toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{caseData.title}</h1>
            {caseData.purpose && (
              <p className="text-muted-foreground mt-1 text-sm">{caseData.purpose}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {/* Download — visible to anyone when report exists */}
          {reportExists && (
            <Button onClick={handleDownloadReport} disabled={isDownloading} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Loading…' : 'Download Report'}
            </Button>
          )}

          {/* Admin-only controls */}
          {isAdmin && isComplete && (
            <>
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                variant="outline"
                size="sm"
              >
                <FilePlus className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating…' : reportExists ? 'Regenerate PDF' : 'Generate PDF'}
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail || !reportExists}
                variant="outline"
                size="sm"
                title={!reportExists ? 'Generate the PDF first' : undefined}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSendingEmail ? 'Sending…' : 'Send Email'}
              </Button>
            </>
          )}

          {isAdmin && (
            <Link href={`/app/admin/cases/${caseData.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Admin View
            </Link>
          )}
        </div>
      </div>

      {/* Score Card (if complete) */}
      {review && review.analysis_status === 'complete' && (
        <LVISScoreCard
          caseNumber={caseData.case_number}
          status={caseData.status}
          totalScore={review.total_score}
          classification={review.classification}
          confidenceLevel={review.confidence_level}
          analyzedAt={review.analyzed_at ?? null}
          categories={[
            { label: 'Provenance', score: review.provenance_score },
            { label: 'File Integrity', score: review.file_integrity_score },
            { label: 'Visual Consistency', score: review.visual_consistency_score },
            { label: 'Manipulation', score: review.manipulation_score },
            { label: 'Synthetic Risk', score: review.synthetic_risk_score },
          ]}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="analysis">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="details">Case Details</TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4 mt-4">
          {!caseFile ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-medium">No image uploaded yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload an image to begin forensic analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : caseData.status === 'analyzing' || (review?.analysis_status === 'pending' || review?.analysis_status === 'running') ? (
            <AnalysisProgress
              caseId={caseData.id}
              initialStatus={review?.analysis_status ?? 'pending'}
              onComplete={() => window.location.reload()}
            />
          ) : review?.analysis_status === 'failed' ? (
            <Card className="border-red-500/20">
              <CardContent className="py-6">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-500">Analysis Failed</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.error_message ?? 'An unexpected error occurred during analysis.'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : review?.analysis_status === 'complete' ? (
            <div className="space-y-4">
              {/* Evidence Panel — lazy loaded */}
              <EvidencePanelLazy
                technicalEvidence={review.technical_evidence as TechnicalEvidence}
                claudeFindings={review.claude_findings as ClaudeFindings}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                <p>Awaiting analysis. Upload an image to begin.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Metadata Tab */}
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
              <CardContent className="py-6 text-center text-muted-foreground">
                <p>Metadata will be available after analysis is complete.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Case Details Tab */}
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wider">Case Number</dt>
                  <dd className="mt-1 font-mono text-sm">{caseData.case_number}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wider">Status</dt>
                  <dd className="mt-1"><CaseStatusBadge status={caseData.status} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wider">Purpose</dt>
                  <dd className="mt-1 text-sm">{caseData.purpose ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wider">Priority</dt>
                  <dd className={`mt-1 text-sm font-medium ${PRIORITY_COLORS[caseData.priority]}`}>
                    {caseData.priority.charAt(0).toUpperCase() + caseData.priority.slice(1)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wider">Submitted</dt>
                  <dd className="mt-1 text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
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
              </dl>

              {caseData.description && (
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</dt>
                  <dd className="text-sm text-foreground">{caseData.description}</dd>
                </div>
              )}

              {caseData.client_notes && (
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</dt>
                  <dd className="text-sm text-foreground">{caseData.client_notes}</dd>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Lazy-loaded heavy components to avoid initial bundle size
function EvidencePanelLazy({ technicalEvidence, claudeFindings }: {
  technicalEvidence: TechnicalEvidence
  claudeFindings: ClaudeFindings
}) {
  const [EvidencePanel, setEvidencePanel] = useState<React.ComponentType<any> | null>(null)

  useState(() => {
    import('@/components/app/EvidencePanel').then((m) => setEvidencePanel(() => m.EvidencePanel))
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
  const [MetadataViewer, setMetadataViewer] = useState<React.ComponentType<any> | null>(null)

  useState(() => {
    import('@/components/app/MetadataViewer').then((m) => setMetadataViewer(() => m.MetadataViewer))
  })

  if (!MetadataViewer) return <div className="h-32 animate-pulse bg-muted rounded-lg" />
  return <MetadataViewer {...props} />
}
