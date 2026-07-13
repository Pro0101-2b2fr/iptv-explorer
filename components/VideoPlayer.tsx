'use client'

import { useState, useRef, useEffect } from 'react'

interface VideoPlayerProps {
  streamUrl: string
  channelName: string
  quality: string | null
  label: string | null
  isProxied?: boolean
}

export default function VideoPlayer({ streamUrl, channelName, quality, label, isProxied }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const hlsRef = useRef<any>(null)
  const retryCountRef = useRef(0)

  useEffect(() => {
    let hls: any = null
    const video = videoRef.current
    if (!video || !streamUrl) {
      setStatus('idle')
      return
    }

    // Reset state
    setStatus('loading')
    setErrorMsg('')
    retryCountRef.current = 0

    const initPlayer = async () => {
      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }

      // Safari native HLS — works without CORS issues
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl
        video.addEventListener('canplay', () => setStatus('playing'), { once: true })
        video.addEventListener('error', () => {
          // Safari native error — try without native
          setStatus('error')
          setErrorMsg('La lecture native a échoué')
        }, { once: true })
        try {
          await video.play()
        } catch (e: any) {
          setStatus('error')
          setErrorMsg(e.name === 'NotAllowedError'
            ? 'Clique sur le lecteur pour lancer la lecture'
            : 'Erreur de lecture')
        }
        return
      }

      // HLS.js for Chrome/Edge/Firefox
      try {
        const Hls = (await import('hls.js')).default
        if (!Hls.isSupported()) {
          setStatus('error')
          setErrorMsg('HLS non supporté par ce navigateur')
          return
        }

        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          // Don't error out on first failure — some streams need retry
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        })
        hlsRef.current = hls

        hls.loadSource(streamUrl)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((e: any) => {
            if (e.name === 'NotAllowedError') {
              setStatus('error')
              setErrorMsg('Clique sur le lecteur pour lancer la lecture')
            }
          })
        })

        hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            console.warn('HLS fatal error:', data.type, data.details)
            setStatus('error')
            if (data.response?.code === 0 || data.details === 'manifestLoadError') {
              setErrorMsg(isProxied
                ? 'Le proxy n\'a pas pu charger ce flux'
                : 'Flux bloqué par CORS — active le proxy ci-dessous')
            } else {
              setErrorMsg(`Erreur: ${data.type}`)
            }
          }
        })

        video.addEventListener('playing', () => setStatus('playing'), { once: true })
        video.addEventListener('waiting', () => {
          if (status === 'playing') setStatus('loading')
        })
        video.addEventListener('canplay', () => {
          if (status === 'loading') setStatus('loading') // keep loading until actually playing
        })
      } catch {
        setStatus('error')
        setErrorMsg('Impossible de charger le player')
      }
    }

    initPlayer()

    return () => {
      if (hls) {
        hls.destroy()
        hlsRef.current = null
      }
      video.removeAttribute('src')
      video.load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl, isProxied])

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain bg-black"
        controls
        playsInline
        poster={`data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect fill="#0a0a0a" width="1280" height="720"/><text fill="#444" font-family="sans-serif" font-size="24" text-anchor="middle" x="640" y="360">${channelName}</text></svg>`
        )}`}
      />

      {/* Overlay */}
      {status !== 'playing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm">Chargement du flux...</p>
              </div>
            )}
            {status === 'error' && (
              <div className="flex flex-col items-center gap-2 px-6">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-red-400 text-sm font-medium">Flux indisponible</p>
                <p className="text-zinc-500 text-xs max-w-sm">{errorMsg}</p>
              </div>
            )}
            {status === 'idle' && (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                <p className="text-zinc-400 text-sm">Aucun flux sélectionné</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Labels */}
      <div className="absolute top-3 left-3 flex gap-2">
        {label?.toLowerCase().includes('geo-blocked') && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
            Geo-blocked
          </span>
        )}
        {label?.toLowerCase().includes('not 24/7') && (
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
            Not 24/7
          </span>
        )}
        {isProxied && (
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
            Proxy
          </span>
        )}
        {quality && (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
            {quality}
          </span>
        )}
      </div>
    </div>
  )
}
