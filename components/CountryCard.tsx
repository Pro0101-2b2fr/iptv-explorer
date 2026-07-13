import Link from 'next/link'

interface CountryCardProps {
  country: {
    name: string
    code: string
    flag: string
    channel_count: number
  }
}

export default function CountryCard({ country }: CountryCardProps) {
  return (
    <Link
      href={`/country/${country.code}`}
      className="group relative flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-zinc-700/50 transition-all duration-200 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-red-500/[0.03] to-transparent" />

      {/* Flag */}
      <div className="text-4xl mb-3 drop-shadow-lg">{country.flag}</div>

      {/* Country name */}
      <h3 className="text-white text-sm font-medium text-center truncate w-full group-hover:text-red-400 transition-colors">
        {country.name}
      </h3>

      {/* Channel count */}
      <span className="mt-1.5 text-xs text-zinc-500">
        {country.channel_count.toLocaleString()} chaînes
      </span>

      {/* Hover arrow */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </Link>
  )
}
