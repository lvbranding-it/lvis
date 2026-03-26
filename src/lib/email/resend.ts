import { Resend } from 'resend'

// Lazy-init so missing key doesn't crash at module load time
function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
  return new Resend(process.env.RESEND_API_KEY)
}

function scoreColor(score: number): string {
  if (score <= 20) return '#22C55E'
  if (score <= 40) return '#84CC16'
  if (score <= 60) return '#EAB308'
  if (score <= 80) return '#F97316'
  return '#EF4444'
}

function scoreLabel(score: number): string {
  if (score <= 20) return 'Authentic Capture'
  if (score <= 40) return 'Authentic with Professional Editing'
  if (score <= 60) return 'Significant Retouching'
  if (score <= 80) return 'High Manipulation Likelihood'
  return 'Synthetic / AI Risk Detected'
}

interface SendReportEmailOptions {
  to: string
  clientName: string
  caseNumber: string
  caseTitle: string
  reportUrl: string
  totalScore: number
  classification: string
}

export async function sendReportReadyEmail(opts: SendReportEmailOptions): Promise<void> {
  const { to, clientName, caseNumber, caseTitle, reportUrl, totalScore, classification } = opts
  const color = scoreColor(totalScore)
  const label = scoreLabel(totalScore)
  const from = process.env.RESEND_FROM_EMAIL ?? 'LVIS™ <onboarding@resend.dev>'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your LVIS™ Forensic Report is Ready</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0F172A;border-radius:12px 12px 0 0;padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background:#1E40AF;color:#F8FAFC;font-size:20px;font-weight:700;letter-spacing:2px;padding:4px 12px;border-radius:4px;">LVIS™</span>
                    <span style="display:inline-block;color:#93C5FD;font-size:11px;letter-spacing:1px;margin-left:10px;vertical-align:middle;">FORENSIC ANALYSIS PLATFORM</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:24px;">
                    <p style="margin:0;color:#94A3B8;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">Forensic Analysis Report</p>
                    <h1 style="margin:8px 0 4px;color:#F8FAFC;font-size:22px;font-weight:700;">${caseTitle}</h1>
                    <p style="margin:0;color:#93C5FD;font-size:13px;font-family:monospace;">Case No. ${caseNumber}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Score band -->
          <tr>
            <td style="background:#060E1A;padding:24px 40px;border-left:1px solid #1E3A5F;border-right:1px solid #1E3A5F;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:16px;">
                    <div style="display:inline-block;width:80px;height:80px;border-radius:50%;border:6px solid ${color};text-align:center;line-height:68px;">
                      <span style="color:${color};font-size:28px;font-weight:700;font-family:monospace;">${Math.round(totalScore)}</span>
                    </div>
                    <p style="margin:12px 0 4px;color:#94A3B8;font-size:10px;letter-spacing:2px;text-transform:uppercase;">LV Authenticity Index™</p>
                    <p style="margin:0;color:#F8FAFC;font-size:16px;font-weight:700;">${classification}</p>
                    <p style="margin:4px 0 0;color:${color};font-size:12px;">${label}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:32px 40px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
              <p style="margin:0 0 16px;color:#334155;font-size:15px;">Hello ${clientName},</p>
              <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
                Your forensic analysis for case <strong style="color:#1E293B;font-family:monospace;">${caseNumber}</strong> is complete.
                The full LVIS™ report — including all category findings, technical evidence, and recommended actions — is ready for download.
              </p>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                This link is valid for <strong>24 hours</strong>. If you need a fresh link, sign in to the LVIS™ platform and visit your case.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#1D4ED8;border-radius:8px;text-align:center;">
                    <a href="${reportUrl}" style="display:inline-block;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;letter-spacing:0.3px;">
                      Download Forensic Report →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;border-radius:0 0 12px 12px;padding:20px 40px;border:1px solid #E2E8F0;border-top:0;">
              <p style="margin:0;color:#94A3B8;font-size:11px;text-align:center;">
                LVIS™ — Luis Velasquez Image Integrity System<br/>
                This is an automated message. Do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  await getResend().emails.send({
    from,
    to,
    subject: `LVIS™ Report Ready — ${caseNumber}`,
    html,
  })
}
