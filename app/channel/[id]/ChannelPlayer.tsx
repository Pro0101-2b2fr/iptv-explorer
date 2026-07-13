'use client'

import { useState } from 'react'
import VideoPlayer from '@/components/VideoPlayer'

interface StreamOption {
  url: string
  quality: string | null
  label: string | null
}

export default function ChannelPlayer({
  channelName,
  streams,
}: {
  channelName: string
  streams: StreamOption[]
}) {
  // Try best quality first
  const bestIndex = (() => {
    const hdIdx = streams.findIndex(
      (s) => s.quality && (s.quality.includes('1080') || s.quality.includes('720'))
    )
    return hdIdx >= 0 ? hdIdx : 0
  })()

  const [activeUrl, setActiveUrl] = useState(streams[bestIndex]?.url || streams[0]?.url || '')

  const activeStream = streams.find((s) => s.url === activeUrl)

  return (
    <div>
      {/* Video player */}
      <VideoPlayer
        streamUrl={activeUrl}
        channelName={channelName}
        quality={activeStream?.quality || null}
        label={activeStream?.label || null}
      />

      {/* Stream selector */}
      {streams.length > 1 && (
        <div className="mt-3">
          <p className="text-zinc-500 text-xs mb-2">Source :</p>
          <div className="flex flex-wrap gap-2">
            {streams.map((stream, i) => (
              <button
                key={i}
                onClick={() => setActiveUrl(stream.url)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeUrl === stream.url
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
                }`}
              >
                {stream.quality || `Stream #${i + 1}`}
                {stream.label && (
                  <span className="ml-1 text-zinc-600">({stream.label})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stream list */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">
          Tous les flux ({streams.length})
        </h3>
        <div className="space-y-2">
          {streams.map((stream, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-zinc-400 text-sm">#{i + 1}</span>
                <span className="text-zinc-300 text-sm truncate">
                  {stream.quality || `Flux ${i + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {stream.quality && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full border border-emerald-500/20">
                    {stream.quality}
                  </span>
                )}
                {stream.label && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded-full border border-amber-500/20">
                    {stream.label}
                  </span>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(stream.url)
                  }}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs rounded-lg transition-colors"
                  title="Copier l&apos;URL"
                >
                  URL
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
