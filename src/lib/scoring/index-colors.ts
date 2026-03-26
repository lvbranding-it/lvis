/**
 * LVIS™ LV Authenticity Index™ — Color System
 *
 * Single source of truth for score-band colors.
 * Used consistently across: PDF reports, web dashboard, certificates, badges, charts.
 *
 * Score bands:
 *   0–20   Authentic Capture                                  #1F7A5A (dark teal)
 *   21–40  Authentic Photograph with Professional Editing     #4CAF50 (green)
 *   41–60  Significant Retouching                             #F4B400 (amber)
 *   61–80  High Manipulation Likelihood                       #FB8C00 (orange)
 *   81–100 Synthetic or AI-Generated Risk                     #D32F2F (red)
 */

export interface IndexColorResult {
  /** Hex color for this score band */
  color: string
  /** Human-readable classification label */
  classification: string
  /** Score range string, e.g. "61-80" */
  range: string
  /** The original score passed in */
  score: number
}

const BANDS: Array<{
  max: number
  color: string
  classification: string
  range: string
}> = [
  {
    max: 20,
    color: '#1F7A5A',
    classification: 'Authentic Capture',
    range: '0-20',
  },
  {
    max: 40,
    color: '#4CAF50',
    classification: 'Authentic Photograph with Professional Editing',
    range: '21-40',
  },
  {
    max: 60,
    color: '#F4B400',
    classification: 'Significant Retouching',
    range: '41-60',
  },
  {
    max: 80,
    color: '#FB8C00',
    classification: 'High Manipulation Likelihood',
    range: '61-80',
  },
  {
    max: 100,
    color: '#D32F2F',
    classification: 'Synthetic or AI-Generated Risk',
    range: '81-100',
  },
]

/**
 * Returns the color, classification label, and range for a given LVIS score.
 *
 * @example
 * getIndexColor(72)
 * // → { score: 72, color: "#FB8C00", classification: "High Manipulation Likelihood", range: "61-80" }
 */
export function getIndexColor(score: number): IndexColorResult {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const band = BANDS.find((b) => clamped <= b.max) ?? BANDS[BANDS.length - 1]
  return {
    score: clamped,
    color: band.color,
    classification: band.classification,
    range: band.range,
  }
}

/**
 * Convenience helper — returns only the hex color string.
 * Useful when you only need the color without the full result object.
 *
 * @example
 * indexColor(72) // → "#FB8C00"
 */
export function indexColor(score: number): string {
  return getIndexColor(score).color
}

/** All band definitions, ordered from lowest to highest risk. Useful for legends and charts. */
export const INDEX_BANDS = BANDS
