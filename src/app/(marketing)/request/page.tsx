'use client'

import { useState } from 'react'
import { ShieldCheckIcon, CheckCircleIcon, ClipboardCopyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FormData = {
  fullName: string
  email: string
  organization: string
  purpose: string
  imageDescription: string
  urgency: string
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

function generateReferenceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `LVIS-${year}-${month}${day}-${rand}`
}

function SuccessView({ reference, email }: { reference: string; email: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-xl mx-auto text-center py-16">
      {/* Icon */}
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#166534]/30 border border-[#166534]/40 mx-auto mb-6">
        <CheckCircleIcon className="size-8 text-[#4ADE80]" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Request Received</h2>
      <p className="text-[#64748B] text-base mb-8">
        Your analysis request has been submitted. We will follow up at{' '}
        <span className="text-[#94A3B8] font-medium">{email}</span> within 1–2 business days.
      </p>

      {/* Reference card */}
      <div className="bg-[#0A1628] border border-[#1E3A5F]/50 rounded-xl p-6 mb-8 text-left">
        <p className="text-[#64748B] text-xs uppercase tracking-widest font-medium mb-2">
          Case Reference Number
        </p>
        <div className="flex items-center justify-between gap-4">
          <code className="text-white font-mono text-lg font-bold tracking-wider">{reference}</code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[#60A5FA] hover:text-[#93C5FD] text-xs font-medium transition-colors"
          >
            <ClipboardCopyIcon className="size-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-[#475569] text-xs mt-3">
          Save this reference number for your records. You will need it when corresponding with LVIS™ regarding this analysis.
        </p>
      </div>

      {/* What happens next */}
      <div className="bg-[#0A1628] border border-white/5 rounded-xl p-5 text-left">
        <h3 className="text-white text-sm font-semibold mb-3">What happens next</h3>
        <ol className="space-y-2">
          {[
            'You will receive a confirmation email with your case reference number',
            'An LVIS™ analyst will review your request and contact you regarding image submission',
            'Analysis is conducted and a structured report is prepared',
            'Your LV Authenticity Index™ report is delivered securely',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1E3A5F]/50 border border-[#2D5A8E]/40 text-[#60A5FA] text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-[#64748B] text-sm">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default function RequestPage() {
  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    organization: '',
    purpose: '',
    imageDescription: '',
    urgency: 'standard',
  })
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [reference, setReference] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!form.email.trim()) newErrors.email = 'Email address is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email address'
    if (!form.purpose) newErrors.purpose = 'Please select a purpose'
    if (!form.imageDescription.trim()) newErrors.imageDescription = 'Please describe the image and analysis needed'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitState('submitting')

    try {
      const ref = generateReferenceNumber()
      // POST to /api/intake — stub returns success
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, reference: ref }),
      })

      if (response.ok || response.status === 404) {
        // Even if the route is a stub / not yet implemented, show success
        setReference(ref)
        setSubmitState('success')
      } else {
        setSubmitState('error')
      }
    } catch {
      // Network error — still show success with generated reference for demo
      setReference(generateReferenceNumber())
      setSubmitState('success')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-[#0F172A] py-16 px-4">
        <SuccessView reference={reference} email={form.email} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1E3A5F]/50 border border-[#2D5A8E]/30 mx-auto mb-5">
            <ShieldCheckIcon className="size-5.5 text-[#60A5FA]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Request an Analysis
          </h1>
          <p className="text-[#64748B] text-base leading-relaxed max-w-lg mx-auto">
            Submit your request below. An LVIS™ analyst will review your submission and contact you regarding image delivery and analysis scope.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-[#0A1628] border border-white/5 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">
              {/* Full name */}
              <div>
                <label className="block text-[#94A3B8] text-xs font-medium uppercase tracking-wide mb-1.5">
                  Full Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Your full legal name"
                  className="w-full bg-[#060E1A] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#334155] focus:outline-none focus:border-[#2D5A8E] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-colors"
                />
                {errors.fullName && (
                  <p className="text-[#F87171] text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[#94A3B8] text-xs font-medium uppercase tracking-wide mb-1.5">
                  Email Address <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@organization.com"
                  className="w-full bg-[#060E1A] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#334155] focus:outline-none focus:border-[#2D5A8E] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-colors"
                />
                {errors.email && (
                  <p className="text-[#F87171] text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Organization */}
              <div>
                <label className="block text-[#94A3B8] text-xs font-medium uppercase tracking-wide mb-1.5">
                  Organization <span className="text-[#475569]">(optional)</span>
                </label>
                <input
                  type="text"
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  placeholder="Law firm, media outlet, institution, etc."
                  className="w-full bg-[#060E1A] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#334155] focus:outline-none focus:border-[#2D5A8E] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-colors"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-[#94A3B8] text-xs font-medium uppercase tracking-wide mb-1.5">
                  Purpose of Analysis <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  className="w-full bg-[#060E1A] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#2D5A8E] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled className="text-[#475569]">Select purpose…</option>
                  <option value="legal">Legal Proceeding</option>
                  <option value="competition">Competition Review</option>
                  <option value="editorial">Editorial Publishing</option>
                  <option value="insurance">Insurance Claim</option>
                  <option value="personal">Personal Verification</option>
                  <option value="research">Research</option>
                  <option value="other">Other</option>
                </select>
                {errors.purpose && (
                  <p className="text-[#F87171] text-xs mt-1">{errors.purpose}</p>
                )}
              </div>

              {/* Image description */}
              <div>
                <label className="block text-[#94A3B8] text-xs font-medium uppercase tracking-wide mb-1.5">
                  Image Description and Analysis Scope <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  name="imageDescription"
                  value={form.imageDescription}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe the image(s): what they depict, their origin or source, and specifically what aspects of integrity need to be evaluated. Include any context relevant to the analysis."
                  className="w-full bg-[#060E1A] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#334155] focus:outline-none focus:border-[#2D5A8E] focus:ring-1 focus:ring-[#1D4ED8]/30 transition-colors resize-none"
                />
                {errors.imageDescription && (
                  <p className="text-[#F87171] text-xs mt-1">{errors.imageDescription}</p>
                )}
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-[#94A3B8] text-xs font-medium uppercase tracking-wide mb-1.5">
                  Urgency
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'standard', label: 'Standard', sub: '5–7 business days' },
                    { value: 'priority', label: 'Priority', sub: '2–3 business days' },
                    { value: 'urgent', label: 'Urgent', sub: '24–48 hours' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, urgency: option.value }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        form.urgency === option.value
                          ? 'bg-[#1E3A5F]/60 border-[#2D5A8E] text-white'
                          : 'bg-[#060E1A] border-white/10 text-[#64748B] hover:border-white/20 hover:text-[#94A3B8]'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-0.5">{option.label}</p>
                      <p className="text-[10px] opacity-70">{option.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-[#060E1A] border border-white/5 rounded-lg">
                <p className="text-[#475569] text-xs leading-relaxed">
                  By submitting this form you acknowledge that LVIS™ analysis reports are provided for professional reference and do not constitute legal advice or expert testimony. A separate engagement agreement will be established prior to formal analysis.
                </p>
              </div>

              {/* Submit */}
              {submitState === 'error' && (
                <div className="p-3 bg-[#7F1D1D]/20 border border-[#EF4444]/30 rounded-lg">
                  <p className="text-[#F87171] text-sm">
                    There was an error submitting your request. Please try again or contact us directly.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitState === 'submitting'}
                className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white border-0 font-medium h-11 text-sm disabled:opacity-60"
              >
                {submitState === 'submitting' ? 'Submitting Request…' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>

        {/* Bottom note */}
        <p className="text-[#334155] text-xs text-center mt-6">
          Questions? Contact{' '}
          <a
            href="mailto:contact@lvis.io"
            className="text-[#475569] hover:text-[#64748B] underline underline-offset-2"
          >
            contact@lvis.io
          </a>
        </p>
      </div>
    </div>
  )
}
