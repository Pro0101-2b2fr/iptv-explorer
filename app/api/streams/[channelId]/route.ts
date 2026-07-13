import type { NextRequest } from 'next/server'
import { fetchStreams } from '@/lib/api'

export const dynamic = 'force-dynamic'
export const revalidate = 86400

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params

  try {
    const streams = await fetchStreams(channelId)
    return Response.json({ streams })
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Failed to fetch streams', streams: [] }, { status: 500 })
  }
}
