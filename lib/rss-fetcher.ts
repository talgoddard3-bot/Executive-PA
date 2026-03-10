/**
 * Free RSS/GDELT fetcher — no API keys required.
 *
 * Sources:
 *  - Google News RSS  (any country, any query, no key needed)
 *  - GDELT Project    (geopolitical/operational depth, no key needed)
 *  - Country-specific authoritative RSS feeds (hardcoded per country)
 */

export interface RSSItem {
  title: string
  description?: string
  source: string
  url?: string
  pubDate?: string
}

// ── RSS XML parser (no dependencies) ─────────────────────────────────────────
function extractCDATA(raw: string): string {
  return raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function stripHTML(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// Google News appends " - Source" to title — extract cleanly
function parseGoogleTitle(raw: string): { title: string; source: string } {
  const cleaned = stripHTML(extractCDATA(raw))
  const lastDash = cleaned.lastIndexOf(' - ')
  if (lastDash > 20) {
    return { title: cleaned.slice(0, lastDash).trim(), source: cleaned.slice(lastDash + 3).trim() }
  }
  return { title: cleaned, source: 'Google News' }
}

export async function parseRSSFeed(url: string, isGoogleNews = false, maxItems = 5): Promise<RSSItem[]> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ExecutiveIntelBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()

    const items: RSSItem[] = []
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
    let match

    while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
      const block = match[1]

      const rawTitle = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
      const rawDesc  = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ?? ''
      const rawLink  = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]
                    ?? block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1]
      const rawDate  = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]
      const rawSrc   = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1]

      if (!rawTitle.trim()) continue

      if (isGoogleNews) {
        const { title, source } = parseGoogleTitle(rawTitle)
        if (!title || title === '[Removed]') continue
        const desc = stripHTML(extractCDATA(rawDesc)).slice(0, 200)
        items.push({ title, description: desc || undefined, source, url: rawLink?.trim(), pubDate: rawDate?.trim() })
      } else {
        const title = stripHTML(extractCDATA(rawTitle))
        if (!title || title === '[Removed]') continue
        const desc   = stripHTML(extractCDATA(rawDesc)).slice(0, 200)
        const source = rawSrc ? stripHTML(extractCDATA(rawSrc)) : new URL(url).hostname.replace(/^www\./, '')
        items.push({ title, description: desc || undefined, source, url: rawLink?.trim(), pubDate: rawDate?.trim() })
      }
    }

    return items
  } catch {
    return []
  }
}

// ── Google News RSS — universal, free, no key ────────────────────────────────
export function googleNewsURL(query: string, countryCode: string, lang = 'en'): string {
  const ceid = `${countryCode.toUpperCase()}:${lang}`
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${lang}&gl=${countryCode.toUpperCase()}&ceid=${encodeURIComponent(ceid)}`
}

export async function fetchGoogleNews(query: string, countryCode: string, lang = 'en', max = 5): Promise<RSSItem[]> {
  return parseRSSFeed(googleNewsURL(query, countryCode, lang), true, max)
}

// ── GDELT Project — geopolitical/operational depth, free, no key ─────────────
interface GDELTArticle { title?: string; domain?: string; url?: string; seendate?: string }

export async function fetchGDELT(query: string, countryCode?: string, max = 5): Promise<RSSItem[]> {
  try {
    let q = query + ' sourcelang:english'
    if (countryCode) q += ` sourcecountry:${countryCode.toUpperCase()}`

    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=ArtList&maxrecords=${max}&format=json`
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()

    return (data.articles ?? []).slice(0, max).map((a: GDELTArticle) => ({
      title: a.title ?? '',
      source: a.domain ?? 'GDELT',
      url: a.url,
      pubDate: a.seendate,
    })).filter((a: RSSItem) => a.title)
  } catch {
    return []
  }
}

// ── Authoritative country RSS feeds ──────────────────────────────────────────
// Curated per-country authoritative sources (English where possible)
export const COUNTRY_RSS: Record<string, { url: string; name: string; isGoogle?: boolean }[]> = {
  IL: [
    { url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',                    name: 'Jerusalem Post' },
    { url: 'https://www.timesofisrael.com/feed/',                                 name: 'Times of Israel' },
    { url: 'https://www.calcalist.co.il/GeneralRSS/0,16318,L-8,00.xml',          name: 'Calcalist' },
    { url: 'https://www.ynet.co.il/Integration/StoryRss1854.xml',                 name: 'Ynet' },
    { url: 'https://news.google.com/rss/search?q=Israel+economy&hl=en&gl=IL&ceid=IL:en', name: 'Google News Israel', isGoogle: true },
  ],
  GB: [
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml',                     name: 'BBC Business' },
    { url: 'https://www.theguardian.com/uk/business/rss',                         name: 'Guardian Business' },
    { url: 'https://news.google.com/rss/search?q=UK+economy&hl=en&gl=GB&ceid=GB:en', name: 'Google News UK', isGoogle: true },
  ],
  FR: [
    { url: 'https://www.france24.com/en/economy/rss',                             name: 'France 24' },
    { url: 'https://news.google.com/rss/search?q=France+economy&hl=en&gl=FR&ceid=FR:en', name: 'Google News France', isGoogle: true },
  ],
  DE: [
    { url: 'https://www.dw.com/en/rss/rss/business/s-4928.xml',                  name: 'Deutsche Welle' },
    { url: 'https://news.google.com/rss/search?q=Germany+economy&hl=en&gl=DE&ceid=DE:en', name: 'Google News Germany', isGoogle: true },
  ],
  US: [
    { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',                      name: 'WSJ Markets' },
    { url: 'https://news.google.com/rss/search?q=US+economy&hl=en&gl=US&ceid=US:en', name: 'Google News US', isGoogle: true },
  ],
  IN: [
    { url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms',         name: 'Economic Times India' },
    { url: 'https://news.google.com/rss/search?q=India+economy&hl=en&gl=IN&ceid=IN:en', name: 'Google News India', isGoogle: true },
  ],
  CN: [
    { url: 'https://news.google.com/rss/search?q=China+economy+manufacturing&hl=en&gl=CN&ceid=CN:en', name: 'Google News China', isGoogle: true },
  ],
  JP: [
    { url: 'https://news.google.com/rss/search?q=Japan+economy&hl=en&gl=JP&ceid=JP:en', name: 'Google News Japan', isGoogle: true },
  ],
  AU: [
    { url: 'https://www.abc.net.au/news/feed/2942460/rss.xml',                    name: 'ABC Australia Business' },
    { url: 'https://news.google.com/rss/search?q=Australia+economy&hl=en&gl=AU&ceid=AU:en', name: 'Google News Australia', isGoogle: true },
  ],
  CA: [
    { url: 'https://news.google.com/rss/search?q=Canada+economy&hl=en&gl=CA&ceid=CA:en', name: 'Google News Canada', isGoogle: true },
  ],
  NL: [
    { url: 'https://news.google.com/rss/search?q=Netherlands+economy&hl=en&gl=NL&ceid=NL:en', name: 'Google News Netherlands', isGoogle: true },
  ],
  SE: [
    { url: 'https://news.google.com/rss/search?q=Sweden+economy&hl=en&gl=SE&ceid=SE:en', name: 'Google News Sweden', isGoogle: true },
  ],
  SG: [
    { url: 'https://www.businesstimes.com.sg/rss/top-stories',                   name: 'Business Times Singapore' },
    { url: 'https://news.google.com/rss/search?q=Singapore+economy&hl=en&gl=SG&ceid=SG:en', name: 'Google News Singapore', isGoogle: true },
  ],
  AE: [
    { url: 'https://news.google.com/rss/search?q=UAE+economy&hl=en&gl=AE&ceid=AE:en', name: 'Google News UAE', isGoogle: true },
  ],
  ZA: [
    { url: 'https://news.google.com/rss/search?q=South+Africa+economy&hl=en&gl=ZA&ceid=ZA:en', name: 'Google News South Africa', isGoogle: true },
  ],
  BR: [
    { url: 'https://news.google.com/rss/search?q=Brazil+economy&hl=en&gl=BR&ceid=BR:en', name: 'Google News Brazil', isGoogle: true },
  ],
  MX: [
    { url: 'https://news.google.com/rss/search?q=Mexico+economy&hl=en&gl=MX&ceid=MX:en', name: 'Google News Mexico', isGoogle: true },
  ],
  TR: [
    { url: 'https://news.google.com/rss/search?q=Turkey+economy&hl=en&gl=TR&ceid=TR:en', name: 'Google News Turkey', isGoogle: true },
  ],
  PL: [
    { url: 'https://news.google.com/rss/search?q=Poland+economy&hl=en&gl=PL&ceid=PL:en', name: 'Google News Poland', isGoogle: true },
  ],
  KR: [
    { url: 'https://news.google.com/rss/search?q=South+Korea+economy&hl=en&gl=KR&ceid=KR:en', name: 'Google News South Korea', isGoogle: true },
  ],
}

/**
 * Fetch all RSS sources for a country, merging results and deduplicating.
 * Falls back to Google News query if no country-specific feeds are available.
 */
export async function fetchCountryRSS(
  countryCode: string,
  countryName: string,
  topicKeywords: string,
  max = 6
): Promise<RSSItem[]> {
  const sources = COUNTRY_RSS[countryCode.toUpperCase()] ?? []

  // Always include a topic-specific Google News query
  const topicGoogleURL = googleNewsURL(`${countryName} ${topicKeywords}`, countryCode)

  const allFetches: Promise<RSSItem[]>[] = [
    parseRSSFeed(topicGoogleURL, true, 4),
    ...sources.slice(0, 3).map(s => parseRSSFeed(s.url, s.isGoogle, 3)),
    // GDELT for geopolitical depth
    fetchGDELT(`${countryName} ${topicKeywords}`, countryCode, 3),
  ]

  const results = await Promise.allSettled(allFetches)
  const seen = new Set<string>()
  const items: RSSItem[] = []

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const item of r.value) {
      if (!seen.has(item.title) && item.title.length > 10) {
        seen.add(item.title)
        items.push(item)
        if (items.length >= max) return items
      }
    }
  }

  return items
}
