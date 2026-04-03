export default function PrintOnePager() {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 14mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { font-family: 'Inter', system-ui, sans-serif; }
      `}</style>

      {/* Print button — hidden on print */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors shadow-lg">
          Print / Save as PDF
        </button>
        <a href="/one-pager" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors shadow-lg">
          Web version
        </a>
      </div>

      {/* A4 page */}
      <div className="bg-white min-h-screen" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="max-w-[794px] mx-auto px-12 py-10">

          {/* Header bar */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-900">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-900 tracking-tight">Intelligent Brief</span>
              </div>
              <p className="text-xs text-gray-400">companybrief.net</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Product Overview</p>
              <p className="text-xs text-gray-400 mt-0.5">2026</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 leading-tight mb-3">
              Your Monday morning<br />competitive edge.
            </h1>
            <p className="text-base text-gray-600 leading-relaxed max-w-xl">
              Intelligent Brief is a weekly AI-powered intelligence report, built for your company specifically —
              your industry, your competitors, your markets, your risks.
              Ready every Monday at 7am. Five minutes to read.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[
              { v: '7am', l: 'Ready every Monday' },
              { v: '5 min', l: 'Average read time' },
              { v: '12+', l: 'Live data sources' },
              { v: '6', l: 'C-suite roles covered' },
            ].map(s => (
              <div key={s.l} className="border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-gray-900 leading-none mb-1">{s.v}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-8 mb-8">

            {/* Left: The problem */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">The Problem</p>
              <h2 className="text-base font-bold text-gray-900 mb-3">Executives are drowning in noise.</h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                Bloomberg, Reuters, analyst reports, newsletters — there is no shortage of information.
                The shortage is <strong>relevance</strong>.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                None of it is written for your company, your position, or your decisions this week.
                You're making million-dollar calls based on headlines you skimmed on the way to a meeting.
              </p>
            </div>

            {/* Right: The solution */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">The Solution</p>
              <h2 className="text-base font-bold text-gray-900 mb-3">One brief. Everything that matters.</h2>
              <div className="space-y-2">
                {[
                  'Written for your company, not a generic sector',
                  'Filtered by your role — CEO sees strategy, CFO sees markets',
                  'Backed by 12+ live sources including SEC, patents, research',
                  'Synthesised by Claude AI into clear, opinionated analysis',
                  '"What this means for you" — never just headlines',
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-emerald-600 font-bold mt-0.5 shrink-0">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mb-8">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">How It Works</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { n: '01', t: 'Profile setup', d: 'Industry, markets, competitors, supply chain. 5 minutes.' },
                { n: '02', t: 'Live data crawl', d: 'AI scans 12+ sources every week — markets, filings, news.' },
                { n: '03', t: 'AI synthesis', d: 'Claude writes your brief: your company, your role, your risks.' },
                { n: '04', t: 'Monday 7am', d: 'Open it. Read for 5 minutes. Walk in prepared.' },
              ].map(h => (
                <div key={h.n} className="border-l-2 border-gray-200 pl-3">
                  <p className="text-[9px] font-black text-gray-300 mb-1">{h.n}</p>
                  <p className="text-xs font-bold text-gray-900 mb-1">{h.t}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{h.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Roles + Pricing side by side */}
          <div className="grid grid-cols-2 gap-8 mb-8">

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Role-Filtered Coverage</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { r: 'CEO', d: 'Strategy & risk' },
                  { r: 'CFO', d: 'Markets & capital' },
                  { r: 'CMO', d: 'Competitors & brand' },
                  { r: 'CTO', d: 'Tech & AI signals' },
                  { r: 'COO', d: 'Ops & supply chain' },
                  { r: 'VP HR', d: 'Talent & workforce' },
                ].map(r => (
                  <div key={r.r} className="bg-gray-50 rounded-lg px-2.5 py-2">
                    <p className="text-xs font-bold text-gray-900">{r.r}</p>
                    <p className="text-[9px] text-gray-400">{r.d}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Pricing</p>
              <div className="space-y-2">
                {[
                  { name: 'Solo', monthly: '$15', yearly: '$150', desc: '1 user · all features' },
                  { name: 'Team', monthly: '$50', yearly: '$500', desc: 'Up to 5 users · all features' },
                ].map(p => (
                  <div key={p.name} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{p.name}</p>
                      <p className="text-[9px] text-gray-400">{p.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">{p.monthly}<span className="text-[9px] font-normal text-gray-400">/mo</span></p>
                      <p className="text-[9px] text-gray-400">{p.yearly}/year</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 mt-2">No contracts. Cancel anytime.</p>
            </div>
          </div>

          {/* Data sources */}
          <div className="mb-8">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Data Sources</p>
            <div className="flex flex-wrap gap-1.5">
              {['SEC EDGAR', 'Federal Reserve', 'Alpha Vantage', 'Bloomberg RSS', 'NewsAPI', 'GDELT', 'Google News', 'Semantic Scholar', 'USPTO Patents', 'S&P / MSCI', 'PR Newswire', 'Financial Times'].map(s => (
                <span key={s} className="px-2 py-0.5 bg-gray-100 rounded text-[9px] text-gray-600 font-medium">{s}</span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Intelligent Brief</p>
              <p className="text-xs text-gray-400">Strategic intelligence for global executives.</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-blue-600">companybrief.net</p>
              <p className="text-[9px] text-gray-400">Powered by Claude AI</p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
