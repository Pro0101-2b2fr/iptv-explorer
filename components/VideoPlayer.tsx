'use client'

import { useState, useRef, useEffect } from 'react'

interface VideoPlayerProps {
  streamUrl: string
  channelName: string
  quality: string | null
  label: string | null
  userAgent?: string | null
  referrer?: string | null
}

export default function VideoPlayer({ streamUrl, channelName, quality, label }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [engine, setEngine] = useState<string>('')

  const getMimeType = (url: string): string => {
    const parts = url.split('.')
    if (parts.length < 2) return ''
    const ext = parts.pop()!.toLowerCase()
    switch (ext) {
      case 'mp4': return 'video/mp4'
      case 'ts': return 'video/mp2t'
      case 'm3u8': return 'application/vnd.apple.mpegurl'
      case 'webm': return 'video/webm'
      default: return ''
    }
  }

  const getDownloadUrl = () => streamUrl
  const isGeo = label?.toLowerCase().includes('geo')
  const isNot247 = label?.toLowerCase().includes('not 24/7')
  const isHLS = streamUrl.toLowerCase().endsWith('.m3u8')

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) { setStatus('idle'); return }

    // Reset
    setStatus('loading')
    setErrorMsg('')
    setEngine('')

    const mimeType = getMimeType(streamUrl)
    const canPlayNative = mimeType ? video.canPlayType(mimeType) !== '' : false

    // If HLS, try HLS.js (with Safari native fallback)
    if (isHLS) {
      const loadHLS = async () => {
        // Clean up any previous instance
        if (video.src) {
          video.removeAttribute('src')
          video.load()
        }

        // Try HLS.js
        try {
          const Hls = (await import('hls.js')).default
          if (!Hls.isSupported()) {
            setStatus('error')
            setErrorMsg('HLS non supporté par ce navigateur')
            setEngine(' aucun')
            return
          }
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          })
          hls.loadSource(streamUrl)
          hls.attachMedia(video)

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {
              // If play fails due to user interaction, keep loading state until user clicks
              setStatus('loading')
              setErrorMsg('Clique sur le lecteur pour lancer la lecture')
            })
          })
          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              console.warn('HLS fatal error:', data.type, data.details)
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setErrorMsg('Erreur réseau – vérifie ton connexion ou essaie plus tard')
                  break
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setErrorMsg('Erreur média – flux peut être corrompu ou géo‑bloqué')
                  break
                default:
                  setErrorMsg(`Erreur HLS: ${data.type}`)
              }
              setStatus('error')
              setEngine(' HLS')
              hls.destroy()
            }
          })
          video.addEventListener('playing', () => setStatus('playing'), { once: true })
          video.addEventListener('waiting', () => {
            if (status === 'playing') setStatus('loading')
          })
        } catch (e) {
          console.error('Failed to load Hls', e)
          setStatus('error')
          setErrorMsg('Impossible de charger le lecteur HLS')
        }
      }

      loadHLS()
      return
    }

    // Not HLS: try native playback if browser reports support
    if (canPlayNative) {
      video.src = streamUrl
      video.addEventListener('canplay', () => setStatus('playing'), { once: true })
      video.addEventListener('error', () => {
        setStatus('error')
        setErrorMsg('Erreur de lecture native. Le navigateur ne supporte peut-être pas ce format.')
      }, { once: true })
      video.play().catch(() => {
        setStatus('error')
        setErrorMsg('Impossible de démarrer la lecture. Clique sur le lecteur pour réessayer.')
      })
      return
    }

    // Unsupported format – suggest VLC
    setStatus('error')
    setErrorMsg(`Format ${(streamUrl.split('.').pop() ?? '').toUpperCase()} non lisible dans le navigateur. Utilisez VLC.`)
    // Provide a download link for the raw stream (may be .ts, .mp4, etc.)
  }, [streamUrl, isHLS])

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain bg-black"
        controls
        playsInline
        poster={`data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect fill="#0a0a0a" width="1280" height="720"/><text fill="#444" font-family="sans-serif" font-size="24" text-anchor="middle" x="640" y="360">${channelName}</text></svg>`
        )}`} />
      
      {/* Overlay for loading / error / idle */}
      {status !== 'playing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm">Chargement du flux...</p>
                {engine && <p className="text-zinc-600 text-xs">{engine}</p>}
              </div>
            )}
            {status === 'error' && (
              <div className="flex flex-col items-center gap-2 px-6">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-red-400 text-sm font-medium">Flux non lisible</p>
                <p className="text-zinc-500 text-xs max-w-sm">{errorMsg}</p>
                {/* Offer to open/download the raw stream for VLC */}
                <div className="flex gap-2 mt-3">
                  <a
                    href={getDownloadUrl()}
                    download={`${channelName.replace(/[^a-z0-9]/gi, '_')}.${streamUrl.split('.').pop()}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-xs hover:bg-emerald-600/30 transition-colors"
                  >
                    Télécharger le flux pour VLC
                  </a>
                  <button
                    onClick={() => {
                      // Attempt to launch VLC via custom protocol (may not work in all browsers)
                      const vlcUrl = `vlc://${encodeURIComponent(getDownloadUrl())}`
                      // Fallback to download if protocol not handled
                      const dl = document.createElement('a')
                      dl.href = getDownloadUrl()
                      dl.download = `${channelName.replace(/[^a-z0-9]/gi, '_')}.${streamUrl.split('.').pop()}`
                      dl.click()
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/30 text-xs hover:bg-blue-600/30 transition-colors"
                  >
                    Ouvrir dans VLC
                  </button>
                </div>
              </div>
            )}
            {status === 'idle' && (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                <p className="text-zinc-400 text-sm">Sélectionne un flux</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Labels (geo, not 24/7, quality, protocol) */}
      <div className="absolute top-3 left-3 flex gap-2">
        {isGeo && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
            Geo
          </span>
        )}
        {isNot247 && (
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
            Not 24/7
          </span>
        )}
        {quality && (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
            {quality}
          </span>
        )}
        {/* Show stream type (HLS, TS, MP4, etc.) */}
        <span className="px-2 py-0.5 bg-zinc-700/20 text-zinc-300 text-[10px] rounded-full">
          {isHLS ? 'HLS' : getMimeType(streamUrl) === 'video/mp2t' ? 'TS' : getMimeType(streamUrl) === 'video/mp4' ? 'MP4' : (streamUrl.split('.').pop() ?? '').toUpperCase()}
        </span>
      </div>
    </div>
  )
}