import type { StoredSparkline, StoredDataPoint } from './types'

const BASE = 'https://api.stlouisfed.org/fred'
function key() { return process.env.FRED_API_KEY ?? '' }

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDataPoint(date: string, value: string): StoredDataPoint | null {
  const v = parseFloat(value)
  if (isNaN(v)) return null
  return {
    date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value: Math.round(v * 1000) / 1000,
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

async function fetchObservations(seriesId: string, limit = 30): Promise<StoredDataPoint[]> {
  const k = key()
  if (!k) return []
  try {
    const url = `${BASE}/series/observations?series_id=${seriesId}&api_key=${k}&sort_order=desc&limit=${limit}&file_type=json`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const json: { observations?: { date: string; value: string }[] } = await res.json()
    return (json.observations ?? [])
      .map(o => toDataPoint(o.date, o.value))
      .filter(Boolean)
      .reverse() as StoredDataPoint[]
  } catch {
    return []
  }
}

// ── Series catalogue ──────────────────────────────────────────────────────────

export const FRED_SERIES = {
  // Market / financial
  dxy:      { id: 'DTWEXBGS',          label: 'USD Index',        ticker: 'DXY',    unit: '' },
  eurusd:   { id: 'DEXUSEU',           label: 'EUR/USD',          ticker: '€/$',    unit: '' },
  gbpusd:   { id: 'DEXUSUK',           label: 'GBP/USD',          ticker: '£/$',    unit: '' },
  usdjpy:   { id: 'DEXJPUS',           label: 'JPY/USD',          ticker: '¥/$',    unit: '' },  // note: this is JPY per USD — invert for USD/JPY
  usdcny:   { id: 'DEXCHUS',           label: 'CNY/USD',          ticker: 'CNY/$',  unit: '' },
  oil:      { id: 'DCOILWTICO',        label: 'WTI Oil',          ticker: 'WTI',    unit: '$/bbl' },
  gold:     { id: 'GOLDAMGBD228NLBM',  label: 'Gold',             ticker: 'XAU',    unit: '$/oz' },
  copper:   { id: 'PCOPPUSDM',         label: 'Copper',           ticker: 'HG',     unit: '$/t' },
  us_10y:   { id: 'DGS10',             label: 'US 10Y Yield',     ticker: 'TNX',    unit: '%' },
  us_2y:    { id: 'DGS2',              label: 'US 2Y Yield',      ticker: 'T2Y',    unit: '%' },

  // Macro — United States
  us_unemployment: { id: 'UNRATE',     label: 'US Unemployment',  ticker: 'UNRATE', unit: '%' },
  us_cpi:          { id: 'CPIAUCSL',   label: 'US CPI',           ticker: 'CPI',    unit: '' },
  us_gdp:          { id: 'GDP',        label: 'US GDP',           ticker: 'GDP',    unit: '$B' },
  us_pmi:          { id: 'MANEMP',     label: 'US Mfg Employ.',   ticker: 'MFGEMP', unit: 'K' },

  // Macro — Europe
  de_unemployment: { id: 'LRHUTTTTDEA156S',  label: 'Germany Unemployment', ticker: 'DE_U', unit: '%' },
  de_cpi:          { id: 'CPGRLE01DEA657N',  label: 'Germany CPI',          ticker: 'DE_CPI', unit: '%' },
  eu_cpi:          { id: 'CP0000EZ19M086NEST', label: 'Eurozone CPI',       ticker: 'EU_CPI', unit: '%' },
  uk_unemployment: { id: 'LRHUTTTTGBA156S',  label: 'UK Unemployment',      ticker: 'UK_U', unit: '%' },
  uk_cpi:          { id: 'GBRCPIALLMINMEI',  label: 'UK CPI',               ticker: 'UK_CPI', unit: '' },

  // Macro — Asia
  jp_unemployment: { id: 'LRHUTTTTJPA156S',  label: 'Japan Unemployment',   ticker: 'JP_U', unit: '%' },
  cn_cpi:          { id: 'CHNCPIALLMINMEI',  label: 'China CPI',            ticker: 'CN_CPI', unit: '' },
} as const

export type FREDSeriesKey = keyof typeof FRED_SERIES

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchFREDSparkline(key: FREDSeriesKey): Promise<StoredSparkline | null> {
  const s = FRED_SERIES[key]
  const data = await fetchObservations(s.id, 30)
  if (!data.length) return null
  return buildSparkline(s.label, s.ticker, s.unit, data)
}

export interface FREDLatest {
  value: number
  date: string
  prevValue: number
  change: number
  changePct: number
}

export async function fetchFREDLatest(seriesId: string): Promise<FREDLatest | null> {
  const data = await fetchObservations(seriesId, 6)
  if (data.length < 2) return null
  const latest = data[data.length - 1]
  const prev   = data[data.length - 2]
  const change    = Math.round((latest.value - prev.value) * 1000) / 1000
  const changePct = prev.value !== 0 ? Math.round(((latest.value - prev.value) / prev.value) * 10000) / 100 : 0
  return { value: latest.value, date: latest.date, prevValue: prev.value, change, changePct }
}

// ── Country → FRED series mapping ────────────────────────────────────────────

const COUNTRY_UNEMPLOYMENT: Record<string, string> = {
  'united states': 'UNRATE',
  'usa': 'UNRATE',
  'us': 'UNRATE',
  'germany': 'LRHUTTTTDEA156S',
  'france': 'LRHUTTTTFRA156S',
  'united kingdom': 'LRHUTTTTGBA156S',
  'uk': 'LRHUTTTTGBA156S',
  'japan': 'LRHUTTTTJPA156S',
  'canada': 'LRHUTTTTCAA156S',
  'australia': 'LRHUTTTTAUA156S',
  'italy': 'LRHUTTTTITA156S',
  'spain': 'LRHUTTTTSPA156S',
  'south korea': 'LRHUTTTTKOR156S',
  'brazil': 'LRHUTTTTBRA156S',
}

const COUNTRY_CPI: Record<string, string> = {
  'united states': 'CPIAUCSL',
  'usa': 'CPIAUCSL',
  'germany': 'CPGRLE01DEA657N',
  'france': 'CPGRLE01FRA657N',
  'united kingdom': 'GBRCPIALLMINMEI',
  'uk': 'GBRCPIALLMINMEI',
  'japan': 'JPNCPIALLMINMEI',
  'china': 'CHNCPIALLMINMEI',
  'eurozone': 'CP0000EZ19M086NEST',
  'eu': 'CP0000EZ19M086NEST',
  'europe': 'CP0000EZ19M086NEST',
}

export function getUnemploymentSeries(country: string): string | null {
  return COUNTRY_UNEMPLOYMENT[country.toLowerCase().trim()] ?? null
}

export function getCPISeries(country: string): string | null {
  return COUNTRY_CPI[country.toLowerCase().trim()] ?? null
}

// ── Build macro context string for Claude signals ─────────────────────────────

export async function buildFREDMacroSignals(revenueCountries: string[]): Promise<string> {
  const lines: string[] = ['[MACRO ECONOMIC DATA — St. Louis Fed (FRED)]']

  // Always fetch key US/global rates
  const [oil, gold, us10y, us2y, usUnemp] = await Promise.all([
    fetchFREDLatest('DCOILWTICO'),
    fetchFREDLatest('GOLDAMGBD228NLBM'),
    fetchFREDLatest('DGS10'),
    fetchFREDLatest('DGS2'),
    fetchFREDLatest('UNRATE'),
  ])

  if (oil)    lines.push(`  WTI Oil: $${oil.value}/bbl (${oil.change >= 0 ? '+' : ''}${oil.change} since ${oil.date})`)
  if (gold)   lines.push(`  Gold: $${gold.value}/oz (${gold.change >= 0 ? '+' : ''}${gold.change} since ${gold.date})`)
  if (us10y && us2y) {
    const spread = Math.round((us10y.value - us2y.value) * 100) / 100
    lines.push(`  US Yield Curve: 10Y ${us10y.value}% / 2Y ${us2y.value}% — spread ${spread >= 0 ? '+' : ''}${spread}bps (${spread < 0 ? 'inverted, recession signal' : 'normal'})`)
  }
  if (usUnemp) lines.push(`  US Unemployment: ${usUnemp.value}% (prev ${usUnemp.prevValue}%)`)

  // Per revenue country
  const countryFetches = revenueCountries.slice(0, 4).map(async (country) => {
    const unemploySeries = getUnemploymentSeries(country)
    const cpiSeries = getCPISeries(country)
    const [unemp, cpi] = await Promise.all([
      unemploySeries ? fetchFREDLatest(unemploySeries) : Promise.resolve(null),
      cpiSeries ? fetchFREDLatest(cpiSeries) : Promise.resolve(null),
    ])
    const parts: string[] = []
    if (unemp) parts.push(`Unemployment ${unemp.value}%`)
    if (cpi)   parts.push(`CPI ${cpi.value} (${cpi.change >= 0 ? '+' : ''}${cpi.change} MoM)`)
    if (parts.length) lines.push(`  ${country}: ${parts.join(' · ')}`)
  })

  await Promise.all(countryFetches)

  return lines.join('\n')
}
