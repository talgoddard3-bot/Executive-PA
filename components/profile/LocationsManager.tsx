'use client'

import { useEffect, useState } from 'react'
import type { CompanyLocation, LocationType } from '@/lib/types'

const LOCATION_TYPES: { value: LocationType; label: string; desc: string }[] = [
  { value: 'hq',            label: 'Headquarters',    desc: 'Main office, executive leadership' },
  { value: 'manufacturing', label: 'Manufacturing',   desc: 'Factory, plant, production site' },
  { value: 'sales',         label: 'Sales Office',    desc: 'Sales team, customer-facing office' },
  { value: 'r&d',           label: 'R&D Centre',      desc: 'Research, engineering, product dev' },
  { value: 'office',        label: 'Regional Office', desc: 'General operations, back-office' },
]

const TYPE_COLORS: Record<LocationType, string> = {
  hq:            'bg-purple-100 text-purple-700',
  manufacturing: 'bg-orange-100 text-orange-700',
  sales:         'bg-blue-100 text-blue-700',
  'r&d':         'bg-emerald-100 text-emerald-700',
  office:        'bg-gray-100 text-gray-600',
}

// Common countries with ISO codes
const COUNTRIES = [
  { code: 'IL', name: 'Israel' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'US', name: 'United States' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'TR', name: 'Turkey' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'ET', name: 'Ethiopia' },
].sort((a, b) => a.name.localeCompare(b.name))

const EMPTY_FORM = { country_code: '', city: '', location_types: [] as LocationType[], headcount: '', notes: '' }

export default function LocationsManager() {
  const [locations, setLocations] = useState<CompanyLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ city: '', location_types: [] as LocationType[], headcount: '', notes: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  function startEdit(loc: CompanyLocation) {
    setEditingId(loc.id)
    setEditForm({
      city: loc.city ?? '',
      location_types: loc.location_types ?? [],
      headcount: loc.headcount ? String(loc.headcount) : '',
      notes: loc.notes ?? '',
    })
    setEditError('')
  }

  function toggleEditType(t: LocationType) {
    setEditForm(f => ({
      ...f,
      location_types: f.location_types.includes(t)
        ? f.location_types.filter(x => x !== t)
        : [...f.location_types, t],
    }))
  }

  async function saveEdit(id: string) {
    if (editForm.location_types.length === 0) { setEditError('Select at least one location type.'); return }
    setEditSaving(true)
    setEditError('')
    const res = await fetch('/api/profile/locations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        city: editForm.city,
        location_types: editForm.location_types,
        headcount: editForm.headcount ? Number(editForm.headcount) : null,
        notes: editForm.notes,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setEditError(data.error ?? 'Failed to save'); setEditSaving(false); return }
    setLocations(prev => prev.map(l => l.id === id ? data : l))
    setEditingId(null)
    setEditSaving(false)
  }

  useEffect(() => {
    fetch('/api/profile/locations')
      .then(r => r.json())
      .then(data => { setLocations(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function toggleType(t: LocationType) {
    setForm(f => ({
      ...f,
      location_types: f.location_types.includes(t)
        ? f.location_types.filter(x => x !== t)
        : [...f.location_types, t],
    }))
  }

  async function addLocation() {
    if (!form.country_code || form.location_types.length === 0) {
      setError('Select a country and at least one location type.')
      return
    }
    setSaving(true)
    setError('')
    const country = COUNTRIES.find(c => c.code === form.country_code)
    const res = await fetch('/api/profile/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country_code: form.country_code,
        country_name: country?.name ?? form.country_code,
        city: form.city,
        location_types: form.location_types,
        headcount: form.headcount ? Number(form.headcount) : null,
        notes: form.notes,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to save'); setSaving(false); return }
    setLocations(prev => [...prev, data])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
  }

  async function removeLocation(id: string) {
    await fetch('/api/profile/locations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLocations(prev => prev.filter(l => l.id !== id))
  }

  const typeLabel = (t: LocationType) => LOCATION_TYPES.find(x => x.value === t)?.label ?? t

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Operational Locations</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Country-level intelligence is tailored to each site type — labour news for factories, FX signals for sales offices
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError('') }}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Location'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <select
                value={form.country_code}
                onChange={e => setForm(f => ({ ...f, country_code: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select country…</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City (optional)</label>
              <input
                type="text"
                placeholder="e.g. Tel Aviv"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location Type <span className="text-gray-400">(select all that apply)</span></label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {LOCATION_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleType(t.value)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                    form.location_types.includes(t.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{t.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Employees (optional)</label>
              <input
                type="number"
                placeholder="e.g. 250"
                value={form.headcount}
                onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
              <input
                type="text"
                placeholder="e.g. Main production facility"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            onClick={addLocation}
            disabled={saving}
            className="w-full text-sm font-medium bg-gray-900 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Location'}
          </button>
        </div>
      )}

      {/* Location list */}
      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="px-5 py-6 text-xs text-gray-400 text-center">Loading…</div>
        ) : locations.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-500">No locations added yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Add your company sites to get country-specific intelligence in every brief.
            </p>
          </div>
        ) : (
          locations.map(loc => (
            <div key={loc.id}>
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {loc.city ? `${loc.city}, ` : ''}{loc.country_name}
                    </span>
                    {(loc.location_types ?? []).map(t => (
                      <span key={t} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${TYPE_COLORS[t] ?? 'bg-gray-100 text-gray-600'}`}>
                        {typeLabel(t)}
                      </span>
                    ))}
                    {loc.headcount && (
                      <span className="text-[10px] text-gray-400">{loc.headcount.toLocaleString()} employees</span>
                    )}
                  </div>
                  {loc.notes && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{loc.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => editingId === loc.id ? setEditingId(null) : startEdit(loc)}
                  className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors p-1 text-xs"
                  title="Edit location"
                >
                  {editingId === loc.id ? 'Cancel' : 'Edit'}
                </button>
                <button
                  onClick={() => removeLocation(loc.id)}
                  className="shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1"
                  title="Remove location"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {editingId === loc.id && (
                <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100 space-y-3 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">City (optional)</label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Employees</label>
                      <input
                        type="number"
                        value={editForm.headcount}
                        onChange={e => setEditForm(f => ({ ...f, headcount: e.target.value }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {LOCATION_TYPES.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => toggleEditType(t.value)}
                          className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                            editForm.location_types.includes(t.value)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-semibold">{t.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <input
                      type="text"
                      value={editForm.notes}
                      onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  {editError && <p className="text-xs text-red-600">{editError}</p>}
                  <button
                    onClick={() => saveEdit(loc.id)}
                    disabled={editSaving}
                    className="text-sm font-medium bg-gray-900 hover:bg-gray-700 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {editSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {locations.length > 0 && (
        <div className="px-5 py-3 bg-blue-50 rounded-b-xl border-t border-blue-100">
          <p className="text-[11px] text-blue-600">
            Country signals from {locations.length} location{locations.length !== 1 ? 's' : ''} will be included in your next brief.
          </p>
        </div>
      )}
    </div>
  )
}
