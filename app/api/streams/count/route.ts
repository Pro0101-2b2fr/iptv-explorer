import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'https://iptv-org.github.io/api'

interface Stream {
  channel: string | null
  feed: string | null
  title: string
  url: string
  quality: string | null
  label: string | null
  user_agent: string | null
  referrer: string | null
}

interface Channel {
  id: string
  country: string
}

let streamsCache: Stream[] | null = null
let streamsPromise: Promise<Stream[]> | null = null

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const country = searchParams.get('country')

  if (!country) {
    return NextResponse.json({ error: 'Country code required' }, { status: 400 })
  }

  try {
    if (!streamsCache) {
      if (!streamsPromise) streamsPromise = fetchJson<Stream[]>(`${API_BASE}/streams.json`)
      streamsCache = await streamsPromise
    }

    // Load channels to filter by country
    const channelsRes = await fetch(`${API_BASE}/channels.json`)
    const channels: Channel[] = await channelsRes.json()

    const countryChannels = channels.filter((ch) => ch.country === country.toUpperCase())
    const channelIds = new Set(countryChannels.map((ch) => ch.id))

    // Count streams per channel
    const streamCounts: Record<string, number> = {}
    for (const stream of streamsCache) {
      if (stream.channel && channelIds.has(stream.channel)) {
        streamCounts[stream.channel] = (streamCounts[stream.channel] || 0) + 1
      }
    }

    return NextResponse.json(streamCounts)
  } catch (error) {
    console.error('Stream count API error:', error)
    return NextResponse.json({ error: 'Failed to fetch stream counts' }, { status: 500 })
  }
}