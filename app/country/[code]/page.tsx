'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useChannelsByCountry, useCategories, useCountryName } from '@/lib/client-data'
import LogoImage from '@/components/LogoImage'

export default function CountryPage() {
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const { channels, loading } = useChannelsByCountry(code)
  const countryName = useCountryName(code)
  const categories = useCategories()
  const perPage = 40

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
  const filtered = activeCategory
    ? channels.filter(ch => ch.categories?.includes(activeCategory))
    : channels

  // Paginate
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  // Adjust page if it exceeds new total
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages)
      syncUrl(activeCategory, totalPages)
    }
  }, [totalPages, page, activeCategory, syncUrl])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Chargement des chaînes...</p>
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
        {filtered.length} chaîne{filtered.length !== 1 ? 's' : ''}
        {activeCategory ? ` · ${activeCategory}` : ''}
      </p>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

      {/* Channels grid */}
      {paginated.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500">Aucune chaîne trouvée</p>
        </div>
      ) : (
        <div className="grid gap-3">
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
                  {ch.categories && ch.categories.length > 3 && (
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] rounded-full">
                      +{ch.categories.length - 3}
                    </span>
                  )}
                </div>
              </div>
              <svg
                className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition-colors shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
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
