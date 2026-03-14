'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function MarkAllReadButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markAll() {
    setLoading(true)
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={markAll}
      disabled={loading}
      className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Marking\u2026' : 'Mark all read'}
    </button>
  )
}
