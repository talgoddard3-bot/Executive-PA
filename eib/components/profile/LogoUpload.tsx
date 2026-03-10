'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface LogoUploadProps {
  currentLogoUrl?: string | null
  companyName: string
}

// Extract dominant non-white, non-black color from an image using Canvas
function extractDominantColor(objectUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const size = 60
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve('#1a1a1a'); return }
      ctx.drawImage(img, 0, 0, size, size)

      const { data } = ctx.getImageData(0, 0, size, size)
      // Bucket pixels by hue; skip transparent, near-white, near-black, and grays
      const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {}
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
        if (a < 100) continue
        const brightness = (r + g + b) / 3
        if (brightness > 230 || brightness < 20) continue
        const saturation = Math.max(r, g, b) - Math.min(r, g, b)
        if (saturation < 30) continue  // skip grays
        // Bucket by hue in 15° increments
        const hue = Math.round(rgbToHue(r, g, b) / 15) * 15
        if (!buckets[hue]) buckets[hue] = { r: 0, g: 0, b: 0, count: 0 }
        buckets[hue].r += r; buckets[hue].g += g; buckets[hue].b += b; buckets[hue].count++
      }

      const top = Object.values(buckets).sort((a, b) => b.count - a.count)[0]
      if (!top || top.count < 5) { resolve('#1a1a1a'); return }
      const hex = '#' + [top.r / top.count, top.g / top.count, top.b / top.count]
        .map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
      resolve(hex)
    }
    img.onerror = () => resolve('#1a1a1a')
    img.src = objectUrl
  })
}

function rgbToHue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return Math.round(h * 360)
}

export default function LogoUpload({ currentLogoUrl, companyName }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentLogoUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError('')
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Extract brand color from the local preview before uploading
    const brandColor = await extractDominantColor(objectUrl)

    const form = new FormData()
    form.append('file', file)
    form.append('brand_color', brandColor)

    const res = await fetch('/api/profile/logo', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Upload failed')
      setPreview(currentLogoUrl ?? null)
    } else {
      setPreview(data.logo_url)
    }

    setUploading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const initials = companyName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="flex items-center gap-5">
      <div
        className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-gray-400 transition-colors relative"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <Image src={preview} alt="Company logo" fill className="object-contain p-1" unoptimized />
        ) : (
          <span className="text-lg font-bold text-gray-300">{initials}</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div>
        <button type="button" onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-gray-700 hover:text-gray-900">
          {preview ? 'Change logo' : 'Upload logo'}
        </button>
        <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP or SVG · click or drag</p>
        <p className="text-xs text-gray-400">Brand color extracted automatically</p>
        {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden" onChange={handleChange} />
      </div>
    </div>
  )
}
