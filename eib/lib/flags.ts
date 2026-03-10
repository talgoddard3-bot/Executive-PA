const FLAG_MAP: Record<string, string> = {
  'afghanistan': '🇦🇫', 'albania': '🇦🇱', 'algeria': '🇩🇿', 'argentina': '🇦🇷',
  'australia': '🇦🇺', 'austria': '🇦🇹', 'bangladesh': '🇧🇩', 'belgium': '🇧🇪',
  'brazil': '🇧🇷', 'bulgaria': '🇧🇬', 'cambodia': '🇰🇭', 'canada': '🇨🇦',
  'chile': '🇨🇱', 'china': '🇨🇳', 'colombia': '🇨🇴', 'croatia': '🇭🇷',
  'czech republic': '🇨🇿', 'czechia': '🇨🇿', 'denmark': '🇩🇰', 'egypt': '🇪🇬',
  'ethiopia': '🇪🇹', 'finland': '🇫🇮', 'france': '🇫🇷', 'germany': '🇩🇪',
  'ghana': '🇬🇭', 'greece': '🇬🇷', 'hong kong': '🇭🇰', 'hungary': '🇭🇺',
  'india': '🇮🇳', 'indonesia': '🇮🇩', 'iran': '🇮🇷', 'iraq': '🇮🇶',
  'ireland': '🇮🇪', 'israel': '🇮🇱', 'italy': '🇮🇹', 'japan': '🇯🇵',
  'jordan': '🇯🇴', 'kazakhstan': '🇰🇿', 'kenya': '🇰🇪', 'south korea': '🇰🇷',
  'korea': '🇰🇷', 'kuwait': '🇰🇼', 'malaysia': '🇲🇾', 'mexico': '🇲🇽',
  'morocco': '🇲🇦', 'myanmar': '🇲🇲', 'netherlands': '🇳🇱', 'new zealand': '🇳🇿',
  'nigeria': '🇳🇬', 'norway': '🇳🇴', 'pakistan': '🇵🇰', 'peru': '🇵🇪',
  'philippines': '🇵🇭', 'poland': '🇵🇱', 'portugal': '🇵🇹', 'qatar': '🇶🇦',
  'romania': '🇷🇴', 'russia': '🇷🇺', 'saudi arabia': '🇸🇦', 'serbia': '🇷🇸',
  'singapore': '🇸🇬', 'slovakia': '🇸🇰', 'south africa': '🇿🇦', 'spain': '🇪🇸',
  'sri lanka': '🇱🇰', 'sweden': '🇸🇪', 'switzerland': '🇨🇭', 'taiwan': '🇹🇼',
  'tanzania': '🇹🇿', 'thailand': '🇹🇭', 'turkey': '🇹🇷', 'turkiye': '🇹🇷',
  'ukraine': '🇺🇦', 'united arab emirates': '🇦🇪', 'uae': '🇦🇪',
  'united kingdom': '🇬🇧', 'uk': '🇬🇧', 'great britain': '🇬🇧',
  'united states': '🇺🇸', 'usa': '🇺🇸', 'us': '🇺🇸', 'america': '🇺🇸',
  'vietnam': '🇻🇳', 'eu': '🇪🇺', 'europe': '🇪🇺', 'eurozone': '🇪🇺',
  'european union': '🇪🇺',
}

export function getFlag(countryOrRegion: string): string {
  if (!countryOrRegion) return ''
  const key = countryOrRegion.toLowerCase().trim()
  // Direct match
  if (FLAG_MAP[key]) return FLAG_MAP[key]
  // Partial match — find a country name contained in the string
  for (const [name, flag] of Object.entries(FLAG_MAP)) {
    if (key.includes(name)) return flag
  }
  return ''
}
