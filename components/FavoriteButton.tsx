'use client'

import { useFavorites } from '@/lib/favorites'
import { useToast } from './ToastProvider'

interface FavoriteButtonProps {
  channelId: string
  channelName: string
  channelCountry?: string | null
  channelCategories?: string[]
  className?: string
  iconOnly?: boolean
}

export default function FavoriteButton({
  channelId,
  channelName,
  channelCountry,
  channelCategories,
  className = '',
  iconOnly = true,
}: FavoriteButtonProps) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const { addToast } = useToast()

  const favorited = isFavorite(channelId)

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite({
      id: channelId,
      name: channelName,
      country: channelCountry || null,
      categories: channelCategories || [],
    })
    addToast(
      favorited
        ? `"${channelName}" retiré des favoris`
        : `"${channelName}" ajouté aux favoris`,
      favorited ? 'info' : 'success'
    )
  }

  return (
    <button
      onClick={handleToggle}
      className={`group flex items-center gap-1.5 transition-all ${
        favorited ? 'text-red-400' : 'text-zinc-600 hover:text-red-400'
      } ${className}`}
      title={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <svg
        className={`w-5 h-5 transition-transform group-hover:scale-110 ${
          favorited ? 'fill-current' : 'fill-none'
        }`}
        fill={favorited ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={favorited ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
      {!iconOnly && (
        <span className="text-xs">{favorited ? 'Favori' : 'Ajouter'}</span>
      )}
    </button>
  )
}