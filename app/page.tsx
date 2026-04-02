'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'Role-specific intelligence',
    desc: 'Each executive sees what matters to them. CEO gets board-level risk. CFO gets capital markets. CTO gets tech threats. No noise, no irrelevance.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Live data, not summaries',
    desc: 'SEC filings, live market data, patent activity, geopolitical signals, and competitor press coverage — all synthesized in one place.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Ready before your first meeting',
    desc: 'Every Monday morning. Synthesized overnight. In your inbox before 8am — so you walk into any room as the most prepared person there.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
    title: 'Your company, your context',
    desc: 'Signals are filtered through your company profile — your markets, your competitors, your supply chain. Nothing generic.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Competitive & geopolitical edge',
    desc: 'Track competitor moves, M&A activity, patent filings, and geopolitical risks across every market you operate in.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Ask the brief anything',
    desc: 'Every brief comes with an AI assistant trained on your company data. Ask follow-up questions, explore scenarios, get deeper analysis.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Set up your company profile',
    desc: 'Tell us your markets, competitors, supply chain, and key risks. Takes 5 minutes.',
  },
  {
    num: '02',
    title: 'We synthesize your intelligence',
    desc: 'Every Monday, our AI pulls from hundreds of sources and writes your weekly brief — filtered for your company\'s specific context.',
  },
  {
    num: '03',
    title: 'Your team reads what matters to them',
    desc: 'CEO sees strategy and risk. CFO sees capital markets. CTO sees tech threats. Each brief is role-filtered automatically.',
  },
]

const PLANS = [
  {
    name: 'Solo',
    desc: 'For a single executive who needs an edge.',
    monthlyPrice: 15,
    yearlyPrice: 150,
    yearlyMonthly: 12.50,
    features: [
      'Weekly AI-synthesized intelligence brief',
      'Role-specific content filtering',
      'Live market data & charts',
      'AI chat assistant per brief',
      'Email delivery every Monday',
      'Full brief archive',
    ],
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Team',
    desc: 'For C-suites that move as one unit.',
    monthlyPrice: 50,
    yearlyPrice: 500,
    yearlyMonthly: 41.67,
    features: [
      'Everything in Solo',
      'Up to 5 team members',
      'Shared company intelligence profile',
      'Role-filtered access per user (CEO, CFO, CTO…)',
      'Internal notes & document upload',
      'Priority support',
    ],
    cta: 'Get started',
    highlight: true,
    badge: 'Most popular',
  },
]

export default function LandingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className="min-h-screen bg-[#080a12] text-white selection:bg-blue-500/30">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#080a12]/90 backdrop-blur-md border-b border-white/5' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-white tracking-tight">Intelligent Brief</span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors"
            >
              Request access
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 left-1/3 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            AI-powered intelligence briefs for C-level executives
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            Your company's intelligence,{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              synthesized
            </span>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Every Monday morning, a tailored intelligence brief lands in your inbox — powered by AI, enriched with live market data, filtered by your role. Built for CEOs, CFOs, CTOs, and the teams they lead.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-base font-semibold text-white transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              Request early access
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-base font-medium text-gray-300 transition-all hover:-translate-y-0.5"
            >
              See how it works
            </a>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Ready before your 8am meeting
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No generic news summaries
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to lead with conviction
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Built for executives who don't have time to read everything, but need to know everything that matters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-[#080a12] p-7 hover:bg-white/[0.02] transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:bg-blue-600/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple setup, permanent edge</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Five minutes of setup. Weekly intelligence that compounds over time.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-blue-500/50 via-indigo-500/30 to-transparent hidden md:block" />

            <div className="space-y-10">
              {STEPS.map((s, i) => (
                <div key={i} className="flex gap-6 md:gap-8">
                  <div className="w-12 h-12 rounded-full border border-blue-500/30 bg-blue-600/10 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0 relative z-10">
                    {s.num}
                  </div>
                  <div className="pt-2.5">
                    <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Invest less than a Bloomberg terminal.<br className="hidden md:block" />
              <span className="text-gray-400">Get something more relevant.</span>
            </h2>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 mt-6 p-1 rounded-xl border border-white/10 bg-white/5">
              {(['monthly', 'yearly'] as const).map(b => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    billing === b
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {b === 'monthly' ? 'Monthly' : 'Yearly'}
                  {b === 'yearly' && (
                    <span className="ml-2 text-[10px] font-bold text-emerald-400">
                      SAVE 17%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border transition-all ${
                  plan.highlight
                    ? 'bg-blue-600/10 border-blue-500/40 ring-1 ring-blue-500/20'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.desc}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${billing === 'monthly' ? plan.monthlyPrice : plan.yearlyMonthly.toFixed(0)}
                    </span>
                    <span className="text-gray-400 text-sm pb-1.5">/month</span>
                  </div>
                  {billing === 'yearly' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Billed annually · ${plan.yearlyPrice}/year
                    </p>
                  )}
                </div>

                <Link
                  href="/login"
                  className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all mb-7 ${
                    plan.highlight
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-blue-400' : 'text-emerald-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500 mt-8">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600/10 rounded-3xl blur-2xl" />
            <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Stop reading the news.<br />Start reading your intelligence.
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Join executives who walk into their Monday meetings already knowing what happened, why it matters, and what to do about it.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-base font-semibold text-white transition-all shadow-xl shadow-blue-500/20 hover:-translate-y-0.5"
              >
                Request early access
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Intelligent Brief</span>
          </div>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Intelligent Brief. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Sign in</Link>
            <a href="#pricing" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
