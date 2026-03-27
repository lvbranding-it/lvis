/**
 * POST /api/admin/cases/[caseId]/send-report
 *
 * Generates a fresh LVIS™ PDF report (optionally with an expert note) and
 * emails it to the client via SendGrid.
 *
 * Body: { recipientEmail: string, message: string, adminNote?: string }
 */

import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import QRCode from 'qrcode'
import sharp from 'sharp'
import sgMail from '@sendgrid/mail'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buildReportProps } from '@/lib/pdf/generator'
import { LVISReportDocument } from '@/components/pdf/LVISReportDocument'
import type { Case, ForensicReview } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params

  // ── Admin check ─────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (adminProfile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  const body = await request.json() as { recipientEmail?: string; message?: string; adminNote?: string }
  const { recipientEmail, message, adminNote } = body

  if (!recipientEmail?.trim()) return Response.json({ error: 'recipientEmail is required' }, { status: 400 })
  if (!message?.trim())        return Response.json({ error: 'message is required' },         { status: 400 })

  // ── Fetch case + review ──────────────────────────────────────────────────────
  const serviceClient = createServiceClient()

  const { data: caseData, error: caseError } = await serviceClient
    .from('cases')
    .select(`
      *,
      profiles!cases_client_id_fkey(id, full_name, company_name, role),
      forensic_reviews(
        id, case_id, case_file_id,
        provenance_score, file_integrity_score, visual_consistency_score,
        manipulation_score, synthetic_risk_score,
        total_score, classification, confidence_level,
        analysis_status, analyzed_at, created_at,
        technical_evidence, claude_findings
      )
    `)
    .eq('id', caseId)
    .single()

  if (caseError || !caseData) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  const review = (Array.isArray(caseData.forensic_reviews)
    ? caseData.forensic_reviews[0]
    : caseData.forensic_reviews) as ForensicReview | null

  if (!review || review.analysis_status !== 'complete') {
    return Response.json({ error: 'No completed analysis found for this case' }, { status: 400 })
  }

  // ── Build PDF props ──────────────────────────────────────────────────────────
  const client = Array.isArray(caseData.profiles) ? caseData.profiles[0] : caseData.profiles
  const baseProps = buildReportProps(
    { ...caseData, client } as Case & { client?: { full_name?: string | null } },
    review
  )

  // Generate QR code
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.thelvis.com'
  let qrDataUrl: string | undefined
  try {
    qrDataUrl = await QRCode.toDataURL(`${appUrl}/verify/${caseId}`, {
      width: 144, margin: 1,
      color: { dark: '#F8FAFC', light: '#1E293B' },
    })
  } catch { /* non-fatal */ }

  // Fetch specimen image
  let specimenImageBase64: string | undefined
  try {
    const { data: caseFile } = await serviceClient
      .from('case_files')
      .select('storage_path, file_name')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (caseFile?.storage_path) {
      const RAW_EXTS = ['.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2', '.raf']
      const ext = '.' + (caseFile.file_name?.split('.').pop() ?? '').toLowerCase()
      const isRaw = RAW_EXTS.includes(ext)

      if (isRaw) {
        const converted = (review.technical_evidence as unknown as Record<string, unknown> | null)
          ?.converted_jpeg_base64 as string | undefined
        if (converted) {
          const buf = Buffer.from(converted, 'base64')
          const resized = await sharp(buf).resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
          specimenImageBase64 = `data:image/jpeg;base64,${resized.toString('base64')}`
        }
      } else {
        const { data: fileBlob } = await serviceClient.storage.from('case-images').download(caseFile.storage_path)
        if (fileBlob) {
          const resized = await sharp(Buffer.from(await fileBlob.arrayBuffer())).resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
          specimenImageBase64 = `data:image/jpeg;base64,${resized.toString('base64')}`
        }
      }
    }
  } catch (imgErr) {
    console.warn('[send-report] Specimen image fetch failed (non-fatal):', imgErr)
  }

  // ── Render PDF ───────────────────────────────────────────────────────────────
  const finalProps = {
    ...baseProps,
    qrDataUrl,
    specimenImageBase64,
    adminNote: adminNote?.trim() || undefined,
  }

  let pdfBuffer: Buffer
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfBuffer = await renderToBuffer(React.createElement(LVISReportDocument, finalProps) as any)
  } catch (pdfErr) {
    console.error('[send-report] PDF render error:', pdfErr)
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }

  // ── Send via SendGrid ────────────────────────────────────────────────────────
  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL
  if (!apiKey || !fromEmail) {
    return Response.json({ error: 'Email service not configured (SENDGRID_API_KEY / SENDGRID_FROM_EMAIL missing)' }, { status: 500 })
  }

  sgMail.setApiKey(apiKey)

  const caseNumber = caseData.case_number
  const clientName = client?.full_name ?? 'Valued Client'

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E293B;">
      <div style="background: #0F172A; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <p style="color: #F8FAFC; font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 2px;">LVIS™</p>
        <p style="color: #94A3B8; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Forensic Image Intelligence</p>
      </div>
      <div style="background: #F8FAFC; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #E2E8F0; border-top: none;">
        <p style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">Dear ${clientName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; white-space: pre-line;">${message.trim()}</p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748B; margin: 0;">
          Case Reference: <strong>${caseNumber}</strong><br/>
          Please find your LVIS™ Forensic Report attached to this email as a PDF.
        </p>
        <div style="margin-top: 24px; padding: 16px; background: #F1F5F9; border-radius: 6px;">
          <p style="font-size: 11px; color: #94A3B8; margin: 0; line-height: 1.5;">
            LVIS™ provides a professional forensic evaluation based on available file evidence.
            Results do not constitute an absolute determination of truth or legal admissibility.
          </p>
        </div>
      </div>
    </div>
  `

  try {
    await sgMail.send({
      to: recipientEmail.trim(),
      from: { email: fromEmail, name: 'LVIS™ Forensic Reports' },
      subject: `Your LVIS™ Forensic Report — Case #${caseNumber}`,
      html: htmlBody,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `LVIS-Report-${caseNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    })
  } catch (emailErr) {
    console.error('[send-report] SendGrid error:', emailErr)
    const errMsg = emailErr instanceof Error ? emailErr.message : 'SendGrid error'
    return Response.json({ error: `Failed to send email: ${errMsg}` }, { status: 500 })
  }

  // ── Mark report as delivered ─────────────────────────────────────────────────
  await serviceClient
    .from('reports')
    .update({ delivered_at: new Date().toISOString() })
    .eq('case_id', caseId)

  return Response.json({ ok: true, sentTo: recipientEmail.trim() })
}
