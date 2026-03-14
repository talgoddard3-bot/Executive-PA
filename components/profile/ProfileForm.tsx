'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoUpload from './LogoUpload'
import type { RevenueCountry, SupplierCountry, Competitor, Customer } from '@/lib/types'

interface ProfileFormProps {
  companyId?: string
  onCancel?: () => void
  initialData?: {
    name: string
    industry: string
    company_type?: 'B2B' | 'B2C' | 'B2B2C'
    stock_ticker?: string | null
    website?: string | null
    logoUrl?: string | null
    revenue_countries: RevenueCountry[]
    supplier_countries: SupplierCountry[]
    competitors: Competitor[]
    customers: Customer[]
    keywords: string[]
    commodities: string[]
  }
}

const COMMODITY_PRESETS: { group: string; items: string[] }[] = [
  { group: 'Metals', items: ['Copper', 'Aluminium', 'Steel', 'Nickel', 'Cobalt', 'Lithium', 'Tantalum', 'Tungsten', 'Titanium', 'Tin', 'Zinc', 'Magnesium', 'Iron Ore'] },
  { group: 'Precious', items: ['Gold', 'Silver', 'Palladium', 'Platinum'] },
  { group: 'Electronics', items: ['Silicon', 'Rare Earth Elements', 'Gallium', 'Germanium', 'Indium'] },
  { group: 'Energy', items: ['Oil', 'Natural Gas', 'Coal', 'Hydrogen', 'Uranium'] },
  { group: 'Agricultural', items: ['Wheat', 'Corn', 'Soybeans', 'Cotton', 'Timber', 'Rubber'] },
]

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
const sectionHeadingClass = 'text-xs font-semibold uppercase tracking-widest text-gray-400'

export default function ProfileForm({ companyId, initialData, onCancel }: ProfileFormProps) {
  const router = useRouter()

  const [name, setName] = useState(initialData?.name ?? '')
  const [industry, setIndustry] = useState(initialData?.industry ?? '')
  const [companyType, setCompanyType] = useState<'B2B' | 'B2C' | 'B2B2C'>(initialData?.company_type ?? 'B2B')
  const [stockTicker, setStockTicker] = useState(initialData?.stock_ticker ?? '')
  const [website, setWebsite] = useState(initialData?.website ?? '')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState('')

  const [step, setStep] = useState<1 | 2>(initialData ? 2 : 1)
  const [revenueCountries, setRevenueCountries] = useState<RevenueCountry[]>(
    initialData?.revenue_countries ?? []
  )
  const [supplierCountries, setSupplierCountries] = useState<SupplierCountry[]>(
    initialData?.supplier_countries ?? []
  )
  const [competitors, setCompetitors] = useState<Competitor[]>(
    initialData?.competitors ?? []
  )
  const [customers, setCustomers] = useState<Customer[]>(
    initialData?.customers ?? []
  )
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords ?? [])
  const [keywordsRaw, setKeywordsRaw] = useState(
    (initialData?.keywords ?? []).join(', ')
  )
  const [commodities, setCommodities] = useState<string[]>(initialData?.commodities ?? [])
  const [customCommodity, setCustomCommodity] = useState('')

  function toggleCommodity(item: string) {
    setCommodities(prev =>
      prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
    )
  }
  function addCustomCommodity() {
    const val = customCommodity.trim()
    if (val && !commodities.includes(val)) {
      setCommodities(prev => [...prev, val])
    }
    setCustomCommodity('')
  }

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault()
    setSuggesting(true)
    setSuggestError('')

    const res = await fetch('/api/profile/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, industry }),
    })

    let data: Record<string, unknown> = {}
    try {
      data = await res.json()
    } catch {
      setSuggestError('Server error — check the terminal for details')
      setSuggesting(false)
      return
    }

    if (!res.ok) {
      setSuggestError((data.error as string) ?? 'Failed to generate suggestions')
      setSuggesting(false)
      return
    }

    setRevenueCountries((data.revenue_countries as RevenueCountry[]) ?? [])
    setSupplierCountries((data.supplier_countries as SupplierCountry[]) ?? [])
    setCompetitors((data.competitors as Competitor[]) ?? [])
    setCustomers((data.customers as Customer[]) ?? [])
    setKeywords((data.keywords as string[]) ?? [])
    setKeywordsRaw(((data.keywords as string[]) ?? []).join(', '))
    setCommodities((data.commodities as string[]) ?? [])
    setStep(2)
    setSuggesting(false)
  }

  function updateRevenue(i: number, field: keyof RevenueCountry, value: string | number) {
    setRevenueCountries((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u })
  }
  function updateSupplier(i: number, field: keyof SupplierCountry, value: string) {
    setSupplierCountries((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u })
  }
  function updateCompetitor(i: number, field: keyof Competitor, value: string) {
    setCompetitors((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u })
  }
  function updateCustomer(i: number, field: keyof Customer, value: string) {
    setCustomers((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')

    const kws = keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean)

    let data: Record<string, unknown> = {}
    try {
      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          name,
          industry,
          company_type: companyType,
          stock_ticker: stockTicker.trim().toUpperCase() || null,
          website: website.trim() || null,
          revenue_countries: revenueCountries,
          supplier_countries: supplierCountries,
          competitors,
          customers,
          keywords: kws,
          commodities,
        }),
      })
      data = await res.json()
      if (!res.ok) { setSaveError((data.error as string) ?? 'Failed to save'); setSaving(false); return }
    } catch {
      setSaveError('Server error — check the terminal for details')
      setSaving(false)
      return
    }

    router.push('/profile?saved=1')
  }

  // ── STEP 1 ──────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <form onSubmit={handleSuggest} className="space-y-6 max-w-md">
        <div>
          <label className={labelClass}>Company name</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Acme Manufacturing GmbH"
          />
        </div>
        <div>
          <label className={labelClass}>Industry</label>
          <input
            className={inputClass}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            placeholder="Automotive components"
          />
        </div>
        <div>
          <label className={labelClass}>Business model</label>
          <div className="grid grid-cols-3 gap-2">
            {(['B2B', 'B2C', 'B2B2C'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCompanyType(type)}
                className={`rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
                  companyType === type
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {companyType === 'B2B' && 'Sells to other businesses — enterprise sales, procurement cycles, account management'}
            {companyType === 'B2C' && 'Sells directly to consumers — brand, retail, D2C, consumer sentiment'}
            {companyType === 'B2B2C' && 'Sells through business partners to end consumers — both enterprise and consumer signals matter'}
          </p>
        </div>

        <div>
          <label className={labelClass}>
            Stock ticker <span className="font-normal text-gray-400">(optional — if publicly listed)</span>
          </label>
          <input
            className={inputClass}
            value={stockTicker}
            onChange={(e) => setStockTicker(e.target.value)}
            placeholder="e.g. AAPL, TSLA, SIEGY"
            maxLength={12}
          />
          <p className="mt-1 text-xs text-gray-400">Used to show your company stock chart in intelligence briefs.</p>
        </div>

        <div>
          <label className={labelClass}>
            Company website <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            className={inputClass}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.yourcompany.com"
            type="url"
          />
          <p className="mt-1 text-xs text-gray-400">Used to scan your site for company context during brief generation.</p>
        </div>

        {suggestError && <p className="text-sm text-red-600">{suggestError}</p>}

        <button
          type="submit"
          disabled={suggesting}
          className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {suggesting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analysing your company…
            </span>
          ) : (
            'Generate profile suggestions →'
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          AI will suggest your revenue markets, suppliers, and competitors.
          You can review and adjust everything before saving.
        </p>
      </form>
    )
  }

  // ── STEP 2 ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSave} className="space-y-10 max-w-2xl">

      {/* Company */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={sectionHeadingClass}>Company</h3>
          <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-700">
            ← Edit name / industry
          </button>
        </div>
        {/* Logo upload — only shown in edit mode */}
        <LogoUpload currentLogoUrl={initialData?.logoUrl} companyName={name || 'Company'} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Company name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Industry</label>
            <input className={inputClass} value={industry} onChange={(e) => setIndustry(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className={labelClass}>Business model</label>
          <div className="flex gap-2">
            {(['B2B', 'B2C', 'B2B2C'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCompanyType(type)}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  companyType === type
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue exposure */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={sectionHeadingClass}>Revenue Exposure</h3>
            <p className="text-xs text-gray-400 mt-0.5">AI suggested — adjust as needed</p>
          </div>
          <button type="button" onClick={() => setRevenueCountries((p) => [...p, { country: '', sector: '' }])} className="text-xs text-gray-500 hover:text-gray-900">
            + Add country
          </button>
        </div>
        {revenueCountries.map((r, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-5">
              {i === 0 && <label className={labelClass}>Country</label>}
              <input className={inputClass} value={r.country} onChange={(e) => updateRevenue(i, 'country', e.target.value)} placeholder="Germany" />
            </div>
            <div className="col-span-6">
              {i === 0 && <label className={labelClass}>Sector</label>}
              <input className={inputClass} value={r.sector} onChange={(e) => updateRevenue(i, 'sector', e.target.value)} placeholder="Automotive" />
            </div>
            <div className="col-span-1 flex items-end pb-0.5">
              {i === 0 && <div className={labelClass + ' opacity-0'}>·</div>}
              <button type="button" onClick={() => setRevenueCountries((p) => p.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 text-xl leading-none">×</button>
            </div>
          </div>
        ))}
      </section>

      {/* Supplier countries */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={sectionHeadingClass}>Supplier Countries</h3>
            <p className="text-xs text-gray-400 mt-0.5">AI suggested — adjust as needed</p>
          </div>
          <button type="button" onClick={() => setSupplierCountries((p) => [...p, { country: '', materials: '' }])} className="text-xs text-gray-500 hover:text-gray-900">
            + Add country
          </button>
        </div>
        {supplierCountries.map((s, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-5">
              {i === 0 && <label className={labelClass}>Country</label>}
              <input className={inputClass} value={s.country} onChange={(e) => updateSupplier(i, 'country', e.target.value)} placeholder="Taiwan" />
            </div>
            <div className="col-span-6">
              {i === 0 && <label className={labelClass}>Materials / components</label>}
              <input className={inputClass} value={s.materials} onChange={(e) => updateSupplier(i, 'materials', e.target.value)} placeholder="Semiconductors" />
            </div>
            <div className="col-span-1 flex items-end pb-0.5">
              {i === 0 && <div className={labelClass + ' opacity-0'}>·</div>}
              <button type="button" onClick={() => setSupplierCountries((p) => p.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 text-xl leading-none">×</button>
            </div>
          </div>
        ))}
      </section>

      {/* Competitors */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={sectionHeadingClass}>Key Competitors</h3>
            <p className="text-xs text-gray-400 mt-0.5">AI suggested — adjust as needed</p>
          </div>
          <button type="button" onClick={() => setCompetitors((p) => [...p, { name: '', ticker: '', notes: '' }])} className="text-xs text-gray-500 hover:text-gray-900">
            + Add competitor
          </button>
        </div>
        {competitors.map((c, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-4">
              {i === 0 && <label className={labelClass}>Name</label>}
              <input className={inputClass} value={c.name} onChange={(e) => updateCompetitor(i, 'name', e.target.value)} placeholder="Competitor GmbH" />
            </div>
            <div className="col-span-2">
              {i === 0 && <label className={labelClass}>Ticker</label>}
              <input className={inputClass} value={c.ticker ?? ''} onChange={(e) => updateCompetitor(i, 'ticker', e.target.value.toUpperCase())} placeholder="MSFT" />
            </div>
            <div className="col-span-5">
              {i === 0 && <label className={labelClass}>Notes</label>}
              <input className={inputClass} value={c.notes} onChange={(e) => updateCompetitor(i, 'notes', e.target.value)} placeholder="Market leader in Germany" />
            </div>
            <div className="col-span-1 flex items-end pb-0.5">
              {i === 0 && <div className={labelClass + ' opacity-0'}>·</div>}
              <button type="button" onClick={() => setCompetitors((p) => p.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 text-xl leading-none">×</button>
            </div>
          </div>
        ))}
      </section>

      {/* Key Customers */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={sectionHeadingClass}>Key Customers</h3>
            <p className="text-xs text-gray-400 mt-0.5">AI suggested — adjust as needed</p>
          </div>
          <button type="button" onClick={() => setCustomers((p) => [...p, { name: '', notes: '' }])} className="text-xs text-gray-500 hover:text-gray-900">
            + Add customer
          </button>
        </div>
        {customers.map((c, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-4">
              {i === 0 && <label className={labelClass}>Name</label>}
              <input className={inputClass} value={c.name} onChange={(e) => updateCustomer(i, 'name', e.target.value)} placeholder="Acme Corp" />
            </div>
            <div className="col-span-7">
              {i === 0 && <label className={labelClass}>Notes</label>}
              <input className={inputClass} value={c.notes} onChange={(e) => updateCustomer(i, 'notes', e.target.value)} placeholder="Largest account, buys precision components" />
            </div>
            <div className="col-span-1 flex items-end pb-0.5">
              {i === 0 && <div className={labelClass + ' opacity-0'}>·</div>}
              <button type="button" onClick={() => setCustomers((p) => p.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 text-xl leading-none">×</button>
            </div>
          </div>
        ))}
      </section>

      {/* Keywords */}
      <section className="space-y-3">
        <div>
          <h3 className={sectionHeadingClass}>Product Keywords</h3>
          <p className="text-xs text-gray-400 mt-0.5">AI suggested — edit or add more</p>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {keywords.map((kw, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700">
              {kw}
              <button
                type="button"
                onClick={() => {
                  const updated = keywords.filter((_, idx) => idx !== i)
                  setKeywords(updated)
                  setKeywordsRaw(updated.join(', '))
                }}
                className="text-gray-400 hover:text-red-500 leading-none"
              >×</button>
            </span>
          ))}
        </div>
        <input
          className={inputClass}
          value={keywordsRaw}
          onChange={(e) => {
            setKeywordsRaw(e.target.value)
            setKeywords(e.target.value.split(',').map((k) => k.trim()).filter(Boolean))
          }}
          placeholder="Add or edit keywords, comma-separated"
        />
      </section>

      {/* Commodities */}
      <section className="space-y-3">
        <div>
          <h3 className={sectionHeadingClass}>Commodity Exposure</h3>
          <p className="text-xs text-gray-400 mt-0.5">Select commodities that affect your input costs or supply chain</p>
        </div>
        {COMMODITY_PRESETS.map(({ group, items }) => (
          <div key={group}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{group}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleCommodity(item)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                    commodities.includes(item)
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input
            className={inputClass + ' flex-1'}
            value={customCommodity}
            onChange={e => setCustomCommodity(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCommodity() } }}
            placeholder="Add custom commodity…"
          />
          <button
            type="button"
            onClick={addCustomCommodity}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 transition-colors"
          >
            Add
          </button>
        </div>
        {commodities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {commodities.map(c => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-gray-900 text-white px-2.5 py-1 text-xs font-medium">
                {c}
                <button type="button" onClick={() => setCommodities(prev => prev.filter(x => x !== c))} className="opacity-60 hover:opacity-100 leading-none">×</button>
              </span>
            ))}
          </div>
        )}
      </section>

      {saveError && <p className="text-sm text-red-600">{saveError}</p>}

      <div className="flex items-center gap-4 pb-8">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
