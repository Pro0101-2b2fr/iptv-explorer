import { Suspense } from 'react'
import CountryCard from '@/components/CountryCard'
import LogoImage from '@/components/LogoImage'
import { fetchCountriesWithCounts, fetchChannels, getLogoUrl } from '@/lib/api'

export const dynamic = 'force-static'
export const revalidate = 86400

async function CountryGrid() {
  const countries = await fetchCountriesWithCounts()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {countries.map((country) => (
        <CountryCard key={country.code} country={country} />
      ))}
    </div>
  )
}

async function SearchResults({ query }: { query: string }) {
  const { channels, total } = await fetchChannels({ search: query, limit: 100 })

  return (
    <div>
      <p className="text-zinc-400 text-sm mb-6">
        {total} résultat{total !== 1 ? 's' : ''} pour &quot;{query}&quot;
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {channels.slice(0, 60).map((ch) => (
          <a
            key={ch.id}
            href={`/channel/${ch.id}`}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-zinc-700/50 transition-all duration-200 group"
          >
            <LogoImage
              src={getLogoUrl(ch.id)}
              alt={ch.name}
              className="w-full h-full object-contain p-1"
              containerClassName="w-12 h-12 rounded-lg bg-zinc-800"
            />
            <span className="text-white text-xs text-center truncate w-full group-hover:text-red-400 transition-colors">
              {ch.name}
            </span>
            <span className="text-zinc-600 text-[10px]">{ch.country}</span>
          </a>
        ))}
      </div>
      {total > 60 && (
        <p className="text-center text-zinc-500 text-sm mt-6">
          +{total - 60} résultats supplémentaires. Affinez votre recherche.
        </p>
      )}
    </div>
  )
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {search ? (
        <>
          <h1 className="text-2xl font-bold text-white mb-2">Résultats de recherche</h1>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <SearchResults query={search} />
          </Suspense>
        </>
      ) : (
        <>
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Explorez les chaînes du monde entier
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
              Parcourez des milliers de chaînes TV en direct, classées par pays et par catégorie.
            </p>
          </div>

          {/* Countries */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-zinc-500 text-sm">Chargement des pays...</p>
                </div>
              </div>
            }
          >
            <CountryGrid />
          </Suspense>
        </>
      )}
    </div>
  )
}
