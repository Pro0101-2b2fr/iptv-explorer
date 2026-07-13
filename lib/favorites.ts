// Favorites system using localStorage
import { useState, useEffect, useCallback } from 'react'

export interface FavoriteChannel {
  id: string
  name: string
  country: string | null
  categories: string[]
  logo?: string
}

const STORAGE_KEY = 'iptv-explorer-favorites'

function loadFavorites(): FavoriteChannel[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveFavorites(favorites: FavoriteChannel[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteChannel[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setFavorites(loadFavorites())
    setIsLoaded(true)
  }, [])

  const addFavorite = useCallback((channel: FavoriteChannel) => {
    setFavorites(prev => {
      if (prev.some(f => f.id === channel.id)) return prev
      const next = [...prev, channel]
      saveFavorites(next)
      return next
    })
  }, [])

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id)
      saveFavorites(next)
      return next
    })
  }, [])

  const toggleFavorite = useCallback((channel: FavoriteChannel) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === channel.id)
      const next = exists ? prev.filter(f => f.id !== channel.id) : [...prev, channel]
      saveFavorites(next)
      return next
    })
  }, [])

  const isFavorite = useCallback((id: string) => {
    return favorites.some(f => f.id === id)
  }, [favorites])

  return { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite, isLoaded }
}

// Toast notifications system
export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}