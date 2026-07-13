'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useChannelById, useStreams, useCountryName } from '@/lib/client-data'
import LogoImage from '@/components/LogoImage'
import VideoPlayer from '@/components/VideoPlayer'

export default function ChannelPage() {
  const params = useParams()
  const id = params.id as string

  const { channel, loading: loadingCh } = useChannelById(id)
  const { streams, loading: loadingStr } = useStreams(id)
  const countryName = useCountryName(channel?.country || '')

  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  const [useProxy, setUseProxy] = useState(false)

  if (loadingCh) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Chargement...</p>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-zinc-500">Chaîne introuvable</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm hover:bg-red-500/30 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  // Deduplicate streams
  const seen = new Set<string>()
  const uniqueStreams = streams.filter(s => {
    if (seen.has(s.url)) return false
    seen.add(s.url)
    return true
  })

  // Best quality first for default selection
  const defaultStream = (() => {
    if (activeUrl) return uniqueStreams.find(s => s.url === activeUrl)
    const hd = uniqueStreams.find(s => s.quality && (s.quality.includes('1080') || s.quality.includes('720')))
    return hd || uniqueStreams[0] || null
  })()

  // Proxy only for HLS (segmented .ts files, short fetches → fits Vercel timeout)
  // TS/FLV streams go direct to let mpegts.js handle them with custom headers
  const isHls = defaultStream?.url.toLowerCase().includes('.m3u8')
  const displayUrl = useProxy && defaultStream && isHls
    ? `/api/proxy?url=${encodeURIComponent(defaultStream.url)}${defaultStream.user_agent ? `&ua=${encodeURIComponent(defaultStream.user_agent)}` : ''}${defaultStream.referrer ? `&ref=${encodeURIComponent(defaultStream.referrer)}` : ''}`
    : defaultStream?.url || ''

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
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
          src={`https://logo.iptv.org/${channel.id}.png`}
          alt={channel.name}
          className="w-full h-full object-contain p-2"
          containerClassName="w-20 h-20 rounded-xl bg-zinc-800 shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{channel.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {channel.country && (
              <span className="text-sm text-zinc-400">{countryName}</span>
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

      {/* Player section */}
      {defaultStream ? (
        <div className="mb-8">
          <VideoPlayer
            streamUrl={displayUrl}
            channelName={channel.name}
            quality={defaultStream.quality || null}
            label={defaultStream.label || null}
            isProxied={useProxy}
            userAgent={defaultStream.user_agent || null}
            referrer={defaultStream.referrer || null}
          />

          {/* Stream selector */}
          {uniqueStreams.length > 1 && (
            <div className="mt-4">
              <p className="text-zinc-500 text-xs mb-2">Sources disponibles ({uniqueStreams.length}) :</p>
              <div className="flex flex-wrap gap-2">
                {uniqueStreams.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveUrl(s.url)
                      setUseProxy(false)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      s.url === activeUrl || (!activeUrl && i === 0)
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
                    }`}
                  >
                    {s.quality || `Flux #${i + 1}`}
                    {s.label && <span className="ml-1 text-zinc-600">({s.label})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Proxy toggle */}
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={e => setUseProxy(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-500 focus:ring-red-500/20 focus:ring-offset-0 accent-red-500"
              />
              <span className="text-zinc-400 text-xs">
                Proxy CORS {isHls ? '(flux HLS)' : '(HLS uniquement — TS direct)'}
              </span>
            </label>

            {/* Open in VLC */}
            <div className="ml-auto flex items-center gap-2">
              <a
                href={defaultStream.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 text-xs hover:bg-zinc-700/50 hover:text-zinc-200 transition-colors"
              >
                Ouvrir dans VLC ↗
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-center">
          <p className="text-zinc-500">
            {loadingStr ? 'Recherche des flux...' : 'Aucun flux disponible pour cette chaîne'}
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-8 p-4 rounded-xl bg-zinc-900/20 border border-zinc-800/30">
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Métadonnées</h3>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <dt className="text-zinc-600">ID</dt>
          <dd className="text-zinc-400 font-mono">{channel.id}</dd>
          {channel.network && (
            <><dt className="text-zinc-600">Réseau</dt><dd className="text-zinc-400">{channel.network}</dd></>
          )}
          {channel.launched && (
            <><dt className="text-zinc-600">Lancée</dt><dd className="text-zinc-400">{channel.launched}</dd></>
          )}
          {channel.closed && (
            <><dt className="text-zinc-600">Fermée</dt><dd className="text-zinc-400">{channel.closed}</dd></>
          )}
        </dl>
      </div>

      {/* All streams list */}
      {uniqueStreams.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Tous les flux ({uniqueStreams.length})</h3>
          <div className="space-y-2">
            {uniqueStreams.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-zinc-400 text-sm">#{i + 1}</span>
                  <span className="text-zinc-300 text-sm truncate">
                    {s.quality || `Flux ${i + 1}`}
                  </span>
                  {s.label && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded-full border border-amber-500/20">
                      {s.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.quality && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full border border-emerald-500/20">
                      {s.quality}
                    </span>
                  )}
                  <button
                    onClick={() => navigator.clipboard?.writeText(s.url)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs rounded-lg transition-colors"
                    title="Copier l'URL"
                  >
                    URL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
