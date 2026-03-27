// Server-only — do NOT add 'use client'. This file is used exclusively for PDF rendering via @react-pdf/renderer.
import {
  Document, Page, View, Text, StyleSheet, Image,
  Svg, Path, Polygon, Rect,
} from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'
import { indexColor, getIndexColor } from '@/lib/scoring/index-colors'

export interface LVISReportDocumentProps {
  caseNumber: string
  caseTitle: string
  clientName: string
  purpose: string | null
  analyzedAt: string
  totalScore: number
  classification: string
  confidenceLevel: string
  categoryScores: {
    provenance: number
    file_integrity: number
    visual_consistency: number
    manipulation: number
    synthetic_risk: number
  }
  claudeFindings: {
    provenance: { score: number; narrative: string; findings: string[] }
    file_integrity: { score: number; narrative: string; findings: string[] }
    visual_consistency: { score: number; narrative: string; findings: string[] }
    manipulation: { score: number; narrative: string; findings: string[] }
    synthetic_risk: { score: number; narrative: string; findings: string[] }
    overall_observations: string
    recommended_actions: string[]
  }
  exiftoolFlags: string[]
  opencvSummary: {
    ela_score: number
    clone_score: number
    noise_uniformity_score: number
    flagged_regions_count: number
  }
  disclaimer: string
  /** Pre-generated QR code PNG data URL linking to /verify/[caseId] */
  qrDataUrl?: string
  /** Chain-of-custody metadata captured at analysis time */
  analysisContext?: {
    ip?: string | null
    city?: string | null
    country?: string | null
    timezone?: string | null
  }
  /** Base64 data URL of the specimen image (jpeg, resized for PDF) */
  specimenImageBase64?: string | null
  /** Base64 data URL of the ELA (Error Level Analysis) heat map */
  elaMapBase64?: string | null
  /** Raw ExifTool metadata object for the Image Evidence page */
  exifDetails?: Record<string, unknown> | null
  /** Optional expert note from admin — rendered as a highlighted callout on the summary page */
  adminNote?: string | null
}

// ─── Colour helpers ──────────────────────────────────────────────────────────
// All score colours flow through getIndexColor() — single source of truth shared
// with the web dashboard, certificates, badges, and charts.

function scoreColor(score: number): string {
  return indexColor(score)
}

const DARK_BG = '#0F172A'
const LIGHT_TEXT = '#F8FAFC'
const DARK_TEXT = '#1E293B'
const MUTED = '#94A3B8'
const BORDER = '#E2E8F0'
const PANEL_BG = '#F8FAFC'

// ─── Brand SVG Components ─────────────────────────────────────────────────────

// LVIS LOGO SIMPLE — L V I S ™  (viewBox: 0 0 133.36 51.54)
// Use color="#FFFFFF" for dark backgrounds, color="#272525" for light
function LVISLogoMark({ color = '#272525', width = 100 }: { color?: string; width?: number }) {
  const h = (width * 51.54) / 133.36
  return (
    <Svg viewBox="0 0 133.36 51.54" style={{ width, height: h }}>
      {/* L */}
      <Polygon fill={color} points="9.46 1.28 0 1.28 0 49.32 32.05 49.32 32.05 40.18 9.46 40.18 9.46 1.28" />
      {/* V */}
      <Polygon fill={color} points="46.23 28.36 35.25 1.28 23.89 1.28 45.82 51.54 67.75 1.28 56.52 1.28 46.23 28.36" />
      {/* I */}
      <Rect fill={color} x="71.99" y="1.28" width="9.46" height="48.04" />
      {/* S */}
      <Path fill={color} d="M99.73,10.68c1.17-.83,2.78-1.24,4.83-1.24,1.65,0,3.43.33,5.32.98,1.89.65,3.75,1.48,5.58,2.48l3.59-7.25c-1.92-1.26-4.08-2.35-6.49-3.26-2.42-.91-5.56-1.37-9.43-1.37-2.96.13-5.57.79-7.83,1.99-2.26,1.2-4.01,2.82-5.25,4.86-1.24,2.05-1.86,4.46-1.86,7.25,0,2.31.42,4.25,1.27,5.84.85,1.59,1.96,2.92,3.33,3.98,1.37,1.07,2.84,1.97,4.41,2.71,1.57.74,3.09,1.39,4.57,1.96,1.26.48,2.43,1.04,3.49,1.7,1.07.65,1.91,1.37,2.55,2.15.63.78.95,1.65.95,2.61,0,1.39-.38,2.48-1.14,3.26-.76.78-1.72,1.34-2.87,1.66-1.15.33-2.3.49-3.43.49s-2.37-.17-3.72-.52c-1.35-.35-2.69-.84-4.01-1.47-1.33-.63-2.56-1.36-3.69-2.19l-4.18,7.38c1.7,1.17,3.46,2.14,5.29,2.9,1.83.76,3.69,1.33,5.58,1.7s3.75.55,5.58.55c3.57,0,6.57-.64,9.01-1.93,2.44-1.28,4.29-2.97,5.55-5.06,1.26-2.09,1.89-4.35,1.89-6.79,0-2.31-.33-4.25-.98-5.84-.65-1.59-1.52-2.92-2.61-3.98-1.09-1.07-2.32-1.96-3.69-2.68-1.37-.72-2.75-1.34-4.14-1.86-1.52-.56-2.99-1.2-4.41-1.89-1.41-.7-2.57-1.49-3.46-2.38-.89-.89-1.34-1.9-1.34-3.04,0-1.65.59-2.89,1.76-3.72Z" />
      {/* TM — T */}
      <Polygon fill={color} points="122.64 .67 124.59 .67 124.59 6.09 125.32 6.09 125.32 .67 127.26 .67 127.26 0 122.64 0 122.64 .67" />
      {/* TM — M */}
      <Polygon fill={color} points="132.6 0 130.5 3.12 128.39 0 127.62 0 127.62 6.09 128.36 6.09 128.36 1.2 130.5 4.36 132.63 1.18 132.63 6.09 133.36 6.09 133.36 0 132.6 0" />
    </Svg>
  )
}

// "The LV Authenticity INDEX™" wordmark — 23 paths, all fill:#272525
// Use color="#FFFFFF" for dark backgrounds
// viewBox: 0 0 114.06 10.1
function AuthenticityIndexWordmark({ color = '#272525', width = 160 }: { color?: string; width?: number }) {
  const h = (width * 10.1) / 114.06
  return (
    <Svg viewBox="0 0 114.06 10.1" style={{ width, height: h }}>
      <Path fill={color} d="M2.38,7.84V1.2H0V.38h5.65v.82h-2.38v6.64h-.89Z" />
      <Path fill={color} d="M5.85,7.84V.38h.85v2.91c.18-.29.41-.51.69-.67.28-.16.61-.23.99-.23.41,0,.77.08,1.09.25s.56.43.73.79c.17.36.26.84.25,1.43v2.98h-.85v-2.73c0-.53-.06-.93-.19-1.2s-.29-.47-.51-.57c-.21-.1-.46-.15-.72-.15-.47,0-.83.17-1.09.5-.26.33-.39.8-.39,1.4v2.76h-.85Z" />
      <Path fill={color} d="M13.47,7.97c-.52,0-.98-.12-1.38-.36-.4-.24-.71-.57-.93-.99s-.34-.9-.34-1.45.11-1.03.34-1.45c.22-.42.53-.75.93-.99.39-.24.85-.36,1.36-.36s.93.12,1.29.37.64.59.84,1.03c.2.44.3.96.3,1.56h-4.19c.04.58.22,1.04.55,1.36.33.33.76.49,1.27.49.38,0,.69-.09.95-.27s.46-.41.6-.7l.73.37c-.13.28-.31.52-.54.72-.22.21-.49.37-.79.48-.3.11-.64.17-1.01.17ZM11.75,4.62h3.21c-.02-.31-.1-.57-.24-.79-.14-.22-.32-.39-.54-.51-.22-.12-.47-.18-.75-.18s-.53.06-.78.18c-.25.12-.46.29-.62.51s-.26.49-.29.79Z" />
      <Path fill={color} d="M18.53,0h1.54v6.35h3.69v1.49h-5.23V0Z" />
      <Path fill={color} d="M25.3,0l2.29,5.65-.89-.18,2.08-5.47h1.83l-3.58,8.2L23.45,0h1.85Z" />
      <Path fill={color} d="M31.78,7.84l3.04-7.46h.94l3.04,7.46h-.95l-.86-2.12h-3.38l-.86,2.12h-.96ZM33.91,4.91h2.75l-1.37-3.4-1.38,3.4Z" />
      <Path fill={color} d="M40.91,7.97c-.41,0-.77-.08-1.08-.25-.31-.17-.55-.43-.72-.8-.17-.37-.26-.84-.26-1.42v-2.98h.85v2.73c0,.53.06.93.18,1.2.12.28.29.47.51.57.22.1.46.16.73.16.46,0,.82-.17,1.08-.5s.39-.8.39-1.4v-2.76h.85v5.33h-.8l-.04-.8c-.18.3-.41.53-.69.69-.28.16-.61.24-.99.24Z" />
      <Path fill={color} d="M46.27,7.97c-.52,0-.92-.13-1.2-.41-.28-.27-.43-.65-.43-1.14v-3.15h-.93v-.76h.93V.85h.85v1.66h1.6v.76h-1.6v3.07c0,.27.07.48.22.62s.35.22.61.22c.08,0,.17-.01.25-.04.08-.02.19-.09.33-.19l.33.69c-.18.12-.35.2-.5.25-.15.05-.3.07-.46.07Z" />
      <Path fill={color} d="M47.64,7.84V.38h.85v2.91c.18-.29.41-.51.69-.67s.61-.23.99-.23c.41,0,.77.08,1.09.25.31.17.56.43.73.79s.26.84.25,1.43v2.98h-.85v-2.73c0-.53-.06-.93-.19-1.2-.12-.28-.29-.47-.51-.57-.21-.1-.45-.15-.72-.15-.47,0-.83.17-1.09.5-.26.33-.39.8-.39,1.4v2.76h-.85Z" />
      <Path fill={color} d="M55.26,7.97c-.52,0-.98-.12-1.38-.36-.4-.24-.71-.57-.93-.99s-.34-.9-.34-1.45.11-1.03.34-1.45c.22-.42.53-.75.93-.99.39-.24.85-.36,1.36-.36s.93.12,1.29.37.64.59.84,1.03c.2.44.3.96.3,1.56h-4.19c.04.58.22,1.04.55,1.36.33.33.76.49,1.27.49.38,0,.69-.09.95-.27s.46-.41.6-.7l.73.37c-.13.28-.31.52-.54.72-.22.21-.49.37-.79.48-.3.11-.64.17-1.01.17ZM53.54,4.62h3.21c-.02-.31-.1-.57-.24-.79-.14-.22-.32-.39-.54-.51-.22-.12-.47-.18-.75-.18s-.53.06-.78.18c-.25.12-.46.29-.62.51s-.26.49-.29.79Z" />
      <Path fill={color} d="M58.08,7.84V2.51h.8l.04.8c.18-.3.41-.53.69-.69.28-.16.61-.24.99-.24.42,0,.78.08,1.09.25.31.17.55.43.72.79s.26.84.25,1.43v2.98h-.85v-2.73c0-.53-.06-.93-.18-1.2s-.29-.47-.5-.57c-.21-.1-.45-.15-.72-.15-.47,0-.83.17-1.09.5-.26.33-.39.8-.39,1.4v2.76h-.85Z" />
      <Path fill={color} d="M65.37,7.97c-.52,0-.92-.13-1.2-.41-.28-.27-.43-.65-.43-1.14v-3.15h-.93v-.76h.93V.85h.85v1.66h1.6v.76h-1.6v3.07c0,.27.07.48.22.62s.35.22.61.22c.08,0,.17-.01.25-.04.08-.02.19-.09.33-.19l.33.69c-.18.12-.35.2-.5.25-.15.05-.3.07-.46.07Z" />
      <Path fill={color} d="M67.22,1.28c-.14,0-.27-.05-.37-.16-.11-.11-.16-.23-.16-.37s.05-.27.16-.38c.11-.1.23-.15.37-.15.15,0,.28.05.38.15.1.1.15.23.15.38s-.05.27-.15.37c-.1.11-.23.16-.38.16ZM66.78,7.84V2.51h.85v5.33h-.85Z" />
      <Path fill={color} d="M70.92,7.97c-.53,0-.99-.12-1.4-.36-.4-.24-.72-.57-.95-.99s-.34-.9-.34-1.45.11-1.03.34-1.45c.22-.42.54-.75.94-.99.41-.24.87-.36,1.39-.36s.97.12,1.37.35c.41.23.71.56.93.99l-.78.35c-.14-.28-.35-.51-.62-.67-.27-.16-.58-.24-.93-.24s-.66.08-.92.26-.48.41-.63.71c-.15.3-.23.65-.23,1.04s.08.74.23,1.04c.15.3.37.54.64.71.27.17.58.26.93.26s.66-.09.93-.27.48-.43.62-.75l.78.35c-.21.46-.52.81-.93,1.07s-.87.38-1.38.38Z" />
      <Path fill={color} d="M74.14,1.28c-.14,0-.27-.05-.37-.16-.11-.11-.16-.23-.16-.37s.05-.27.16-.38c.11-.1.23-.15.37-.15.15,0,.28.05.38.15.1.1.15.23.15.38s-.05.27-.15.37c-.1.11-.23.16-.38.16ZM73.7,7.84V2.51h.85v5.33h-.85Z" />
      <Path fill={color} d="M77.46,7.97c-.52,0-.92-.13-1.2-.41-.28-.27-.43-.65-.43-1.14v-3.15h-.93v-.76h.93V.85h.85v1.66h1.6v.76h-1.6v3.07c0,.27.07.48.22.62s.35.22.61.22c.08,0,.17-.01.25-.04.08-.02.19-.09.33-.19l.33.69c-.18.12-.35.2-.5.25-.15.05-.3.07-.46.07Z" />
      <Path fill={color} d="M79.3,10.1c-.13,0-.29-.03-.47-.08-.18-.05-.37-.12-.56-.21l.32-.71c.16.07.31.12.43.16s.22.05.29.05c.19,0,.35-.05.47-.16.12-.1.23-.25.31-.44l.36-.9-2.29-5.31h.91l1.81,4.31,1.79-4.31h.92l-2.56,6.07c-.13.31-.28.58-.42.81s-.32.4-.53.52c-.21.12-.47.18-.79.18Z" />
      <Path fill={color} d="M85.98,7.84V.38h.91v7.46h-.91Z" />
      <Path fill={color} d="M87.97,7.84V2.51h.8l.04.8c.18-.3.41-.53.69-.69.28-.16.61-.24.99-.24.42,0,.78.08,1.09.25.31.17.55.43.72.79s.26.84.25,1.43v2.98h-.85v-2.73c0-.53-.06-.93-.18-1.2s-.29-.47-.5-.57c-.21-.1-.45-.15-.72-.15-.47,0-.83.17-1.09.5-.26.33-.39.8-.39,1.4v2.76h-.85Z" />
      <Path fill={color} d="M95.35,7.97c-.48,0-.9-.12-1.26-.35s-.64-.56-.85-.99c-.2-.42-.3-.91-.3-1.46s.1-1.04.3-1.46c.2-.42.48-.75.85-.98s.78-.35,1.26-.35c.39,0,.74.09,1.05.27.31.18.56.43.75.75V.38h.85v7.46h-.81l-.04-.91c-.19.32-.44.57-.75.76-.31.18-.66.28-1.05.28ZM95.54,7.19c.31,0,.59-.08.83-.25s.43-.4.56-.7.21-.64.22-1.02v-.07c0-.38-.08-.73-.22-1.03s-.33-.54-.57-.7c-.24-.17-.52-.25-.83-.25-.33,0-.63.08-.89.26s-.47.41-.61.71c-.15.31-.22.65-.22,1.04s.07.74.22,1.04c.15.3.36.54.62.71.26.17.56.25.89.25Z" />
      <Path fill={color} d="M101.17,7.97c-.52,0-.98-.12-1.37-.36-.4-.24-.71-.57-.93-.99s-.33-.9-.33-1.45.11-1.03.33-1.45c.22-.42.53-.75.93-.99.39-.24.85-.36,1.36-.36s.93.12,1.29.37.64.59.84,1.03c.2.44.3.96.3,1.56h-4.19c.04.58.22,1.04.55,1.36.33.33.76.49,1.27.49.38,0,.69-.09.95-.27.26-.18.46-.41.6-.7l.74.37c-.13.28-.31.52-.54.72s-.49.37-.79.48c-.3.11-.64.17-1.01.17ZM99.45,4.62h3.21c-.02-.31-.1-.57-.24-.79-.14-.22-.32-.39-.54-.51-.22-.12-.47-.18-.75-.18s-.53.06-.78.18c-.25.12-.45.29-.62.51-.16.22-.26.49-.29.79Z" />
      <Path fill={color} d="M103.3,7.84l1.97-2.76-1.83-2.57h1.01l1.29,1.88,1.27-1.88h1.01l-1.8,2.58,1.93,2.75h-1.02l-1.38-2.07-1.41,2.07h-1.03Z" />
      <Path fill={color} d="M108.68,5.6v-2.83h-1.02v-.53h2.63v.53h-1.03v2.83h-.58ZM112.4,4.75l-1.08-1.58v2.42h-.58v-3.36h.63l1.03,1.53,1.03-1.53h.62v3.36h-.58v-2.44l-1.08,1.59Z" />
    </Svg>
  )
}

// QUALITY SEAL — dark body with white globe/LVIS details
// Works on light backgrounds. Dark oval with globe inside + LVIS text
// viewBox: 0 0 71.45 53.87
function QualitySealMark({ width = 60 }: { width?: number }) {
  const h = (width * 53.87) / 71.45
  return (
    <Svg viewBox="0 0 71.45 53.87" style={{ width, height: h }}>
      {/* Outer dark seal body */}
      <Path fill="#272525" d="M70.82,25.06c-5.35-8.53-11.33-14.93-17.8-19.06-.96-2.15-3.13-3.66-5.64-3.66-.46,0-.92.05-1.37.16-3.39-1.24-6.84-1.86-10.29-1.86-1.86,0-3.75.19-5.63.56-1.17-.76-2.55-1.19-3.98-1.19-3.45,0-6.35,2.41-7.11,5.63C12.33,9.73,6.15,16.25.63,25.06c-.84,1.34-.84,3.05,0,4.39,1.93,3.08,3.98,5.93,6.11,8.49-.02.78.12,1.58.43,2.33.88,2.15,2.93,3.56,5.24,3.61,7.3,6.64,15.14,10,23.32,10,2.72,0,5.45-.39,8.13-1.16.84.37,1.76.57,2.71.57,3.03,0,5.59-2.01,6.43-4.76,6.47-4.12,12.46-10.53,17.82-19.08.84-1.34.84-3.05,0-4.39Z" />
      {/* Globe / eye detail paths (white) */}
      <Path fill="#ffffff" d="M64.3,27.73c.21,0,.38-.17.38-.38s-.17-.38-.38-.38h-12.63c-.04-1.22-.22-2.4-.51-3.53-.29.16-.6.29-.94.35.3,1.18.47,2.4.47,3.67,0,2.34-.56,4.55-1.52,6.52.32.12.61.3.85.54,1.02-2.06,1.61-4.37,1.65-6.81h12.62Z" />
      <Path fill="#ffffff" d="M35.89,49.77c-7.65,0-15.08-3.51-21.94-10.23-.13.32-.32.61-.57.85,7.02,6.82,14.64,10.38,22.52,10.38,2.83,0,5.62-.47,8.36-1.37-.18-.28-.31-.59-.41-.92-2.62.85-5.27,1.29-7.96,1.29Z" />
      <Path fill="#ffffff" d="M35.89,4.94c3.22,0,6.4.62,9.52,1.84.11-.32.27-.62.48-.88-3.27-1.29-6.61-1.97-10-1.97-2.05,0-4.09.26-6.1.73.13.3.23.62.29.95,1.92-.45,3.86-.68,5.81-.68Z" />
      <Path fill="#ffffff" d="M68.52,27.09c-5.4-8.6-11.37-14.89-17.69-18.73-.08.34-.23.66-.42.94,5.14,3.15,10.07,7.98,14.63,14.41-8.68-8.31-18.63-12.68-29-12.68-5.39,0-10.66,1.18-15.7,3.48.19.28.33.59.43.92,3.07-1.4,6.23-2.37,9.44-2.91-5.93,2.2-10.22,7.82-10.42,14.47H7.08c-.21,0-.38.17-.38.38s.17.38.38.38h12.69c.02,1.07.15,2.11.37,3.12.21-.11.43-.19.68-.24.09-.02.18-.02.27-.02-.21-1.01-.33-2.05-.33-3.11,0-8.25,6.71-14.96,14.96-14.96,4.89,0,9.23,2.37,11.96,6.01.25-.22.54-.4.85-.52-1.92-2.59-4.61-4.58-7.72-5.64,9.52,1.29,18.57,6.41,26.42,15.02-7.6,8.34-16.32,13.41-25.52,14.89,2.06-.84,3.9-2.1,5.43-3.67-.3-.15-.56-.36-.78-.61-2.71,2.75-6.48,4.46-10.64,4.46-5.45,0-10.22-2.94-12.83-7.31-.26.21-.56.37-.89.46,1.7,2.86,4.26,5.14,7.32,6.49-8.82-1.68-17.18-6.68-24.49-14.71,3.2-3.51,6.6-6.44,10.15-8.77-.22-.25-.4-.53-.54-.84-2.91,1.91-5.73,4.22-8.41,6.91,5.01-7.29,10.46-12.63,16.17-15.91-.18-.27-.32-.57-.43-.89-6.63,3.78-12.89,10.23-18.52,19.2l-.17.27.17.27c2.14,3.42,4.38,6.45,6.69,9.13.25-.23.55-.4.88-.51-1.59-1.84-3.16-3.85-4.68-6.04,8.89,8.86,19.16,13.54,29.88,13.54s20.23-4.33,28.89-12.57c-4.6,6.44-9.55,11.25-14.73,14.37.19.28.32.6.42.94,6.4-3.82,12.45-10.16,17.91-18.85l.17-.27-.17-.27Z" />
      {/* Decorative circles */}
      <Path fill="#ffffff" d="M25.83,9.74c1.84,0,3.33-1.49,3.33-3.33s-1.49-3.33-3.33-3.33-3.33,1.49-3.33,3.33,1.49,3.33,3.33,3.33ZM25.27,3.87c.48,0,.86.39.86.86s-.39.86-.86.86-.86-.39-.86-.86.39-.86.86-.86Z" />
      <Path fill="#ffffff" d="M48.08,9.82c1.18,0,2.14-.96,2.14-2.14s-.96-2.14-2.14-2.14-2.14.96-2.14,2.14.96,2.14,2.14,2.14ZM47.72,6.05c.31,0,.55.25.55.55s-.25.55-.55.55-.55-.25-.55-.55.25-.55.55-.55Z" />
      <Path fill="#ffffff" d="M15.07,16.42c0,1.37,1.11,2.48,2.48,2.48s2.48-1.11,2.48-2.48-1.11-2.48-2.48-2.48-2.48,1.11-2.48,2.48ZM17.77,15.16c0,.35-.29.64-.64.64s-.64-.29-.64-.64.29-.64.64-.64.64.29.64.64Z" />
      <Path fill="#ffffff" d="M49.76,18.42c-1.33-.06-2.45.97-2.51,2.3-.06,1.33.97,2.45,2.3,2.51,1.33.06,2.45-.97,2.51-2.3.06-1.33-.97-2.45-2.3-2.51ZM49.27,20.21c-.34-.01-.61-.31-.59-.65s.31-.61.65-.59.61.31.59.65-.31.61-.65.59Z" />
      {/* Inner circle rings */}
      <Path fill="#ffffff" d="M35.73,14.92c-6.92,0-12.56,5.63-12.56,12.56s5.63,12.56,12.56,12.56,12.56-5.63,12.56-12.56-5.63-12.56-12.56-12.56ZM35.73,39.63c-6.7,0-12.16-5.45-12.16-12.16s5.45-12.16,12.16-12.16,12.16,5.45,12.16,12.16-5.45,12.16-12.16,12.16Z" />
      {/* Side dots */}
      <Path fill="#ffffff" d="M22.85,33.93c.44-.86.09-1.92-.77-2.36-.86-.44-1.92-.09-2.36.77-.44.86-.09,1.92.77,2.36.86.44,1.92.09,2.36-.77ZM20.16,33.41c-.22-.11-.31-.39-.2-.61s.39-.31.61-.2c.22.11.31.39.2.61-.11.22-.39.31-.61.2Z" />
      <Path fill="#ffffff" d="M48.02,34.61c-.96.15-1.63,1.05-1.48,2.01s1.05,1.63,2.01,1.48c.96-.15,1.63-1.05,1.48-2.01-.15-.96-1.05-1.63-2.01-1.48ZM47.92,35.97c-.25.04-.48-.13-.52-.38-.04-.25.13-.48.38-.52.25-.04.48.13.52.38.04.25-.13.48-.38.52Z" />
      <Path fill="#ffffff" d="M47.23,44.77c-1.5,0-2.72,1.22-2.72,2.72s1.22,2.72,2.72,2.72,2.72-1.22,2.72-2.72-1.22-2.72-2.72-2.72ZM46.77,46.82c-.39,0-.7-.32-.7-.7s.31-.7.7-.7.7.32.7.7-.31.7-.7.7Z" />
      <Path fill="#ffffff" d="M13.25,37.94c-.37-.9-1.39-1.33-2.28-.96-.9.37-1.33,1.39-.96,2.28.37.9,1.39,1.33,2.28.96.9-.37,1.33-1.39.96-2.28ZM10.98,39.36c-.23.09-.5-.02-.59-.25-.09-.23.02-.5.25-.59.23-.09.5.02.59.25s-.02.5-.25.59Z" />
      {/* LVIS text inside circle */}
      <Polygon fill="#ffffff" points="26.96 23.64 25.48 23.64 25.48 31.17 30.51 31.17 30.51 29.74 26.96 29.74 26.96 23.64" />
      <Polygon fill="#ffffff" points="32.73 27.88 31.01 23.64 29.23 23.64 32.67 31.52 36.11 23.64 34.35 23.64 32.73 27.88" />
      <Rect fill="#ffffff" x="36.77" y="23.64" width="1.48" height="7.53" />
      <Path fill="#ffffff" d="M41.88,24.92c.26,0,.54.05.83.15.3.1.59.23.88.39l.56-1.14c-.3-.2-.64-.37-1.02-.51-.38-.14-.87-.21-1.48-.21-.46.02-.87.12-1.23.31-.36.19-.63.44-.82.76-.19.32-.29.7-.29,1.14,0,.36.07.67.2.92.13.25.31.46.52.62.21.17.45.31.69.42.25.12.48.22.72.31.2.08.38.16.55.27.17.1.3.21.4.34.1.12.15.26.15.41,0,.22-.06.39-.18.51-.12.12-.27.21-.45.26-.18.05-.36.08-.54.08s-.37-.03-.58-.08c-.21-.05-.42-.13-.63-.23-.21-.1-.4-.21-.58-.34l-.66,1.16c.27.18.54.34.83.46.29.12.58.21.88.27.3.06.59.09.88.09.56,0,1.03-.1,1.41-.3.38-.2.67-.47.87-.79.2-.33.3-.68.3-1.06,0-.36-.05-.67-.15-.92-.1-.25-.24-.46-.41-.62-.17-.17-.36-.31-.58-.42-.22-.11-.43-.21-.65-.29-.24-.09-.47-.19-.69-.3-.22-.11-.4-.23-.54-.37-.14-.14-.21-.3-.21-.48,0-.26.09-.45.28-.58.18-.13.44-.19.76-.19Z" />
      {/* TM */}
      <Polygon fill="#ffffff" points="44.72 23.54 45.02 23.54 45.02 24.39 45.13 24.39 45.13 23.54 45.44 23.54 45.44 23.44 44.72 23.44 44.72 23.54" />
      <Polygon fill="#ffffff" points="46.28 23.44 45.95 23.92 45.62 23.44 45.5 23.44 45.5 24.39 45.61 24.39 45.61 23.62 45.95 24.12 46.28 23.62 46.28 24.39 46.4 24.39 46.4 23.44 46.28 23.44" />
    </Svg>
  )
}

// AUTHENTICITY INDEX PLACEMENT — the correct eye/orbital mark for the score indicator
// viewBox: 0 0 65.59 47.69  — open design (no solid body fill), pure orbital eye lines + dots
// All elements rendered in a single dynamic color (band color for dark bg, #272525 for light)
function AuthenticityIndexPlacement({ color = '#272525', width = 240 }: { color?: string; width?: number }) {
  const h = (width * 47.69) / 65.59
  return (
    <Svg viewBox="0 0 65.59 47.69" style={{ width, height: h }}>
      <Path fill={color} d="M61.21,24.64c.21,0,.38-.17.38-.38s-.17-.38-.38-.38h-12.63c-.04-1.22-.22-2.4-.51-3.53-.29.16-.6.29-.94.35.3,1.18.47,2.4.47,3.67,0,2.34-.56,4.55-1.52,6.52.32.12.61.3.85.54,1.02-2.06,1.61-4.37,1.65-6.81h12.62Z" />
      <Path fill={color} d="M32.8,46.68c-7.65,0-15.08-3.51-21.94-10.23-.13.32-.32.61-.57.85,7.02,6.82,14.64,10.38,22.52,10.38,2.83,0,5.62-.47,8.36-1.37-.18-.28-.31-.59-.41-.92-2.62.85-5.27,1.29-7.96,1.29Z" />
      <Path fill={color} d="M32.8,1.85c3.22,0,6.4.62,9.52,1.84.11-.32.27-.62.48-.88-3.27-1.29-6.61-1.97-10-1.97-2.05,0-4.09.26-6.1.73.13.3.23.62.29.95,1.92-.45,3.86-.68,5.81-.68Z" />
      <Path fill={color} d="M65.42,24c-5.4-8.6-11.37-14.89-17.69-18.73-.08.34-.23.66-.42.94,5.14,3.15,10.07,7.98,14.63,14.41-8.68-8.31-18.63-12.68-29-12.68-5.39,0-10.66,1.18-15.7,3.48.19.28.33.59.43.92,3.07-1.4,6.23-2.37,9.44-2.91-5.93,2.2-10.22,7.82-10.42,14.47H3.99c-.21,0-.38.17-.38.38s.17.38.38.38h12.69c.02,1.07.15,2.11.37,3.12.21-.11.43-.19.68-.24.09-.02.18-.02.27-.02-.21-1.01-.33-2.05-.33-3.11,0-8.25,6.71-14.96,14.96-14.96,4.89,0,9.23,2.37,11.96,6.01.25-.22.54-.4.85-.52-1.92-2.59-4.61-4.58-7.72-5.64,9.52,1.29,18.57,6.41,26.42,15.02-7.6,8.34-16.32,13.41-25.52,14.89,2.06-.84,3.9-2.1,5.43-3.67-.3-.15-.56-.36-.78-.61-2.71,2.75-6.48,4.46-10.64,4.46-5.45,0-10.22-2.94-12.83-7.31-.26.21-.56.37-.89.46,1.7,2.86,4.26,5.14,7.32,6.49-8.82-1.68-17.18-6.68-24.49-14.71,3.2-3.51,6.6-6.44,10.15-8.77-.22-.25-.4-.53-.54-.84-2.91,1.91-5.73,4.22-8.41,6.91,5.01-7.29,10.46-12.63,16.17-15.91-.18-.27-.32-.57-.43-.89C12.06,8.58,5.8,15.02.17,24l-.17.27.17.27c2.14,3.42,4.38,6.45,6.69,9.13.25-.23.55-.4.88-.51-1.59-1.84-3.16-3.85-4.68-6.04,8.89,8.86,19.16,13.54,29.88,13.54s20.23-4.33,28.89-12.57c-4.6,6.44-9.55,11.25-14.73,14.37.19.28.32.6.42.94,6.4-3.82,12.45-10.16,17.91-18.85l.17-.27-.17-.27Z" />
      <Path fill={color} d="M22.74,6.65c1.84,0,3.33-1.49,3.33-3.33s-1.49-3.33-3.33-3.33-3.33,1.49-3.33,3.33,1.49,3.33,3.33,3.33ZM22.18.78c.48,0,.86.39.86.86s-.39.86-.86.86-.86-.39-.86-.86.39-.86.86-.86Z" />
      <Path fill={color} d="M44.99,6.73c1.18,0,2.14-.96,2.14-2.14s-.96-2.14-2.14-2.14-2.14.96-2.14,2.14.96,2.14,2.14,2.14ZM44.63,2.95c.31,0,.55.25.55.55s-.25.55-.55.55-.55-.25-.55-.55.25-.55.55-.55Z" />
      <Path fill={color} d="M11.97,13.33c0,1.37,1.11,2.48,2.48,2.48s2.48-1.11,2.48-2.48-1.11-2.48-2.48-2.48-2.48,1.11-2.48,2.48ZM14.68,12.07c0,.35-.29.64-.64.64s-.64-.29-.64-.64.29-.64.64-.64.64.29.64.64Z" />
      <Path fill={color} d="M46.67,15.33c-1.33-.06-2.45.97-2.51,2.3-.06,1.33.97,2.45,2.3,2.51,1.33.06,2.45-.97,2.51-2.3.06-1.33-.97-2.45-2.3-2.51ZM46.18,17.12c-.34-.01-.61-.31-.59-.65s.31-.61.65-.59.61.31.59.65-.31.61-.65.59Z" />
      <Path fill={color} d="M32.64,11.83c-6.92,0-12.56,5.63-12.56,12.56s5.63,12.56,12.56,12.56,12.56-5.63,12.56-12.56-5.63-12.56-12.56-12.56ZM32.64,36.54c-6.7,0-12.16-5.45-12.16-12.16s5.45-12.16,12.16-12.16,12.16,5.45,12.16,12.16-5.45,12.16-12.16,12.16Z" />
      <Path fill={color} d="M19.76,30.84c.44-.86.09-1.92-.77-2.36-.86-.44-1.92-.09-2.36.77-.44.86-.09,1.92.77,2.36.86.44,1.92.09,2.36-.77ZM17.07,30.32c-.22-.11-.31-.39-.2-.61s.39-.31.61-.2c.22.11.31.39.2.61-.11.22-.39.31-.61.2Z" />
      <Path fill={color} d="M44.93,31.52c-.96.15-1.63,1.05-1.48,2.01s1.05,1.63,2.01,1.48c.96-.15,1.63-1.05,1.48-2.01-.15-.96-1.05-1.63-2.01-1.48ZM44.83,32.88c-.25.04-.48-.13-.52-.38-.04-.25.13-.48.38-.52.25-.04.48.13.52.38.04.25-.13.48-.38.52Z" />
      <Path fill={color} d="M44.14,41.68c-1.5,0-2.72,1.22-2.72,2.72s1.22,2.72,2.72,2.72,2.72-1.22,2.72-2.72-1.22-2.72-2.72-2.72ZM43.68,43.73c-.39,0-.7-.32-.7-.7s.31-.7.7-.7.7.32.7.7-.31.7-.7.7Z" />
      <Path fill={color} d="M10.16,34.85c-.37-.9-1.39-1.33-2.28-.96-.9.37-1.33,1.39-.96,2.28.37.9,1.39,1.33,2.28.96.9-.37,1.33-1.39.96-2.28ZM7.89,36.27c-.23.09-.5-.02-.59-.25-.09-.23.02-.5.25-.59.23-.09.5.02.59.25s-.02.5-.25.59Z" />
    </Svg>
  )
}

// SCORE GRAPHIC — Authenticity Index Placement mark with score overlaid at iris center
// Iris math: viewBox 65.59×47.69, iris center (32.64, 24.39), inner radius 12.16
function SealScoreGraphic({ totalScore, scoreCol }: { totalScore: number; scoreCol: string }) {
  const W = 260
  const H = (W * 47.69) / 65.59       // ≈ 189.1
  const scale = W / 65.59             // ≈ 3.964
  const irisCY = 24.39 * scale        // ≈ 96.7 — iris center Y
  const irisR  = 11.0  * scale        // ≈ 43.6 — usable radius inside ring stroke
  const overlayTop = irisCY - irisR   // ≈ 53.1
  const overlayH   = irisR * 2        // ≈ 87.2

  return (
    <View style={{ width: W, height: H, position: 'relative' }}>
      <AuthenticityIndexPlacement color={scoreCol} width={W} />
      {/* Score overlay — centered inside the iris, score in band color on dark bg */}
      <View style={{
        position: 'absolute',
        top: overlayTop,
        left: 0,
        right: 0,
        height: overlayH,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 32, fontFamily: 'Helvetica-Bold', color: scoreCol, lineHeight: 1 }}>
          {totalScore}
        </Text>
        <Text style={{ fontSize: 7, color: '#64748B', letterSpacing: 0.5, marginTop: 4 }}>/ 100</Text>
      </View>
    </View>
  )
}

// ─── ExifTool field helper ────────────────────────────────────────────────────
// ExifTool runs with -G flag so keys are group-prefixed (e.g. "EXIF:Make").
// Falls back to unprefixed keys for robustness.
function getExifField(raw: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!raw) return '—'
  for (const key of keys) {
    const val = raw[key]
    if (val !== null && val !== undefined && val !== '') return String(val)
  }
  return '—'
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    paddingTop: 0,
    paddingBottom: 48,
    paddingHorizontal: 0,
    fontSize: 10,
    color: DARK_TEXT,
  },

  // ── Cover ──────────────────────────────────────────────────────────────────
  coverHeader: {
    backgroundColor: DARK_BG,
    paddingHorizontal: 48,
    paddingTop: 48,
    paddingBottom: 36,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  logoSub: {
    color: '#64748B',
    fontSize: 7,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 5,
  },
  coverTitleLabel: {
    color: MUTED,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  coverTitle: {
    color: LIGHT_TEXT,
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  coverCaseNumber: {
    color: '#93C5FD',
    fontSize: 11,
    marginBottom: 28,
  },

  // Score circle — border-ring style (no solid fill)
  scoreCircleWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 7,
    backgroundColor: 'transparent',
  },
  scoreCircleNumber: {
    fontSize: 34,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1,
  },
  scoreCircleLabel: {
    color: MUTED,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 3,
  },
  wordmarkRow: {
    alignItems: 'center',
    marginBottom: 20,
  },

  // Classification pill
  classBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 24,
  },
  classBadgeText: {
    color: LIGHT_TEXT,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },

  // Cover meta table
  metaTable: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1E3A5F',
    paddingTop: 14,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 7,
  },
  metaLabel: {
    color: MUTED,
    fontSize: 8,
    width: 120,
    letterSpacing: 0.3,
  },
  metaValue: {
    color: LIGHT_TEXT,
    fontSize: 8,
    flex: 1,
  },

  // ── Shared layout ──────────────────────────────────────────────────────────
  pageBody: {
    paddingHorizontal: 48,
    paddingTop: 32,
  },
  sectionHeader: {
    backgroundColor: DARK_BG,
    paddingHorizontal: 48,
    paddingVertical: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderText: {
    color: LIGHT_TEXT,
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: MUTED,
    marginBottom: 16,
  },

  // ── Score breakdown ────────────────────────────────────────────────────────
  scorePanelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  scorePanelCard: {
    width: '46%',
    backgroundColor: PANEL_BG,
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  scorePanelCardFull: {
    width: '100%',
    backgroundColor: PANEL_BG,
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  scorePanelName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: MUTED,
    marginBottom: 8,
  },
  scoreBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 8,
    borderRadius: 4,
  },
  scoreBarValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    width: 32,
    textAlign: 'right',
  },

  // ── Technical evidence ────────────────────────────────────────────────────
  evidenceGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  evidencePanel: {
    flex: 1,
    backgroundColor: PANEL_BG,
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  evidencePanelTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: MUTED,
    marginBottom: 10,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    gap: 6,
  },
  flagBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EA580C',
    marginTop: 3,
    flexShrink: 0,
  },
  flagText: {
    fontSize: 9,
    color: DARK_TEXT,
    flex: 1,
    lineHeight: 1.4,
  },
  opencvStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  opencvStatLabel: {
    fontSize: 9,
    color: MUTED,
  },
  opencvStatValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK_TEXT,
  },

  // ── Findings ───────────────────────────────────────────────────────────────
  findingsCategory: {
    marginBottom: 28,
    backgroundColor: PANEL_BG,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  findingsCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 10,
  },
  findingsCategoryName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK_TEXT,
    flex: 1,
  },
  findingsScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  findingsScorePillText: {
    color: LIGHT_TEXT,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  findingsCategoryBody: {
    padding: 14,
  },
  narrativeText: {
    fontSize: 9,
    color: DARK_TEXT,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  findingBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    gap: 6,
  },
  findingBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1E293B',
    marginTop: 3,
    flexShrink: 0,
  },
  findingBulletText: {
    fontSize: 9,
    color: DARK_TEXT,
    flex: 1,
    lineHeight: 1.4,
  },
  observationsBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  observationsLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#1D4ED8',
    marginBottom: 8,
  },
  observationsText: {
    fontSize: 9,
    color: '#1E40AF',
    lineHeight: 1.5,
  },

  // ── Recommendations & disclaimer ───────────────────────────────────────────
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  recommendationIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: DARK_BG,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recommendationIndexText: {
    color: LIGHT_TEXT,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  recommendationText: {
    fontSize: 9,
    color: DARK_TEXT,
    flex: 1,
    lineHeight: 1.5,
    paddingTop: 4,
  },
  disclaimerBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#92400E',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 8.5,
    color: '#78350F',
    lineHeight: 1.6,
  },

  // ── Signature block ────────────────────────────────────────────────────────
  signatureBlock: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
  },
  signatureLeft: {
    flexDirection: 'column',
  },
  signatureImage: {
    width: 130,
    height: 52,
    objectFit: 'contain',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK_TEXT,
  },
  signatureTitle: {
    fontSize: 8,
    color: MUTED,
    marginTop: 1,
  },
  signatureDate: {
    fontSize: 8,
    color: MUTED,
    marginTop: 1,
  },
  signatureRight: {
    alignItems: 'flex-end',
  },

  // ── Page footer ────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7.5,
    color: MUTED,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 16,
  },

  // ── Image Evidence page ─────────────────────────────────────────────────────
  imageEvidenceGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  evidenceImageLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: MUTED,
    marginBottom: 5,
  },
  evidenceImageBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: 'hidden',
  },
  metaSection: {
    marginBottom: 14,
  },
  metaSectionHeader: {
    backgroundColor: DARK_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaSectionHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: LIGHT_TEXT,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metaDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaDataLabel: {
    fontSize: 8,
    color: MUTED,
    width: 120,
  },
  metaDataValue: {
    fontSize: 8,
    color: DARK_TEXT,
    flex: 1,
  },
  metaDataValueBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  metaDataGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metaDataCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
})

// ─── Sub-components ──────────────────────────────────────────────────────────

function PageFooter({ caseNumber }: { caseNumber: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>LVIS™ Forensic Analysis Report — {caseNumber}</Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionHeaderText}>{title}</Text>
      <LVISLogoMark color="#FFFFFF" width={48} />
    </View>
  )
}

function CategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    provenance: 'Provenance',
    file_integrity: 'File Integrity',
    visual_consistency: 'Visual Consistency',
    manipulation: 'Manipulation',
    synthetic_risk: 'Synthetic / AI Risk',
  }
  return labels[category] ?? category
}

function ScoreBar({ name, score }: { name: string; score: number }) {
  const color = scoreColor(score)
  const barWidth = `${score}%` as `${string}%`
  return (
    <View style={s.scorePanelCard}>
      <Text style={s.scorePanelName}>{CategoryLabel(name)}</Text>
      <View style={s.scoreBarRow}>
        <View style={s.scoreBarTrack}>
          <View style={[s.scoreBarFill, { width: barWidth, backgroundColor: color }]} />
        </View>
        <Text style={[s.scoreBarValue, { color }]}>{score}</Text>
      </View>
    </View>
  )
}

function FindingsSection({
  category,
  data,
}: {
  category: string
  data: { score: number; narrative: string; findings: string[] }
}) {
  const color = scoreColor(data.score)
  return (
    // No wrap={false} on the outer card — allows the section to split across pages
    // naturally instead of leaving large whitespace gaps when a card is too tall to fit.
    <View style={s.findingsCategory}>
      {/* Header + narrative kept together — prevents category title from stranding
          alone at the bottom of a page without any body content beneath it. */}
      <View wrap={false}>
        <View style={s.findingsCategoryHeader}>
          <Text style={s.findingsCategoryName}>{CategoryLabel(category)}</Text>
          <View style={[s.findingsScorePill, { backgroundColor: color }]}>
            <Text style={s.findingsScorePillText}>{data.score} / 100</Text>
          </View>
        </View>
        <View style={[s.findingsCategoryBody, { paddingBottom: 0 }]}>
          <Text style={s.narrativeText}>{data.narrative}</Text>
        </View>
      </View>
      {/* Bullet points flow independently — they may continue onto the next page */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
        {data.findings.map((f, i) => (
          <View key={i} style={s.findingBulletRow}>
            <View style={s.findingBullet} />
            <Text style={s.findingBulletText}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function LVISReportDocument(props: LVISReportDocumentProps) {
  const {
    caseNumber,
    caseTitle,
    clientName,
    purpose,
    analyzedAt,
    totalScore,
    classification,
    confidenceLevel,
    categoryScores,
    claudeFindings,
    exiftoolFlags,
    opencvSummary,
    disclaimer,
    qrDataUrl,
    analysisContext,
    specimenImageBase64,
    elaMapBase64,
    exifDetails,
    adminNote,
  } = props

  // Derive all cover-page dynamic colours from the single getIndexColor() call
  const indexResult = getIndexColor(totalScore)
  const scoreCol = indexResult.color

  const formattedDate = (() => {
    try {
      return new Date(analyzedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return analyzedAt
    }
  })()

  const formattedTime = (() => {
    try {
      const tz = analysisContext?.timezone ?? 'UTC'
      return new Date(analyzedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz,
        timeZoneName: 'short',
      })
    } catch {
      return ''
    }
  })()

  const locationString = [analysisContext?.city, analysisContext?.country]
    .filter(Boolean)
    .join(', ') || null

  const categories: Array<keyof typeof categoryScores> = [
    'provenance',
    'file_integrity',
    'visual_consistency',
    'manipulation',
    'synthetic_risk',
  ]

  // Signature: render if the file exists at public/lvis/signature.png
  const signaturePath = path.join(process.cwd(), 'public', 'lvis', 'signature.png')
  const hasSignature = fs.existsSync(signaturePath)

  return (
    <Document
      title={`LVIS Report — ${caseNumber}`}
      author="LVIS™ Forensic Analysis Platform"
      subject={caseTitle}
      creator="LVIS™"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 1 — COVER
      ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={[s.page, { backgroundColor: DARK_BG }]}>
        {/* Full-page dark cover — single unified block */}
        <View style={[s.coverHeader, { flex: 1 }]}>
          {/* Logo row: LVIS wordmark left, sub-label right */}
          <View style={s.logoRow}>
            <View>
              <LVISLogoMark color="#FFFFFF" width={112} />
              <Text style={s.logoSub}>FORENSIC ANALYSIS PLATFORM</Text>
            </View>
            <QualitySealMark width={52} />
          </View>

          {/* Title block */}
          <Text style={s.coverTitleLabel}>FORENSIC ANALYSIS REPORT</Text>
          <Text style={s.coverTitle}>{caseTitle}</Text>
          <Text style={s.coverCaseNumber}>Case No. {caseNumber}</Text>

          {/* Score seal graphic — large colored eye seal with score overlaid at iris */}
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <SealScoreGraphic totalScore={totalScore} scoreCol={scoreCol} />
          </View>

          {/* Authenticity INDEX wordmark below circle */}
          <View style={s.wordmarkRow}>
            <AuthenticityIndexWordmark color="#FFFFFF" width={170} />
          </View>

          {/* Classification badge */}
          <View style={[s.classBadge, { backgroundColor: scoreCol }]}>
            <Text style={s.classBadgeText}>{classification}</Text>
          </View>

          {/* Meta info — left/right split: meta rows left, QR code right */}
          <View style={[s.metaTable, { flexDirection: 'row', alignItems: 'flex-end' }]}>
            {/* Left: meta rows */}
            <View style={{ flex: 1 }}>
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>Client</Text>
                <Text style={s.metaValue}>{clientName}</Text>
              </View>
              {purpose ? (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Purpose</Text>
                  <Text style={s.metaValue}>{purpose}</Text>
                </View>
              ) : null}
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>Analysis Date</Text>
                <Text style={s.metaValue}>{formattedDate}</Text>
              </View>
              {formattedTime ? (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Analysis Time</Text>
                  <Text style={s.metaValue}>{formattedTime}</Text>
                </View>
              ) : null}
              {locationString ? (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Location</Text>
                  <Text style={s.metaValue}>{locationString}</Text>
                </View>
              ) : null}
              {analysisContext?.ip && analysisContext.ip !== 'Unknown' ? (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Origin IP</Text>
                  <Text style={s.metaValue}>{analysisContext.ip}</Text>
                </View>
              ) : null}
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>Confidence Level</Text>
                <Text style={s.metaValue}>{confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)}</Text>
              </View>
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>LV Authenticity Index™</Text>
                <Text style={[s.metaValue, { color: scoreCol, fontFamily: 'Helvetica-Bold' }]}>{totalScore} / 100</Text>
              </View>
            </View>

            {/* Right: QR code */}
            {qrDataUrl ? (
              <View style={{ alignItems: 'center', marginLeft: 20 }}>
                <Text style={{ color: MUTED, fontSize: 6.5, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>
                  LV Authenticity Index™
                </Text>
                <Image src={qrDataUrl} style={{ width: 68, height: 68 }} />
                <Text style={{ color: MUTED, fontSize: 6.5, marginTop: 5, textAlign: 'center' }}>
                  Report Authenticity Checker
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Body note — dark bg, muted text */}
        <View style={{ paddingHorizontal: 48, paddingTop: 20, paddingBottom: 48 }}>
          <View style={{ borderTopWidth: 1, borderTopColor: '#1E3A5F', paddingTop: 16 }}>
            <Text style={{ fontSize: 9, color: '#475569', lineHeight: 1.6 }}>
              This report was generated by the LVIS™ platform and contains the complete findings of the forensic image
              analysis. The following pages contain image evidence, category scores, technical findings, and recommendations.
            </Text>
          </View>
        </View>

        {/* Footer styled for dark bg */}
        <View style={[s.footer, { borderTopColor: '#1E3A5F' }]} fixed>
          <Text style={[s.footerText, { color: '#334155' }]}>LVIS™ Forensic Analysis Report — {caseNumber}</Text>
          <Text
            style={[s.footerText, { color: '#334155' }]}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 2 — IMAGE EVIDENCE
      ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SectionHeader title="Image Evidence" />

        <View style={s.pageBody}>
          {/* ── Specimen + ELA map ─────────────────────────────────────────── */}
          <View style={s.imageEvidenceGrid}>
            {/* Left: specimen image */}
            <View style={{ flex: 3 }}>
              <Text style={s.evidenceImageLabel}>Specimen Image</Text>
              {specimenImageBase64 ? (
                <View style={s.evidenceImageBox}>
                  <Image src={specimenImageBase64} style={{ width: '100%', objectFit: 'contain', maxHeight: 200 }} />
                </View>
              ) : (
                <View style={[s.evidenceImageBox, { height: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: PANEL_BG }]}>
                  <Text style={{ fontSize: 8, color: MUTED }}>Image not available</Text>
                </View>
              )}
            </View>

            {/* Right: ELA heat map */}
            <View style={{ flex: 2 }}>
              <Text style={s.evidenceImageLabel}>ELA Map (Error Level Analysis)</Text>
              {elaMapBase64 ? (
                <View style={s.evidenceImageBox}>
                  <Image src={elaMapBase64} style={{ width: '100%', objectFit: 'contain', maxHeight: 200 }} />
                </View>
              ) : (
                <View style={[s.evidenceImageBox, { height: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: PANEL_BG }]}>
                  <Text style={{ fontSize: 8, color: MUTED }}>ELA map not available</Text>
                </View>
              )}
              <Text style={{ fontSize: 6.5, color: MUTED, marginTop: 4, lineHeight: 1.4 }}>
                Bright regions indicate compression inconsistency — potential indicator of post-capture editing or compositing.
              </Text>
            </View>
          </View>

          {/* ── Metadata tables — two-column layout ───────────────────────── */}
          <View style={s.metaDataGrid}>
            {/* Left column: Camera & Capture */}
            <View style={[s.metaDataCol, { flex: 1 }]}>
              <View style={s.metaSectionHeader}>
                <Text style={s.metaSectionHeaderText}>Camera &amp; Capture</Text>
              </View>
              {[
                { label: 'Make', value: getExifField(exifDetails, 'EXIF:Make', 'Make') },
                { label: 'Model', value: getExifField(exifDetails, 'EXIF:Model', 'Model') },
                { label: 'Focal Length', value: getExifField(exifDetails, 'EXIF:FocalLength', 'FocalLength') },
                { label: 'Exposure Time', value: getExifField(exifDetails, 'EXIF:ExposureTime', 'ExposureTime') },
                { label: 'F-Number', value: getExifField(exifDetails, 'EXIF:FNumber', 'FNumber') },
                { label: 'ISO', value: getExifField(exifDetails, 'EXIF:ISO', 'ISO', 'ISOSpeedRatings') },
                { label: 'Date / Time', value: getExifField(exifDetails, 'EXIF:DateTimeOriginal', 'DateTimeOriginal', 'EXIF:CreateDate', 'CreateDate') },
                { label: 'Lens', value: getExifField(exifDetails, 'EXIF:LensModel', 'LensModel', 'Composite:LensID', 'EXIF:LensInfo') },
              ].map((row, i, arr) => (
                <View key={row.label} style={[s.metaDataRow, i === arr.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                  <Text style={s.metaDataLabel}>{row.label}</Text>
                  <Text style={s.metaDataValue}>{row.value}</Text>
                </View>
              ))}
            </View>

            {/* Right column: File & Color Profile */}
            <View style={[s.metaDataCol, { flex: 1 }]}>
              <View style={s.metaSectionHeader}>
                <Text style={s.metaSectionHeaderText}>File &amp; Color Profile</Text>
              </View>
              {[
                { label: 'File Size', value: getExifField(exifDetails, 'File:FileSize', 'FileSize', 'System:FileSize') },
                { label: 'Dimensions', value: (() => {
                  const w = getExifField(exifDetails, 'EXIF:ImageWidth', 'EXIF:ExifImageWidth', 'ExifImageWidth', 'File:ImageWidth', 'ImageWidth')
                  const h = getExifField(exifDetails, 'EXIF:ImageHeight', 'EXIF:ExifImageHeight', 'ExifImageHeight', 'File:ImageHeight', 'ImageHeight')
                  if (w !== '—' && h !== '—') return `${w} × ${h}`
                  // Fallback: Composite:ImageSize returns "W H" for JFIF JPEGs without EXIF
                  const composite = getExifField(exifDetails, 'Composite:ImageSize', 'ImageSize')
                  if (composite !== '—') return composite.replace(' ', ' × ')
                  return '—'
                })()},
                { label: 'Color Space', value: getExifField(exifDetails, 'EXIF:ColorSpace', 'ColorSpace', 'ICC_Profile:ColorSpaceData', 'Composite:ColorSpace') },
                { label: 'ICC Profile', value: getExifField(exifDetails, 'ICC_Profile:ProfileDescription', 'ICC-Profile:ProfileDescription', 'ProfileDescription', 'ICC_Profile:ProfileID') },
                { label: 'Bit Depth', value: getExifField(exifDetails, 'EXIF:BitsPerSample', 'BitsPerSample', 'File:BitsPerSample', 'PNG:BitDepth') },
                { label: 'Compression', value: getExifField(exifDetails, 'EXIF:Compression', 'Compression', 'File:FileType', 'JFIF:JFIFVersion') },
                { label: 'Software', value: getExifField(exifDetails, 'EXIF:Software', 'Software', 'XMP:CreatorTool', 'XMP-xmp:CreatorTool') },
                { label: 'Modify Date', value: getExifField(exifDetails, 'EXIF:ModifyDate', 'ModifyDate', 'File:FileModifyDate', 'XMP:ModifyDate') },
              ].map((row, i, arr) => (
                <View key={row.label} style={[s.metaDataRow, i === arr.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                  <Text style={s.metaDataLabel}>{row.label}</Text>
                  <Text style={s.metaDataValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Forensic Indicators (full width) ──────────────────────────── */}
          <View style={s.metaSection}>
            <View style={s.metaDataCol}>
              <View style={s.metaSectionHeader}>
                <Text style={s.metaSectionHeaderText}>Forensic Indicators</Text>
              </View>
              {[
                {
                  label: 'GPS Coordinates',
                  value: (exifDetails && (exifDetails['GPS:GPSLatitude'] || exifDetails['GPS:GPSLongitude']))
                    ? `Present — ${getExifField(exifDetails, 'GPS:GPSLatitude', 'GPSLatitude')}, ${getExifField(exifDetails, 'GPS:GPSLongitude', 'GPSLongitude')}`
                    : 'Absent (stripped or never recorded)',
                  flag: !(exifDetails && (exifDetails['GPS:GPSLatitude'] || exifDetails['GPS:GPSLongitude'])),
                },
                {
                  label: 'Embedded Thumbnail',
                  value: (exifDetails && (exifDetails['Thumbnail:ThumbnailLength'] || exifDetails['EXIF:ThumbnailLength'] || exifDetails['ThumbnailImage']))
                    ? 'Present'
                    : 'Absent',
                  flag: false,
                },
                {
                  label: 'XMP Edit History',
                  value: (() => {
                    const h = exifDetails?.['XMP:HistoryAction'] ?? exifDetails?.['XMP-xmpMM:HistoryAction']
                    if (Array.isArray(h) && h.length > 0) return `${h.length} recorded operation${h.length === 1 ? '' : 's'}`
                    if (h) return 'Present'
                    return 'None detected'
                  })(),
                  flag: (() => {
                    const h = exifDetails?.['XMP:HistoryAction'] ?? exifDetails?.['XMP-xmpMM:HistoryAction']
                    return Array.isArray(h) && h.length > 1
                  })(),
                },
                {
                  label: 'Hidden / Steganographic Data',
                  value: 'Not assessed (requires dedicated steganalysis)',
                  flag: false,
                },
                {
                  label: 'ELA Manipulation Score',
                  value: `${opencvSummary.ela_score} / 100`,
                  flag: opencvSummary.ela_score > 40,
                },
                {
                  label: 'Clone Detection Score',
                  value: `${opencvSummary.clone_score} / 100`,
                  flag: opencvSummary.clone_score > 40,
                },
                {
                  label: 'Flagged Regions',
                  value: opencvSummary.flagged_regions_count > 0
                    ? `${opencvSummary.flagged_regions_count} region${opencvSummary.flagged_regions_count === 1 ? '' : 's'} flagged by OpenCV`
                    : 'None',
                  flag: opencvSummary.flagged_regions_count > 0,
                },
                {
                  label: 'Content Credentials / C2PA',
                  value: (exifDetails && (exifDetails['XMP:Provenance'] || exifDetails['XMP-c2pa:Provenance'] || exifDetails['C2PA:Claim']))
                    ? 'Present'
                    : 'Not detected',
                  flag: false,
                },
              ].map((row, i, arr) => (
                <View key={row.label} style={[s.metaDataRow, { flexDirection: 'row', alignItems: 'center' }, i === arr.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                  <Text style={[s.metaDataLabel, { width: 170 }]}>{row.label}</Text>
                  <Text style={[s.metaDataValue, row.flag ? { color: '#EA580C', fontFamily: 'Helvetica-Bold' } : {}]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <PageFooter caseNumber={caseNumber} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 3 — SCORE BREAKDOWN
      ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SectionHeader title="Score Breakdown" />

        <View style={s.pageBody}>
          <Text style={s.sectionLabel}>LV Authenticity Index™ — Category Scores</Text>

          {/* Category bars */}
          <View style={s.scorePanelGrid}>
            {categories.map((cat) => (
              <ScoreBar key={cat} name={cat} score={categoryScores[cat]} />
            ))}
            {/* Total score — full width */}
            <View style={s.scorePanelCardFull}>
              <Text style={s.scorePanelName}>Overall LV Authenticity Index™</Text>
              <View style={s.scoreBarRow}>
                <View style={s.scoreBarTrack}>
                  <View style={[s.scoreBarFill, { width: `${totalScore}%` as `${string}%`, backgroundColor: scoreCol }]} />
                </View>
                <Text style={[s.scoreBarValue, { color: scoreCol, fontSize: 18 }]}>{totalScore}</Text>
              </View>
            </View>
          </View>

          <View style={s.divider} />

          {/* Technical Evidence */}
          <Text style={s.sectionLabel}>Technical Evidence</Text>

          <View style={s.evidenceGrid}>
            {/* ExifTool flags */}
            <View style={s.evidencePanel}>
              <Text style={s.evidencePanelTitle}>ExifTool Flags</Text>
              {exiftoolFlags.length === 0 ? (
                <Text style={[s.flagText, { color: '#16A34A' }]}>No flags detected</Text>
              ) : (
                exiftoolFlags.map((flag, i) => (
                  <View key={i} style={s.flagItem}>
                    <View style={s.flagBullet} />
                    <Text style={s.flagText}>{flag}</Text>
                  </View>
                ))
              )}
            </View>

            {/* OpenCV summary */}
            <View style={s.evidencePanel}>
              <Text style={s.evidencePanelTitle}>OpenCV Analysis</Text>
              <View style={s.opencvStat}>
                <Text style={s.opencvStatLabel}>ELA Score</Text>
                <Text style={[s.opencvStatValue, { color: scoreColor(opencvSummary.ela_score) }]}>
                  {opencvSummary.ela_score}
                </Text>
              </View>
              <View style={s.opencvStat}>
                <Text style={s.opencvStatLabel}>Clone Score</Text>
                <Text style={[s.opencvStatValue, { color: scoreColor(opencvSummary.clone_score) }]}>
                  {opencvSummary.clone_score}
                </Text>
              </View>
              <View style={s.opencvStat}>
                <Text style={s.opencvStatLabel}>Noise Uniformity</Text>
                <Text style={[s.opencvStatValue, { color: scoreColor(100 - opencvSummary.noise_uniformity_score) }]}>
                  {opencvSummary.noise_uniformity_score}
                </Text>
              </View>
              <View style={[s.opencvStat, { borderBottomWidth: 0 }]}>
                <Text style={s.opencvStatLabel}>Flagged Regions</Text>
                <Text style={[s.opencvStatValue, { color: opencvSummary.flagged_regions_count > 0 ? '#EA580C' : '#16A34A' }]}>
                  {opencvSummary.flagged_regions_count}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <PageFooter caseNumber={caseNumber} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 4 — FINDINGS (Part 1: Overall Observations + first 2 categories)
      ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SectionHeader title="Detailed Findings" />

        <View style={s.pageBody}>
          {/* Admin / Forensic Expert Note — shown only when provided */}
          {adminNote ? (
            <View wrap={false} style={{ backgroundColor: '#FEF3C7', borderRadius: 6, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#D97706' }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#92400E', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Forensic Expert Note
              </Text>
              <Text style={{ fontSize: 9, color: '#78350F', lineHeight: 1.5, fontStyle: 'italic' }}>
                {adminNote}
              </Text>
            </View>
          ) : null}

          {/* Overall observations — wrap={false} keeps label + body together */}
          {claudeFindings.overall_observations ? (
            <View style={s.observationsBox} wrap={false}>
              <Text style={s.observationsLabel}>Overall Observations</Text>
              <Text style={s.observationsText}>{claudeFindings.overall_observations}</Text>
            </View>
          ) : null}

          <FindingsSection category="provenance" data={claudeFindings.provenance} />
          <FindingsSection category="file_integrity" data={claudeFindings.file_integrity} />
        </View>

        <PageFooter caseNumber={caseNumber} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 5 — FINDINGS (Part 2: remaining 3 categories)
      ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SectionHeader title="Detailed Findings (cont.)" />

        <View style={s.pageBody}>
          <FindingsSection category="visual_consistency" data={claudeFindings.visual_consistency} />
          <FindingsSection category="manipulation" data={claudeFindings.manipulation} />
          <FindingsSection category="synthetic_risk" data={claudeFindings.synthetic_risk} />
        </View>

        <PageFooter caseNumber={caseNumber} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 6 — RECOMMENDATIONS & DISCLAIMER
      ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <SectionHeader title="Recommendations & Disclaimer" />

        <View style={s.pageBody}>
          <Text style={s.sectionLabel}>Recommended Actions</Text>

          {claudeFindings.recommended_actions.length === 0 ? (
            <Text style={{ fontSize: 9, color: MUTED }}>No specific actions recommended.</Text>
          ) : (
            claudeFindings.recommended_actions.map((action, i) => (
              <View key={i} style={s.recommendationItem}>
                <View style={s.recommendationIndex}>
                  <Text style={s.recommendationIndexText}>{i + 1}</Text>
                </View>
                <Text style={s.recommendationText}>{action}</Text>
              </View>
            ))
          )}

          <View style={s.divider} />

          <Text style={s.sectionLabel}>Score Reference</Text>
          {[
            { range: '0 – 20', label: 'Authentic Capture', color: '#16A34A' },
            { range: '21 – 40', label: 'Authentic Photograph with Professional Editing', color: '#65A30D' },
            { range: '41 – 60', label: 'Significant Retouching', color: '#CA8A04' },
            { range: '61 – 80', label: 'High Manipulation Likelihood', color: '#EA580C' },
            { range: '81 – 100', label: 'Synthetic or AI-Generated Risk', color: '#DC2626' },
          ].map((band) => (
            <View key={band.range} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: band.color, flexShrink: 0 }} />
              <Text style={{ fontSize: 8.5, color: MUTED, width: 60 }}>{band.range}</Text>
              <Text style={{ fontSize: 8.5, color: DARK_TEXT }}>{band.label}</Text>
            </View>
          ))}

          {/* Chain of Custody */}
          {(analysisContext?.ip || locationString || formattedTime) ? (
            <View style={{ marginTop: 14, marginBottom: 12, padding: 10, backgroundColor: PANEL_BG, borderRadius: 6, borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                Chain of Custody
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                {formattedTime ? (
                  <View>
                    <Text style={{ fontSize: 7.5, color: MUTED }}>Analysis Time</Text>
                    <Text style={{ fontSize: 8.5, color: DARK_TEXT, fontFamily: 'Helvetica-Bold' }}>{formattedTime}</Text>
                  </View>
                ) : null}
                {locationString ? (
                  <View>
                    <Text style={{ fontSize: 7.5, color: MUTED }}>Location</Text>
                    <Text style={{ fontSize: 8.5, color: DARK_TEXT, fontFamily: 'Helvetica-Bold' }}>{locationString}</Text>
                  </View>
                ) : null}
                {analysisContext?.ip && analysisContext.ip !== 'Unknown' ? (
                  <View>
                    <Text style={{ fontSize: 7.5, color: MUTED }}>Origin IP</Text>
                    <Text style={{ fontSize: 8.5, color: DARK_TEXT, fontFamily: 'Helvetica-Bold' }}>{analysisContext.ip}</Text>
                  </View>
                ) : null}
                <View>
                  <Text style={{ fontSize: 7.5, color: MUTED }}>Analysis Date</Text>
                  <Text style={{ fontSize: 8.5, color: DARK_TEXT, fontFamily: 'Helvetica-Bold' }}>{formattedDate}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Disclaimer — flows naturally onto whatever page it reaches */}
          <View style={s.disclaimerBox}>
            <Text style={s.disclaimerLabel}>Legal Disclaimer</Text>
            <Text style={s.disclaimerText}>{disclaimer}</Text>
          </View>

          {/* Signature block — wrap={false} keeps the sig image, name, seal, and
              case reference together as a single unit. The disclaimer above can flow,
              but the signature itself never splits across pages. */}
          <View style={s.signatureBlock} wrap={false}>
            {/* Left: signature image + name */}
            <View style={s.signatureLeft}>
              {hasSignature ? (
                <Image src={signaturePath} style={s.signatureImage} />
              ) : (
                <View style={{ width: 130, height: 1, backgroundColor: BORDER, marginBottom: 8 }} />
              )}
              <Text style={s.signatureName}>LVIS™ Forensic Analysis Platform</Text>
              <Text style={s.signatureTitle}>Certified Digital Forensics Report</Text>
              <Text style={s.signatureDate}>{formattedDate}</Text>
            </View>

            {/* Right: quality seal + case reference */}
            <View style={s.signatureRight}>
              <QualitySealMark width={56} />
              <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 8, textAlign: 'right' }}>Case Reference</Text>
              <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DARK_TEXT, textAlign: 'right' }}>{caseNumber}</Text>
              <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2, textAlign: 'right' }}>LV Authenticity Index™: {totalScore} / 100</Text>
            </View>
          </View>
        </View>

        <PageFooter caseNumber={caseNumber} />
      </Page>
    </Document>
  )
}
