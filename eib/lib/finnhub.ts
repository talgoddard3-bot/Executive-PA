import type { StoredSparkline, StoredDataPoint } from './types'

const BASE = 'https://finnhub.io/api/v1'

function key() { return process.env.FINNHUB_API_KEY ?? '' }

function buildSparkline(
  label: string, ticker: string, unit: string, data: StoredDataPoint[]
): StoredSparkline {
  const current = data[data.length - 1]?.value ?? 0
  const open    = data[0]?.value ?? current
  const pct     = open !== 0 ? Math.round(((current - open) / open) * 10000) / 100 : 0
  return { label, ticker, unit, data, current, open, pct, up: current >= open }
}

async function get<T>(path: string): Promise<T | null> {
  const k = key()
  if (!k) return null
  try {
    const res = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}token=${k}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── Quotes ───────────────────────────────────────────────────────────────────

export interface FinnhubQuote {
  c: number   // current price
  d: number   // change
  dp: number  // % change
  h: number   // high
  l: number   // low
  o: number   // open
  pc: number  // previous close
}

export async function finnhubQuote(symbol: string): Promise<FinnhubQuote | null> {
  return get<FinnhubQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`)
}

// ── Candles (30-day daily OHLCV → sparkline) ─────────────────────────────────

interface CandleResponse {
  c: number[]; t: number[]; s: string
}

async function fetchCandleSparkline(
  endpoint: string,
  symbol: string,
  label: string,
  ticker: string,
  unit = '',
  days = 30,
): Promise<StoredSparkline | null> {
  const to   = Math.floor(Date.now() / 1000)
  const from = to - days * 86400
  const data = await get<CandleResponse>(
    `${endpoint}?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}`
  )
  if (!data || data.s !== 'ok' || !data.c?.length) return null
  const pts: StoredDataPoint[] = data.c.map((v, i) => ({
    date: new Date(data.t[i] * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value: Math.round(v * 100) / 100,
  }))
  return buildSparkline(label, ticker, unit, pts)
}

export function fetchStockCandle(symbol: string, label: string, ticker: string, days = 30) {
  return fetchCandleSparkline('/stock/candle', symbol, label, ticker, '', days)
}

export function fetchForexCandle(symbol: string, label: string, ticker: string, days = 30) {
  return fetchCandleSparkline('/forex/candle', symbol, label, ticker, '', days)
}

// ── Symbol search ─────────────────────────────────────────────────────────────

interface SearchResult { description: string; displaySymbol: string; symbol: string; type: string }

export async function finnhubSearch(query: string): Promise<SearchResult[]> {
  const data = await get<{ result: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`)
  return data?.result ?? []
}

/** Resolve a company name to its primary US ticker symbol */
export async function resolveSymbol(companyName: string): Promise<string | null> {
  const results = await finnhubSearch(companyName)
  const stock = results.find(r => r.type === 'Common Stock' && !r.symbol.includes('.'))
  return stock?.symbol ?? results[0]?.symbol ?? null
}

// ── Company news ──────────────────────────────────────────────────────────────

export interface FinnhubNewsItem {
  datetime: number
  headline: string
  source: string
  summary: string
  url: string
}

export async function finnhubCompanyNews(
  symbol: string,
  daysBack = 7,
): Promise<FinnhubNewsItem[]> {
  const to   = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0]
  const data = await get<FinnhubNewsItem[]>(
    `/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`
  )
  return (data ?? []).slice(0, 3)
}

// ── Earnings calendar ─────────────────────────────────────────────────────────

export interface EarningsEvent {
  date: string
  epsActual: number | null
  epsEstimate: number | null
  quarter: number
  revenueActual: number | null
  revenueEstimate: number | null
  symbol: string
  year: number
}

export async function finnhubEarnings(daysAhead = 14): Promise<EarningsEvent[]> {
  const from = new Date().toISOString().split('T')[0]
  const to   = new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0]
  const data = await get<{ earningsCalendar: EarningsEvent[] }>(
    `/calendar/earnings?from=${from}&to=${to}`
  )
  return data?.earningsCalendar ?? []
}

// ── Convenience: competitor signals bundle ────────────────────────────────────

export interface CompetitorSignal {
  name: string
  symbol: string | null
  quote: FinnhubQuote | null
  news: FinnhubNewsItem[]
}

export async function fetchCompetitorSignals(
  competitorNames: string[],
): Promise<CompetitorSignal[]> {
  return Promise.all(
    competitorNames.slice(0, 5).map(async (name) => {
      const symbol = await resolveSymbol(name)
      const [quote, news] = await Promise.all([
        symbol ? finnhubQuote(symbol) : Promise.resolve(null),
        symbol ? finnhubCompanyNews(symbol, 7) : Promise.resolve([]),
      ])
      return { name, symbol, quote, news }
    })
  )
}
