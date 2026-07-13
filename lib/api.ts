const BASE_URL = 'https://iptv-org.github.io/api'

// Server-side fetch with caching (Vercel edge cache)
async function cachedFetch<T>(url: string, revalidate = 86400): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate },
    headers: { 'User-Agent': 'iptv-explorer/1.0' },
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

// In-memory cache for the 10MB channels.json (module-level singleton)
let channelsCache: { data: any[]; timestamp: number } | null = null
const CHANNELS_CACHE_TTL = 86_400_000 // 24 hours in ms

function getCachedChannels(): any[] | null {
  if (channelsCache && Date.now() - channelsCache.timestamp < CHANNELS_CACHE_TTL) {
    return channelsCache.data
  }
  return null
}

function setCachedChannels(data: any[]): void {
  channelsCache = { data, timestamp: Date.now() }
}

export async function fetchChannels(filter?: {
  country?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{ channels: any[]; total: number }> {
  // Try memory cache first
  let all = getCachedChannels()
  if (!all) {
    all = await cachedFetch<any[]>(`${BASE_URL}/channels.json`, 86400)
    setCachedChannels(all)
  }

  let filtered = all

  if (filter?.country) {
    filtered = filtered.filter((ch: any) => ch.country === filter.country)
  }
  if (filter?.category) {
    filtered = filtered.filter(
      (ch: any) => ch.categories && ch.categories.includes(filter.category!)
    )
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase()
    filtered = filtered.filter(
      (ch: any) =>
        ch.name.toLowerCase().includes(q) ||
        (ch.alt_names && ch.alt_names.some((a: string) => a.toLowerCase().includes(q)))
    )
  }

  // Pagination
  const page = filter?.page || 1
  const limit = filter?.limit || 50
  const start = (page - 1) * limit
  const paginated = filtered.slice(start, start + limit)

  return {
    channels: paginated,
    total: filtered.length,
  }
}

export async function fetchChannelById(id: string): Promise<any | null> {
  let all = getCachedChannels()
  if (!all) {
    all = await cachedFetch<any[]>(`${BASE_URL}/channels.json`, 86400)
    setCachedChannels(all)
  }
  return all.find((ch: any) => ch.id === id) || null
}

export async function fetchStreams(channelId: string): Promise<any[]> {
  const all = await cachedFetch<any[]>(`${BASE_URL}/streams.json`, 86400)
  return all.filter((s: any) => s.channel === channelId)
}

let countriesCache: { data: any[]; timestamp: number } | null = null
const COUNTRIES_CACHE_TTL = 86_400_000

export async function fetchCountries(): Promise<any[]> {
  let data = countriesCache?.data ?? null
  if (!data) {
    data = await cachedFetch<any[]>(`${BASE_URL}/countries.json`, 86400)
    countriesCache = { data, timestamp: Date.now() }
  }
  return data
}

let categoriesCache: { data: any[]; timestamp: number } | null = null
const CATEGORIES_CACHE_TTL = 86_400_000

export async function fetchCategories(): Promise<any[]> {
  let data = categoriesCache?.data ?? null
  if (!data) {
    data = await cachedFetch<any[]>(`${BASE_URL}/categories.json`, 86400)
    categoriesCache = { data, timestamp: Date.now() }
  }
  return data
}

export async function fetchCountriesWithCounts(): Promise<any[]> {
  const [countries, channels] = await Promise.all([
    fetchCountries(),
    (async () => {
      let all = getCachedChannels()
      if (!all) {
        all = await cachedFetch<any[]>(`${BASE_URL}/channels.json`, 86400)
        setCachedChannels(all)
      }
      return all
    })(),
  ])

  // Count channels per country
  const counts: Record<string, number> = {}
  for (const ch of channels) {
    if (ch.country) {
      counts[ch.country] = (counts[ch.country] || 0) + 1
    }
  }

  return countries
    .map((c: any) => ({
      ...c,
      channel_count: counts[c.code] || 0,
    }))
    .filter((c: any) => c.channel_count > 0)
    .sort((a: any, b: any) => b.channel_count - a.channel_count)
}

export function getLogoUrl(channelId: string): string {
  return `https://logo.iptv.org/${channelId}.png`
}
