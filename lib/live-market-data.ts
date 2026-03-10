import type { StoredSparkline, StoredDataPoint } from './types'
import { fetchStockCandle, fetchForexCandle } from './finnhub'
import { fetchFREDSparkline } from './fred'

const AV_KEY  = process.env.ALPHA_VANTAGE_KEY
const FMP_KEY = process.env.FMP_API_KEY

// ── Commodity name → Alpha Vantage function ───────────────────────────────────
const AV_COMMODITY_MAP: Record<string, { fn: string; label: string; ticker: string; unit: string }> = {
  'oil':         { fn: 'WTI',         label: 'WTI Oil',   ticker: 'WTI',  unit: '$/bbl'    },
  'crude':       { fn: 'WTI',         label: 'WTI Oil',   ticker: 'WTI',  unit: '$/bbl'    },
  'brent':       { fn: 'BRENT',       label: 'Brent Oil', ticker: 'BNO',  unit: '$/bbl'    },
  'gold':        { fn: 'GOLD',        label: 'Gold',      ticker: 'XAU',  unit: '$/oz'     },
  'silver':      { fn: 'SILVER',      label: 'Silver',    ticker: 'XAG',  unit: '$/oz'     },
  'platinum':    { fn: 'PLATINUM',    label: 'Platinum',  ticker: 'PPLT', unit: '$/oz'     },
  'copper':      { fn: 'COPPER',      label: 'Copper',    ticker: 'HG',   unit: '¢/lb'     },
  'aluminium':   { fn: 'ALUMINUM',    label: 'Aluminium', ticker: 'ALI',  unit: '$/t'      },
  'aluminum':    { fn: 'ALUMINUM',    label: 'Aluminium', ticker: 'ALI',  unit: '$/t'      },
  'natural gas': { fn: 'NATURAL_GAS', label: 'Nat. Gas',  ticker: 'NG',   unit: '$/MMBtu'  },
  'natgas':      { fn: 'NATURAL_GAS', label: 'Nat. Gas',  ticker: 'NG',   unit: '$/MMBtu'  },
  'wheat':       { fn: 'WHEAT',       label: 'Wheat',     ticker: 'ZW',   unit: '¢/bu'     },
  'corn':        { fn: 'CORN',        label: 'Corn',      ticker: 'ZC',   unit: '¢/bu'     },
  'cotton':      { fn: 'COTTON',      label: 'Cotton',    ticker: 'CT',   unit: '¢/lb'     },
  'sugar':       { fn: 'SUGAR',       label: 'Sugar',     ticker: 'SB',   unit: '¢/lb'     },
  'coffee':      { fn: 'COFFEE',      label: 'Coffee',    ticker: 'KC',   unit: '¢/lb'     },
}
// Commodities with no AV function → FMP ETF proxy
const FMP_COMMODITY_MAP: Record<string, { symbol: string; label: string; ticker: string }> = {
  'steel':          { symbol: 'SLX',    label: 'Steel ETF',   ticker: 'SLX'  },
  'lithium':        { symbol: 'LIT',    label: 'Lithium ETF', ticker: 'LIT'  },
  'cobalt':         { symbol: 'LIT',    label: 'Lithium ETF', ticker: 'LIT'  },
  'silicon':        { symbol: 'SOXX',   label: 'Semis ETF',   ticker: 'SOXX' },
  'semiconductors': { symbol: 'SOXX',   label: 'Semis ETF',   ticker: 'SOXX' },
  'chips':          { symbol: 'SOXX',   label: 'Semis ETF',   ticker: 'SOXX' },
  'rare earth':     { symbol: 'REMX',   label: 'Rare Earth',  ticker: 'REMX' },
  'palladium':      { symbol: 'PALL',   label: 'Palladium',   ticker: 'PALL' },
  'nickel':         { symbol: 'JJNUSX', label: 'Nickel',      ticker: 'JJNU' },
  'uranium':        { symbol: 'URA',    label: 'Uranium ETF', ticker: 'URA'  },
  'timber':         { symbol: 'WOOD',   label: 'Timber ETF',  ticker: 'WOOD' },
}

function toDataPoint(date: string, value: number): StoredDataPoint {
  return {
    date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value,
  }
}

function buildSparkline(
  label: string, ticker: string, unit: string, data: StoredDataPoint[]
): StoredSparkline {
  const current = data[data.length - 1]?.value ?? 0
  const open    = data[0]?.value ?? current
  const pct     = open !== 0 ? Math.round(((current - open) / open) * 10000) / 100 : 0
  return { label, ticker, unit, data, current, open, pct, up: current >= open }
}

// ── Alpha Vantage ─────────────────────────────────────────────────────────────

async function fetchAVFX(from: string, to: string): Promise<StoredSparkline | null> {
  if (!AV_KEY) return null
  try {
    const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&outputsize=compact&apikey=${AV_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    if (json.Note || json.Information) return null
    const series = json['Time Series FX (Daily)']
    if (!series) return null
    const data = Object.entries(series)
      .slice(0, 30).reverse()
      .map(([date, v]) => toDataPoint(date, parseFloat((v as Record<string, string>)['4. close'])))
    return buildSparkline(`${from}/${to}`, `${from}/${to}`, '', data)
  } catch { return null }
}

async function fetchAVCommodity(fn: string, label: string, ticker: string, unit: string): Promise<StoredSparkline | null> {
  if (!AV_KEY) return null
  try {
    const url = `https://www.alphavantage.co/query?function=${fn}&interval=daily&apikey=${AV_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    if (json.Note || json.Information) return null
    const entries = (json.data ?? [])
      .filter((d: Record<string, string>) => d.value !== '.')
      .slice(0, 30).reverse()
      .map((d: Record<string, string>) => toDataPoint(d.date, parseFloat(d.value)))
    if (!entries.length) return null
    return buildSparkline(label, ticker, unit, entries)
  } catch { return null }
}

// ── Financial Modeling Prep ───────────────────────────────────────────────────

async function fetchFMP(symbol: string, label: string, ticker: string): Promise<StoredSparkline | null> {
  if (!FMP_KEY) return null
  try {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${encodeURIComponent(symbol)}?timeseries=30&apikey=${FMP_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    const hist = json.historical?.slice(0, 30).reverse()
    if (!hist?.length) return null
    const data = hist.map((d: Record<string, number | string>) => toDataPoint(String(d.date), Number(d.close)))
    return buildSparkline(label, ticker, '', data)
  } catch { return null }
}

// ── Waterfall helpers ─────────────────────────────────────────────────────────

/** Try each async factory in order, return first non-null result */
async function firstOf<T>(...fns: (() => Promise<T | null>)[]): Promise<T | null> {
  for (const fn of fns) {
    const result = await fn()
    if (result !== null) return result
  }
  return null
}

// ── Stock / competitor / commodity helpers ────────────────────────────────────

/** Fetch any equity by ticker from FMP (30-day history) */
async function fetchFMPStock(symbol: string, label: string, ticker: string): Promise<StoredSparkline | null> {
  return fetchFMP(symbol, label, ticker)
}

/** Look up a company's primary stock ticker via FMP search */
async function searchFMPTicker(companyName: string): Promise<string | null> {
  if (!FMP_KEY) return null
  try {
    const url = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(companyName)}&limit=3&exchange=NASDAQ,NYSE,NYSE%20American&apikey=${FMP_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    // Prefer exact or close name match
    const hit = (json as Array<{ symbol: string; name: string }>).find(r =>
      r.name.toLowerCase().includes(companyName.toLowerCase().split(' ')[0])
    ) ?? json[0]
    return hit?.symbol ?? null
  } catch { return null }
}

/** Fetch a sparkline for a commodity name (case-insensitive) */
async function fetchCommodityByName(name: string): Promise<StoredSparkline | null> {
  const key = name.toLowerCase().trim()
  const avEntry = AV_COMMODITY_MAP[key]
  if (avEntry) {
    const s = await fetchAVCommodity(avEntry.fn, avEntry.label, avEntry.ticker, avEntry.unit)
    if (s) return s
  }
  const fmpEntry = FMP_COMMODITY_MAP[key]
  if (fmpEntry) {
    return fetchFMP(fmpEntry.symbol, fmpEntry.label, fmpEntry.ticker)
  }
  return null
}

// ── Main export ───────────────────────────────────────────────────────────────

interface MarketDataOptions {
  stockTicker?: string | null       // company's own stock ticker
  companyName?: string              // used as label if stockTicker provided
  competitors?: Array<{ name: string }>
  commodities?: string[]
  locationCountryNames?: string[]   // operational location country names
}

export async function fetchLiveMarketData(
  revenueCountryNames: string[],
  options: MarketDataOptions = {}
): Promise<Record<string, StoredSparkline>> {
  const allCountries = [...revenueCountryNames, ...(options.locationCountryNames ?? [])]
  const lower    = allCountries.map(c => c.toLowerCase())
  const hasUK    = lower.some(c => c.includes('uk') || c.includes('united kingdom'))
  const hasJapan = lower.some(c => c.includes('japan'))
  const hasChina = lower.some(c => c.includes('china'))
  const hasIsrael = lower.some(c => c.includes('israel'))

  // ── Wave 1: indices + USD ─────────────────────────────────────────────────
  // Finnhub primary (60/min), FMP/AV fallback
  const [sp500, dxy, eurusd, oil] = await Promise.all([
    firstOf(
      () => fetchStockCandle('SPY',       'S&P 500',   'SPX'),
      () => fetchFMP('^GSPC',             'S&P 500',   'SPX'),
    ),
    firstOf(
      () => fetchForexCandle('OANDA:USD_INDEX', 'USD Index', 'DXY'),
      () => fetchFREDSparkline('dxy'),
      () => fetchFMP('DX-Y.NYB',          'USD Index', 'DXY'),
    ),
    firstOf(
      () => fetchForexCandle('OANDA:EUR_USD', 'EUR/USD', '€/$'),
      () => fetchFREDSparkline('eurusd'),
      () => fetchAVFX('EUR', 'USD'),
    ),
    firstOf(
      () => fetchFREDSparkline('oil'),
      () => fetchAVCommodity('WTI', 'WTI Oil', 'WTI', '$/bbl'),
    ),
  ])

  // ── Small gap to respect Alpha Vantage 5/min ──────────────────────────────
  await new Promise(r => setTimeout(r, 1200))

  // ── Wave 2: MSCI, gold, FX optionals ─────────────────────────────────────
  const [msci, gold, gbpusd, usdjpy, usdcny, usdils] = await Promise.all([
    firstOf(
      () => fetchStockCandle('URTH',     'MSCI World', 'MXWO'),
      () => fetchFMP('URTH',             'MSCI World', 'MXWO'),
    ),
    firstOf(
      () => fetchFREDSparkline('gold'),
      () => fetchAVCommodity('GOLD', 'Gold', 'XAU', '$/oz'),
    ),
    hasUK ? firstOf(
      () => fetchForexCandle('OANDA:GBP_USD', 'GBP/USD', '£/$'),
      () => fetchFREDSparkline('gbpusd'),
      () => fetchAVFX('GBP', 'USD'),
    ) : Promise.resolve(null),
    hasJapan ? firstOf(
      () => fetchForexCandle('OANDA:USD_JPY', 'USD/JPY', '$/¥'),
      () => fetchFREDSparkline('usdjpy'),
      () => fetchAVFX('USD', 'JPY'),
    ) : Promise.resolve(null),
    hasChina ? firstOf(
      () => fetchForexCandle('OANDA:USD_CNH', 'USD/CNH', '$/CNH'),
      () => fetchFREDSparkline('usdcny'),
      () => fetchAVFX('USD', 'CNY'),
    ) : Promise.resolve(null),
    hasIsrael ? firstOf(
      () => fetchForexCandle('OANDA:USD_ILS', 'USD/ILS', '$/₪'),
      () => fetchAVFX('USD', 'ILS'),
    ) : Promise.resolve(null),
  ])

  const all  = [sp500, dxy, eurusd, oil, msci, gold, gbpusd, usdjpy, usdcny, usdils]
  const keys = ['sp500', 'dxy', 'eurusd', 'oil', 'msci', 'gold', 'gbpusd', 'usdjpy', 'usdcny', 'usdils']

  const snapshots: Record<string, StoredSparkline> = {}
  all.forEach((s, i) => { if (s) snapshots[keys[i]] = s })

  // ── Wave 3: company stock, competitor stocks, commodities ─────────────────
  await new Promise(r => setTimeout(r, 800))

  const { stockTicker, companyName, competitors = [], commodities = [] } = options

  // Company stock
  if (stockTicker) {
    const s = await firstOf(
      () => fetchStockCandle(stockTicker, companyName ?? stockTicker, stockTicker),
      () => fetchFMPStock(stockTicker, companyName ?? stockTicker, stockTicker),
    )
    if (s) snapshots['company_stock'] = s
  }

  // Competitor stocks (up to 3, auto-lookup ticker via FMP search)
  const topCompetitors = competitors.slice(0, 3)
  for (const comp of topCompetitors) {
    try {
      const ticker = await searchFMPTicker(comp.name)
      if (ticker) {
        const s = await firstOf(
          () => fetchStockCandle(ticker, comp.name, ticker),
          () => fetchFMPStock(ticker, comp.name, ticker),
        )
        if (s) {
          const key = `competitor_${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}`
          snapshots[key] = s
        }
      }
    } catch { /* skip */ }
  }

  // Profile commodities (up to 4)
  const topCommodities = commodities.slice(0, 4)
  for (const name of topCommodities) {
    // Skip if already covered by macro charts
    const key = name.toLowerCase().trim()
    if (['oil', 'crude', 'gold'].includes(key) && snapshots['oil'] && key !== 'gold') continue
    if (key === 'gold' && snapshots['gold']) continue
    const s = await fetchCommodityByName(name)
    if (s) {
      const snapKey = `commodity_${key.replace(/[^a-z0-9]/g, '_').slice(0, 20)}`
      snapshots[snapKey] = s
    }
  }

  console.log(`[market-data] Fetched ${Object.keys(snapshots).length} live series`)
  return snapshots
}
