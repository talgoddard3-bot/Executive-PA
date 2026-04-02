'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

const POSITIONS = [
  { value: 'Chief Executive Officer',        label: 'CEO',   desc: 'Strategy & full brief' },
  { value: 'Chief Financial Officer',        label: 'CFO',   desc: 'Markets & capital' },
  { value: 'Chief Marketing Officer',        label: 'CMO',   desc: 'Competitors & brand' },
  { value: 'Chief Operating Officer',        label: 'COO',   desc: 'Ops & supply chain' },
  { value: 'Chief Business Process Officer', label: 'CBPO',  desc: 'Process intelligence' },
  { value: 'Chief Technology Officer',       label: 'CTO',   desc: 'Tech & AI signals' },
  { value: 'VP Human Resources',             label: 'VP HR', desc: 'Talent & workforce' },
  { value: 'Business Development',           label: 'BD',    desc: 'M&A & partnerships' },
  { value: 'Executive',                      label: 'All',   desc: 'Full brief access' },
]

const STEPS = ['You', 'Company', 'Confirm']

function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan    = searchParams.get('plan')    ?? localStorage.getItem('ib_plan')    ?? 'solo'
  const billing = searchParams.get('billing') ?? localStorage.getItem('ib_billing') ?? 'monthly'
  const [step, setStep] = useState<'loading' | 1 | 2 | 3 | 'done'>('loading')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', position: 'Chief Executive Officer', company_name: '', industry: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      const meta = data.user.user_metadata
      setForm(f => ({ ...f, full_name: meta?.full_name ?? meta?.name ?? '', email: data.user?.email ?? '' }))
      setStep(1)
    })
  }, [router])

  async function submit() {
    setSaving(true); setError('')
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: form.full_name, email: form.email, company_name: form.company_name, position: form.position, plan }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Something went wrong.'); setSaving(false); return }

    // Redirect to Stripe Checkout
    const stripeRes = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, billing }),
    })
    if (stripeRes.ok) {
      const { url } = await stripeRes.json()
      if (url) { window.location.href = url; return }
    }
    // Stripe not configured — go straight to pending
    setStep('done')
    setTimeout(() => router.replace('/pending'), 1200)
  }

  if (step === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <span className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Request submitted</h2>
        <p className="text-sm text-gray-500 mt-1">You will be notified when approved.</p>
      </div>
    </div>
  )

  const stepNum = step as 1 | 2 | 3

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Request Access</h1>
          <p className="text-sm text-gray-500 mt-1">3 quick steps</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-7">
          {STEPS.map((label, i) => {
            const n = i + 1; const active = stepNum === n; const done = stepNum > n
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? 'bg-gray-900 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {done ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : n}
                </div>
                <span className={`text-xs font-medium ${active ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          {stepNum === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">About you</h2>
                <p className="text-xs text-gray-400 mt-0.5">Name, email and your role</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                  <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Jane Smith"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Work Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jane@company.com"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Your Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map(p => (
                    <button key={p.value} type="button" onClick={() => setForm(f => ({ ...f, position: p.value }))}
                      className={`text-left rounded-xl border p-3 transition-colors ${form.position === p.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <p className={`text-sm font-bold ${form.position === p.value ? 'text-blue-700' : 'text-gray-800'}`}>{p.label}</p>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { if (!form.full_name.trim() || !form.email.trim()) { setError('Please fill in all fields.'); return }; setError(''); setStep(2) }}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors">
                Continue
              </button>
              {error && <p className="text-xs text-red-600 text-center">{error}</p>}
            </div>
          )}

          {stepNum === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Your company</h2>
                <p className="text-xs text-gray-400 mt-0.5">Used to personalise your intelligence brief</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name</label>
                  <input type="text" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                    placeholder="Acme Corp"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Industry (optional)</label>
                  <input type="text" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                    placeholder="e.g. Manufacturing, SaaS, Retail"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Back</button>
                <button onClick={() => { if (!form.company_name.trim()) { setError('Please enter your company name.'); return }; setError(''); setStep(3) }}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors">Continue</button>
              </div>
              {error && <p className="text-xs text-red-600 text-center">{error}</p>}
            </div>
          )}

          {stepNum === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Confirm your request</h2>
                <p className="text-xs text-gray-400 mt-0.5">An admin will review and approve your account</p>
              </div>
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                {[
                  { label: 'Name', value: form.full_name },
                  { label: 'Email', value: form.email },
                  { label: 'Role', value: POSITIONS.find(p => p.value === form.position)?.label ?? form.position },
                  { label: 'Company', value: form.company_name },
                  ...(form.industry ? [{ label: 'Industry', value: form.industry }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center px-4 py-2.5 gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 w-16 shrink-0">{row.label}</span>
                    <span className="text-sm text-gray-800">{row.value}</span>
                  </div>
                ))}
              </div>
              {error && <p className="text-xs text-red-600 text-center">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Back</button>
                <button onClick={submit} disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Submitting...' : 'Request Access'}
                </button>
              </div>
            </div>
          )}

        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Already approved? <a href="/login" className="text-blue-500 hover:text-blue-700">Sign in</a>
        </p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  )
}
