'use client'

import { useState, useRef, useEffect } from 'react'

interface VideoPlayerProps {
  streamUrl: string
  channelName: string
  quality: string | null
  label: string | null
  isProxied?: boolean
  userAgent?: string | null
  referrer?: string | null
}

// ---- Type detection ----
type StreamType = 'hls' | 'ts' | 'mp4' | 'flv' | 'unknown'
function classify(url: string): StreamType {
  const p = url.split('?')[0].split('#')[0].toLowerCase()
  if (p.endsWith('.m3u8')) return 'hls'
  if (p.endsWith('.mp4')) return 'mp4'
  if (p.endsWith('.ts')) return 'ts'
  if (p.endsWith('.flv')) return 'flv'
  // No extension + http → likely raw TS (by far most common IPTV pattern)
  if (/^https?:\/\//.test(url) && !p.split('/').pop()?.includes('.')) return 'ts'
  return 'unknown'
}

export default function VideoPlayer({ streamUrl, channelName, quality, label, userAgent, referrer }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [engine, setEngine] = useState('')

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) { setStatus('idle'); setEngine(''); return }

    let cancelled = false
    let currentPlayer: { destroy: () => void; unload?: () => void } | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    setStatus('loading')
    setErrorMsg('')
    setEngine('')

    const cleanup = () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      if (currentPlayer) {
        try {
          if ('unload' in currentPlayer) (currentPlayer as { unload: () => void }).unload()
          currentPlayer.destroy()
        } catch { /* */ }
      }
      video.removeAttribute('src')
      video.load()
    }

    const nativeFallback = () => {
      if (cancelled) return
      setEngine('Nat驻')
      video.src = streamUrl
      video.addEventListener('canplay', () => {
        if (!cancelled) video.play().then(() => { if (!cancelled) setStatus('playing') }).catch(() => {})
      }, { once: true })
      video.addEventListener('playing', () => { if (!cancelled) setStatus('playing') }, { once: true })
      video.addEventListener('error', () => {
        if (cancelled) return
        const me = video.error
        setStatus('error')
        if (me?.code === 4) setErrorMsg('Format non supporté par le navigateur')
        else if (me?.code === 3) setErrorMsg('Erreur décodage')
        else setErrorMsg('Erreur lecture')
      }, { once: true })
      timer = setTimeout(() => { if (!cancelled) { setStatus('error'); setErrorMsg('Timeout 12s') } }, 12000)
    }

    const init = async () => {
      const type = classify(streamUrl)
      console.log(`[VideoPlayer] type=${type} engine=starting url=${streamUrl.substring(0, 80)}`)

      // ======================== HLS ========================
      if (type === 'hls') {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          setEngine('Safari HLS')
          video.src = streamUrl
          video.addEventListener('canplay', () => { if (!cancelled) setStatus('playing') }, { once: true })
          video.addEventListener('error', () => { if (!cancelled) { setStatus('error'); setErrorMsg('Échec HLS natif') } }, { once: true })
          try { await video.play() } catch (e) { if (!cancelled) setErrorMsg((e as Error).name === 'NotAllowedError' ? 'Clique pour lancer' : 'Erreur') }
          return
        }
        setEngine('hls.js')
        try {
          const m = (await import('hls.js')).default as {
            isSupported: () => boolean
            Events: { MANIFEST_PARSED: string; ERROR: string }
            new (c: Record<string, unknown>): { loadSource: (u: string) => void; attachMedia: (v: HTMLVideoElement) => void; on: (e: string, cb: (...a: unknown[]) => void) => void; destroy: () => void }
          }
          if (!m.isSupported()) { video.src = streamUrl; try { await video.play() } catch { /* */ } return }
          const hls = new m({ enableWorker: true, lowLatencyMode: false, backBufferLength: 30, maxBufferLength: 30, maxMaxBufferLength: 60 })
          currentPlayer = hls
          hls.loadSource(streamUrl)
          hls.attachMedia(video)
          hls.on(m.Events.MANIFEST_PARSED, () => { if (!cancelled) video.play().catch(() => {}) })
          hls.on(m.Events.ERROR, (...args: unknown[]) => {
            if (cancelled) return
            const d = args[1] as Record<string, unknown> | undefined
            if (!d?.fatal) return
            setStatus('error'); setErrorMsg('Erreur HLS')
          })
        } catch { if (!cancelled) { setStatus('error'); setErrorMsg('HLS indisponible') } }
        return
      }

      // ======================== TS / FLV / unknown → mpegts.js ========================
      setEngine('mpegts.js')
      try {
        const m = (await import('mpegts.js')).default as {
          createPlayer: (ds: { type: string; url: string; isLive: boolean }, cfg?: Record<string, unknown>) => {
            attachMediaElement: (v: HTMLVideoElement) => void
            load: () => void
            play: () => Promise<void>
            destroy: () => void
            unload: () => void
            on: (e: string, cb: (...a: unknown[]) => void) => void
          }
        }

        // Build config with optional custom headers
        const config: Record<string, unknown> = {}
        if (userAgent || referrer || navigator.userAgent) {
          config.headers = {
            'User-Agent': userAgent || navigator.userAgent,
            ...(referrer ? { Referer: referrer } : {}),
          }
        }

        const player = m.createPlayer(
          { type: type === 'flv' ? 'flv' : 'mpegts', url: streamUrl, isLive: true },
          config
        )
        currentPlayer = player
        player.attachMediaElement(video)
        player.load()

        // mpegts.js may not reliably trigger video 'playing'.
        // Check if we get media info or error events
        let mpegtsOk = false

        video.addEventListener('playing', () => {
          mpegtsOk = true
          if (!cancelled) setStatus('playing')
        }, { once: true })

        player.play().then(() => {
          if (!cancelled) {
            // If we haven't got 'playing' after 2s, assume it's buffering
            setTimeout(() => { if (!cancelled && status === 'loading') setStatus('playing') }, 2000)
          }
        }).catch((err: Error) => {
          console.warn('mpegts.play() error:', err.message)
          if (cancelled) return
          // mpegts.js failed → fallback to native
          mpegtsCleanup(player)
          nativeFallback()
        })

        // Timeout: if mpegts.js doesn't start streaming within 10s, try native
        timer = setTimeout(() => {
          if (cancelled || mpegtsOk || status === 'playing') return
          console.warn('mpegts.js timeout → native fallback')
          mpegtsCleanup(player)
          video.removeAttribute('src')
          video.load()
          nativeFallback()
        }, 10000)

      } catch (err) {
        console.warn('mpegts.js init error:', err)
        nativeFallback()
      }

      function mpegtsCleanup(p: { destroy: () => void; unload?: () => void }) {
        try { p.unload?.(); p.destroy() } catch { /* */ }
        currentPlayer = null
      }
    }

    init()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl])

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain bg-black"
        controls
        playsInline
        poster={`data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect fill="#0a0a0a" width="1280" height="720"/><text fill="#444" font-family="sans-serif" font-size="24" text-anchor="middle" x="640" y="360">${channelName}</text></svg>`
        )}`}
      />

      {status !== 'playing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm">Chargement...</p>
                {engine && <p className="text-zinc-600 text-xs">{engine}</p>}
              </div>
            )}
            {status === 'error' && (
              <div className="flex flex-col items-center gap-2 px-6">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-red-400 text-sm font-medium">Flux indisponible dans le navigateur</p>
                <p className="text-zinc-500 text-xs max-w-sm">{errorMsg}</p>
                {engine && <p className="text-zinc-600 text-[10px]">{engine}</p>}
                <p className="text-zinc-600 text-[10px] mt-2">Utilise le lien VLC ci-dessous ↗</p>
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

      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
        <span className="px-2 py-0.5 bg-zinc-700/50 text-zinc-300 text-[10px] rounded-full">{classify(streamUrl).toUpperCase()}</span>
        {label?.includes('geo') && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full">Geo</span>}
        {quality && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full">{quality}</span>}
      </div>
    </div>
  )
}
