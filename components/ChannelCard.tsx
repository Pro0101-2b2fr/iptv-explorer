import Link from 'next/link'
import LogoImage from './LogoImage'
import { getLogoUrl } from '@/lib/api'

interface ChannelCardProps {
  channel: {
    id: string
    name: string
    country: string
    categories: string[]
    is_nsfw: boolean
    website: string | null
  }
}

export default function ChannelCard({ channel }: ChannelCardProps) {
  const logoUrl = getLogoUrl(channel.id)

  return (
    <Link
      href={`/channel/${channel.id}`}
      className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all duration-200"
    >
      {/* Logo */}
      <LogoImage
        src={logoUrl}
        alt={channel.name}
        className="w-full h-full object-contain p-1"
        containerClassName="w-14 h-14 rounded-lg bg-zinc-800 shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium text-sm truncate group-hover:text-red-400 transition-colors">
          {channel.name}
        </h3>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {channel.categories?.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded-full border border-zinc-700/50"
            >
              {cat}
            </span>
          ))}
          {channel.categories && channel.categories.length > 3 && (
            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] rounded-full">
              +{channel.categories.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg
        className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition-colors shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
