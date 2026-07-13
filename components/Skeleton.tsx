'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-zinc-800/60 rounded-lg ${className}`}
      aria-hidden="true"
    />
  )
}

/** Pulse spinner — petit cercle pulsé au lieu du spinner classique */
export function SkeletonSpinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-zinc-800 rounded-full ${className}`}
      aria-hidden="true"
    />
  )
}

/** Grid de skeletons pour les pays (mêmes dimensions que la grille réelle) */
export function CountrySkeletons({ count = 24 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/30"
        >
          <Skeleton className="w-10 h-10 mb-3" />
          <Skeleton className="w-20 h-4 mb-2" />
          <Skeleton className="w-12 h-3" />
        </div>
      ))}
    </div>
  )
}

/** Skeletons pour la liste de chaînes (layout liste) */
export function ChannelListSkeletons({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40"
        >
          <Skeleton className="w-14 h-14 shrink-0 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="w-3/4 h-4" />
            <div className="flex gap-1.5">
              <Skeleton className="w-14 h-4 rounded-full" />
              <Skeleton className="w-16 h-4 rounded-full" />
              <Skeleton className="w-12 h-4 rounded-full" />
            </div>
          </div>
          <Skeleton className="w-4 h-4 shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** Skeletons compact pour la vue grille */
export function ChannelGridSkeletons({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30"
        >
          <Skeleton className="w-16 h-16 rounded-xl mb-3" />
          <Skeleton className="w-full h-4 mb-1.5" />
          <div className="flex gap-1.5">
            <Skeleton className="w-10 h-3 rounded-full" />
            <Skeleton className="w-12 h-3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Skeleton pour la fiche chaîne */
export function ChannelDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-5">
        <Skeleton className="w-20 h-20 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="w-1/2 h-7" />
          <div className="flex gap-2">
            <Skeleton className="w-16 h-5 rounded-full" />
            <Skeleton className="w-20 h-5 rounded-full" />
            <Skeleton className="w-14 h-5 rounded-full" />
          </div>
        </div>
      </div>
      {/* Player placeholder */}
      <Skeleton className="w-full aspect-video rounded-xl" />
      {/* Streams */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30">
            <Skeleton className="w-6 h-4" />
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-16 h-4 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeletons pour les résultats de recherche */
export function SearchResultSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40"
        >
          <Skeleton className="w-14 h-14 shrink-0 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="w-2/3 h-4" />
            <div className="flex gap-1.5">
              <Skeleton className="w-16 h-4 rounded-full" />
              <Skeleton className="w-12 h-4 rounded-full" />
            </div>
          </div>
          <Skeleton className="w-4 h-4 shrink-0" />
        </div>
      ))}
    </div>
  )
}