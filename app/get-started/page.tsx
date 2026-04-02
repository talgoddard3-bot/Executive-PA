'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'

// ── Data ─────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'solo', name: 'Solo', monthlyPrice: 15, yearlyPrice: 150, yearlyMonthly: 12.5,
    desc: 'One executive, full intelligence.',
    features: ['Weekly AI brief', 'Role-filtered content', 'Live market data', 'AI chat per brief'],
    highlight: false,
  },
  {
    id: 'team', name: 'Team', monthlyPrice: 50, yearlyPrice: 500, yearlyMonthly: 41.67,
    desc: 'Your entire C-suite, aligned.',
    features: ['Everything in Solo', 'Up to 5 users', 'Role-based access', 'Internal notes & uploads'],
    highlight: true,
    badge: 'Most popular',
  },
]

const ROLES = [
  { value: 'Chief Executive Officer',        label: 'CEO',   desc: 'Strategy & full brief' },
  { value: 'Chief Financial Officer',        label: 'CFO',   desc: 'Markets & capital' },
  { value: 'Chief Marketing Officer',        label: 'CMO',   desc: 'Competitors & brand' },
  { value: 'Chief Operating Officer',        label: 'COO',   desc: 'Ops & supply chain' },
  { value: 'Chief Technology Officer',       label: 'CTO',   desc: 'Tech & AI signals' },
  { value: 'Chief Business Process Officer', label: 'CBPO',  desc: 'Process intelligence' },
  { value: 'VP Human Resources',             label: 'VP HR', desc: 'Talent & workforce' },
  { value: 'Business Development',           label: 'BD',    desc: 'M&A & partnerships' },
  { value: 'Executive',                      label: 'All',   desc: 'Full brief access' },
]

type Step = 'plan' | 'details' | 'account' | 'paying'

function GetStartedFlow() {
  const searchParams = useSearchParams()
  const [step, setStep]       = useState<Step>('plan')
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [plan,    setPlan]    = useState(searchParams.get('plan') ?? 'solo')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const [details, setDetails] = useState({
    full_name: '', email: '', company_name: '',
    position: 'Chief Executive Officer',
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Read plan from URL on mount
  useEffect(() => {
    const p = searchParams.get('plan')
    const b = searchParams.get('billing')
    if (p) setPlan(p)
    if (b === 'monthly' || b === 'yearly') setBilling(b)
    // Skip plan step if coming from a specific pricing CTA
    if (p) setStep('details')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPlan = PLANS.find(p => p.id === plan) ?? PLANS[0]
  const price = billing === 'yearly' ? selectedPlan.yearlyMonthly : selectedPlan.monthlyPrice

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function handleGoogleSignIn() {
    setGoogleLoading(true); setError('')
    // Save data first
    localStorage.setItem('ib_plan', plan)
    localStorage.setItem('ib_billing', billing)
    localStorage.setItem('ib_details', JSON.stringify(details))

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/get-started-finish` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  async function handleEmailSignUp() {
    setError('')
    if (!details.full_name.trim() || !details.email.trim() || !details.company_name.trim()) {
      setError('Please fill in all fields.'); return
    }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: details.email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/get-started-finish`,
        data: { full_name: details.full_name },
      },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    // Save everything to localStorage so get-started-finish can pick it up
    localStorage.setItem('ib_plan', plan)
    localStorage.setItem('ib_billing', billing)
    localStorage.setItem('ib_details', JSON.stringify(details))

    // If session exists immediately (email confirmation disabled), proceed directly
    if (data.session) {
      await finishSignup()
      return
    }

    // Otherwise show email confirmation prompt
    setEmailSent(true)
    setLoading(false)
  }

  async function finishSignup() {
    setStep('paying')
    setError('')

    // Save profile
    const onbRes = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...details, plan }),
    })
    if (!onbRes.ok) {
      const d = await onbRes.json()
      setError(d.error ?? 'Profile save failed.')
      setStep('account')
      setLoading(false)
      return
    }

    // Go to Stripe
    const stripeRes = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, billing }),
    })
    if (stripeRes.ok) {
      const { url } = await stripeRes.json()
      if (url) { window.location.href = url; return }
    }

    // Stripe not configured — go to pending
    window.location.href = '/pending'
  }

  // ── Step indicators ──────────────────────────────────────────────────────────

  const STEPS: { id: Step; label: string }[] = [
    { id: 'plan',    label: 'Plan' },
    { id: 'details', label: 'About you' },
    { id: 'account', label: 'Account' },
    { id: 'paying',  label: 'Payment' },
  ]
  const stepIndex = STEPS.findIndex(s => s.id === step)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080a12] flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-icon.svg" alt="Intelligent Brief" width={28} height={28} className="rounded-md" />
          <span className="text-sm font-semibold text-white">Intelligent Brief</span>
        </Link>
        <Link href="/login" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Already have an account? Sign in
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* Step bar */}
          {step !== 'paying' && (
            <div className="flex items-center justify-center gap-0 mb-8">
              {STEPS.filter(s => s.id !== 'paying').map((s, i) => {
                const idx   = STEPS.findIndex(x => x.id === s.id)
                const done  = stepIndex > idx
                const active = stepIndex === idx
                return (
                  <div key={s.id} className="flex items-center">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      active ? 'bg-blue-600/20 text-blue-300' :
                      done   ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        done   ? 'bg-emerald-500 text-white' :
                        active ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {done ? '✓' : i + 1}
                      </div>
                      {s.label}
                    </div>
                    {i < 2 && <div className="w-6 h-px bg-gray-700 mx-1" />}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── STEP: Plan ──────────────────────────────────────────────────── */}
          {step === 'plan' && (
            <div>
              <div className="text-center mb-7">
                <h1 className="text-2xl font-bold text-white mb-1">Choose your plan</h1>
                <p className="text-sm text-gray-400">You can change or cancel at any time.</p>

                {/* Billing toggle */}
                <div className="inline-flex items-center gap-1 mt-4 p-1 rounded-xl border border-white/10 bg-white/5">
                  {(['monthly', 'yearly'] as const).map(b => (
                    <button key={b} onClick={() => setBilling(b)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        billing === b ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-white'
                      }`}>
                      {b === 'monthly' ? 'Monthly' : 'Yearly'}
                      {b === 'yearly' && <span className="ml-1.5 text-emerald-400">–17%</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {PLANS.map(p => (
                  <button key={p.id} onClick={() => { setPlan(p.id); setStep('details') }}
                    className={`relative text-left rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
                      plan === p.id
                        ? 'border-blue-500/60 bg-blue-600/10 ring-1 ring-blue-500/20'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}>
                    {p.badge && (
                      <span className="absolute -top-2.5 left-4 text-[9px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                    <p className="text-base font-bold text-white mb-0.5">{p.name}</p>
                    <p className="text-xs text-gray-400 mb-4">{p.desc}</p>
                    <div className="flex items-end gap-1 mb-4">
                      <span className="text-2xl font-bold text-white">
                        ${billing === 'yearly' ? p.yearlyMonthly.toFixed(0) : p.monthlyPrice}
                      </span>
                      <span className="text-gray-500 text-xs pb-1">/mo</span>
                    </div>
                    <ul className="space-y-1.5">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                          <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: Details ───────────────────────────────────────────────── */}
          {step === 'details' && (
            <div>
              <div className="text-center mb-7">
                <h1 className="text-2xl font-bold text-white mb-1">Tell us about you</h1>
                <p className="text-sm text-gray-400">Personalises your intelligence brief.</p>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full name</label>
                    <input value={details.full_name} onChange={e => setDetails(d => ({ ...d, full_name: e.target.value }))}
                      placeholder="Jane Smith" className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Company</label>
                    <input value={details.company_name} onChange={e => setDetails(d => ({ ...d, company_name: e.target.value }))}
                      placeholder="Acme Corp" className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Work email</label>
                  <input type="email" value={details.email} onChange={e => setDetails(d => ({ ...d, email: e.target.value }))}
                    placeholder="jane@company.com" className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Your role</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ROLES.map(r => (
                      <button key={r.value} type="button" onClick={() => setDetails(d => ({ ...d, position: r.value }))}
                        className={`text-left rounded-xl border p-2.5 transition-colors ${
                          details.position === r.value
                            ? 'border-blue-500/60 bg-blue-600/10'
                            : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                        }`}>
                        <p className={`text-xs font-bold ${details.position === r.value ? 'text-blue-300' : 'text-gray-200'}`}>{r.label}</p>
                        <p className="text-[9px] text-gray-500 leading-tight mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setStep('plan'); setError('') }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">
                    Back
                  </button>
                  <button onClick={() => {
                    if (!details.full_name.trim() || !details.email.trim() || !details.company_name.trim()) {
                      setError('Please fill in all fields.'); return
                    }
                    setError(''); setStep('account')
                  }} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: Account ───────────────────────────────────────────────── */}
          {step === 'account' && (
            <div>
              <div className="text-center mb-7">
                <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
                <p className="text-sm text-gray-400">
                  {selectedPlan.name} plan · ${price.toFixed(2)}/mo billed {billing}
                </p>
              </div>

              {emailSent ? (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-4">✉️</div>
                  <h2 className="text-lg font-bold text-white mb-2">Check your inbox</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    We sent a confirmation link to <strong className="text-white">{details.email}</strong>.<br />
                    Click it to confirm your account — you'll be redirected to complete payment.
                  </p>
                  <button onClick={() => setEmailSent(false)}
                    className="mt-5 text-xs text-blue-400 hover:underline">
                    Use a different email
                  </button>
                </div>
              ) : (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">

                  {/* Google */}
                  <button onClick={handleGoogleSignIn} disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-gray-200 transition-colors disabled:opacity-50">
                    {googleLoading
                      ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      : <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                    }
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-xs text-gray-600">or</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters" autoComplete="new-password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Confirm password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password" autoComplete="new-password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setStep('details'); setError('') }}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">
                      Back
                    </button>
                    <button onClick={handleEmailSignUp} disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                      {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {loading ? 'Creating account…' : 'Create account & pay'}
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-600 text-center">
                    By continuing you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Paying ────────────────────────────────────────────────── */}
          {step === 'paying' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border border-blue-500/30 bg-blue-600/10 flex items-center justify-center mx-auto mb-5">
                <span className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin block" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Setting up your account…</h2>
              <p className="text-sm text-gray-400">Redirecting you to secure payment.</p>
              {error && (
                <div className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function GetStartedPage() {
  return (
    <Suspense>
      <GetStartedFlow />
    </Suspense>
  )
}
