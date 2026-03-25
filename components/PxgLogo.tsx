'use client'
import Image from 'next/image'

interface PxgLogoProps {
  height?: number
  color?: 'gold' | 'white' | 'black'
  useImage?: boolean
}

// SVG version — accurate winged PXG wordmark
export function PxgLogoSvg({ height = 32, color = 'gold' }: { height?: number; color?: string }) {
  const fill = color === 'gold' ? '#C9A84C' : color === 'white' ? '#FFFFFF' : '#000000'
  const w = Math.round(height * 4.36)
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 480 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PXG"
      style={{ display: 'block' }}
    >
      {/* ── LEFT WINGS (two chevrons pointing right / inward) ── */}
      {/* Outer left chevron */}
      <polygon points="2,8 24,8 62,55 24,102 2,102" fill={fill} />
      {/* Inner left chevron */}
      <polygon points="74,8 96,8 134,55 96,102 74,102" fill={fill} />

      {/* ── P ── */}
      <path
        d="M150 15h28c11 0 18 6.5 18 16.5S189 48 178 48h-16v24h-12V15zm12 23h14.5c4 0 7-2.5 7-6.5s-3-6.5-7-6.5H162v13z"
        fill={fill}
      />

      {/* ── X ── */}
      <path
        d="M209 15l14 19.5L237 15h13l-20 26 22 31h-13.5L224 51l-15 21h-13.5l21-30-20-27H209z"
        fill={fill}
      />

      {/* ── G ── */}
      <path
        d="M322 24.5c-3.5-6-9.5-10-17.5-10-12 0-21 9.5-21 21.5s9 21.5 21 21.5c9.5 0 16.5-5.5 18.5-13.5h-20v-9h31v3.5c0 16-13 28-29.5 28-18.5 0-33-14-33-30.5S286.5 5.5 304.5 5.5c12.5 0 22.5 6.5 27 17l-9.5 2z"
        fill={fill}
      />

      {/* ── RIGHT WINGS (two chevrons pointing left / inward) ── */}
      {/* Inner right chevron */}
      <polygon points="346,8 368,8 346,55 324,102 346,102" fill={fill} />
      {/* Outer right chevron */}
      <polygon points="418,8 440,8 418,55 396,102 418,102" fill={fill} />
    </svg>
  )
}

// Image version — use actual PXG logo PNG if available at /pxg-logo.png
export function PxgLogo({ height = 32, color = 'gold', useImage = false }: PxgLogoProps) {
  if (useImage) {
    return (
      <Image
        src="/pxg-logo.png"
        alt="PXG"
        height={height}
        width={Math.round(height * 4.36)}
        style={{ objectFit: 'contain', filter: color === 'gold' ? 'invert(1) sepia(1) saturate(2) hue-rotate(5deg) brightness(0.85)' : color === 'white' ? 'invert(1) brightness(10)' : 'none' }}
      />
    )
  }
  return <PxgLogoSvg height={height} color={color} />
}
