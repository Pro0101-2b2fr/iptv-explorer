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

interface HlsErrorData {
  fatal: boolean
  type: string
  details: string
  response?: { code: number }
}

interface HlsInstance {
  loadSource: (url: string) => void
  attachMedia: (video: HTMLVideoElement) => void
  on: (event: string, callback: (event: unknown, data: HlsErrorData) => void) => void
  destroy: () => void
}

interface HlsModule {
  isSupported: () => boolean
  Events: { MANIFEST_PARSED: string; ERROR: string }
  new (config: {
    enableWorker: boolean
    lowLatencyMode: boolean
    backBufferLength: number
    maxBufferLength: number
    maxMaxBufferLength: number
  }): HlsInstance
}

interface MpegtsPlayer {
  attachMediaElement: (video: HTMLVideoElement) => void
  load: () => void
  play: () => Promise<void>
  destroy: () => void
  unload: () => void
  on: (event: string, callback: (...args: unknown[]) => void) => void
  off: (event: string, callback: (...args: unknown[]) => void) => void
}

type StreamType = 'hls' | 'mp4' | 'ts' | 'flv' | 'unknown'

function detectStreamType(url: string): StreamType {
  const path = url.split('?')[0].toLowerCase()
  if (path.endsWith('.m3u8')) return 'hls'
  if (path.endsWith('.mp4')) return 'mp4'
  if (path.endsWith('.ts')) return 'ts'
  if (path.endsWith('.flv')) return 'flv'
  return 'unknown'
}

function formatStreamType(type: StreamType): string {
  const labels: Record<StreamType, string> = { hls: 'HLS', mp4: 'MP4', ts: 'MPEG-TS', flv: 'FLV', unknown: 'Direct' }
  return labels[type]
}

export default function VideoPlayer({
  streamUrl,
  channelName,
  quality,
  label,
  isProxied,
  userAgent,
  referrer,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [playMethod, setPlayMethod] = useState<string>('')
  const hlsRef = useRef<HlsInstance | null>(null)
  const mpegtsRef = useRef<MpegtsPlayer | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 2

  useEffect(() => {
    let hls: HlsInstance | null = null
    let mpegts: MpegtsPlayer | null = null
    const video = videoRef.current
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    if (!video || !streamUrl) {
      setStatus('idle')
      setPlayMethod('')
      return () => {}
    }

    setErrorMsg('')
    retryCountRef.current = 0
    setPlayMethod('')

    const cleanup = () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      if (hls) { try { hls.destroy() } catch { /* ignore */ } hlsRef.current = null }
      if (mpegts) { try { mpegts.destroy() } catch { /* ignore */ } mpegtsRef.current = null }
      video.removeAttribute('src')
      video.load()
    }

    const initPlayer = async () => {
      // Clean previous
      if (hlsRef.current) { try { hlsRef.current.destroy() } catch { /* ignore */ } hlsRef.current = null }
      if (mpegtsRef.current) { try { mpegtsRef.current.destroy() } catch { /* ignore */ } mpegtsRef.current = null }
      video.removeAttribute('src')
      video.load()

      const type = detectStreamType(streamUrl)
      const isHls = type === 'hls'
      const isTs = type === 'ts'

      // --- 1) Safari native HLS ---
      if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
        setPlayMethod('Safari natif HLS')
        video.src = streamUrl
        video.addEventListener('canplay', () => { if (!cancelled) setStatus('playing') }, { once: true })
        video.addEventListener('error', () => { if (!cancelled) { setStatus('error'); setErrorMsg('La lecture native a échoué') } }, { once: true })
        try { await video.play() } catch (err) {
          const e = err as Error
          if (!cancelled) { setStatus('error'); setErrorMsg(e.name === 'NotAllowedError' ? 'Clique sur le lecteur pour lancer la lecture' : 'Erreur de lecture') }
        }
        return
      }

      // --- 2) HLS via hls.js ---
      if (isHls) {
        setPlayMethod('HLS.js')
        try {
          const HlsModule = (await import('hls.js')).default as HlsModule
          if (!HlsModule.isSupported()) {
            setPlayMethod('Lecture native (HLS non supporté)')
            video.src = streamUrl
            video.addEventListener('canplay', () => { if (!cancelled) setStatus('playing') }, { once: true })
            try { await video.play() } catch { /* ignore */ }
            return
          }

          hls = new HlsModule({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          })
          hlsRef.current = hls

          hls.loadSource(streamUrl)
          hls.attachMedia(video)

          hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
            video.play().catch((e: unknown) => {
              const err = e as Error
              if (err.name === 'NotAllowedError' && !cancelled) {
                setStatus('error')
                setErrorMsg('Clique sur le lecteur pour lancer la lecture')
              }
            })
          })

          hls.on(HlsModule.Events.ERROR, (_event: unknown, data: HlsErrorData) => {
            if (!data.fatal || cancelled) return
            console.warn('HLS fatal:', data.type, data.details)
            if (data.details === 'manifestLoadError' || data.details === 'manifestLoadTimeout' || data.response?.code === 0) {
              if (!isProxied && retryCountRef.current < maxRetries) {
                retryCountRef.current++
                setStatus('error')
                setErrorMsg('Flux bloqué par CORS — active le proxy ci-dessous')
              } else {
                setStatus('error')
                setErrorMsg(isProxied ? 'Le proxy n\'a pas pu charger ce flux' : 'Flux bloqué par CORS — active le proxy ci-dessous')
              }
            } else {
              setStatus('error')
              setErrorMsg(`Erreur HLS: ${data.type}`)
            }
          })
        } catch {
          if (!cancelled) { setStatus('error'); setErrorMsg('Impossible de charger le player HLS') }
        }
        return
      }

      // --- 3) MPEG-TS via mpegts.js ---
      if (isTs) {
        setPlayMethod('mpegts.js')
        try {
          const mpegtsModule = (await import('mpegts.js')).default as {
            createPlayer: (config: { type: string; url: string; isLive: boolean }) => MpegtsPlayer
            Events: Record<string, string>
          }

          if (!mpegtsModule.createPlayer) {
            // Fallback to native
            setPlayMethod('Lecture native (mpegts.js indisponible)')
            video.src = streamUrl
            video.addEventListener('canplay', () => { if (!cancelled) setStatus('playing') }, { once: true })
            try { await video.play() } catch { /* ignore */ }
            return
          }

          mpegts = mpegtsModule.createPlayer({
            type: 'mpegts',
            url: streamUrl,
            isLive: true,
          })
          mpegtsRef.current = mpegts
          mpegts.attachMediaElement(video)
          mpegts.load()
          mpegts.play().catch((e: Error) => {
            if (!cancelled) {
              console.warn('mpegts.js play error:', e)
              setPlayMethod('Lecture native (mpegts.js échec)')
              // Fallback
              video.src = streamUrl
              video.addEventListener('canplay', () => { if (!cancelled) setStatus('playing') }, { once: true })
              try { video.play() } catch { /* ignore */ }
            }
          })

          // Speed metadata
          try { video.play() } catch { /* ignore */ }

          video.addEventListener('playing', () => { if (!cancelled) setStatus('playing') }, { once: true })
          video.addEventListener('waiting', () => { if (!cancelled && status === 'playing') setStatus('loading') })
          video.addEventListener('error', () => {
            if (!cancelled) {
              setStatus('error')
              setErrorMsg('Erreur de décodage du flux TS')
            }
          }, { once: true })
        } catch {
          if (!cancelled) {
            setPlayMethod('Lecture native (mpegts.js chargement échoué)')
            video.src = streamUrl
            video.addEventListener('canplay', () => { if (!cancelled) setStatus('playing') }, { once: true })
            try { await video.play() } catch { /* ignore */ }
          }
        }
        return
      }

      // --- 4) Direct MP4 / unknown via native <video> ---
      setPlayMethod(`Lecture native (${formatStreamType(type)})`)
      video.src = streamUrl

      video.addEventListener('canplay', () => {
        if (!cancelled) {
          setStatus('loading')
          video.play().then(() => { if (!cancelled) setStatus('playing') }).catch((e: unknown) => {
            const err = e as Error
            if (err.name === 'NotAllowedError' && !cancelled) {
              setStatus('error')
              setErrorMsg('Clique sur le lecteur pour lancer la lecture')
            }
          })
        }
      }, { once: true })

      video.addEventListener('playing', () => { if (!cancelled) setStatus('playing') }, { once: true })

      video.addEventListener('error', () => {
        if (cancelled) return
        const mediaError = video.error
        if (mediaError && mediaError.code === 4 && !isProxied && retryCountRef.current < maxRetries) {
          retryCountRef.current++
          setPlayMethod(`Lecture native (tentative ${retryCountRef.current + 1})`)
          setStatus('error')
          setErrorMsg(mediaError.code === 4 ? 'Format non supporté — essaie le proxy ci-dessous' : 'Erreur de lecture')
        } else if (mediaError) {
          setStatus('error')
          setErrorMsg(
            mediaError.code === 4 ? 'Format non supporté par le navigateur' :
            mediaError.code === 3 ? 'Erreur de décodage' : 'Erreur de lecture'
          )
        } else {
          setStatus('error')
          setErrorMsg('Erreur de lecture inconnue')
        }
      }, { once: true })

      // Timeout 15s
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setStatus('error')
          setErrorMsg('Le flux ne répond pas (timeout)')
          setPlayMethod('')
        }
      }, 15000)
    }

    initPlayer()

    return cleanup
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

      {status !== 'playing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm">Chargement du flux...</p>
                {playMethod && <p className="text-zinc-600 text-xs">{playMethod}</p>}
              </div>
            )}
            {status === 'error' && (
              <div className="flex flex-col items-center gap-2 px-6">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-red-400 text-sm font-medium">Flux indisponible</p>
                <p className="text-zinc-500 text-xs max-w-sm">{errorMsg}</p>
                {playMethod && <p className="text-zinc-600 text-[10px]">{playMethod}</p>}
                {(userAgent || referrer) && (
                  <p className="text-amber-400 text-[10px] max-w-xs mt-1">
                    {userAgent && `UA: ${userAgent}`}{userAgent && referrer && ' · '}{referrer && `Referrer: ${referrer}`}
                  </p>
                )}
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

      <div className="absolute top-3 left-3 flex gap-2">
        {detectStreamType(streamUrl) !== 'unknown' && (
          <span className="px-2 py-0.5 bg-zinc-700/50 text-zinc-300 text-xs rounded-full border border-zinc-600/50">
            {formatStreamType(detectStreamType(streamUrl))}
          </span>
        )}
        {label?.toLowerCase().includes('geo-blocked') && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">Geo-blocked</span>
        )}
        {label?.toLowerCase().includes('not 24/7') && (
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">Not 24/7</span>
        )}
        {isProxied && (
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">Proxy</span>
        )}
        {quality && (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">{quality}</span>
        )}
      </div>
    </div>
  )
}
