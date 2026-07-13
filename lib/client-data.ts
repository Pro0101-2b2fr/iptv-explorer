'use client'

import { useState, useEffect } from 'react'

// Client-side data store — loads from iptv-org.github.io (CORS-friendly)
// and caches in memory for the session

interface Channel {
  id: string
  name: string
  alt_names: string[]
  network: string | null
  owners: string[]
  country: string
  categories: string[]
  is_nsfw: boolean
  launched: string | null
  closed: string | null
  replaced_by: string | null
  website: string | null
}

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

interface Country {
  name: string
  code: string
  flag: string
  channel_count?: number
}

interface Category {
  id: string
  name: string
}

const API_BASE = 'https://iptv-org.github.io/api'

let channelsCache: Channel[] | null = null
let channelsPromise: Promise<Channel[]> | null = null
let streamsCache: Stream[] | null = null
let streamsPromise: Promise<Stream[]> | null = null
let countriesCache: Country[] | null = null
let categoriesCache: Category[] | null = null

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json()
}

export function useCountries(): { countries: (Country & { channel_count: number })[]; loading: boolean; error: string | null } {
  const [countries, setCountries] = useState<(Country & { channel_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (!countriesCache) {
          countriesCache = await fetchJson<Country[]>(`${API_BASE}/countries.json`)
        }
        if (!channelsCache) {
          if (!channelsPromise) channelsPromise = fetchJson<Channel[]>(`${API_BASE}/channels.json`)
          channelsCache = await channelsPromise
        }
        if (cancelled) return

        const counts: Record<string, number> = {}
        for (const ch of channelsCache) {
          if (ch.country) counts[ch.country] = (counts[ch.country] || 0) + 1
        }

        const result = countriesCache
          .filter(c => counts[c.code] > 0)
          .map(c => ({ ...c, channel_count: counts[c.code] }))
          .sort((a, b) => b.channel_count - a.channel_count)

        if (!cancelled) {
          setCountries(result)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message)
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { countries, loading, error }
}

export function useChannelsByCountry(countryCode: string): { channels: Channel[]; loading: boolean } {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (!channelsCache) {
          if (!channelsPromise) channelsPromise = fetchJson<Channel[]>(`${API_BASE}/channels.json`)
          channelsCache = await channelsPromise
        }
        if (cancelled) return
        const code = countryCode.toUpperCase()
        const filtered = channelsCache.filter(ch => ch.country === code)
        if (!cancelled) {
          setChannels(filtered)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [countryCode])

  return { channels, loading }
}

export function useChannelById(id: string): { channel: Channel | null; loading: boolean } {
  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (!channelsCache) {
          if (!channelsPromise) channelsPromise = fetchJson<Channel[]>(`${API_BASE}/channels.json`)
          channelsCache = await channelsPromise
        }
        if (cancelled) return
        const found = channelsCache.find(ch => ch.id === id) || null
        if (!cancelled) {
          setChannel(found)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  return { channel, loading }
}

export function useStreams(channelId: string): { streams: Stream[]; loading: boolean } {
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (!streamsCache) {
          if (!streamsPromise) streamsPromise = fetchJson<Stream[]>(`${API_BASE}/streams.json`)
          streamsCache = await streamsPromise
        }
        if (cancelled) return
        const filtered = streamsCache.filter(s => s.channel === channelId)
        // Deduplicate
        const seen = new Set<string>()
        const deduped = filtered.filter(s => {
          if (seen.has(s.url)) return false
          seen.add(s.url)
          return true
        })
        if (!cancelled) {
          setStreams(deduped)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [channelId])

  return { streams, loading }
}

export function useCategories(): Category[] {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (categoriesCache) {
        if (!cancelled) setCategories(categoriesCache)
        return
      }
      try {
        const data = await fetchJson<Category[]>(`${API_BASE}/categories.json`)
        categoriesCache = data
        if (!cancelled) setCategories(data)
      } catch {
        // Ignore
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return categories
}

export function useCountryName(code: string): string {
  const [name, setName] = useState(code)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (countriesCache) {
        const c = countriesCache.find(c => c.code === code)
        if (c && !cancelled) setName(c.name)
        return
      }
      try {
        const data = await fetchJson<Country[]>(`${API_BASE}/countries.json`)
        countriesCache = data
        const c = data.find(c => c.code === code)
        if (c && !cancelled) setName(c.name)
      } catch {
        // Ignore
      }
    }
    load()
    return () => { cancelled = true }
  }, [code])

  return name
}

export function getLogoUrl(channelId: string): string {
  return `https://logo.iptv.org/${channelId}.png`
}

// Full-text search across channels
export function useSearchChannels(query: string): { results: Channel[]; total: number; loading: boolean } {
  const [results, setResults] = useState<Channel[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const q = query.toLowerCase().trim()

    async function load() {
      if (!q) {
        if (!cancelled) {
          setResults([])
          setTotal(0)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      try {
        if (!channelsCache) {
          if (!channelsPromise) channelsPromise = fetchJson<Channel[]>(`${API_BASE}/channels.json`)
          channelsCache = await channelsPromise
        }
        if (cancelled) return

        const matched = channelsCache.filter(
          ch =>
            ch.name.toLowerCase().includes(q) ||
            (ch.alt_names && ch.alt_names.some(a => a.toLowerCase().includes(q)))
        )

        if (!cancelled) {
          setResults(matched.slice(0, 60))
          setTotal(matched.length)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [query])

  return { results, total, loading }
}

// Fetch stream counts for all channels in a country
export function useStreamCounts(countryCode: string): { counts: Record<string, number>; loading: boolean } {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!countryCode) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/streams/count?country=${countryCode.toUpperCase()}`)
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setCounts(data)
        } else {
          if (!cancelled) setCounts({})
        }
      } catch {
        if (!cancelled) setCounts({})
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [countryCode])

  return { counts, loading }
}
