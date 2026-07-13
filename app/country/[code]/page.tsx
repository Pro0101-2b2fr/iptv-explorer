'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useChannelsByCountry, useCategories, useCountryName } from '@/lib/client-data'
import LogoImage from '@/components/LogoImage'
import FavoriteButton from '@/components/FavoriteButton'
import { ChannelListSkeletons, Skeleton } from '@/components/Skeleton'

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

export default function CountryPage() {
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const { channels, loading } = useChannelsByCountry(code)
  const countryName = useCountryName(code)
  const categories = useCategories()
  const perPage = 40

  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortBy, setSortBy] = useStorageState('name-asc', 'country-sort')
  const [localSearch, setLocalSearch] = useState('')

  // Read initial state from URL (avoid useSearchParams — needs Suspense)
  const getStateFromUrl = useCallback((): { cat: string | null; pg: number } => {
    if (typeof window === 'undefined') return { cat: null, pg: 1 }
    const sp = new URLSearchParams(window.location.search)
    return {
      cat: sp.get('category') || null,
      pg: Math.max(1, parseInt(sp.get('page') || '1', 10)),
    }
  }, [])

  const initial = getStateFromUrl()
  const [activeCategory, setActiveCategory] = useState<string | null>(initial.cat)
  const [page, setPage] = useState(initial.pg)
  const syncedOnce = useRef(false)

  // Sync state back to URL when category or page changes
  const syncUrl = useCallback(
    (cat: string | null, p: number) => {
      const sp = new URLSearchParams()
      if (cat) sp.set('category', cat)
      if (p > 1) sp.set('page', p.toString())
      const qs = sp.toString()
      const newUrl = `/country/${code}${qs ? '?' + qs : ''}`
      window.history.replaceState(null, '', newUrl)
    },
    [code]
  )

  // Sync initial state once channels are loaded (handles fresh page loads with URL params)
  useEffect(() => {
    if (loading || channels.length === 0 || syncedOnce.current) return
    const state = getStateFromUrl()
    setActiveCategory(state.cat)
    setPage(state.pg)
    syncedOnce.current = true
  }, [loading, channels.length, getStateFromUrl])

  const handleCategory = (cat: string | null) => {
    setActiveCategory(cat)
    setPage(1)
    syncUrl(cat, 1)
  }

  const handlePage = (p: number) => {
    setPage(p)
    syncUrl(activeCategory, p)
  }

  // Apply filters
  const filteredByCategory = useMemo(() => {
    return activeCategory
      ? channels.filter(ch => ch.categories?.includes(activeCategory))
      : channels
  }, [channels, activeCategory])

  // Apply local search
  const filteredBySearch = useMemo(() => {
    if (!localSearch.trim()) return filteredByCategory
    const searchTerm = localSearch.toLowerCase().trim()
    return filteredByCategory.filter(ch => 
      ch.name.toLowerCase().includes(searchTerm) ||
      (ch.alt_names && ch.alt_names.some(name => name.toLowerCase().includes(searchTerm)))
    )
  }, [filteredByCategory, localSearch])

  // Apply sorting
  const sortedChannels = useMemo(() => {
    return [...filteredBySearch].sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name)
      } else if (sortBy === 'streams-asc') {
        // We don't have stream count easily available, would need additional data
        // For now, fallback to name
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'streams-desc') {
        return b.name.localeCompare(a.name)
      }
      return 0
    })
  }, [filteredBySearch, sortBy])

  // Paginate
  const totalPages = Math.ceil(sortedChannels.length / perPage)
  const paginated = sortedChannels.slice((page - 1) * perPage, page * perPage)

  // Adjust page if it exceeds new total
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages)
      syncUrl(activeCategory, totalPages)
    }
  }, [totalPages, page, activeCategory, syncUrl])

  // Get stream count for a channel (would need to fetch streams data)
  // For now, we'll simulate or leave as placeholder
  const getStreamCount = useCallback((channelId: string): number => {
    // In a real app, we would fetch streams data or have it pre-loaded
    // For demo purposes, return a mock value or 0
    return 0
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="w-32 h-5 mb-6" />
        <div className="mb-2">
          <Skeleton className="w-72 h-8" />
        </div>
        <Skeleton className="w-40 h-4 mb-4" />
        {/* Category filter skeletons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-20 h-7 rounded-lg" />
          ))}
        </div>
        <ChannelListSkeletons count={10} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Tous les pays
      </Link>

      {/* Country header */}
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Chaînes de {countryName}
        </h1>
      </div>

      <p className="text-zinc-500 text-sm mb-6">
        {sortedChannels.length} chaîne{sortedChannels.length !== 1 ? 's' : ''}
        {activeCategory ? ` · ${activeCategory}` : ''}
      </p>

      {/* Controls: Search, View, Sort */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Local Search */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Rechercher dans ce pays..."
            className="pl-8 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all w-48"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Vue :</span>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
              }`}
            >
              Grille
            </button>
          </div>
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.preventDefault()
              // Toggle sort order for same field, or cycle through options
              const order = sortBy.endsWith('-asc') ? '-desc' : '-asc'
              const base = sortBy.split('-')[0]
              setSortBy(`${base}${order}`)
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all border border-zinc-700/50 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
          >
            <span className="capitalize">
              {sortBy === 'name-asc' || sortBy === 'name-desc' ? 'Nom' : 'Flux'}
            </span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute left-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-xl z-10 hidden">
            {/* Sort options would go here in a dropdown */}
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
            !activeCategory
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
          }`}
        >
          Toutes
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              activeCategory === cat.id
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Channels display */}
      {paginated.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500">Aucune chaîne trouvée</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="space-y-2">
              {paginated.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/channel/${ch.id}`}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all duration-200"
                >
                  <LogoImage
                    src={`https://logo.iptv.org/${ch.id}.png`}
                    alt={ch.name}
                    className="w-full h-full object-contain p-1"
                    containerClassName="w-14 h-14 rounded-lg bg-zinc-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate group-hover:text-red-400 transition-colors">
                      {ch.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {ch.categories?.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded-full border border-zinc-700/50"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="text-zinc-500">{ch.country}</span>
                      <span className="text-zinc-500">·</span>
                      <span className="text-zinc-400">{getStreamCount(ch.id)} flux</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <FavoriteButton
                      channelId={ch.id}
                      channelName={ch.name}
                      channelCountry={ch.country}
                      channelCategories={ch.categories}
                      iconOnly
                    />
                  </div>
                  <svg className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {paginated.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/channel/${ch.id}`}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all duration-200"
                >
                  <LogoImage
                    src={`https://logo.iptv.org/${ch.id}.png`}
                    alt={ch.name}
                    className="w-full h-full object-contain p-2"
                    containerClassName="w-16 h-16 rounded-lg bg-zinc-800 shrink-0"
                  />
                  <h3 className="text-white font-medium text-sm text-center truncate w-full group-hover:text-red-400 transition-colors">
                    {ch.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-2 text-xs">
                    {ch.categories?.slice(0, 2).map((cat) => (
                      <span key={cat} className="px-1 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] rounded-full border border-zinc-700/50">
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="text-zinc-500">{ch.country}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-400">{getStreamCount(ch.id)} flux</span>
                  </div>
                  <FavoriteButton
                    channelId={ch.id}
                    channelName={ch.name}
                    channelCountry={ch.country}
                    channelCategories={ch.categories}
                    iconOnly
                    className="mt-2"
                  />
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg bg-zinc-800/50 text-zinc-300 text-sm hover:bg-zinc-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <span className="text-zinc-500 text-sm">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg bg-zinc-800/50 text-zinc-300 text-sm hover:bg-zinc-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}

// Custom hook for useStorageState (localStorage persistence)
function useStorageState<T>(defaultValue: T, key: string): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    const saved = window.localStorage.getItem(key)
    try {
      return saved ? (JSON.parse(saved) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setStateWithStorage = useCallback((value: T) => {
    setState(value)
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage errors
    }
  }, [key])

  return [state, setStateWithStorage]
}