// Deterministic seeded random — same values every render, no hydration mismatch
function seeded(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export interface DataPoint {
  date: string
  value: number
}

export interface Sparkline {
  label: string
  ticker: string
  unit: string
  data: DataPoint[]
  current: number
  open: number // 30 days ago
  pct: number
  up: boolean
}

function generate(
  label: string,
  ticker: string,
  unit: string,
  base: number,
  vol: number,
  drift: number,
  decimals: number,
  seedOffset: number,
  days = 30
): Sparkline {
  const data: DataPoint[] = []
  let v = base
  for (let i = 0; i < days; i++) {
    v += (seeded(i * 13.7 + seedOffset) - 0.48) * vol + drift / days
    const date = new Date()
    date.setDate(date.getDate() - (days - i))
    data.push({
      date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      value: Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals),
    })
  }
  const current = data[data.length - 1].value
  const open = data[0].value
  const pct = Math.round(((current - open) / open) * 10000) / 100
  return { label, ticker, unit, data, current, open, pct, up: current >= open }
}

export const SPARKLINES: Record<string, Sparkline> = {
  sp500:    generate('S&P 500',    'SPX',  '',    5_150,  60,   120,  0, 1),
  msci:     generate('MSCI World', 'MXWO', '',    3_480,  40,    80,  0, 2),
  dxy:      generate('USD Index',  'DXY',  '',    104.2,   0.6,   0.8, 2, 3),
  eurusd:   generate('EUR/USD',    '€/$',  '',    1.085,   0.006, -0.008, 4, 4),
  gbpusd:   generate('GBP/USD',    '£/$',  '',    1.265,   0.007,  0.005, 4, 5),
  usdjpy:   generate('USD/JPY',    '$/¥',  '',    151.5,   1.8,    2.0,  2, 6),
  usdcny:   generate('USD/CNY',    '$/¥',  '',    7.22,    0.04,   0.02, 4, 7),
  usdils:   generate('USD/ILS',    '$/₪',  '',    3.72,    0.05,   0.03, 4, 12),
  gold:     generate('Gold',       'XAU',  '$/oz', 2_050,  30,    45,  0, 8),
  oil:      generate('WTI Oil',    'WTI',  '$/bbl', 78.5,   3,    -4,  1, 9),
  copper:   generate('Copper',     'HG',   '$/t', 8_900,  200,   150,  0, 10),
  natgas:   generate('Nat. Gas',   'NG',   '$/MMBtu', 2.4, 0.15, -0.1, 2, 11),
}

// Return the 4 most relevant macro charts for the masthead
export const MACRO_CHARTS: Sparkline[] = [
  SPARKLINES.sp500,
  SPARKLINES.msci,
  SPARKLINES.dxy,
  SPARKLINES.gold,
]

// Map currency pairs to country names for contextual FX display
const COUNTRY_FX: Record<string, string> = {
  'germany': 'eurusd', 'france': 'eurusd', 'italy': 'eurusd', 'spain': 'eurusd',
  'netherlands': 'eurusd', 'belgium': 'eurusd', 'austria': 'eurusd', 'eurozone': 'eurusd',
  'eu': 'eurusd', 'europe': 'eurusd',
  'united kingdom': 'gbpusd', 'uk': 'gbpusd', 'great britain': 'gbpusd',
  'japan': 'usdjpy',
  'china': 'usdcny',
  'israel': 'usdils',
}

export function getFxForCountry(country: string): Sparkline | null {
  const key = country.toLowerCase()
  for (const [name, ticker] of Object.entries(COUNTRY_FX)) {
    if (key.includes(name)) return SPARKLINES[ticker] ?? null
  }
  return null
}

// Map CFO signal categories to chart keys
export const CFO_CHART_MAP: Record<string, string> = {
  'fx risk': 'eurusd',
  'commodity pricing': 'oil',
  'equity sentiment': 'sp500',
  'interest rates': 'dxy',
  'credit markets': 'sp500',
}
