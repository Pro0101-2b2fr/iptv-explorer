import { NextRequest, NextResponse } from 'next/server'

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
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
    }

    // Forward optional headers that streams may require
    if (userAgent) headers['User-Agent'] = userAgent
    if (referrer) headers['Referer'] = referrer

    // Fetch the stream
    const response = await fetch(url, {
      headers,
      // Don't follow redirects — let the client handle them
      redirect: 'follow',
      // Signal handling — Next.js manages timeouts
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Stream returned HTTP ${response.status}` },
        { status: response.status }
      )
    }

    // Stream the response back with permissive CORS headers
    const body = response.body
    if (!body) {
      return NextResponse.json({ error: 'No response body' }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Disposition': 'inline',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy failed' },
      { status: 502 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
}
