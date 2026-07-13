import { notFound } from 'next/navigation'
import Link from 'next/link'
import ChannelCard from '@/components/ChannelCard'
import Filters from '@/components/Filters'
import { fetchCountries, fetchCategories, fetchChannels } from '@/lib/api'

export const revalidate = 86400
export const dynamic = 'force-static'

interface Props {
  params: Promise<{ code: string }>
  searchParams: Promise<{ category?: string; page?: string }>
}

// Server component that fetches channels directly
async function CountryChannels({
  code,
  category,
  page,
}: {
  code: string
  category?: string
  page: number
}) {
  const { channels, total } = await fetchChannels({
    country: code,
    category,
    page,
    limit: 60,
  })

  const totalPages = Math.ceil(total / 60)

  if (channels.length === 0 && page === 1) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Aucune chaîne trouvée</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-zinc-500 text-sm mb-4">
        {total} chaîne{total !== 1 ? 's' : ''}
      </p>

      <div className="grid gap-3">
        {channels.map((ch: any) => (
          <ChannelCard key={ch.id} channel={ch} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          {page > 1 && (
            <Link
              href={`/country/${code}?page=${page - 1}${category ? `&category=${category}` : ''}`}
              className="px-4 py-2 rounded-lg bg-zinc-800/50 text-zinc-300 text-sm hover:bg-zinc-700/50 transition-colors"
            >
              ← Précédent
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/country/${code}?page=${page + 1}${category ? `&category=${category}` : ''}`}
              className="px-4 py-2 rounded-lg bg-zinc-800/50 text-zinc-300 text-sm hover:bg-zinc-700/50 transition-colors"
            >
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default async function CountryPage({ params, searchParams }: Props) {
  const { code } = await params
  const { category, page: pageStr } = await searchParams
  const page = parseInt(pageStr || '1', 10)

  const [countries, categories] = await Promise.all([
    fetchCountries(),
    fetchCategories(),
  ])

  const country = countries.find((c: any) => c.code?.toUpperCase() === code?.toUpperCase())
  if (!country) notFound()

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
      <div className="flex items-center gap-4 mb-8">
        <div className="text-5xl">{country.flag}</div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Chaînes de {country.name}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Code pays: {code.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="mb-6">
        <Filters categories={categories} currentCategory={category} />
      </div>

      {/* Channels */}
      <CountryChannels code={code.toLowerCase()} category={category} page={page} />
    </div>
  )
}
