import { CATEGORY_WEIGHTS, SCORE_BANDS } from '@/lib/constants'
import type { CategoryScores, LVIndexResult, ConfidenceLevel } from '@/types'

export function getClassification(score: number): string {
  const band = SCORE_BANDS.find(b => score >= b.min && score <= b.max)
  return band?.label ?? 'Unknown'
}

export function getScoreBand(score: number) {
  return SCORE_BANDS.find(b => score >= b.min && score <= b.max) ?? SCORE_BANDS[0]
}

export function getScoreBandColor(score: number): string {
  const band = getScoreBand(score)
  // band is referenced to satisfy lint; actual color is derived from score thresholds
  void band
  if (score <= 20) return 'var(--color-score-authentic)'
  if (score <= 40) return 'var(--color-score-edited)'
  if (score <= 60) return 'var(--color-score-retouched)'
  if (score <= 80) return 'var(--color-score-manipulated)'
  return 'var(--color-score-synthetic)'
}

export function getScoreColorClass(score: number): string {
  if (score <= 20) return 'text-green-600 dark:text-green-400'
  if (score <= 40) return 'text-lime-600 dark:text-lime-400'
  if (score <= 60) return 'text-amber-600 dark:text-amber-400'
  if (score <= 80) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function deriveConfidence(scores: CategoryScores): ConfidenceLevel {
  const values = Object.values(scores)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length
  // Low variance = consistent signals = higher confidence
  if (variance < 100) return 'high'
  if (variance < 400) return 'medium'
  return 'low'
}

export function calculateLVIndex(
  claudeScores: CategoryScores,
  technicalFloors?: Partial<CategoryScores>
): LVIndexResult {
  // Technical evidence provides objective floor — AI cannot score lower than objective evidence
  const finalScores: CategoryScores = {
    provenance: Math.max(claudeScores.provenance, technicalFloors?.provenance ?? 0),
    file_integrity: Math.max(claudeScores.file_integrity, technicalFloors?.file_integrity ?? 0),
    visual_consistency: Math.max(claudeScores.visual_consistency, technicalFloors?.visual_consistency ?? 0),
    manipulation: Math.max(claudeScores.manipulation, technicalFloors?.manipulation ?? 0),
    synthetic_risk: Math.max(claudeScores.synthetic_risk, technicalFloors?.synthetic_risk ?? 0),
  }

  const total =
    finalScores.provenance * CATEGORY_WEIGHTS.provenance +
    finalScores.file_integrity * CATEGORY_WEIGHTS.file_integrity +
    finalScores.visual_consistency * CATEGORY_WEIGHTS.visual_consistency +
    finalScores.manipulation * CATEGORY_WEIGHTS.manipulation +
    finalScores.synthetic_risk * CATEGORY_WEIGHTS.synthetic_risk

  const rounded = Math.round(total * 100) / 100

  return {
    total_score: rounded,
    classification: getClassification(rounded),
    confidence_level: deriveConfidence(finalScores),
    weighted_breakdown: {
      provenance: Math.round(finalScores.provenance * CATEGORY_WEIGHTS.provenance * 100) / 100,
      file_integrity: Math.round(finalScores.file_integrity * CATEGORY_WEIGHTS.file_integrity * 100) / 100,
      visual_consistency: Math.round(finalScores.visual_consistency * CATEGORY_WEIGHTS.visual_consistency * 100) / 100,
      manipulation: Math.round(finalScores.manipulation * CATEGORY_WEIGHTS.manipulation * 100) / 100,
      synthetic_risk: Math.round(finalScores.synthetic_risk * CATEGORY_WEIGHTS.synthetic_risk * 100) / 100,
    },
  }
}
