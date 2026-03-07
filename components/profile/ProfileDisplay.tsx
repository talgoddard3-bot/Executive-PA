'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ProfileForm from './ProfileForm'
import type { Company, CompanyProfile, RevenueCountry, SupplierCountry, Competitor, Customer } from '@/lib/types'

interface ProfileDisplayProps {
  company: Company
  profile: CompanyProfile
}

const sectionHeadingClass = 'text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3'

export default function ProfileDisplay({ company, profile }: ProfileDisplayProps) {
  const [editing, setEditing] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const router = useRouter()

  async function handleReset() {
    setResetting(true)
    await fetch('/api/profile/reset', { method: 'POST' })
    router.refresh()
  }

  if (editing) {
    return (
      <ProfileForm
        companyId={company.id}
        initialData={{
          name: company.name,
          industry: company.industry,
          company_type: company.company_type,
          stock_ticker: company.stock_ticker,
          logoUrl: company.logo_url,
          revenue_countries: profile.revenue_countries as RevenueCountry[],
          supplier_countries: profile.supplier_countries as SupplierCountry[],
          competitors: profile.competitors as Competitor[],
          customers: profile.customers as Customer[],
          keywords: profile.keywords,
          commodities: profile.commodities ?? [],
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Static logo display — editing handled inside ProfileForm */}
          <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
            {company.logo_url ? (
              <Image src={company.logo_url} alt={company.name} width={64} height={64} className="object-contain p-1" />
            ) : (
              <span className="text-lg font-bold text-gray-300">
                {company.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
              {company.company_type && (
                <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-gray-500">
                  {company.company_type}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{company.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit profile
          </button>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-400 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              Switch company
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Delete all data?</span>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {resetting ? 'Deleting…' : 'Yes, start over'}
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Exposure */}
      <section>
        <h3 className={sectionHeadingClass}>Revenue Exposure</h3>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-gray-500">Country</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Share</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Sector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(profile.revenue_countries as RevenueCountry[]).map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 text-gray-900">{r.country}</td>
                  <td className="px-4 py-2.5 text-gray-700">{r.pct}%</td>
                  <td className="px-4 py-2.5 text-gray-500">{r.sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Supplier Countries */}
      <section>
        <h3 className={sectionHeadingClass}>Supplier Countries</h3>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-gray-500">Country</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Materials / Components</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(profile.supplier_countries as SupplierCountry[]).map((s, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 text-gray-900">{s.country}</td>
                  <td className="px-4 py-2.5 text-gray-500">{s.materials}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Competitors */}
      <section>
        <h3 className={sectionHeadingClass}>Key Competitors</h3>
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
          {(profile.competitors as Competitor[]).map((c, i) => (
            <div key={i} className="px-4 py-2.5">
              <span className="text-sm font-medium text-gray-900">{c.name}</span>
              {c.notes && <span className="text-sm text-gray-500"> — {c.notes}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Key Customers */}
      {(profile.customers ?? []).length > 0 && (
        <section>
          <h3 className={sectionHeadingClass}>Key Customers</h3>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {(profile.customers as Customer[]).map((c, i) => (
              <div key={i} className="px-4 py-2.5">
                <span className="text-sm font-medium text-gray-900">{c.name}</span>
                {c.notes && <span className="text-sm text-gray-500"> — {c.notes}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Keywords */}
      {profile.keywords.length > 0 && (
        <section>
          <h3 className={sectionHeadingClass}>Product Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {profile.keywords.map((kw, i) => (
              <span key={i} className="rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-1 text-xs text-gray-700 dark:text-gray-300">
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Commodities */}
      {(profile.commodities ?? []).length > 0 && (
        <section>
          <h3 className={sectionHeadingClass}>Commodity Exposure</h3>
          <div className="flex flex-wrap gap-2">
            {(profile.commodities ?? []).map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 dark:bg-gray-700 text-white px-3 py-1 text-xs font-medium">
                <svg className="w-2.5 h-2.5 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
                {c}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
