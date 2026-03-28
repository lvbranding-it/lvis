'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react'
import type { TechnicalEvidence, ClaudeFindings } from '@/types'
import { indexColor } from '@/lib/scoring/index-colors'

interface EvidencePanelProps {
  technicalEvidence: TechnicalEvidence
  claudeFindings: ClaudeFindings
}

// Uses the shared brand colour system — same as PDF, scorecard, badges, charts
function scoreHexColor(score: number): string {
  return indexColor(score)
}

function ScoreIndicator({ score, label }: { score: number; label: string }) {
  const color = scoreHexColor(score)
  const isLow = score <= 40
  const isMid = score > 40 && score <= 60

  return (
    <div className="flex items-center gap-1.5">
      {isLow ? (
        <CheckCircle2 className="size-4" style={{ color }} />
      ) : isMid ? (
        <AlertCircle className="size-4" style={{ color }} />
      ) : (
        <AlertTriangle className="size-4" style={{ color }} />
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="ml-auto font-mono text-xs font-bold"
        style={{ color, transition: 'color 0.5s ease-out' }}
      >
        {Math.round(score)}
      </span>
    </div>
  )
}

function AccordionSection({
  title,
  badge,
  badgeHexColor,
  defaultOpen,
  children,
}: {
  title: string
  badge?: string
  badgeHexColor?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={
                badgeHexColor
                  ? {
                      backgroundColor: badgeHexColor + '22',
                      color: badgeHexColor,
                      border: `1px solid ${badgeHexColor}55`,
                      transition: 'color 0.5s ease-out, background-color 0.5s ease-out, border-color 0.5s ease-out',
                    }
                  : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
              }
            >
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 py-4 space-y-3">{children}</div>}
    </div>
  )
}

const CLAUDE_CATEGORY_LABELS: Record<string, string> = {
  provenance: 'Provenance Analysis',
  file_integrity: 'File Integrity',
  visual_consistency: 'Visual Consistency',
  manipulation: 'Manipulation Detection',
  synthetic_risk: 'Synthetic Risk',
}

// Accordion section badge — inline style to use brand colours consistently
function getBadge(score: number): { label: string; hexColor: string } {
  const hexColor = scoreHexColor(score)
  if (score <= 40) return { label: 'Low Risk', hexColor }
  if (score <= 60) return { label: 'Moderate', hexColor }
  return { label: 'High Risk', hexColor }
}

const EMPTY_EXIFTOOL = { provenance_score: 0, integrity_score: 0, flags: [], raw: {} }
const EMPTY_OPENCV = { ela_score: 0, clone_score: 0, noise_uniformity_score: 100, flagged_regions: [], ela_map_base64: null }
const EMPTY_PILLOW = { integrity_flags: [], integrity_score: 100 }

export function EvidencePanel({ technicalEvidence, claudeFindings }: EvidencePanelProps) {
  const exiftool = technicalEvidence?.exiftool ?? EMPTY_EXIFTOOL
  const opencv = technicalEvidence?.opencv ?? EMPTY_OPENCV
  const pillow = technicalEvidence?.pillow ?? EMPTY_PILLOW
  const hasTechnicalEvidence = !!(technicalEvidence?.exiftool || technicalEvidence?.opencv)

  // Overall ExifTool risk score
  const exiftoolMaxScore = Math.max(
    100 - (exiftool.provenance_score ?? 0),
    100 - (exiftool.integrity_score ?? 0)
  )
  const exiftoolBadge = getBadge(exiftoolMaxScore)

  // OpenCV overall score
  const opencvRiskScore = Math.max(
    opencv.ela_score ?? 0,
    opencv.clone_score ?? 0,
    100 - (opencv.noise_uniformity_score ?? 100)
  )
  const opencvBadge = getBadge(opencvRiskScore)

  // Claude overall score
  const claudeKeys = ['provenance', 'file_integrity', 'visual_consistency', 'manipulation', 'synthetic_risk'] as const
  const claudeAvg = claudeKeys.reduce((acc, k) => acc + claudeFindings[k].score, 0) / claudeKeys.length
  const claudeBadge = getBadge(claudeAvg)

  return (
    <div className="space-y-2">
      {!hasTechnicalEvidence && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Technical engine offline</span> — ExifTool and OpenCV analysis were not available for this case. Visual analysis by Claude Vision is shown below.
        </div>
      )}

      {/* ExifTool Section */}
      <AccordionSection
        title="EXIF Analysis"
        badge={hasTechnicalEvidence ? exiftoolBadge.label : 'Unavailable'}
        badgeHexColor={hasTechnicalEvidence ? exiftoolBadge.hexColor : undefined}
        defaultOpen={hasTechnicalEvidence}
      >
        {!hasTechnicalEvidence ? (
          <p className="text-xs text-muted-foreground">Technical engine was offline during this analysis. No ExifTool data available.</p>
        ) : (exiftool.flags ?? []).length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Flags Detected
            </p>
            <div className="flex flex-wrap gap-1.5">
              {exiftool.flags.map((flag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  <AlertTriangle className="size-3" />
                  {flag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-green-500" />
            No suspicious flags detected
          </div>
        )}

        {/* Scores */}
        {hasTechnicalEvidence && (
          <div className="space-y-2 pt-1">
            <ScoreIndicator score={100 - (exiftool.provenance_score ?? 0)} label="Provenance Risk Score" />
            <ScoreIndicator score={100 - (exiftool.integrity_score ?? 0)} label="Integrity Risk Score" />
          </div>
        )}

        {/* Pillow flags */}
        {hasTechnicalEvidence && (pillow.integrity_flags ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              File Structure Issues (Pillow)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pillow.integrity_flags.map((flag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                >
                  <AlertCircle className="size-3" />
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}
      </AccordionSection>

      {/* OpenCV Section */}
      <AccordionSection
        title="ELA Analysis"
        badge={hasTechnicalEvidence ? opencvBadge.label : 'Unavailable'}
        badgeHexColor={hasTechnicalEvidence ? opencvBadge.hexColor : undefined}
        defaultOpen={hasTechnicalEvidence}
      >
        {!hasTechnicalEvidence ? (
          <p className="text-xs text-muted-foreground">Technical engine was offline during this analysis. No OpenCV data available.</p>
        ) : (
          <div className="space-y-2">
            <ScoreIndicator score={opencv.ela_score ?? 0} label="ELA Risk Score" />
            <ScoreIndicator score={100 - (opencv.noise_uniformity_score ?? 100)} label="Noise Inconsistency" />
            <ScoreIndicator score={opencv.clone_score ?? 0} label="Clone Detection Score" />
          </div>
        )}

        {/* Flagged regions */}
        {hasTechnicalEvidence && (opencv.flagged_regions ?? []).length > 0 && (
          <div className="rounded-lg bg-muted/30 px-3 py-2.5">
            <p className="text-xs font-medium text-foreground">
              {opencv.flagged_regions.length} Flagged Region{opencv.flagged_regions.length !== 1 ? 's' : ''} Detected
            </p>
            <div className="mt-2 space-y-1">
              {opencv.flagged_regions.slice(0, 5).map((region, i) => (
                <p key={i} className="font-mono text-[10px] text-muted-foreground">
                  Region {i + 1}: [{region.x}, {region.y}] {region.w}×{region.h}px — {region.type}
                </p>
              ))}
              {opencv.flagged_regions.length > 5 && (
                <p className="text-[10px] text-muted-foreground">
                  +{opencv.flagged_regions.length - 5} more regions…
                </p>
              )}
            </div>
          </div>
        )}

        {/* ELA map */}
        {opencv.ela_map_base64 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Error Level Analysis Map
            </p>
            <div className="overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/jpeg;base64,${opencv.ela_map_base64}`}
                alt="Error Level Analysis map"
                className="w-full"
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Error Level Analysis map — brighter regions indicate areas with higher compression
              inconsistency, suggesting post-processing or compositing at those locations.
            </p>
          </div>
        )}
      </AccordionSection>

      {/* Claude Vision Section */}
      <AccordionSection
        title="Vision Analysis"
        badge={claudeBadge.label}
        badgeHexColor={claudeBadge.hexColor}
        defaultOpen
      >
        {/* Overall observations */}
        {claudeFindings.overall_observations && (
          <div className="rounded-lg bg-muted/30 px-3 py-2.5">
            <p className="text-xs text-foreground leading-relaxed">
              {claudeFindings.overall_observations}
            </p>
          </div>
        )}

        {/* Per-category */}
        {claudeKeys.map((key) => {
          const cat = claudeFindings[key]
          const catBadge = getBadge(cat.score)
          return (
            <div key={key} className="border-t pt-3 first:border-t-0 first:pt-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                  {CLAUDE_CATEGORY_LABELS[key]}
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: catBadge.hexColor + '22',
                      color: catBadge.hexColor,
                      border: `1px solid ${catBadge.hexColor}55`,
                      transition: 'color 0.5s ease-out, background-color 0.5s ease-out',
                    }}
                  >
                    {catBadge.label}
                  </span>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: catBadge.hexColor, transition: 'color 0.5s ease-out' }}
                  >
                    {cat.score}
                  </span>
                </div>
              </div>

              {cat.narrative && (
                <p className="text-xs text-muted-foreground leading-relaxed">{cat.narrative}</p>
              )}

              {cat.findings.length > 0 && (
                <ul className="space-y-1">
                  {cat.findings.map((finding, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                      <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground" />
                      {finding}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}

        {/* Recommended actions */}
        {claudeFindings.recommended_actions.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended Actions
            </p>
            <ul className="space-y-1.5">
              {claudeFindings.recommended_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </AccordionSection>
    </div>
  )
}
