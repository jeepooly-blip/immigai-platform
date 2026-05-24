/**
 * Eligibility Engine — combined rules-based pre-filter + Claude AI analysis
 * Adapted from R9 (VisaGuideAiProclaude)
 */
import Anthropic from '@anthropic-ai/sdk'

export interface EligibilityInput {
  nationality: string
  current_visa_status: string           // us_citizen | lpr | h1b | f1 | out_of_status | abroad | other
  immigration_goal: string              // work | study | family | investment | visit | pr
  employment_situation: string          // employer_sponsorship | self_employed | extraordinary_ability | multinational_manager | none
  employer_sponsorship: boolean
  family_relationships: string[]        // us_citizen_spouse | us_citizen_parent | lpr_spouse | us_citizen_child | none
  education_level: string              // high_school | associates | bachelors | masters | phd | professional
  years_in_us?: number
  prior_violations?: string            // none | visa_overstay | removal | criminal | other
  urgent?: boolean
}

export interface VisaPathway {
  visa_type: string
  full_name: string
  likelihood: 'high' | 'medium' | 'low'
  estimated_timeline: string
  key_requirements: string[]
  next_steps: string[]
  notes: string
}

export interface EligibilityResult {
  eligible_pathways: VisaPathway[]
  ineligible_pathways: { visa_type: string; reason: string }[]
  recommended_pathway: string
  plain_language_summary: string
  consult_attorney: boolean
  barriers: string[]
}

// ── Rules-based pre-filter ────────────────────────────────────
function rulesBasedEligibility(input: EligibilityInput) {
  const eligible: string[] = []
  const ineligible: { visa_type: string; reason: string }[] = []
  const barriers: string[] = []

  const deg = input.education_level
  const hasDegree = ['bachelors', 'masters', 'phd', 'professional'].includes(deg)
  const hasAdvancedDeg = ['masters', 'phd', 'professional'].includes(deg)

  // Prior violations
  if (input.prior_violations && input.prior_violations !== 'none') {
    barriers.push(`Prior violation (${input.prior_violations}) may affect eligibility — attorney review required`)
  }

  // Work-based
  if (input.employer_sponsorship && input.employment_situation === 'employer_sponsorship') {
    if (hasDegree) eligible.push('H-1B')
    else ineligible.push({ visa_type: 'H-1B', reason: "Requires bachelor's degree or higher in specialty field" })
    if (hasDegree)        eligible.push('EB-3')
    if (hasAdvancedDeg)   eligible.push('EB-2')
  }
  if (input.employment_situation === 'extraordinary_ability') {
    eligible.push('O-1A', 'EB-1A')
  }
  if (input.employment_situation === 'multinational_manager') {
    eligible.push('L-1A', 'EB-1C')
  }

  // TN for CA/MX nationals
  const nat = input.nationality.toLowerCase()
  if (['canada', 'mexico', 'ca', 'mx'].some(n => nat.includes(n))) {
    if (input.employer_sponsorship) eligible.push('TN')
  }

  // Self-petition research
  if (hasAdvancedDeg && input.immigration_goal === 'work') {
    eligible.push('EB-2 NIW (National Interest Waiver)')
  }

  // Family-based
  if (input.family_relationships.includes('us_citizen_spouse')) {
    eligible.push('IR-1/CR-1 (Immediate Relative Spouse)')
    eligible.push('K-1 (Fiancé Visa)')
  }
  if (input.family_relationships.includes('lpr_spouse')) {
    eligible.push('F-2A (Spouse of LPR)')
  }
  if (input.family_relationships.includes('us_citizen_parent')) {
    eligible.push('IR-2/CR-2 (Child of USC)')
  }

  // Study
  if (input.immigration_goal === 'study') eligible.push('F-1 (Student Visa)')

  // Business / visit
  if (['visit', 'business_visit'].includes(input.immigration_goal)) eligible.push('B-1/B-2')

  return { eligible: [...new Set(eligible)], ineligible, barriers }
}

// ── Claude AI analysis ────────────────────────────────────────
export async function runEligibilityEngine(input: EligibilityInput): Promise<EligibilityResult> {
  const rules = rulesBasedEligibility(input)

  if (!process.env.ANTHROPIC_API_KEY) {
    // Demo mode fallback
    return {
      eligible_pathways: rules.eligible.map(v => ({
        visa_type: v,
        full_name: v,
        likelihood: 'medium' as const,
        estimated_timeline: '6–18 months',
        key_requirements: ['Consult attorney for full requirements'],
        next_steps: ['Schedule consultation with immigration attorney'],
        notes: 'Demo mode — connect Anthropic API for full analysis',
      })),
      ineligible_pathways: rules.ineligible,
      recommended_pathway: rules.eligible[0] ?? 'Consult attorney',
      plain_language_summary: 'Based on your profile, an immigration attorney should review your options.',
      consult_attorney: true,
      barriers: rules.barriers,
    }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    system: `You are a US immigration attorney assistant. Analyze the applicant profile and rules-engine output. 
Respond ONLY with valid JSON matching this TypeScript interface exactly:
{
  "eligible_pathways": [{
    "visa_type": string,
    "full_name": string,
    "likelihood": "high"|"medium"|"low",
    "estimated_timeline": string,
    "key_requirements": string[],
    "next_steps": string[],
    "notes": string
  }],
  "ineligible_pathways": [{"visa_type": string, "reason": string}],
  "recommended_pathway": string,
  "plain_language_summary": string,
  "consult_attorney": true,
  "barriers": string[]
}
Always set consult_attorney to true. Be concise but specific. Timelines should reflect current USCIS processing times.`,
    messages: [{
      role: 'user',
      content: `Profile:
- Nationality: ${input.nationality}
- Current status: ${input.current_visa_status}
- Goal: ${input.immigration_goal}
- Employment: ${input.employment_situation}
- Has employer sponsor: ${input.employer_sponsorship}
- Family: ${input.family_relationships.join(', ') || 'none'}
- Education: ${input.education_level}
- Prior violations: ${input.prior_violations ?? 'none stated'}

Rules engine eligible visas: ${rules.eligible.join(', ') || 'none identified'}
Rules engine barriers: ${rules.barriers.join('; ') || 'none'}

Provide detailed analysis for each eligible pathway and confirm/expand the barriers list.`,
    }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from eligibility engine')

  const cleaned = content.text.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(cleaned) as EligibilityResult
}

// ── Checklist generator ───────────────────────────────────────
export function getChecklistForVisa(visaType: string): Array<{
  item_label: string; required: boolean; sort_order: number; category: string
}> {
  const checklists: Record<string, Array<{ item_label: string; required: boolean; sort_order: number; category: string }>> = {
    'H-1B': [
      { item_label: 'Form I-129 (Petition for Nonimmigrant Worker)', required: true,  sort_order: 1,  category: 'form'     },
      { item_label: 'Labor Condition Application (LCA) from DOL',    required: true,  sort_order: 2,  category: 'form'     },
      { item_label: 'Passport (valid 6+ months beyond stay)',         required: true,  sort_order: 3,  category: 'identity' },
      { item_label: 'Degree certificates and official transcripts',   required: true,  sort_order: 4,  category: 'document' },
      { item_label: 'Job offer letter with salary and duties',        required: true,  sort_order: 5,  category: 'document' },
      { item_label: 'Employer support letter',                        required: true,  sort_order: 6,  category: 'document' },
      { item_label: 'Prevailing wage determination evidence',         required: true,  sort_order: 7,  category: 'document' },
      { item_label: 'Prior H-1B approvals (if extending)',            required: false, sort_order: 8,  category: 'document' },
    ],
    'I-485': [
      { item_label: 'Form I-485 (Application to Adjust Status)',        required: true, sort_order: 1,  category: 'form'     },
      { item_label: 'Passport (valid)',                                  required: true, sort_order: 2,  category: 'identity' },
      { item_label: 'Birth certificate (with certified translation)',    required: true, sort_order: 3,  category: 'identity' },
      { item_label: 'Two passport-size photos (2"x2")',                 required: true, sort_order: 4,  category: 'photo'    },
      { item_label: 'Form I-693 Medical Examination',                   required: true, sort_order: 5,  category: 'medical'  },
      { item_label: 'Form I-864 Affidavit of Support',                  required: true, sort_order: 6,  category: 'form'     },
      { item_label: 'Police clearance certificates (all countries)',     required: true, sort_order: 7,  category: 'document' },
      { item_label: 'Marriage certificate (if applicable)',              required: false, sort_order: 8, category: 'document' },
      { item_label: 'Divorce decrees (if applicable)',                   required: false, sort_order: 9, category: 'document' },
    ],
    'F-1': [
      { item_label: 'Form I-20 (Certificate of Eligibility from school)', required: true, sort_order: 1, category: 'form'     },
      { item_label: 'DS-160 Online Nonimmigrant Visa Application',        required: true, sort_order: 2, category: 'form'     },
      { item_label: 'Passport (valid 6+ months)',                         required: true, sort_order: 3, category: 'identity' },
      { item_label: 'SEVIS I-901 fee receipt',                            required: true, sort_order: 4, category: 'document' },
      { item_label: 'Financial support evidence (bank statements)',        required: true, sort_order: 5, category: 'document' },
      { item_label: 'Acceptance letter from SEVP-certified school',       required: true, sort_order: 6, category: 'document' },
    ],
    'O-1A': [
      { item_label: 'Form I-129 with O classification supplement', required: true, sort_order: 1, category: 'form'     },
      { item_label: 'Advisory opinion letter from peer group',     required: true, sort_order: 2, category: 'document' },
      { item_label: 'Evidence of extraordinary ability (8 criteria)', required: true, sort_order: 3, category: 'document' },
      { item_label: 'Published work / citations',                  required: false, sort_order: 4, category: 'document' },
      { item_label: 'Awards and recognition letters',              required: false, sort_order: 5, category: 'document' },
      { item_label: 'High salary evidence',                        required: false, sort_order: 6, category: 'document' },
    ],
  }

  return checklists[visaType] ?? [
    { item_label: 'Passport (valid 6+ months)',          required: true,  sort_order: 1, category: 'identity' },
    { item_label: 'Completed visa application form',     required: true,  sort_order: 2, category: 'form'     },
    { item_label: 'Two passport-size photos',            required: true,  sort_order: 3, category: 'photo'    },
    { item_label: 'Birth certificate',                   required: true,  sort_order: 4, category: 'identity' },
    { item_label: 'Supporting documents for visa type',  required: true,  sort_order: 5, category: 'document' },
  ]
}
