// Public verification page — no login required.
// Linked from the QR code on every LVIS™ PDF report.
// Uses service-role client to read case data without RLS restrictions.
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getIndexColor, INDEX_BANDS } from '@/lib/scoring/index-colors'

interface VerifyPageProps {
  params: Promise<{ caseId: string }>
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { caseId } = await params
  const supabase = createServiceClient()

  // Fetch case
  const { data: caseData } = await supabase
    .from('cases')
    .select('id, case_number, title, created_at')
    .eq('id', caseId)
    .single()

  if (!caseData) notFound()

  // Fetch latest forensic review
  const { data: review } = await supabase
    .from('forensic_reviews')
    .select('total_score, classification, confidence_level, analyzed_at, created_at')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!review) notFound()

  const { color, classification } = getIndexColor(review.total_score)

  const formattedDate = (() => {
    try {
      return new Date(review.analyzed_at ?? review.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    } catch {
      return review.analyzed_at ?? review.created_at
    }
  })()

  return (
    <div className="min-h-screen bg-[#060E1A] flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="bg-[#0F172A] rounded-t-2xl border border-[#1E3A5F] border-b-0 px-8 py-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#64748B] text-xs tracking-[0.15em] uppercase font-mono">
              LVIS™ Forensic Analysis Platform
            </span>
            {/* Verified badge */}
            <span className="flex items-center gap-1.5 bg-[#1F7A5A]/20 text-[#4CAF50] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#4CAF50]/30">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Verified
            </span>
          </div>
          <h1 className="text-[#F8FAFC] text-xl font-bold tracking-tight">
            Report Authenticity Check
          </h1>
        </div>

        {/* Score card */}
        <div className="bg-[#0F172A] border border-[#1E3A5F] border-t-0 border-b-0 px-8 py-8 flex flex-col items-center">

          {/* Score indicator */}
          <div
            className="w-36 h-36 rounded-full flex flex-col items-center justify-center mb-5"
            style={{
              border: `8px solid ${color}`,
              boxShadow: `0 0 32px ${color}33`,
            }}
          >
            <span
              className="text-4xl font-bold font-mono leading-none"
              style={{ color }}
            >
              {review.total_score}
            </span>
            <span className="text-[#64748B] text-xs tracking-widest mt-1">/ 100</span>
          </div>

          {/* Classification badge */}
          <div
            className="px-4 py-1.5 rounded-full text-white text-sm font-semibold mb-6 text-center"
            style={{ backgroundColor: color }}
          >
            {classification}
          </div>

          {/* Meta rows */}
          <div className="w-full space-y-3 border-t border-[#1E3A5F] pt-5">
            <MetaRow label="Case Reference" value={caseData.case_number} mono />
            <MetaRow label="Analysis Date" value={formattedDate} />
            <MetaRow
              label="Confidence Level"
              value={review.confidence_level.charAt(0).toUpperCase() + review.confidence_level.slice(1)}
            />
            <MetaRow
              label="LV Authenticity Index™"
              value={`${review.total_score} / 100`}
              valueColor={color}
              bold
            />
          </div>
        </div>

        {/* Score reference */}
        <div className="bg-[#0A1628] border border-[#1E3A5F] border-t-0 px-8 py-5">
          <p className="text-[#475569] text-xs tracking-[0.12em] uppercase mb-3">Score Reference</p>
          <div className="space-y-1.5">
            {INDEX_BANDS.map((band) => (
              <div key={band.range} className="flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: band.color }}
                />
                <span className="text-[#475569] text-xs w-14 font-mono">{band.range}</span>
                <span className="text-[#94A3B8] text-xs">{band.classification}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0F172A] rounded-b-2xl border border-[#1E3A5F] border-t-0 px-8 py-4">
          <p className="text-[#334155] text-xs text-center leading-relaxed">
            This report was generated and sealed by the{' '}
            <span className="text-[#475569]">LVIS™ Forensic Analysis Platform</span>.
            Scan verified at {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
          </p>
        </div>

      </div>
    </div>
  )
}

function MetaRow({
  label,
  value,
  mono = false,
  bold = false,
  valueColor,
}: {
  label: string
  value: string
  mono?: boolean
  bold?: boolean
  valueColor?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[#64748B] text-xs shrink-0">{label}</span>
      <span
        className={[
          'text-xs text-right',
          mono ? 'font-mono' : '',
          bold ? 'font-bold' : '',
        ].join(' ')}
        style={{ color: valueColor ?? '#F8FAFC' }}
      >
        {value}
      </span>
    </div>
  )
}
