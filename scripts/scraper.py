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
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_KEY']
COMPANY_ID   = os.environ.get('COMPANY_ID')  # optional — omit to scrape ALL companies

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
        ('https://www.jpost.com/rss/rssfeedsfrontpage.aspx',         'Jerusalem Post', False),
        ('https://www.timesofisrael.com/feed/',                       'Times of Israel', False),
        ('https://www.ynet.co.il/Integration/StoryRss1854.xml',       'Ynet', False),
        ('https://www.calcalist.co.il/GeneralRSS/0,16318,L-8,00.xml','Calcalist', False),
    ],
    'GB': [
        ('https://feeds.bbci.co.uk/news/business/rss.xml',           'BBC Business', False),
        ('https://www.theguardian.com/uk/business/rss',               'Guardian Business', False),
    ],
    'US': [
        ('https://feeds.a.dj.com/rss/RSSMarketsMain.xml',            'WSJ Markets', False),
    ],
    'DE': [
        ('https://www.dw.com/en/rss/rss/business/s-4928.xml',        'Deutsche Welle', False),
    ],
    'FR': [
        ('https://www.france24.com/en/economy/rss',                   'France 24', False),
    ],
    'SG': [
        ('https://www.businesstimes.com.sg/rss/top-stories',          'Business Times SG', False),
    ],
    'AU': [
        ('https://www.abc.net.au/news/feed/2942460/rss.xml',          'ABC Australia', False),
    ],
    'IN': [
        ('https://economictimes.indiatimes.com/rssfeedstopstories.cms','Economic Times India', False),
    ],
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
        total += upsert(supabase, company_id, 'location', cname, cname, items)
        time.sleep(DELAY)

    # ── 5. Industry / keyword signals ─────────────────────────────────────────
    log.info('\n── Industry signals ──────────────────────────────')
    kw_query = f'{industry} ' + ' '.join(keywords[:4])
    log.info(f'  Query: {kw_query[:80]}')
    items  = parse_rss(google_news_url(kw_query), is_google=True, max_items=10)
    items += fetch_gdelt(kw_query, max_items=5)
    total += upsert(supabase, company_id, 'industry', industry, '', items)

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
        supabase.rpc('exec_sql', {
            'sql': "DELETE FROM raw_signals WHERE fetched_at < now() - interval '14 days'"
        }).execute()
        log.info('   Old signals pruned (>14 days)')
    except Exception:
        pass  # RPC may not be enabled — not critical


if __name__ == '__main__':
    main()
