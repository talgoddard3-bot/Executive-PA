'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

const STATS = [
  { value: '7am', label: 'Ready every Monday morning' },
  { value: '5 min', label: 'Average reading time' },
  { value: 'Dozens', label: 'Live data sources' },
  { value: '8+', label: 'C-suite roles covered' },
]

const ROLES = [
  { label: 'CEO', color: 'bg-violet-500/10 text-violet-300 border-violet-500/20', desc: 'Strategy, risk, board-level decisions' },
  { label: 'CFO', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20', desc: 'Markets, FX, capital structure' },
  { label: 'CMO', color: 'bg-pink-500/10 text-pink-300 border-pink-500/20', desc: 'Competitor moves, brand signals' },
  { label: 'CTO', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20', desc: 'AI, cybersecurity, tech disruption' },
  { label: 'COO', color: 'bg-orange-500/10 text-orange-300 border-orange-500/20', desc: 'Supply chain, operations, labour' },
  { label: 'VP HR', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', desc: 'Talent, workforce, hiring trends' },
  { label: 'CBPO', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20', desc: 'Business processes, operational intelligence' },
  { label: 'BD', color: 'bg-rose-500/10 text-rose-300 border-rose-500/20', desc: 'M&A, partnerships, deal flow' },
]

const SOURCES = [
  'SEC EDGAR', 'Federal Reserve', 'Bloomberg RSS', 'Financial Times',
  'Alpha Vantage', 'NewsAPI', 'GDELT', 'Google News',
  'Semantic Scholar', 'USPTO Patents', 'PR Newswire', 'S&P / MSCI',
]

const HOW = [
  {
    n: '01',
    title: 'Set up your company profile',
    desc: 'Tell us your industry, markets, competitors, and supply chain. Takes 5 minutes.',
  },
  {
    n: '02',
    title: 'We crawl the world for you',
    desc: 'Every week our AI scans dozens of live sources — markets, filings, news, patents, research.',
  },
  {
    n: '03',
    title: 'Claude synthesises your brief',
    desc: 'Not a news feed. A strategic analysis written for your company, your role, your decisions.',
  },
  {
    n: '04',
    title: 'Open it at 7am Monday',
    desc: 'Five minutes. Walk into your week knowing everything that matters.',
  },
]

export default function OnePagerWeb() {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText('https://companybrief.net')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#080a12] text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#080a12]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.svg" alt="Intelligent Brief" width={28} height={28} className="rounded-md" />
            <span className="font-semibold text-white text-sm">Intelligent Brief</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={copyLink} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied!' : 'Share'}
            </button>
            <Link href="/print-one-pager" target="_blank"
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </Link>
            <Link href="/get-started"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors">
              Request access
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6">

        {/* Hero */}
        <section className="pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Strategic intelligence for C-level executives
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            Your Monday morning<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              competitive edge.
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Intelligent Brief is a weekly AI-powered intelligence report built for your company specifically —
            your industry, your competitors, your markets, your risks. Ready every Monday at 7am.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-10">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white mb-1">{s.value}</p>
                <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          <Link href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20">
            Start your free trial
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </section>

        {/* The problem */}
        <section className="py-14 border-t border-white/5">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">The problem</p>
              <h2 className="text-3xl font-bold text-white mb-5 leading-snug">
                Executives are drowning in noise.
              </h2>
              <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
                <p>The average CEO receives over 200 emails a day. Bloomberg, Reuters, LinkedIn, analyst reports, board decks — there is no shortage of information.</p>
                <p>The shortage is <strong className="text-white">relevance</strong>. None of it is written for your company, your position, your decisions this week.</p>
                <p>You're making million-dollar calls on a Tuesday morning based on a headline you skimmed on the way to a meeting.</p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-3">
              {[
                { icon: '📰', text: 'Generic market news not relevant to your sector' },
                { icon: '🔁', text: 'Same headlines across 10 different newsletters' },
                { icon: '⏱', text: '45 minutes reading before you find one useful insight' },
                { icon: '🎯', text: 'No analysis — just headlines, no "so what"' },
                { icon: '👤', text: 'Nothing filtered for your specific role' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The solution */}
        <section className="py-14 border-t border-white/5">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">The solution</p>
            <h2 className="text-3xl font-bold text-white mb-4">One brief. Everything that matters. Nothing that doesn't.</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
              Every section of your brief is written specifically for your company, filtered by your role, and backed by live data from the world's best sources.
            </p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
            {ROLES.map((r, i) => (
              <div key={i} className={`rounded-xl border p-4 ${r.color}`}>
                <p className="text-sm font-bold mb-1">{r.label}</p>
                <p className="text-xs opacity-70 leading-snug">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-14 border-t border-white/5">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">How it works</p>
            <h2 className="text-3xl font-bold text-white">Set up once. Delivered every week.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {HOW.map(h => (
              <div key={h.n} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <p className="text-xs font-bold text-gray-600 mb-3">{h.n}</p>
                <p className="text-base font-bold text-white mb-2">{h.title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sources */}
        <section className="py-14 border-t border-white/5">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Data sources</p>
            <h2 className="text-3xl font-bold text-white mb-3">Built on the world's best data — and more.</h2>
            <p className="text-gray-400 text-sm">Dozens of live sources, synthesised by Claude AI into one coherent brief.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {SOURCES.map(s => (
              <span key={s} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-gray-400 font-medium">
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* Features grid */}
        <section className="py-14 border-t border-white/5">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Features</p>
            <h2 className="text-3xl font-bold text-white mb-3">Built for how executive teams actually work.</h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">Everything your leadership team needs — personalised, collaborative, and always in sync.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: '🎯',
                title: 'Position personalisation',
                desc: 'Every brief is filtered by role. Your CEO sees strategy and risk. Your CFO sees markets and capital. Your CTO sees tech disruption. No noise from sections that aren\'t yours.',
              },
              {
                icon: '🏢',
                title: 'Company customisation',
                desc: 'Set your industry, competitors, supply chain, target markets, and key commodities. The brief is built around your business — not a generic sector template.',
              },
              {
                icon: '✅',
                title: 'Action items',
                desc: 'Every brief ends with a prioritised action list per role. Add, edit, or remove actions. Mark them done. Your team always knows what to do next.',
              },
              {
                icon: '💬',
                title: 'Comments & tagging',
                desc: 'React to any article in the brief. Tag a colleague with @mention to share a signal or flag a risk. Keeps strategic conversations in context, not buried in email.',
              },
              {
                icon: '🔄',
                title: 'Full management sync',
                desc: 'Every C-level member gets the same brief, filtered to their view. Everyone is working from the same intelligence. No more "did you see that article?" — they already did.',
              },
              {
                icon: '🔮',
                title: 'Internal data — coming soon',
                desc: 'Today the brief runs on external signals. Soon you\'ll be able to upload internal notes, sales signals, and documents — and the AI will weave them into your analysis.',
                soon: true,
              },
            ].map((f, i) => (
              <div key={i} className={`rounded-2xl border p-6 relative ${f.soon ? 'border-white/5 bg-white/[0.01]' : 'border-white/10 bg-white/[0.03]'}`}>
                {f.soon && (
                  <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                    Coming soon
                  </span>
                )}
                <p className="text-2xl mb-3">{f.icon}</p>
                <p className={`text-sm font-bold mb-2 ${f.soon ? 'text-gray-500' : 'text-white'}`}>{f.title}</p>
                <p className={`text-xs leading-relaxed ${f.soon ? 'text-gray-600' : 'text-gray-400'}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="py-14 border-t border-white/5">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Pricing</p>
            <h2 className="text-3xl font-bold text-white mb-3">Less than one hour of a consultant's time.</h2>
            <p className="text-gray-400 text-sm">No contracts. Cancel anytime.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {[
              { name: 'Solo', price: '$15', period: '/month', desc: 'One executive, full intelligence.', features: ['Weekly AI brief', 'Role-filtered content', 'Live market data', 'AI chat per brief'] },
              { name: 'Team', price: '$50', period: '/month', desc: 'Your entire C-suite, aligned.', features: ['Everything in Solo', 'Up to 5 users', 'Role-based access', 'Internal notes & uploads'], highlight: true },
            ].map(p => (
              <div key={p.name} className={`rounded-2xl border p-6 ${p.highlight ? 'border-blue-500/40 bg-blue-600/5' : 'border-white/10 bg-white/[0.02]'}`}>
                <p className="text-base font-bold text-white mb-1">{p.name}</p>
                <p className="text-xs text-gray-500 mb-4">{p.desc}</p>
                <div className="flex items-end gap-1 mb-5">
                  <span className="text-3xl font-bold text-white">{p.price}</span>
                  <span className="text-gray-500 text-sm pb-1">{p.period}</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                      <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/get-started?plan=${p.name.toLowerCase()}`}
                  className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${p.highlight ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 border-t border-white/5 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Be the best-informed person<br />in every meeting.
          </h2>
          <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
            Join executives who start every week with clarity, not chaos.
          </p>
          <Link href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all hover:-translate-y-0.5">
            Request early access
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="mt-4 text-xs text-gray-600">companybrief.net · Powered by Claude AI</p>
        </section>

      </div>
    </div>
  )
}
