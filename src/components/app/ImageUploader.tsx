'use client'

import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import Image from 'next/image'
import { UploadCloud, X, FileImage, AlertCircle } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'
import { MAX_FILE_SIZE_BYTES, SUPPORTED_FILE_TYPES, RAW_EXTENSIONS } from '@/lib/constants'

interface ImageUploaderProps {
  onChange: (file: File | null) => void
  value?: File | null
  disabled?: boolean
}

const ACCEPT_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tif', '.tiff'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'image/webp': ['.webp'],
  // RAW camera formats
  'image/x-canon-cr2': ['.cr2'],
  'image/x-canon-cr3': ['.cr3'],
  'image/x-nikon-nef': ['.nef'],
  'image/x-sony-arw': ['.arw'],
  'image/x-adobe-dng': ['.dng'],
  'image/x-olympus-orf': ['.orf'],
  'image/x-panasonic-rw2': ['.rw2'],
  'image/x-fuji-raf': ['.raf'],
}

const DISPLAY_TYPES = 'JPEG, PNG, TIFF, HEIC, WEBP, RAW'

/** Some browsers report RAW files as application/octet-stream — accept by extension as fallback */
function isValidByExtension(file: File): boolean {
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase()
  return RAW_EXTENSIONS.includes(ext) || SUPPORTED_FILE_TYPES.includes(file.type)
}

export function ImageUploader({ onChange, value, disabled }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null)

      // Handle files that were rejected — check extension fallback for RAW files
      if (rejectedFiles.length > 0) {
        // Re-check: browser may have rejected a valid RAW file due to unknown MIME type
        const rawFallback = rejectedFiles.find(
          (r) => r.errors.every((e) => e.code === 'file-invalid-type') && isValidByExtension(r.file)
        )
        if (rawFallback && rawFallback.file.size <= MAX_FILE_SIZE_BYTES) {
          // Accept the RAW file despite MIME type rejection
          onChange(rawFallback.file)
          setPreview(null)
          return
        }

        const firstError = rejectedFiles[0].errors[0]
        if (firstError.code === 'file-too-large') {
          setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`)
        } else if (firstError.code === 'file-invalid-type') {
          setError(`Unsupported file type. Please upload: ${DISPLAY_TYPES}.`)
        } else {
          setError(firstError.message)
        }
        onChange(null)
        setPreview(null)
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      // Generate preview for displayable types
      if (
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/webp'
      ) {
        const url = URL.createObjectURL(file)
        setPreview(url)
      } else {
        setPreview(null)
      }

      onChange(file)
    },
    [onChange]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPT_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    maxFiles: 1,
    disabled,
  })

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setError(null)
    onChange(null)
  }

  if (value) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-4">
          {/* Preview or icon */}
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            {preview ? (
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <FileImage className="size-8 text-muted-foreground/60" />
              </div>
            )}
          </div>

          {/* File info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatFileSize(value.size)}
            </p>
            <p className="text-xs text-muted-foreground">{value.type || 'Unknown type'}</p>
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={clearFile}
            disabled={disabled}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Remove file"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200',
          isDragActive && !isDragReject
            ? 'border-primary bg-primary/5'
            : isDragReject
            ? 'border-destructive bg-destructive/5'
            : 'border-border bg-muted/10 hover:border-primary/50 hover:bg-muted/20',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <div
          className={cn(
            'mb-4 flex size-12 items-center justify-center rounded-full transition-colors',
            isDragActive && !isDragReject
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <UploadCloud className="size-6" />
        </div>

        {isDragActive && !isDragReject ? (
          <p className="text-sm font-medium text-primary">Drop to upload</p>
        ) : isDragReject ? (
          <p className="text-sm font-medium text-destructive">
            File type not accepted
          </p>
        ) : (
          <>
            <p className="text-sm font-medium">
              Drag &amp; drop your image here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              or{' '}
              <span className="text-primary underline underline-offset-2">
                click to browse
              </span>
            </p>
          </>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {DISPLAY_TYPES.split(', ').map((t) => (
            <span
              key={t}
              className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            Max 150 MB
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
