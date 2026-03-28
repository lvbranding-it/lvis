'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ImageUploader } from '@/components/app/ImageUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  UploadCloud,
  Brain,
  FileCheck,
} from 'lucide-react'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import type { CasePriority, SubscriptionTier } from '@/types'
import { ALLOWED_PRIORITIES } from '@/lib/constants'

interface StepIndicatorProps {
  currentStep: number
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { label: 'Case Details', number: 1 },
    { label: 'Upload Image', number: 2 },
  ]

  return (
    <div className="mb-8 flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                currentStep === step.number
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.number
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {currentStep > step.number ? (
                <CheckCircle2 className="size-4" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={cn(
                'text-xs font-medium hidden sm:block',
                currentStep === step.number
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'mx-3 h-px w-12 sm:w-20 transition-colors',
                currentStep > step.number ? 'bg-green-500' : 'bg-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

interface ProgressStep {
  label: string
  icon: React.ReactNode
  status: 'pending' | 'running' | 'done' | 'error'
}

const PURPOSE_OPTIONS = [
  { value: 'legal_proceeding', label: 'Legal Proceeding' },
  { value: 'competition_review', label: 'Competition Review' },
  { value: 'editorial_publishing', label: 'Editorial Publishing' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'personal', label: 'Personal' },
  { value: 'research', label: 'Research' },
  { value: 'other', label: 'Other' },
]

const PRIORITY_OPTIONS: { value: CasePriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

interface FormData {
  title: string
  purpose: string
  priority: CasePriority
  description: string
  client_notes: string
}

interface FieldGroupProps {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}

function FieldGroup({ label, required, children, hint }: FieldGroupProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface NewCaseFormProps {
  userTier?: SubscriptionTier
}

export function NewCaseForm({ userTier = 'free' }: NewCaseFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    purpose: '',
    priority: 'normal',
    description: '',
    client_notes: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([])

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    else if (formData.title.trim().length < 3)
      newErrors.title = 'Title must be at least 3 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const updateProgress = (index: number, status: ProgressStep['status']) => {
    setProgressSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s))
    )
  }

  const handleSubmit = async () => {
    if (!imageFile) {
      toast.error('Please select an image to upload.')
      return
    }

    const steps: ProgressStep[] = [
      { label: 'Creating case record', icon: <FileCheck className="size-4" />, status: 'pending' },
      { label: 'Uploading image', icon: <UploadCloud className="size-4" />, status: 'pending' },
      { label: 'Queuing analysis', icon: <Brain className="size-4" />, status: 'pending' },
    ]
    setProgressSteps(steps)
    setSubmitting(true)

    try {
      // Step 1: Create case
      updateProgress(0, 'running')
      const caseRes = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          purpose: formData.purpose || undefined,
          priority: formData.priority,
          description: formData.description.trim() || undefined,
          client_notes: formData.client_notes.trim() || undefined,
        }),
      })

      if (!caseRes.ok) {
        const data = await caseRes.json()
        throw new Error(data.error ?? 'Failed to create case')
      }
      const caseData = await caseRes.json()
      const caseId: string = caseData.id
      updateProgress(0, 'done')

      // Step 2: Upload image
      updateProgress(1, 'running')
      // Browsers report RAW files as "" (unknown MIME type).
      // Map known RAW extensions to their proper image/x-* MIME types.
      const RAW_MIME_MAP: Record<string, string> = {
        '.cr2': 'image/x-canon-cr2',
        '.cr3': 'image/x-canon-cr3',
        '.nef': 'image/x-nikon-nef',
        '.arw': 'image/x-sony-arw',
        '.dng': 'image/x-adobe-dng',
        '.orf': 'image/x-olympus-orf',
        '.rw2': 'image/x-panasonic-rw2',
        '.raf': 'image/x-fuji-raf',
      }
      const RAW_EXTENSIONS = Object.keys(RAW_MIME_MAP)
      const fileExt = '.' + (imageFile.name.split('.').pop() ?? '').toLowerCase()
      const isRawFile = RAW_EXTENSIONS.includes(fileExt)
      const resolvedFileType = imageFile.type || RAW_MIME_MAP[fileExt] || 'image/x-raw'

      if (isRawFile) {
        // RAW files: send raw binary body to our API route.
        // Metadata travels in X-* headers — completely avoids Next.js's
        // multipart form-data parser which has a restrictive body size limit.
        // The server uploads with service role, bypassing Supabase MIME restrictions.
        const uploadRes = await fetch(`/api/cases/${caseId}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-File-Name': imageFile.name,
            'X-File-Type': resolvedFileType,
            'X-File-Size': String(imageFile.size),
          },
          body: imageFile,
        })

        if (!uploadRes.ok) {
          const data = await uploadRes.json()
          throw new Error(data.error ?? 'Failed to upload RAW file')
        }
      } else {
        // Standard images: get signed URL, PUT directly to Supabase Storage
        const uploadRes = await fetch(`/api/cases/${caseId}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: imageFile.name,
            fileType: resolvedFileType,
            fileSize: imageFile.size,
          }),
        })

        if (!uploadRes.ok) {
          const data = await uploadRes.json()
          throw new Error(data.error ?? 'Failed to get upload URL')
        }
        const { signedUrl } = await uploadRes.json()

        // PUT directly to storage
        const putRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': resolvedFileType },
          body: imageFile,
        })

        if (!putRes.ok) {
          throw new Error('Failed to upload image to storage')
        }
      }
      updateProgress(1, 'done')

      // Step 3: Trigger analysis
      updateProgress(2, 'running')
      const analyzeRes = await fetch(`/api/cases/${caseId}/analyze`, {
        method: 'POST',
      })

      if (!analyzeRes.ok) {
        // Non-fatal — case was created, analysis can be retried
        console.warn('Analysis trigger failed, will retry on case page')
      }
      updateProgress(2, 'done')

      toast.success('Case submitted successfully!')
      router.push(`/app/cases/${caseId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      toast.error(message)
      setProgressSteps((prev) =>
        prev.map((s) => (s.status === 'running' ? { ...s, status: 'error' } : s))
      )
      setSubmitting(false)
    }
  }

  if (submitting && progressSteps.length > 0) {
    return (
      <div className="rounded-xl border bg-card p-8">
        <h2 className="text-base font-semibold">Processing your case...</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please keep this page open while we process your submission.
        </p>
        <div className="mt-6 space-y-4">
          {progressSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
                  step.status === 'done'
                    ? 'bg-green-500/20 text-green-500'
                    : step.status === 'running'
                    ? 'bg-primary/20 text-primary'
                    : step.status === 'error'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {step.status === 'running' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : step.status === 'done' ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                  )}
                >
                  {step.label}
                </p>
              </div>
              {step.status === 'done' && (
                <span className="text-xs text-green-500 font-medium">Done</span>
              )}
              {step.status === 'error' && (
                <span className="text-xs text-destructive font-medium">Error</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 md:p-8">
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <div className="space-y-5">
          <FieldGroup label="Case Title" required>
            <Input
              placeholder="e.g. Insurance Claim Photo Verification"
              value={formData.title}
              onChange={(e) => setField('title', e.target.value)}
              className={errors.title ? 'border-destructive' : ''}
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title}</p>
            )}
          </FieldGroup>

          <FieldGroup label="Purpose of Analysis">
            <select
              value={formData.purpose}
              onChange={(e) => setField('purpose', e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">Select a purpose…</option>
              {PURPOSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Priority">
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((o) => {
                const allowed = (ALLOWED_PRIORITIES[userTier] ?? ALLOWED_PRIORITIES.free).includes(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => allowed && setField('priority', o.value)}
                    disabled={!allowed}
                    title={!allowed ? 'Available on paid plans — upgrade at Billing' : undefined}
                    className={cn(
                      'flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all',
                      !allowed
                        ? 'border-border bg-muted/10 text-muted-foreground/40 cursor-not-allowed opacity-50'
                        : formData.priority === o.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    <span className="flex items-center justify-center gap-1">
                      {!allowed && <Lock className="size-2.5" />}
                      {o.label}
                    </span>
                  </button>
                )
              })}
            </div>
            {userTier === 'free' && (
              <p className="text-xs text-muted-foreground mt-1">
                High &amp; Urgent priority available on paid plans.{' '}
                <Link href="/app/billing" className="underline hover:text-foreground">
                  Upgrade
                </Link>
              </p>
            )}
          </FieldGroup>

          <FieldGroup label="Description" hint="Context about the image or situation (optional)">
            <textarea
              value={formData.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Provide any relevant background information…"
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none dark:bg-input/30"
            />
          </FieldGroup>

          <FieldGroup label="Client Notes" hint="Any specific concerns or focus areas (optional)">
            <textarea
              value={formData.client_notes}
              onChange={(e) => setField('client_notes', e.target.value)}
              placeholder="e.g. Please pay particular attention to the background area…"
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none dark:bg-input/30"
            />
          </FieldGroup>

          <div className="flex justify-end pt-2">
            <Button onClick={handleNext} size="sm">
              Next: Upload Image
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold">Upload Image for Analysis</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upload the image you wish to submit for forensic review.
            </p>
          </div>

          <ImageUploader
            onChange={setImageFile}
            value={imageFile}
            disabled={submitting}
          />

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              size="sm"
              disabled={!imageFile || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <UploadCloud className="mr-1.5 size-4" />
                  Upload &amp; Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
