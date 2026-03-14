'use client'

import { useState } from 'react'

interface Props {
  companyId: string
  briefId: string
  section: string
  itemIndex: number
  headline: string
  sectionLabel: string
  briefWeekOf: string
  initialSaved?: boolean
}

export default function FavouriteButton({ companyId, briefId, section, itemIndex, headline, sectionLabel, briefWeekOf, initialSaved = false }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, brief_id: briefId, section, item_index: itemIndex, headline, section_label: sectionLabel, brief_week_of: briefWeekOf }),
      })
      const data = await res.json()
      setSaved(data.saved)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
        saved
          ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
          : 'bg-white text-gray-400 border-gray-200 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={saved ? 'Remove from saved' : 'Save article'}
    >
      <svg
        className="w-4 h-4"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
