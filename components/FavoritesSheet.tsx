'use client'

import Link from 'next/link'
import { useFavorites } from '@/lib/favorites'
import LogoImage from './LogoImage'
import { useEffect } from 'react'

interface FavoritesSheetProps {
  open: boolean
  onClose: () => void
}

export default function FavoritesSheet({ open, onClose }: FavoritesSheetProps) {
  const { favorites, removeFavorite, isLoaded } = useFavorites()

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-2xl max-h-[70vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <h2 className="text-white font-semibold">Favoris</h2>
              {isLoaded && (
                <span className="text-zinc-500 text-sm">({favorites.length})</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!isLoaded ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-12 h-12 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <p className="text-zinc-400 text-sm">Aucun favori</p>
                <p className="text-zinc-600 text-xs mt-1">Ajoute des chaînes en cliquant sur ♡</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {favorites.map(ch => (
                  <div key={ch.id} className="flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors group">
                    <Link
                      href={`/channel/${ch.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <LogoImage
                        src={`https://logo.iptv.org/${ch.id}.png`}
                        alt={ch.name}
                        className="w-full h-full object-contain p-1"
                        containerClassName="w-10 h-10 rounded-lg bg-zinc-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate group-hover:text-red-400 transition-colors">
                          {ch.name}
                        </p>
                        {ch.categories && ch.categories.length > 0 && (
                          <p className="text-zinc-500 text-xs truncate mt-0.5">
                            {ch.categories[0]}
                          </p>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => removeFavorite(ch.id)}
                      className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                      title="Retirer des favoris"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}