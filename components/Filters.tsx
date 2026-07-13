'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

interface FiltersProps {
  categories: { id: string; name: string }[]
  currentCategory?: string
}

export default function Filters({ categories, currentCategory }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setCategory = useCallback(
    (cat: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (cat) {
        params.set('category', cat)
      } else {
        params.delete('category')
      }
      params.set('page', '1')
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setCategory(null)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          !currentCategory
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
        }`}
      >
        Toutes
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setCategory(cat.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
            currentCategory === cat.id
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
