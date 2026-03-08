'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const POSITIONS = [
  'Chief Executive Officer',
  'Chief Operating Officer',
  'Chief Financial Officer',
  'Chief Marketing Officer',
  'Chief Business Process Officer',
  'Chief Technology Officer',
  'VP Human Resources',
  'Business Development',
  'Executive',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'loading' | 'form' | 'done'>('loading')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company_name: '',
    position: 'Chief Executive Officer',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login')
        return
      }
      // Pre-fill from Google OAuth metadata
      const meta = data.user.user_metadata
      setForm(f => ({
        ...f,
        full_name: meta?.full_name ?? meta?.name ?? '',
        email: data.user?.email ?? '',
      }))
      setStep('form')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.company_name.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setStep('done')
      setTimeout(() => router.replace('/pending'), 1500)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Something went wrong.')
      setSaving(false)
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-lg font-semibold text-gray-900">Request submitted!</h2>
          <p className="text-sm text-gray-500 mt-1">Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tell us about yourself to request access.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100"
        >
          {/* Full name */}
          <div className="p-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
            />
          </div>

          {/* Email */}
          <div className="p-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Work Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jane@company.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
            />
          </div>

          {/* Company */}
          <div className="p-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Company
            </label>
            <input
              type="text"
              required
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              placeholder="Acme Corp"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
            />
          </div>

          {/* Position */}
          <div className="p-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Your Position
            </label>
            <select
              value={form.position}
              onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 transition bg-white"
            >
              {POSITIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">
              This determines which sections of your brief you see. Admin can adjust it.
            </p>
          </div>

          {/* Submit */}
          <div className="p-5">
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Request Access
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          An admin will review your request and approve your account.
        </p>
      </div>
    </div>
  )
}
