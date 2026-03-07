'use client'

import { useEffect, useState } from 'react'

export interface TOCSection {
  id: string
  label: string
  audience: string
  audienceColor: string
}

const AUDIENCE_COLORS: Record<string, string> = {
  CEO:  'text-violet-600 bg-violet-50',
  CFO:  'text-blue-600 bg-blue-50',
  CMO:  'text-emerald-600 bg-emerald-50',
  CBPO: 'text-orange-600 bg-orange-50',
  CTO:  'text-cyan-600 bg-cyan-50',
  HR:   'text-pink-600 bg-pink-50',
  BD:   'text-indigo-600 bg-indigo-50',
}

export default function BriefTOC({ sections }: { sections: TOCSection[] }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -50% 0px', threshold: 0 }
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3">Contents</p>
      <div className="space-y-0.5">
        {sections.map(({ id, label, audience, audienceColor }) => {
          const active = activeId === id
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors group ${
                active ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`w-1 h-4 rounded-full shrink-0 transition-colors ${active ? 'bg-gray-900' : 'bg-gray-200 group-hover:bg-gray-300'}`} />
              <span className={`text-xs leading-snug transition-colors ${active ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-700'}`}>
                {label}
              </span>
              <span className={`ml-auto shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${audienceColor}`}>
                {audience}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export { AUDIENCE_COLORS }
