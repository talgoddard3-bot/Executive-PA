'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BriefGeneratingPoller({ briefId }: { briefId: string }) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/briefs/${briefId}/status`)
        if (!res.ok) return
        const { status } = await res.json()
        if (status === 'complete' || status === 'failed') {
          clearInterval(interval)
          router.refresh()
        }
      } catch {
        // silent — keep polling
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [briefId, router])

  return null
}
