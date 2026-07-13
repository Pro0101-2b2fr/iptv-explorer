import { notFound } from 'next/navigation'
import Link from 'next/link'
import LogoImage from '@/components/LogoImage'
import { fetchChannelById, fetchStreams, fetchCountries, getLogoUrl } from '@/lib/api'
import ChannelPlayer from './ChannelPlayer'

export const revalidate = 86400
export const dynamic = 'force-static'

interface Props {
  params: Promise<{ id: string }>
}

async function ChannelContent({ id }: { id: string }) {
  const [channel, streams] = await Promise.all([
    fetchChannelById(id),
    fetchStreams(id),
  ])

  if (!channel) notFound()

  const countries = await fetchCountries()
  const country = countries.find((c: any) => c.code === channel.country)

  // Deduplicate streams by URL
  const seen = new Set<string>()
  const uniqueStreams = streams.filter((s: any) => {
    if (seen.has(s.url)) return false
    seen.add(s.url)
    return true
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href={channel.country ? `/country/${channel.country}` : '/'}
        className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </Link>

      {/* Channel header */}
      <div className="flex items-start gap-5 mb-8">
        <LogoImage
          src={getLogoUrl(channel.id)}
          alt={channel.name}
          className="w-full h-full object-contain p-2"
          containerClassName="w-20 h-20 rounded-xl bg-zinc-800 shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{channel.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {country && (
              <span className="text-sm text-zinc-400">
                {country.flag} {country.name}
              </span>
            )}
            {channel.categories?.map((cat: string) => (
              <span
                key={cat}
                className="px-2.5 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-full border border-zinc-700/50 capitalize"
              >
                {cat}
              </span>
            ))}
          </div>
          {channel.website && (
            <a
              href={channel.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-500 hover:text-red-400 text-xs mt-2 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Site officiel
            </a>
          )}
        </div>
      </div>

      {/* Video player + streams (client component) */}
      {uniqueStreams.length > 0 ? (
        <div className="mb-8">
          <ChannelPlayer
            channelName={channel.name}
            streams={uniqueStreams.map((s: any) => ({
              url: s.url,
              quality: s.quality,
              label: s.label,
            }))}
          />
        </div>
      ) : (
        <div className="mb-8 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-center">
          <p className="text-zinc-500">Aucun flux disponible pour cette chaîne</p>
        </div>
      )}

      {/* Channel metadata */}
      <div className="mt-8 p-4 rounded-xl bg-zinc-900/20 border border-zinc-800/30">
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Métadonnées</h3>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <dt className="text-zinc-600">ID</dt>
          <dd className="text-zinc-400 font-mono">{channel.id}</dd>
          {channel.network && (
            <>
              <dt className="text-zinc-600">Réseau</dt>
              <dd className="text-zinc-400">{channel.network}</dd>
            </>
          )}
          {channel.launched && (
            <>
              <dt className="text-zinc-600">Lancée</dt>
              <dd className="text-zinc-400">{channel.launched}</dd>
            </>
          )}
          {channel.closed && (
            <>
              <dt className="text-zinc-600">Fermée</dt>
              <dd className="text-zinc-400">{channel.closed}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  )
}

export default async function ChannelPage({ params }: Props) {
  const { id } = await params
  return <ChannelContent id={id} />
}
