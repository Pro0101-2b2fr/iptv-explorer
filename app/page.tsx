'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCountries, useSearchChannels } from '@/lib/client-data'
import LogoImage from '@/components/LogoImage'

function HomeContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('search') || ''

  const { countries, loading, error } = useCountries()
  const { results: searchResults, total: searchTotal, loading: searchLoading } = useSearchChannels(query)

  // Countries view
  if (!query) {
    if (error) {
      return (
        <div className="text-center py-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Erreur de chargement : {error}
          </div>
          <p className="text-zinc-500 text-sm">Recharge la page ou réessaie plus tard.</p>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Chargement des pays...</p>
        </div>
      )
    }

    const totalChannels = countries.reduce((sum, c) => sum + c.channel_count, 0)

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Explorez les chaînes du monde entier
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
            {countries.length} pays · {totalChannels.toLocaleString()} chaînes
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {countries.map((country) => (
            <Link
              key={country.code}
              href={`/country/${country.code}`}
              className="group relative flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-zinc-700/50 transition-all duration-200 overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-red-500/[0.03] to-transparent" />
              <div className="text-4xl mb-3 drop-shadow-lg">{country.flag}</div>
              <h3 className="text-white text-sm font-medium text-center truncate w-full group-hover:text-red-400 transition-colors">
                {country.name}
              </h3>
              <span className="mt-1.5 text-xs text-zinc-500">
                {country.channel_count.toLocaleString()} chaînes
              </span>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Search results view
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Tous les pays
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">
        Recherche : &ldquo;{query}&rdquo;
      </h1>

      {searchLoading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Recherche en cours...</p>
        </div>
      ) : (
        <>
          <p className="text-zinc-500 text-sm mb-6">{searchTotal} résultat{searchTotal !== 1 ? 's' : ''}</p>

          {searchResults.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500">Aucune chaîne trouvée pour &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {searchResults.map((ch) => (
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
                        <span key={cat} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded-full border border-zinc-700/50">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
