/**
 * ImmigAI Regulatory Engine
 * ─────────────────────────────────────────────────────────────
 * Fetches USCIS + Federal Register feeds, uses AI to analyse
 * each article, generates plain-language summaries, and
 * determines which visa categories / cases are affected.
 */

// ── Feed sources ─────────────────────────────────────────────
export const FEED_SOURCES = [
  {
    name:     'USCIS News',
    url:      'https://www.uscis.gov/feeds/news.xml',
    type:     'uscis_news',
    priority: 'high',
  },
  {
    name:     'USCIS Alerts',
    url:      'https://www.uscis.gov/feeds/alerts.xml',
    type:     'uscis_news',
    priority: 'high',
  },
  {
    name:     'Federal Register — USCIS',
    url:      'https://www.federalregister.gov/api/v1/articles.json?agencies[]=homeland-security-department&agencies[]=executive-office-for-immigration-review&per_page=20&order=newest',
    type:     'federal_register',
    priority: 'medium',
  },
]

// ── Keyword → visa category mapping ──────────────────────────
const VISA_KEYWORDS: { keywords: string[]; visaTypes: string[] }[] = [
  { keywords: ['h-1b', 'h1b', 'specialty occupation', 'cap-subject', 'cap subject', 'lottery', 'registration'],
    visaTypes: ['H-1B', 'H-1B Extension', 'H-1B Transfer'] },
  { keywords: ['l-1', 'l1', 'intracompany', 'blanket petition'],
    visaTypes: ['L-1A', 'L-1B'] },
  { keywords: ['o-1', 'o1', 'extraordinary ability'],
    visaTypes: ['O-1A', 'O-1B'] },
  { keywords: ['eb-1', 'eb1', 'priority worker', 'extraordinary ability', 'outstanding researcher'],
    visaTypes: ['EB-1A', 'EB-1B', 'EB-1C'] },
  { keywords: ['eb-2', 'eb2', 'national interest waiver', 'niw', 'advanced degree', 'perm'],
    visaTypes: ['EB-2 NIW', 'EB-2 PERM'] },
  { keywords: ['eb-3', 'eb3', 'skilled worker'],
    visaTypes: ['EB-3'] },
  { keywords: ['eb-5', 'eb5', 'investor', 'regional center', 'i-526'],
    visaTypes: ['EB-5 Regional Center', 'EB-5 Direct'] },
  { keywords: ['f-1', 'f1', 'student visa', 'opt', 'cpt', 'stem opt'],
    visaTypes: ['F-1 Student', 'F-1 OPT', 'F-1 STEM OPT'] },
  { keywords: ['j-1', 'j1', 'exchange visitor'],
    visaTypes: ['J-1 Exchange'] },
  { keywords: ['green card', 'adjustment of status', 'i-485', 'lawful permanent'],
    visaTypes: ['Marriage Green Card', 'EB-2 NIW', 'EB-1A', 'EB-3'] },
  { keywords: ['i-130', 'family petition', 'immediate relative', 'spouse', 'fiancé', 'k-1'],
    visaTypes: ['Marriage Green Card', 'K-1 Fiancé Visa', 'IR-2 Child'] },
  { keywords: ['tn visa', 'tn-1', 'nafta', 'usmca', 'canadian', 'mexican professional'],
    visaTypes: ['TN Visa'] },
  { keywords: ['i-129', 'form i-129', 'nonimmigrant worker'],
    visaTypes: ['H-1B', 'L-1A', 'O-1A', 'TN Visa'] },
  { keywords: ['i-140', 'form i-140', 'immigrant petition'],
    visaTypes: ['EB-1A', 'EB-1B', 'EB-2 NIW', 'EB-3'] },
  { keywords: ['premium processing', 'i-907', 'expedite'],
    visaTypes: ['H-1B', 'L-1A', 'O-1A', 'EB-1A', 'EB-2 NIW'] },
  { keywords: ['fee', 'filing fee', 'fee schedule', 'fee increase', 'fee waiver'],
    visaTypes: [] }, // affects all
  { keywords: ['biometrics', 'asc appointment', 'fingerprint'],
    visaTypes: [] }, // affects all
]

// ── Alert type detection ──────────────────────────────────────
export function detectAlertType(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase()
  if (/fee|filing fee|fee schedule|fee increase|fee change/.test(text)) return 'fee_change'
  if (/h-1b|cap season|lottery|registration opens|cap-subject/.test(text)) return 'cap_season'
  if (/form i-|new form|revised form|form update/.test(text)) return 'form_change'
  if (/premium processing|expedite/.test(text)) return 'premium_processing'
  if (/processing time|wait time|backlog/.test(text)) return 'processing_time'
  if (/policy|memo|guidance|regulation|rule/.test(text)) return 'policy_update'
  if (/travel ban|proclamation|executive order|restriction/.test(text)) return 'travel_ban'
  return 'general'
}

// ── Severity detection ────────────────────────────────────────
export function detectSeverity(title: string, content: string, alertType: string): string {
  const text = `${title} ${content}`.toLowerCase()
  if (alertType === 'fee_change' && /increase|higher|raise/.test(text)) return 'critical'
  if (alertType === 'cap_season') return 'critical'
  if (alertType === 'travel_ban') return 'critical'
  if (/immediate|urgent|deadline|suspend|terminat/.test(text)) return 'high'
  if (alertType === 'premium_processing') return 'high'
  if (alertType === 'form_change') return 'medium'
  if (alertType === 'processing_time') return 'medium'
  if (alertType === 'policy_update') return 'medium'
  return 'low'
}

// ── Visa type matching ────────────────────────────────────────
export function matchVisaTypes(title: string, content: string): { visaTypes: string[]; affectsAll: boolean } {
  const text = `${title} ${content}`.toLowerCase()
  const matched = new Set<string>()
  let affectsAll = false

  for (const { keywords, visaTypes } of VISA_KEYWORDS) {
    const hit = keywords.some(kw => text.includes(kw))
    if (hit) {
      if (visaTypes.length === 0) {
        affectsAll = true
      } else {
        visaTypes.forEach(v => matched.add(v))
      }
    }
  }

  // Fee / biometrics / general USCIS changes affect everyone
  if (/all petition|all application|all visa|uscis announce/.test(text)) {
    affectsAll = true
  }

  return { visaTypes: Array.from(matched), affectsAll }
}

// ── XML RSS parser (no external deps) ────────────────────────
export interface FeedItem {
  title:       string
  description: string
  link:        string
  pubDate:     string
  guid:        string
}

export function parseRssFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const block  = match[1]
    const get    = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
      return m ? (m[1] ?? m[2] ?? '').trim() : ''
    }
    items.push({
      title:       get('title')       || 'Untitled',
      description: get('description') || '',
      link:        get('link')        || '',
      pubDate:     get('pubDate')     || '',
      guid:        get('guid')        || get('link') || `${Date.now()}-${Math.random()}`,
    })
  }
  return items
}

// ── Federal Register JSON parser ──────────────────────────────
export function parseFederalRegister(json: any): FeedItem[] {
  if (!json?.results) return []
  return json.results.map((r: any) => ({
    title:       r.title       ?? 'Untitled',
    description: r.abstract    ?? r.type ?? '',
    link:        r.html_url    ?? r.pdf_url ?? '',
    pubDate:     r.publication_date ?? '',
    guid:        r.document_number  ?? r.html_url ?? `${Date.now()}`,
  }))
}

// ── AI summary generation ─────────────────────────────────────
export async function generateAiSummary(
  title: string,
  content: string,
  affectedVisaTypes: string[],
  apiKey: string
): Promise<string> {
  const prompt = `You are an immigration law assistant. Summarize the following regulatory update in plain English for an immigration attorney.

Title: ${title}

Content: ${content.slice(0, 2000)}

Affected visa types: ${affectedVisaTypes.length > 0 ? affectedVisaTypes.join(', ') : 'All visa types'}

Write a 2-3 sentence plain-language summary that:
1. States what changed or is happening
2. Notes the effective date if mentioned
3. States what action (if any) an attorney should take

Keep it under 200 words. Be direct and factual.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.content?.[0]?.text?.trim() ?? fallbackSummary(title, content)
    }
  } catch (e) {
    console.warn('AI summary failed, using fallback:', e)
  }
  return fallbackSummary(title, content)
}

// ── Fallback summary (no AI) ──────────────────────────────────
function fallbackSummary(title: string, content: string): string {
  const clean = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const first = clean.split(/[.!?]/)[0]?.trim() ?? ''
  return first.length > 20 ? `${first}.` : title
}

// ── Dedup check (returns true if item is new) ─────────────────
export function isNewItem(guid: string, existingIds: Set<string>): boolean {
  return !existingIds.has(guid)
}
