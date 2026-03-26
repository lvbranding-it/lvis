import { createClient, createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE_BYTES, RAW_EXTENSIONS } from '@/lib/constants'

// Allow large RAW files (up to 150 MB) through the Next.js body parser
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const uploadMetaSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
})

type RouteContext = {
  params: Promise<{ caseId: string }>
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { caseId } = await ctx.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify case ownership
  const { data: existingCase, error: caseError } = await supabase
    .from('cases')
    .select('id, client_id')
    .eq('id', caseId)
    .single()

  if (caseError || !existingCase) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin && existingCase.client_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  const serviceClient = createServiceClient()

  // ── Raw binary path: RAW camera files sent as application/octet-stream ───────
  // Metadata (fileName, fileType, fileSize) travel in X-* request headers.
  // This avoids Next.js's multipart form-data parser size limits entirely.
  // Service role upload bypasses Supabase Storage bucket MIME restrictions.
  // ──────────────────────────────────────────────────────────────────────────
  if (contentType === 'application/octet-stream') {
    try {
      const fileName = request.headers.get('x-file-name') ?? ''
      const fileType = request.headers.get('x-file-type') ?? 'application/octet-stream'
      const fileSize = Number(request.headers.get('x-file-size') ?? '0')

      if (!fileName) {
        return Response.json({ error: 'Missing X-File-Name header' }, { status: 400 })
      }

      const fileExt = '.' + (fileName.split('.').pop() ?? '').toLowerCase()
      const isRawByExtension = RAW_EXTENSIONS.includes(fileExt)
      if (!SUPPORTED_FILE_TYPES.includes(fileType) && !isRawByExtension) {
        return Response.json(
          { error: `Unsupported file type: ${fileType}.` },
          { status: 422 }
        )
      }

      if (fileSize > MAX_FILE_SIZE_BYTES) {
        return Response.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` },
          { status: 422 }
        )
      }

      const timestamp = Date.now()
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${user.id}/${caseId}/${timestamp}-${sanitizedName}`

      // Read raw binary body — no form parser involved, no size limit from Next.js
      const arrayBuf = await request.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuf)

      // Supabase Storage enforces the bucket's allowed MIME type list even with service role.
      // RAW image types (image/x-canon-cr3, etc.) are not in any standard bucket allowlist.
      // We store as 'image/jpeg' so Storage accepts it — the real MIME type is preserved in
      // the case_files.file_type DB column and used by the analysis engine.
      const storageContentType = isRawByExtension ? 'image/jpeg' : fileType

      // Upload directly — service role bypasses RLS; storageContentType satisfies bucket policy
      const { error: uploadError } = await serviceClient.storage
        .from('case-images')
        .upload(storagePath, fileBuffer, {
          contentType: storageContentType,
          upsert: false,
        })

      if (uploadError) {
        console.error('[upload/route] RAW storage error:', uploadError)
        return Response.json(
          { error: `Storage upload error: ${uploadError.message}` },
          { status: 500 }
        )
      }

      const { data: caseFile, error: fileError } = await serviceClient
        .from('case_files')
        .insert({
          case_id: caseId,
          storage_path: storagePath,
          file_name: fileName,
          file_type: fileType,
          file_size: fileSize,
        })
        .select()
        .single()

      if (fileError) {
        console.error('[upload/route] DB insert error:', fileError)
        return Response.json({ error: `DB insert error: ${fileError.message}` }, { status: 500 })
      }

      await serviceClient.from('cases').update({ status: 'in_review' }).eq('id', caseId)

      // Return storagePath (no signedUrl — upload is already done server-side)
      return Response.json({ storagePath, caseFileId: caseFile.id })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[upload/route] RAW binary handler threw:', msg)
      return Response.json({ error: `Upload failed: ${msg}` }, { status: 500 })
    }
  }

  // ── JSON path: standard images use signed URL for direct client upload ──────
  const body = await request.json()
  const parsed = uploadMetaSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { fileName, fileType, fileSize } = parsed.data

  // Validate file type — accept by MIME type OR by RAW extension (browsers may report RAW as octet-stream)
  const fileExt = '.' + (fileName.split('.').pop() ?? '').toLowerCase()
  const isRawByExtension = RAW_EXTENSIONS.includes(fileExt)
  if (!SUPPORTED_FILE_TYPES.includes(fileType) && !isRawByExtension) {
    return Response.json(
      {
        error: `Unsupported file type: ${fileType}. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}.`,
      },
      { status: 422 }
    )
  }

  // Validate file size
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return Response.json(
      {
        error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
      },
      { status: 422 }
    )
  }

  // Generate unique storage path
  const timestamp = Date.now()
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${user.id}/${caseId}/${timestamp}-${sanitizedName}`

  // Create signed upload URL — requires service role (bypasses RLS)
  const { data: signedData, error: signedError } = await serviceClient.storage
    .from('case-images')
    .createSignedUploadUrl(storagePath)

  if (signedError || !signedData) {
    return Response.json(
      { error: `Storage error: ${signedError?.message ?? 'Failed to create upload URL'}` },
      { status: 500 }
    )
  }

  // Insert case_files record (service client — ownership already verified above)
  const { data: caseFile, error: fileError } = await serviceClient
    .from('case_files')
    .insert({
      case_id: caseId,
      storage_path: storagePath,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
    })
    .select()
    .single()

  if (fileError) {
    return Response.json({ error: `DB insert error: ${fileError.message} (code: ${fileError.code})` }, { status: 500 })
  }

  // Update case status
  await serviceClient
    .from('cases')
    .update({ status: 'in_review' })
    .eq('id', caseId)

  return Response.json({
    signedUrl: signedData.signedUrl,
    storagePath,
    caseFileId: caseFile.id,
  })
}
