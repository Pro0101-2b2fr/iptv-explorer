import type { NextRequest } from 'next/server'
import { fetchChannels, fetchCategories } from '@/lib/api'

export const dynamic = 'force-dynamic'
export const revalidate = 86400

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country') || undefined
  const category = searchParams.get('category') || undefined
  const search = searchParams.get('search') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  try {
    const { channels, total } = await fetchChannels({
      country,
      category,
      search,
      page,
      limit,
    })

    const total_pages = Math.ceil(total / limit)

    return Response.json({
      channels,
      total,
      page,
      limit,
      total_pages,
    })
  } catch (error) {
    console.error('API error:', error)
    return Response.json(
      { error: 'Failed to fetch channels', channels: [], total: 0, page: 1, limit: 50, total_pages: 0 },
      { status: 500 }
    )
  }
}
