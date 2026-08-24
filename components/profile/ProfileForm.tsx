'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoUpload from './LogoUpload'
import type { RevenueCountry, SupplierCountry, Competitor, Customer, LocationType } from '@/lib/types'

interface SuggestedLocation {
  city: string
  country_name: string
  country_code: string
  location_types: LocationType[]
  notes?: string
}

const LOCATION_TYPE_OPTIONS: { value: LocationType; label: string }[] = [
  { value: 'hq',            label: 'Headquarters' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'sales',         label: 'Sales Office' },
  { value: 'r&d',           label: 'R&D Centre' },
  { value: 'office',        label: 'Regional Office' },
]

interface ProfileFormProps {
  companyId?: string
  onCancel?: () => void
  initialData?: {
    name: string
    industry: string
    company_type?: 'B2B' | 'B2C' | 'B2B2C' | 'NGO' | 'Investor'
    stock_ticker?: string | null
    website?: string | null
    logoUrl?: string | null
    revenue_countries: RevenueCountry[]
    supplier_countries: SupplierCountry[]
    competitors: Competitor[]
    customers: Customer[]
    keywords: string[]
    commodities: string[]
    products?: string | null
    company_notes?: string | null
    vision?: string | null
    mission?: string | null
    ir_page_url?: string | null
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
  const [companyType, setCompanyType] = useState<'B2B' | 'B2C' | 'B2B2C' | 'NGO' | 'Investor'>(initialData?.company_type ?? 'B2B')
  const [stockTicker, setStockTicker] = useState(initialData?.stock_ticker ?? '')
  const [website, setWebsite] = useState(initialData?.website ?? '')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')

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
  const [products, setProducts] = useState(initialData?.products ?? '')
  const [companyNotes, setCompanyNotes] = useState(initialData?.company_notes ?? '')
  const [vision, setVision] = useState(initialData?.vision ?? '')
  const [mission, setMission] = useState(initialData?.mission ?? '')
  const [irPageUrl, setIrPageUrl] = useState(initialData?.ir_page_url ?? '')
  const [suggestedLocations, setSuggestedLocations] = useState<SuggestedLocation[]>([])

  function updateLocation(i: number, field: keyof SuggestedLocation, value: string) {
    setSuggestedLocations((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u })
  }
  function toggleLocationType(i: number, type: LocationType) {
    setSuggestedLocations((prev) => {
      const u = [...prev]
      const types = u[i].location_types.includes(type)
        ? u[i].location_types.filter((t) => t !== type)
        : [...u[i].location_types, type]
      u[i] = { ...u[i], location_types: types }
      return u
    })
  }

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

  async function runSuggest(advanceToStep2: boolean) {
    setSuggesting(true)
    setSuggestError('')

    const res = await fetch('/api/profile/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        industry,
        company_type: companyType,
        website: website.trim() || undefined,
        custom_instructions: customInstructions.trim() || undefined,
      }),
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
    setProducts((data.products as string) ?? '')
    setCompanyNotes((data.company_notes as string) ?? '')
    setVision((data.vision as string) ?? '')
    setMission((data.mission as string) ?? '')
    setIrPageUrl((data.ir_page_url as string) ?? '')
    setSuggestedLocations((data.locations as SuggestedLocation[]) ?? [])
    if (advanceToStep2) setStep(2)
    setSuggesting(false)
  }

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault()
    await runSuggest(true)
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
          products: products.trim() || null,
          company_notes: companyNotes.trim() || null,
          vision: vision.trim() || null,
          mission: mission.trim() || null,
          ir_page_url: irPageUrl.trim() || null,
          locations: suggestedLocations.filter((l) => l.country_name.trim() && l.country_code.trim()),
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
            {(['B2B', 'B2C', 'B2B2C', 'NGO', 'Investor'] as const).map((type) => (
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
            {companyType === 'NGO' && 'Non-governmental organization — focus on impact, funding, partnerships, and global issues'}
            {companyType === 'Investor' && 'Invests in or advises companies — portfolio performance, deal flow, fund/LP relations, and sector allocation matter more than direct sales'}
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

        <div>
          <label className={labelClass}>
            Research instructions <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            className={inputClass + ' resize-none'}
            rows={3}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g. Focus on their 2025 annual report and investor relations page. They are a REIT — emphasise property portfolio and occupancy rates over product sales."
          />
          <p className="mt-1 text-xs text-gray-400">Steer what the AI looks for or which sources it prioritises.</p>
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
              Researching your company…
            </span>
          ) : (
            'Generate profile suggestions →'
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          AI will search the web for real background, offices, competitors, customers, and revenue markets.
          You can review and adjust everything before saving.
        </p>
      </form>
    )
  }

  // ── STEP 2 ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSave} className="space-y-10 max-w-2xl">

      {/* AI Research — re-run suggestions without starting over */}
      <section className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div>
          <h3 className={sectionHeadingClass}>AI Research</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Re-run web research for {name || 'this company'} — overwrites the fields below with fresh suggestions. Point it at specific sources or angles if useful.
          </p>
        </div>
        <textarea
          className={inputClass + ' resize-none bg-white'}
          rows={2}
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="e.g. Check their latest annual report and investor relations page. They are a REIT — emphasise property portfolio and occupancy rates."
        />
        {suggestError && <p className="text-sm text-red-600">{suggestError}</p>}
        <button
          type="button"
          onClick={() => runSuggest(false)}
          disabled={suggesting || !name.trim() || !industry.trim()}
          className="flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {suggesting && <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {suggesting ? 'Researching…' : 'Regenerate with AI →'}
        </button>
      </section>

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
          <div className="flex flex-wrap gap-2">
            {(['B2B', 'B2C', 'B2B2C', 'NGO', 'Investor'] as const).map((type) => (
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

      {/* Vision & Mission */}
      <section className="space-y-3">
        <div>
          <h3 className={sectionHeadingClass}>Vision &amp; Mission</h3>
          <p className="text-xs text-gray-400 mt-0.5">The company's own published statements — grounds strategic recommendations in what leadership has actually committed to, not generic advice.</p>
        </div>
        <div>
          <label className={labelClass}>Vision <span className="font-normal text-gray-400">(optional)</span></label>
          <textarea
            className={inputClass + ' resize-none'}
            rows={2}
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="e.g. To be the leading provider of precision sensing technology in industrial automation worldwide."
          />
        </div>
        <div>
          <label className={labelClass}>Mission <span className="font-normal text-gray-400">(optional)</span></label>
          <textarea
            className={inputClass + ' resize-none'}
            rows={2}
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            placeholder="e.g. We design and deliver reliable precision instruments that help manufacturers improve quality and reduce waste."
          />
        </div>
        <div>
          <label className={labelClass}>
            Investor Relations page <span className="font-normal text-gray-400">(optional — public companies only)</span>
          </label>
          <input
            className={inputClass}
            value={irPageUrl}
            onChange={(e) => setIrPageUrl(e.target.value)}
            placeholder="https://investors.yourcompany.com"
            type="url"
          />
          <p className="mt-1 text-xs text-gray-400">Checked each week for a new annual/quarterly report — key figures and disclosures get folded into the brief automatically.</p>
        </div>
      </section>

      {/* Suggested Locations */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={sectionHeadingClass}>Offices &amp; Locations</h3>
            <p className="text-xs text-gray-400 mt-0.5">AI suggested — review, adjust, or remove. Saved into Operational Locations.</p>
          </div>
          <button
            type="button"
            onClick={() => setSuggestedLocations((p) => [...p, { city: '', country_name: '', country_code: '', location_types: ['office'] }])}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            + Add location
          </button>
        </div>
        {suggestedLocations.length === 0 && (
          <p className="text-xs text-gray-400">No locations suggested — add one manually, or fill this in later from the Company Profile page.</p>
        )}
        {suggestedLocations.map((loc, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4">
                {i === 0 && <label className={labelClass}>City</label>}
                <input className={inputClass} value={loc.city} onChange={(e) => updateLocation(i, 'city', e.target.value)} placeholder="Tel Aviv" />
              </div>
              <div className="col-span-4">
                {i === 0 && <label className={labelClass}>Country</label>}
                <input className={inputClass} value={loc.country_name} onChange={(e) => updateLocation(i, 'country_name', e.target.value)} placeholder="Israel" />
              </div>
              <div className="col-span-3">
                {i === 0 && <label className={labelClass}>Country code</label>}
                <input className={inputClass} value={loc.country_code} onChange={(e) => updateLocation(i, 'country_code', e.target.value.toUpperCase())} placeholder="IL" maxLength={2} />
              </div>
              <div className="col-span-1 flex items-end pb-0.5">
                {i === 0 && <div className={labelClass + ' opacity-0'}>·</div>}
                <button type="button" onClick={() => setSuggestedLocations((p) => p.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 text-xl leading-none">×</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LOCATION_TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleLocationType(i, t.value)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                    loc.location_types.includes(t.value)
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              className={inputClass}
              value={loc.notes ?? ''}
              onChange={(e) => updateLocation(i, 'notes', e.target.value)}
              placeholder="Notes (optional) — e.g. main manufacturing site, ~200 employees"
            />
          </div>
        ))}
      </section>

      {/* Products / Services */}
      <section className="space-y-3">
        <div>
          <h3 className={sectionHeadingClass}>Products / Services</h3>
          <p className="text-xs text-gray-400 mt-0.5">What does the company sell? Describe your main products, services, or platform.</p>
        </div>
        <textarea
          className={inputClass + ' resize-none'}
          rows={3}
          value={products}
          onChange={(e) => setProducts(e.target.value)}
          placeholder="e.g. High-precision optical sensors for industrial automation and semiconductor inspection. Also sells calibration software and maintenance contracts."
        />
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

      {/* Supplier countries — not applicable to investment firms with no physical supply chain */}
      {companyType !== 'Investor' && (
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
      )}

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

      {/* Commodities — not applicable to investment firms with no physical supply chain */}
      {companyType !== 'Investor' && (
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
      )}

      {/* Company Notes */}
      <section className="space-y-3">
        <div>
          <h3 className={sectionHeadingClass}>Background context for AI</h3>
          <p className="text-xs text-gray-400 mt-0.5">Explain anything specific about this company the AI should treat as fact — nuances, strategic priorities, sensitivities, or context not obvious from public sources.</p>
        </div>
        <textarea
          className={inputClass + ' resize-none'}
          rows={5}
          value={companyNotes}
          onChange={(e) => setCompanyNotes(e.target.value)}
          placeholder="e.g. Our sole manufacturing site is in northern Israel and has been operating at reduced capacity since Oct 2023. We are heavily dependent on a single customer (Siemens) for ~40% of revenue. The CEO is in active acquisition talks in Q2 2026."
        />
        <p className="text-xs text-gray-400">This is injected directly into every brief as verified analyst context. Keep it factual and up to date.</p>
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
