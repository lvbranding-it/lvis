import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { MAX_FILE_SIZE_BYTES } from '@/lib/constants'
import { lookup } from 'dns/promises'
import { isIP } from 'net'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ caseId: string }>
}

// Block private/reserved IP ranges (SSRF protection)
function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4) return false
  const [a, b] = parts
  if (a === 10) return true                           // 10.0.0.0/8
  if (a === 127) return true                          // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true             // 169.254.0.0/16 link-local / AWS IMDS
  if (a === 172 && b >= 16 && b <= 31) return true    // 172.16.0.0/12
  if (a === 192 && b === 168) return true             // 192.168.0.0/16
  if (a === 0) return true                            // 0.0.0.0/8
  return false
}

async function validateImageUrl(rawUrl: string): Promise<{ error: string } | null> {
  if (rawUrl.length > 2048) {
    return { error: 'URL too long (max 2048 characters)' }
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { error: 'Invalid URL format' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { error: 'URL must use http or https' }
  }

  const hostname = parsed.hostname.toLowerCase()

  if (hostname === 'localhost' || hostname === '0.0.0.0') {
    return { error: 'URL points to a disallowed host' }
  }

  const ipVersion = isIP(hostname)
  if (ipVersion === 4) {
    if (isPrivateIp(hostname)) {
      return { error: 'URL points to a private or reserved IP address' }
    }
  } else if (ipVersion === 6) {
    if (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd')) {
      return { error: 'URL points to a private or reserved IP address' }
    }
  } else {
    // Resolve hostname and check resolved IP
    try {
      const resolved = await lookup(hostname)
      if (isPrivateIp(resolved.address)) {
        return { error: 'URL resolves to a private or reserved IP address' }
      }
    } catch {
      return { error: 'Could not resolve host' }
    }
  }

  return null
}

const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/tiff': '.tiff',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/bmp': '.bmp',
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

  // Parse body
  let imageUrl: string
  try {
    const body = await request.json()
    if (!body.imageUrl || typeof body.imageUrl !== 'string') throw new Error()
    imageUrl = body.imageUrl.trim()
  } catch {
    return Response.json({ error: 'imageUrl is required' }, { status: 400 })
  }

  // Validate URL + SSRF protection
  const validationError = await validateImageUrl(imageUrl)
  if (validationError) {
    return Response.json({ error: validationError.error }, { status: 400 })
  }

  // Derive filename from URL path
  let fileName = 'image'
  try {
    const parsed = new URL(imageUrl)
    const segments = parsed.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    if (last) fileName = decodeURIComponent(last)
  } catch {
    // keep default
  }
  fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    let contentType = ''
    let contentLength = 0

    // HEAD first to check content-type and size without downloading the body
    try {
      const headRes = await fetch(imageUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      })
      contentType = headRes.headers.get('content-type')?.split(';')[0].trim() ?? ''
      contentLength = parseInt(headRes.headers.get('content-length') ?? '0', 10) || 0
    } catch {
      // Some servers don't support HEAD — proceed to GET
    }

    if (contentType && !contentType.startsWith('image/')) {
      return Response.json(
        { error: `URL does not point to an image (content-type: ${contentType})` },
        { status: 400 }
      )
    }

    if (contentLength > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        { error: `Image too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` },
        { status: 400 }
      )
    }

    // Fetch the image
    const getRes = await fetch(imageUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    })

    if (!getRes.ok) {
      return Response.json(
        { error: `Failed to fetch image: HTTP ${getRes.status}` },
        { status: 400 }
      )
    }

    // Use actual content-type from GET if HEAD didn't provide one
    if (!contentType) {
      contentType = getRes.headers.get('content-type')?.split(';')[0].trim() ?? ''
    }

    if (!contentType.startsWith('image/')) {
      return Response.json(
        { error: `URL does not point to an image (content-type: ${contentType || 'unknown'})` },
        { status: 400 }
      )
    }

    // Add extension to filename if missing
    if (!fileName.includes('.')) {
      fileName += EXT_MAP[contentType] ?? '.jpg'
    }

    // Stream body with byte-count limit
    const reader = getRes.body?.getReader()
    if (!reader) {
      return Response.json({ error: 'Could not read image data' }, { status: 400 })
    }

    const chunks: Uint8Array[] = []
    let bytesRead = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytesRead += value.length
      if (bytesRead > MAX_FILE_SIZE_BYTES) {
        reader.cancel()
        return Response.json(
          { error: `Image too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` },
          { status: 400 }
        )
      }
      chunks.push(value)
    }

    const imageBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)))
    const serviceClient = createServiceClient()

    const timestamp = Date.now()
    const storagePath = `${user.id}/${caseId}/${timestamp}-${fileName}`

    const { error: uploadError } = await serviceClient.storage
      .from('case-images')
      .upload(storagePath, imageBuffer, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      console.error('[upload-url/route] storage error:', uploadError)
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
        file_type: contentType,
        file_size: imageBuffer.length,
      })
      .select()
      .single()

    if (fileError) {
      console.error('[upload-url/route] DB insert error:', fileError)
      return Response.json({ error: `DB insert error: ${fileError.message}` }, { status: 500 })
    }

    await serviceClient.from('cases').update({ status: 'in_review' }).eq('id', caseId)

    return Response.json({ storagePath, caseFileId: caseFile.id })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      return Response.json({ error: 'Image fetch timed out (15 s limit)' }, { status: 400 })
    }
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload-url/route] error:', msg)
    return Response.json({ error: `Failed to process URL: ${msg}` }, { status: 500 })
  } finally {
    clearTimeout(timeout)
  }
}
