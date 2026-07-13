'use client'

import { useState } from 'react'
import Image from 'next/image'

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
        <span className="text-zinc-500 font-bold select-none text-lg">{alt.charAt(0).toUpperCase()}</span>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={56}
          height={56}
          className={className}
          onError={() => setFailed(true)}
          unoptimized // logos.iptv.org may not support next/image optimization
          loading="lazy"
        />
      )}
    </div>
  )
}
