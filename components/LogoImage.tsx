'use client'

import { useState } from 'react'

interface LogoImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
}

export default function LogoImage({ src, alt, className = '', containerClassName = '' }: LogoImageProps) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={`flex items-center justify-center overflow-hidden ${containerClassName}`}>
      {failed ? (
        <span className="text-zinc-500 font-bold select-none">{alt.charAt(0).toUpperCase()}</span>
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          onError={() => setFailed(true)}
          loading="lazy"
        />
      )}
    </div>
  )
}
