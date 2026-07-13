import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel Pro: max 60s for Serverless

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  const userAgent = searchParams.get('ua')
  const referrer = searchParams.get('ref')

  if (!url) {
    return NextResponse.json({ error: 'url parameter required' }, { status: 400 })
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      'Connection': 'keep-alive',
    }
    if (referrer) headers['Referer'] = referrer

    // Fetch with longer timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55000)

    const response = await fetch(url, {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Stream returned HTTP ${response.status}` },
        { status: response.status }
      )
    }

    const body = response.body
    if (!body) {
      return NextResponse.json({ error: 'Empty response body' }, { status: 502 })
    }

    // Get content-type from upstream, or default to video/MP2T
    let contentType = response.headers.get('content-type') || ''
    if (!contentType || contentType === 'application/octet-stream' || contentType === 'text/plain') {
      // Guess from URL
      const path = url.split('?')[0].toLowerCase()
      if (path.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl'
      else if (path.endsWith('.ts')) contentType = 'video/mp2t'
      else if (path.endsWith('.mp4')) contentType = 'video/mp4'
      else if (path.endsWith('.flv')) contentType = 'video/x-flv'
      else contentType = 'video/mp2t' // Default to MPEG-TS for IPTV streams
    }

    // Important: pass Content-Length if available for seeking
    const contentLength = response.headers.get('content-length')

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Accept-Ranges': 'bytes',
    }

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
    }

    return new NextResponse(body, { headers: responseHeaders })
  } catch (error) {
    console.error('Proxy error:', error)
    const message = error instanceof Error ? error.message : 'Proxy failed'
    // AbortError = timeout
    if (message.includes('aborted') || message.includes('timeout')) {
      return NextResponse.json({ error: 'Stream timeout (Vercel limit: 60s)' }, { status: 504 })
    }
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
}
