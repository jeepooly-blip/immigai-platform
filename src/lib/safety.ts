/**
 * Safety & Geo Module — adapted from R1 (immigration-platform-main)
 * Provides:
 *  - AI output validation (hallucination / legal overreach detection)
 *  - Geo-based content gating (embargoed countries)
 *  - PII scrubbing from logs
 */
import Anthropic from '@anthropic-ai/sdk'

// Countries that require special handling per OFAC/export controls
const RESTRICTED_COUNTRIES = new Set(['CU', 'IR', 'KP', 'SY', 'RU'])
const HIGH_RISK_COUNTRIES   = new Set(['AF', 'BY', 'MM', 'SD', 'VE', 'ZW'])

export type GeoContext = {
  countryCode: string
  countryName: string
  isRestricted: boolean
  isHighRisk: boolean
  requiresDisclosure: boolean
}

export function getGeoContext(countryCode: string, countryName: string): GeoContext {
  const code = countryCode.toUpperCase()
  return {
    countryCode: code,
    countryName,
    isRestricted:       RESTRICTED_COUNTRIES.has(code),
    isHighRisk:         HIGH_RISK_COUNTRIES.has(code),
    requiresDisclosure: RESTRICTED_COUNTRIES.has(code) || HIGH_RISK_COUNTRIES.has(code),
  }
}

export type SafetyCheckResult = {
  safe: boolean
  flags: string[]
  severity: 'none' | 'low' | 'medium' | 'high'
  sanitizedContent?: string
}

// Quick heuristic checks (no API call needed)
export function quickSafetyCheck(content: string): SafetyCheckResult {
  const flags: string[] = []
  const lower = content.toLowerCase()

  // Legal overreach patterns
  const legalOverreach = [
    'you will be approved', 'guaranteed approval', 'your case will succeed',
    'you are definitely eligible', 'you will win', 'i guarantee',
  ]
  if (legalOverreach.some(p => lower.includes(p))) {
    flags.push('legal_overreach')
  }

  // Specific inadmissibility advice
  if (lower.includes('lie') || lower.includes('falsify') || lower.includes('misrepresent')) {
    if (lower.includes('form') || lower.includes('application') || lower.includes('interview')) {
      flags.push('harmful_advice')
    }
  }

  // PII detection
  const ssnPattern = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/
  const aNumberPattern = /\b[aA]-?\d{8,9}\b/
  if (ssnPattern.test(content) || aNumberPattern.test(content)) {
    flags.push('pii_detected')
  }

  const severity: SafetyCheckResult['severity'] =
    flags.includes('harmful_advice') ? 'high' :
    flags.includes('legal_overreach') ? 'medium' :
    flags.length > 0 ? 'low' : 'none'

  return { safe: flags.length === 0, flags, severity }
}

// Deep AI safety check (used for high-stakes outputs like RFE drafts)
export async function deepSafetyCheck(content: string): Promise<SafetyCheckResult> {
  const quick = quickSafetyCheck(content)
  if (!process.env.ANTHROPIC_API_KEY) return quick

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: `You are a legal compliance reviewer for an immigration AI platform.
Check the following AI-generated content for: (1) specific legal advice or outcome guarantees, (2) advice to misrepresent on forms, (3) PII, (4) factually incorrect immigration law claims.
Return ONLY JSON: {"safe":boolean,"flags":["flag1"],"severity":"none|low|medium|high","notes":"brief explanation"}`,
      messages: [{ role: 'user', content: `Review this AI output:\n\n${content.slice(0, 2000)}` }],
    })
    const text = (response.content[0] as any).text.replace(/```json\n?|\n?```/g, '').trim()
    const aiResult = JSON.parse(text)
    return {
      safe:     aiResult.safe && quick.safe,
      flags:    [...new Set([...quick.flags, ...(aiResult.flags ?? [])])],
      severity: aiResult.severity ?? quick.severity,
    }
  } catch {
    return quick
  }
}

// Scrub PII from text before logging
export function scrubPII(text: string): string {
  return text
    .replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[SSN]')
    .replace(/\b[aA]-?\d{8,9}\b/g, '[A-NUMBER]')
    .replace(/\b[A-Z0-9]{10,}\b/g, m => m.length > 12 ? '[ID]' : m)  // Passport-like numbers
}
