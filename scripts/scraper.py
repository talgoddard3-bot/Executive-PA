#!/usr/bin/env python3
"""
Executive Intelligence Brief — News Scraper
============================================
Fetches RSS / GDELT signals for a company profile and upserts them
into the Supabase `raw_signals` table.

Required environment variables:
  SUPABASE_URL          — e.g. https://xxxx.supabase.co
  SUPABASE_SERVICE_KEY  — service role key (bypasses RLS)
  COMPANY_ID            — (optional) scrape only this company UUID; omit to scrape ALL companies

Install dependencies:
  pip install requests supabase
"""

import os
import re
import time
import logging
from datetime import datetime, timezone
from urllib.parse import urlencode, quote

import requests
from supabase import create_client

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s %(message)s',
    datefmt='%H:%M:%S',
)
log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
COMPANY_ID   = os.environ.get('COMPANY_ID')  # optional — omit to scrape ALL companies

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set as GitHub Secrets')

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; ExecutiveIntelBot/1.0)'}
TIMEOUT = 12   # seconds per HTTP request
DELAY   = 0.6  # seconds between requests (be polite)

# ── RSS helpers ───────────────────────────────────────────────────────────────

def strip_html(s: str) -> str:
    return re.sub(r'<[^>]+>', ' ', s).replace('  ', ' ').strip()

def extract_cdata(s: str) -> str:
    return re.sub(r'<!\[CDATA\[(.*?)\]\]>', r'\1', s, flags=re.DOTALL).strip()

def clean(s: str) -> str:
    return strip_html(extract_cdata(s))

def parse_google_title(raw: str):
    """Google News appends ' - Source Name' at the end — split it cleanly."""
    text = clean(raw)
    idx = text.rfind(' - ')
    if idx > 20:
        return text[:idx].strip(), text[idx + 3:].strip()
    return text, 'Google News'

def parse_rss(url: str, is_google=False, max_items=8) -> list:
    try:
        r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if not r.ok:
            log.warning(f'  HTTP {r.status_code} — {url[:80]}')
            return []
        xml = r.text
        items = []
        for m in re.finditer(r'<item[^>]*>(.*?)</item>', xml, re.DOTALL):
            if len(items) >= max_items:
                break
            block = m.group(1)

            raw_title = re.search(r'<title[^>]*>(.*?)</title>',           block, re.DOTALL)
            raw_desc  = re.search(r'<description[^>]*>(.*?)</description>', block, re.DOTALL)
            raw_link  = (re.search(r'<link[^>]*>(.*?)</link>',            block, re.DOTALL) or
                         re.search(r'<guid[^>]*>(.*?)</guid>',             block, re.DOTALL))
            raw_date  = re.search(r'<pubDate[^>]*>(.*?)</pubDate>',       block, re.DOTALL)

            if not raw_title:
                continue

            if is_google:
                title, source = parse_google_title(raw_title.group(1))
            else:
                title  = clean(raw_title.group(1))
                source = 'RSS'

            if not title or title == '[Removed]' or len(title) < 10:
                continue

            desc = clean(raw_desc.group(1))[:400] if raw_desc else ''
            link = raw_link.group(1).strip() if raw_link else None
            date = raw_date.group(1).strip() if raw_date else None

            if not link:
                continue  # skip items without a URL (can't deduplicate)

            items.append({
                'title':        title,
                'summary':      desc,
                'url':          link[:1000],
                'source_name':  source[:200],
                'published_at': date,
            })
        log.info(f'  → {len(items)} items from {url[:70]}')
        return items
    except Exception as e:
        log.warning(f'  RSS error ({url[:60]}): {e}')
        return []

def google_news_url(query: str, country_code='US', lang='en') -> str:
    ceid = f'{country_code.upper()}:{lang}'
    params = urlencode({'q': query, 'hl': lang, 'gl': country_code.upper(), 'ceid': ceid})
    return f'https://news.google.com/rss/search?{params}'

def fetch_gdelt(query: str, country_code: str = None, max_items=5) -> list:
    try:
        q = query + ' sourcelang:english'
        if country_code:
            q += f' sourcecountry:{country_code.upper()}'
        url = (f'https://api.gdeltproject.org/api/v2/doc/doc'
               f'?query={quote(q)}&mode=ArtList&maxrecords={max_items}&format=json')
        r = requests.get(url, timeout=TIMEOUT)
        if not r.ok:
            return []
        articles = r.json().get('articles') or []
        items = []
        for a in articles[:max_items]:
            if a.get('title') and a.get('url'):
                items.append({
                    'title':        a['title'][:500],
                    'summary':      '',
                    'url':          a['url'][:1000],
                    'source_name':  a.get('domain', 'GDELT')[:200],
                    'published_at': a.get('seendate'),
                })
        log.info(f'  → {len(items)} items from GDELT ({query[:50]})')
        return items
    except Exception as e:
        log.warning(f'  GDELT error: {e}')
        return []

# ── Supabase writer ───────────────────────────────────────────────────────────

def upsert(supabase, company_id: str, signal_type: str,
           entity_name: str, country: str, items: list) -> int:
    if not items:
        return 0
    now = datetime.now(timezone.utc).isoformat()
    rows = [{
        'company_id':   company_id,
        'signal_type':  signal_type,
        'entity_name':  entity_name[:300],
        'country':      country[:100],
        'title':        it['title'][:500],
        'summary':      (it.get('summary') or '')[:1000],
        'url':          it['url'],
        'source_name':  (it.get('source_name') or '')[:200],
        'published_at': it.get('published_at'),
        'fetched_at':   now,
    } for it in items if it.get('url')]

    if not rows:
        return 0
    try:
        supabase.table('raw_signals').upsert(rows, on_conflict='url').execute()
        log.info(f'  ✓ Upserted {len(rows)} rows [{signal_type}: {entity_name}]')
        return len(rows)
    except Exception as e:
        log.error(f'  ✗ Supabase upsert failed: {e}')
        return 0

# ── Location type → topic keywords ───────────────────────────────────────────

# Countries with active conflicts — augment location signals with war/crisis queries
ACTIVE_CONFLICT_QUERIES = {
    'IL': [
        'Israel war conflict manufacturing economy business impact',
        'Israel conflict industrial supply chain disruption',
        'Israel defense economy technology sector investment',
    ],
    'UA': [
        'Ukraine war manufacturing economy business impact',
        'Ukraine conflict supply chain industrial disruption',
    ],
    'RU': [
        'Russia sanctions economy business manufacturing impact',
    ],
    'SD': [
        'Sudan conflict business economy manufacturing disruption',
    ],
    'MM': [
        'Myanmar conflict economy business manufacturing disruption',
    ],
}

LOCATION_TOPICS = {
    'manufacturing': 'manufacturing workers labor strike energy factory industrial',
    'sales':         'consumer spending economy retail demand trade regulations',
    'hq':            'economy business investment regulation government policy',
    'r&d':           'technology research innovation talent university skills',
    'office':        'economy employment business labour regulations',
}

# ── Authoritative country RSS feeds (bonus coverage) ─────────────────────────

COUNTRY_RSS = {
    'IL': [
        ('https://www.globes.co.il/EN/rss/rss.aspx',                   'Globes Business IL', False),
        ('https://www.jpost.com/rss/rssfeedsfrontpage.aspx',            'Jerusalem Post', False),
        ('https://www.timesofisrael.com/feed/',                          'Times of Israel', False),
        ('https://www.calcalist.co.il/GeneralRSS/0,16318,L-8,00.xml',  'Calcalist', False),
    ],
    'GB': [
        ('https://feeds.bbci.co.uk/news/business/rss.xml',              'BBC Business', False),
        ('https://www.theguardian.com/uk/business/rss',                  'Guardian Business', False),
        ('https://www.thisismoney.co.uk/money/news/feed.rss',            'This is Money', False),
    ],
    'US': [
        ('https://feeds.a.dj.com/rss/RSSMarketsMain.xml',               'WSJ Markets', False),
        ('https://feeds.reuters.com/reuters/businessNews',               'Reuters Business', False),
    ],
    'DE': [
        ('https://www.dw.com/en/rss/rss/business/s-4928.xml',           'Deutsche Welle', False),
        ('https://www.handelsblatt.com/rss/english',                     'Handelsblatt EN', False),
    ],
    'FR': [
        ('https://www.france24.com/en/economy/rss',                      'France 24', False),
        ('https://www.lesechos.fr/rss/rss_une.xml',                      'Les Echos', False),
    ],
    'JP': [
        ('https://asia.nikkei.com/rss/feed/nar',                         'Nikkei Asia', False),
        ('https://www3.nhk.or.jp/nhkworld/en/news/feeds/rss.xml',        'NHK World', False),
    ],
    'KR': [
        ('https://www.koreaherald.com/rss/koreaherald.xml',              'Korea Herald', False),
        ('https://koreajoongangdaily.joins.com/rss/feed',                 'Korea JoongAng Daily', False),
    ],
    'CN': [
        ('https://www.caixinglobal.com/rss/',                             'Caixin Global', False),
        ('https://www.scmp.com/rss/5/feed',                               'South China Morning Post', False),
    ],
    'HK': [
        ('https://www.scmp.com/rss/5/feed',                               'South China Morning Post', False),
    ],
    'SG': [
        ('https://www.businesstimes.com.sg/rss/top-stories',              'Business Times SG', False),
        ('https://www.channelnewsasia.com/rss/8395844',                   'CNA Business', False),
    ],
    'AU': [
        ('https://www.abc.net.au/news/feed/2942460/rss.xml',              'ABC Australia', False),
        ('https://www.afr.com/rss',                                        'AFR', False),
    ],
    'IN': [
        ('https://economictimes.indiatimes.com/rssfeedstopstories.cms',   'Economic Times India', False),
        ('https://www.livemint.com/rss/homepage',                          'Livemint', False),
    ],
    'CA': [
        ('https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/business/', 'Globe and Mail', False),
        ('https://financialpost.com/feed',                                 'Financial Post CA', False),
    ],
    'AE': [
        ('https://www.thenationalnews.com/arc/outboundfeeds/rss/category/business/', 'The National UAE', False),
        ('https://gulfnews.com/rss/business',                              'Gulf News', False),
    ],
    'SA': [
        ('https://arab.news/feed',                                         'Arab News', False),
    ],
    'ZA': [
        ('https://www.businesslive.co.za/rss/',                            'Business Live SA', False),
    ],
    'NL': [
        ('https://feeds.nos.nl/nosjournaal',                               'NOS News NL', False),
    ],
    'SE': [
        ('https://www.di.se/rss',                                          'Dagens Industri SE', False),
    ],
    'CH': [
        ('https://www.swissinfo.ch/eng/rss/news',                          'SwissInfo', False),
    ],
    'BR': [
        ('https://www.valor.com.br/rss',                                   'Valor Economico BR', False),
    ],
    'MX': [
        ('https://www.elfinanciero.com.mx/rss',                            'El Financiero MX', False),
    ],
}

# ── Industry-specific trade publication RSS feeds ─────────────────────────────
# Matched by substring against company.industry (lowercase)

INDUSTRY_RSS: list[tuple[list[str], list[tuple[str, str, bool]]]] = [
    (
        ['manufactur', 'factory', 'industrial', 'precision', 'production', 'machining'],
        [
            ('https://www.industryweek.com/rss.xml',              'IndustryWeek', False),
            ('https://www.assemblymag.com/rss/topic/all',          'Assembly Magazine', False),
            ('https://www.manufacturingglobal.com/rss.xml',        'Manufacturing Global', False),
        ]
    ),
    (
        ['semiconductor', 'chip', 'wafer', 'pcb', 'sensor', 'optical', 'photonic', 'electronic component'],
        [
            ('https://www.eetimes.com/feed/',                       'EE Times', False),
            ('https://semiwiki.com/feed/',                           'SemiWiki', False),
            ('https://www.electronicdesign.com/rss.xml',            'Electronic Design', False),
        ]
    ),
    (
        ['pharma', 'biotech', 'life science', 'medical device', 'diagnostic', 'clinical'],
        [
            ('https://www.fiercepharma.com/rss/xml',               'FiercePharma', False),
            ('https://www.statnews.com/feed/',                       'STAT News', False),
            ('https://www.biopharmadive.com/feeds/news/',           'BioPharma Dive', False),
        ]
    ),
    (
        ['healthcare', 'hospital', 'health system'],
        [
            ('https://www.fiercehealthcare.com/rss/xml',            'FierceHealthcare', False),
            ('https://www.healthcaredive.com/feeds/news/',          'Healthcare Dive', False),
        ]
    ),
    (
        ['software', 'saas', 'cloud', 'platform', 'enterprise tech', 'data', 'cybersecurity'],
        [
            ('https://techcrunch.com/feed/',                         'TechCrunch', False),
            ('https://feeds.arstechnica.com/arstechnica/index',     'Ars Technica', False),
            ('https://www.darkreading.com/rss.xml',                  'Dark Reading', False),
        ]
    ),
    (
        ['artificial intelligence', 'machine learning', 'llm', 'deep learning'],
        [
            ('https://techcrunch.com/category/artificial-intelligence/feed/', 'TechCrunch AI', False),
            ('https://venturebeat.com/category/ai/feed/',           'VentureBeat AI', False),
        ]
    ),
    (
        ['energy', 'oil', 'gas', 'petroleum', 'refin', 'lng'],
        [
            ('https://oilprice.com/rss/main',                        'OilPrice', False),
            ('https://www.energymonitor.ai/feed/',                   'Energy Monitor', False),
            ('https://www.ogj.com/rss',                              'Oil & Gas Journal', False),
        ]
    ),
    (
        ['renewable', 'solar', 'wind', 'clean energy', 'battery', 'ev', 'electric vehicle'],
        [
            ('https://www.pv-magazine.com/feed/',                    'PV Magazine', False),
            ('https://electrek.co/feed/',                            'Electrek', False),
        ]
    ),
    (
        ['retail', 'ecommerce', 'consumer goods', 'fmcg', 'brand'],
        [
            ('https://www.retaildive.com/feeds/news/',               'Retail Dive', False),
            ('https://www.grocerydive.com/feeds/news/',              'Grocery Dive', False),
        ]
    ),
    (
        ['food', 'beverage', 'agriculture', 'agri', 'farming', 'crop'],
        [
            ('https://www.fooddive.com/feeds/news/',                 'Food Dive', False),
            ('https://www.agweb.com/rss.xml',                        'AgWeb', False),
        ]
    ),
    (
        ['logistics', 'freight', 'shipping', 'supply chain', 'transport', 'warehouse'],
        [
            ('https://www.supplychaindive.com/feeds/news/',          'Supply Chain Dive', False),
            ('https://www.freightwaves.com/news/feed',               'FreightWaves', False),
        ]
    ),
    (
        ['defense', 'defence', 'aerospace', 'aviation', 'military'],
        [
            ('https://www.defensenews.com/arc/outboundfeeds/rss/',   'Defense News', False),
            ('https://breakingdefense.com/feed/',                     'Breaking Defense', False),
        ]
    ),
    (
        ['automotive', 'vehicle', 'car ', 'truck', 'mobility'],
        [
            ('https://www.autonews.com/rss.xml',                     'Automotive News', False),
            ('https://www.greencarcongress.com/atom.xml',            'Green Car Congress', False),
        ]
    ),
    (
        ['finance', 'banking', 'insurance', 'fintech', 'investment', 'asset management', 'capital markets'],
        [
            ('https://www.bankingdive.com/feeds/news/',              'Banking Dive', False),
            ('https://www.risk.net/rss',                             'Risk.net', False),
        ]
    ),
    (
        ['construction', 'real estate', 'property', 'infrastructure', 'civil engineering'],
        [
            ('https://www.constructiondive.com/feeds/news/',         'Construction Dive', False),
            ('https://therealdeal.com/feed/',                         'The Real Deal', False),
        ]
    ),
    (
        ['mining', 'metals', 'steel', 'alumin', 'copper', 'iron ore'],
        [
            ('https://www.mining.com/feed/',                          'Mining.com', False),
            ('https://www.metalbulletin.com/rss',                    'Metal Bulletin', False),
        ]
    ),
]

# ── Revenue countries with EU/US/UK regulatory exposure ──────────────────────
EU_MEMBER_STATES = {
    'germany', 'france', 'italy', 'spain', 'netherlands', 'belgium', 'poland',
    'sweden', 'denmark', 'finland', 'austria', 'czech republic', 'hungary',
    'romania', 'portugal', 'greece', 'ireland', 'slovakia', 'bulgaria',
    'croatia', 'slovenia', 'lithuania', 'latvia', 'estonia', 'luxembourg',
    'malta', 'cyprus',
}

# ── Per-company scraper ────────────────────────────────────────────────────────

def scrape_company(supabase, company_id: str) -> int:
    # ── Load company profile ──────────────────────────────────────────────────
    company = supabase.table('companies').select('*').eq('id', company_id).single().execute().data
    if not company:
        log.warning(f'Company {company_id} not found — skipping')
        return 0

    profile_rows = (supabase.table('company_profiles')
                    .select('*').eq('company_id', company_id)
                    .order('updated_at', desc=True).limit(1).execute().data)
    profile = profile_rows[0] if profile_rows else {}

    locations = (supabase.table('company_locations')
                 .select('*').eq('company_id', company_id).execute().data or [])

    company_name  = company['name']
    industry      = company.get('industry', '')
    competitors   = profile.get('competitors', [])
    rev_countries = profile.get('revenue_countries', [])
    keywords      = profile.get('keywords', [])

    log.info(f'{company_name} | industry={industry} | '
             f'{len(competitors)} competitors | {len(rev_countries)} revenue countries | '
             f'{len(locations)} locations')

    total = 0

    # ── 1. Company news ───────────────────────────────────────────────────────
    log.info('\n── Company news ──────────────────────────────────')
    items = parse_rss(google_news_url(f'"{company_name}"'), is_google=True, max_items=10)
    total += upsert(supabase, company_id, 'company', company_name, '', items)
    time.sleep(DELAY)

    # ── 2. Competitor news ────────────────────────────────────────────────────
    log.info('\n── Competitor news ───────────────────────────────')
    for comp in competitors[:6]:
        name = comp.get('name') if isinstance(comp, dict) else str(comp)
        if not name:
            continue
        log.info(f'  Competitor: {name}')
        items = parse_rss(google_news_url(f'"{name}"'), is_google=True, max_items=6)
        total += upsert(supabase, company_id, 'competitor', name, '', items)
        time.sleep(DELAY)

    # ── 3. Revenue country signals ────────────────────────────────────────────
    log.info('\n── Revenue country signals ───────────────────────')
    for rc in rev_countries[:6]:
        country = rc.get('country') if isinstance(rc, dict) else str(rc)
        sector  = rc.get('sector', '') if isinstance(rc, dict) else ''
        if not country:
            continue
        log.info(f'  Country: {country} / {sector}')
        q = f'{country} {sector or industry} economy trade'
        items  = parse_rss(google_news_url(q, lang='en'), is_google=True, max_items=6)
        items += fetch_gdelt(q, max_items=3)
        total += upsert(supabase, company_id, 'country', country, country, items)
        time.sleep(DELAY)

    # ── 4. Operational location signals ──────────────────────────────────────
    log.info('\n── Operational location signals ──────────────────')
    seen_countries = set()
    for loc in locations:
        cname = loc.get('country_name', '')
        ccode = loc.get('country_code', 'US')
        ltype = loc.get('location_type', 'office')
        if not cname or cname in seen_countries:
            continue
        seen_countries.add(cname)
        topic = LOCATION_TOPICS.get(ltype, 'economy business')
        log.info(f'  Location: {cname} ({ltype})')

        q = f'{cname} {topic}'
        items = parse_rss(google_news_url(q, country_code=ccode, lang='en'), is_google=True, max_items=6)

        for feed_url, feed_name, is_g in COUNTRY_RSS.get(ccode.upper(), []):
            log.info(f'    Feed: {feed_name}')
            items += parse_rss(feed_url, is_google=is_g, max_items=4)
            time.sleep(DELAY)

        items += fetch_gdelt(q, country_code=ccode, max_items=3)

        # Extra conflict/crisis queries for at-risk locations
        for conflict_q in ACTIVE_CONFLICT_QUERIES.get(ccode.upper(), []):
            log.info(f'    Conflict signal: {conflict_q[:60]}')
            items += parse_rss(google_news_url(conflict_q, country_code='US', lang='en'), is_google=True, max_items=4)
            items += fetch_gdelt(conflict_q, max_items=3)
            time.sleep(DELAY)

        total += upsert(supabase, company_id, 'location', cname, cname, items)
        time.sleep(DELAY)

    # ── 5. Industry / keyword signals ─────────────────────────────────────────
    log.info('\n── Industry signals ──────────────────────────────')
    kw_query = f'{industry} ' + ' '.join(keywords[:4])
    log.info(f'  Query: {kw_query[:80]}')
    items  = parse_rss(google_news_url(kw_query), is_google=True, max_items=10)
    items += fetch_gdelt(kw_query, max_items=5)
    total += upsert(supabase, company_id, 'industry', industry, '', items)

    # ── 5b. Industry trade publications ───────────────────────────────────────
    log.info('\n── Industry trade publications ───────────────────')
    industry_lower = industry.lower()
    matched_feeds: list[tuple[str, str, bool]] = []
    for keywords_match, feeds in INDUSTRY_RSS:
        if any(kw in industry_lower for kw in keywords_match):
            matched_feeds.extend(feeds)
            log.info(f'  Matched: {[f[1] for f in feeds]}')
            break  # one matched group is enough to avoid too many feeds
    for feed_url, feed_name, is_g in matched_feeds:
        log.info(f'  Trade feed: {feed_name}')
        items = parse_rss(feed_url, is_google=is_g, max_items=6)
        total += upsert(supabase, company_id, 'industry', feed_name, '', items)
        time.sleep(DELAY)

    # ── 6. Regulatory signals ─────────────────────────────────────────────────
    log.info('\n── Regulatory signals ────────────────────────────')
    rev_country_names_lower = {
        (rc.get('country', '') if isinstance(rc, dict) else str(rc)).lower()
        for rc in rev_countries
    }
    has_eu = any(c in EU_MEMBER_STATES for c in rev_country_names_lower)
    has_us = any('united states' in c or c == 'usa' or c == 'us' for c in rev_country_names_lower)
    has_uk = any('united kingdom' in c or c == 'uk' or c == 'britain' for c in rev_country_names_lower)

    if has_eu:
        log.info('  EU regulatory signals')
        q = f'European Commission regulation {industry} business directive 2025 2026'
        items  = parse_rss(google_news_url(q, lang='en'), is_google=True, max_items=5)
        items += fetch_gdelt(f'European Union regulation {industry}', max_items=3)
        total += upsert(supabase, company_id, 'industry', 'EU Regulation', '', items)
        time.sleep(DELAY)

    if has_us:
        log.info('  US regulatory signals')
        q = f'FTC SEC FDA OSHA regulation {industry} business rule 2025 2026'
        items  = parse_rss(google_news_url(q, lang='en'), is_google=True, max_items=5)
        items += fetch_gdelt(f'United States regulation {industry} government', max_items=3)
        total += upsert(supabase, company_id, 'industry', 'US Regulation', '', items)
        time.sleep(DELAY)

    if has_uk:
        log.info('  UK regulatory signals')
        q = f'UK government FCA CMA regulation {industry} business 2025 2026'
        items  = parse_rss(google_news_url(q, lang='en'), is_google=True, max_items=4)
        total += upsert(supabase, company_id, 'industry', 'UK Regulation', '', items)
        time.sleep(DELAY)

    return total


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    if COMPANY_ID:
        # Single-company mode (env var set or manual workflow_dispatch input)
        company_ids = [COMPANY_ID]
        log.info(f'Single-company mode: {COMPANY_ID}')
    else:
        # Multi-company mode — scrape ALL companies in the database
        rows = supabase.table('companies').select('id, name').execute().data or []
        company_ids = [r['id'] for r in rows]
        log.info(f'Multi-company mode: found {len(company_ids)} companies')

    grand_total = 0
    for idx, cid in enumerate(company_ids, 1):
        log.info(f'\n{"="*60}')
        log.info(f'Company {idx}/{len(company_ids)}: {cid}')
        log.info(f'{"="*60}')
        try:
            grand_total += scrape_company(supabase, cid)
        except Exception as e:
            log.error(f'Error scraping company {cid}: {e}')

    log.info(f'\n✅  Done. Grand total signals upserted: {grand_total}')

    # Clean up signals older than 14 days
    try:
        from datetime import timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
        supabase.table('raw_signals').delete().lt('fetched_at', cutoff).execute()
        log.info('   Old signals pruned (>14 days)')
    except Exception as e:
        log.warning(f'   Signal pruning failed (non-critical): {e}')


if __name__ == '__main__':
    main()
