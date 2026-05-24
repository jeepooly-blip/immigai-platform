/**
 * ImmigAI RFE Engine
 * ─────────────────────────────────────────────────────────────
 * Analyses RFE notices and generates structured legal response drafts
 * for: cover letters, personal statements, support letters, and full RFE responses.
 */

// ── RFE Ground types ──────────────────────────────────────────
export type RfeGroundType =
  | 'specialty_occupation'
  | 'employer_employee_relationship'
  | 'maintenance_of_status'
  | 'beneficiary_qualifications'
  | 'wage_level'
  | 'itinerary_worksite'
  | 'specialty_occupation_degree'
  | 'extraordinary_ability_criteria'
  | 'national_interest'
  | 'petitioner_ability_to_pay'
  | 'job_offer_validity'
  | 'derivative_beneficiary'
  | 'priority_date'
  | 'inadmissibility'
  | 'missing_documents'
  | 'signature_missing'
  | 'fee_error'
  | 'other'

export interface RfeGround {
  type:        RfeGroundType
  title:       string
  description: string
  evidenceNeeded: string[]
  legalBasis:  string
}

export interface ParsedRfe {
  caseType:     string
  visaCategory: string
  grounds:      RfeGround[]
  deadlineText: string
  serviceCenter:string
  receiptNumber:string
  issuedDate:   string
  summary:      string
}

export interface DraftSection {
  id:      string
  title:   string
  content: string
  type:    'intro' | 'legal_standard' | 'ground_response' | 'evidence_list' | 'conclusion' | 'certification'
  groundRef?: string
}

// ── Known RFE patterns → grounds mapping ─────────────────────
const RFE_PATTERNS: { pattern: RegExp; ground: RfeGroundType }[] = [
  { pattern: /specialty occupation|theoretical and practical application|degree requirement|bachelor.{0,20}degree/i, ground: 'specialty_occupation' },
  { pattern: /employer.employee relationship|right to control|supervision|staffing|third.party/i, ground: 'employer_employee_relationship' },
  { pattern: /maintenance of status|fell out of status|unlawful presence|accrued/i, ground: 'maintenance_of_status' },
  { pattern: /beneficiary.{0,30}qualif|degree.{0,30}equivalent|foreign education|credential evaluation/i, ground: 'beneficiary_qualifications' },
  { pattern: /wage level|prevailing wage|actual wage|LCA|labor condition/i, ground: 'wage_level' },
  { pattern: /itinerary|specific worksite|end.client|third.party placement|off.site/i, ground: 'itinerary_worksite' },
  { pattern: /extraordinary abilit|sustained national|international acclaim|evidence of/i, ground: 'extraordinary_ability_criteria' },
  { pattern: /national interest|matter of dhanasar|proposed endeavor|well.positioned/i, ground: 'national_interest' },
  { pattern: /ability to pay|gross annual income|net income|financial|tax return/i, ground: 'petitioner_ability_to_pay' },
  { pattern: /missing document|not submitted|not provided|not included/i, ground: 'missing_documents' },
]

// ── Ground definitions ────────────────────────────────────────
const GROUND_DEFINITIONS: Record<RfeGroundType, Omit<RfeGround, 'description'>> = {
  specialty_occupation: {
    type: 'specialty_occupation',
    title: 'Specialty Occupation',
    evidenceNeeded: [
      'Detailed job duties description showing theoretical/practical application of specialized knowledge',
      'Evidence that degree is normally required in industry (Bureau of Labor Statistics, Occupational Outlook Handbook)',
      'Employer\'s past hiring practices showing degree requirement',
      'Expert opinion letter from industry professional',
      'Job postings from similar companies requiring the same degree',
      'Professional licenses or certifications if applicable',
    ],
    legalBasis: 'INA §101(a)(15)(H)(i)(b); 8 C.F.R. §214.2(h)(4)(ii); Matter of Simeio Solutions, LLC; Matter of Michael Hertz Associates',
  },
  employer_employee_relationship: {
    type: 'employer_employee_relationship',
    title: 'Employer-Employee Relationship',
    evidenceNeeded: [
      'Signed contracts between petitioner and end-client specifying control',
      'Master Service Agreement (MSA) showing right to control',
      'Project itinerary with specific worksite details',
      'Evidence of petitioner\'s HR supervision (performance reviews, disciplinary authority)',
      'Beneficiary\'s day-to-day supervisor identified as petitioner\'s employee',
      'Statement from end-client confirming petitioner\'s control',
    ],
    legalBasis: 'Matter of Ijaz; Matter of Simeio Solutions; 8 C.F.R. §214.2(h)(4)(ii)',
  },
  maintenance_of_status: {
    type: 'maintenance_of_status',
    title: 'Maintenance of Status',
    evidenceNeeded: [
      'All prior visa stamps and I-94 records',
      'Prior approval notices (I-797)',
      'Paystubs/W-2s showing employment during authorized period',
      'Cap-gap documentation if applicable',
      'Any prior status change documentation',
      'Explanation letter addressing any gaps',
    ],
    legalBasis: '8 C.F.R. §214.1; INA §248',
  },
  beneficiary_qualifications: {
    type: 'beneficiary_qualifications',
    title: 'Beneficiary Qualifications',
    evidenceNeeded: [
      'Official degree certificates and transcripts',
      'Credential evaluation from NACES member organization',
      'Evidence that degree is in related field (course catalog, syllabi)',
      'Professional work experience letters (3-year experience = 1 year of education)',
      'Professional licenses or certifications',
      'Evidence of continuing education',
    ],
    legalBasis: '8 C.F.R. §214.2(h)(4)(iii)(C); Matter of Silver Dragon Chinese Restaurant',
  },
  wage_level: {
    type: 'wage_level',
    title: 'Wage Level / Prevailing Wage',
    evidenceNeeded: [
      'Certified LCA showing prevailing wage source and level',
      'Wage survey data supporting offered wage (OES, employer survey)',
      'Evidence of actual wage paid (paystubs, W-2, offer letter)',
      'Explanation for wage level selection (Level I vs II vs III)',
      'Description of complexity of duties justifying wage level',
    ],
    legalBasis: 'INA §212(n); 20 C.F.R. Part 655; 8 C.F.R. §214.2(h)(4)(i)(B)(1)',
  },
  itinerary_worksite: {
    type: 'itinerary_worksite',
    title: 'Itinerary / Worksite',
    evidenceNeeded: [
      'Detailed itinerary listing specific worksites, dates, and durations',
      'Contracts or purchase orders for work at each location',
      'Signed MSA/SOW with end-client for each project',
      'LCA for each worksite location (or blanket LCA if qualifying)',
      'Letter from end-client confirming project duration and location',
    ],
    legalBasis: '8 C.F.R. §214.2(h)(2)(i)(B); Matter of Simeio Solutions',
  },
  extraordinary_ability_criteria: {
    type: 'extraordinary_ability_criteria',
    title: 'Extraordinary Ability Criteria',
    evidenceNeeded: [
      'Documentation for each criterion claimed (minimum 3 of 10)',
      'Expert opinion letters from recognized field authorities',
      'Published articles with citation records',
      'Award certificates and media coverage',
      'Membership documentation in exclusive associations',
      'Evidence of high salary relative to peers',
      'Critical role evidence in distinguished organizations',
      'Judging panels served on',
    ],
    legalBasis: '8 C.F.R. §204.5(h)(3); Matter of Kazarian; Kazarian v. USCIS (9th Cir. 2010)',
  },
  national_interest: {
    type: 'national_interest',
    title: 'National Interest Waiver',
    evidenceNeeded: [
      'Evidence of substantial merit and national importance (publications, citations, impact)',
      'Evidence beneficiary is well-positioned (credentials, track record, support letters)',
      'Letters from field experts supporting national importance',
      'Published research and citation metrics',
      'Government grant funding documentation',
      'Evidence of specific plan to advance the endeavor',
      'On-balance benefit analysis responding to each Dhanasar prong',
    ],
    legalBasis: 'Matter of Dhanasar (AAO 2016); INA §203(b)(2)(B)(i)',
  },
  petitioner_ability_to_pay: {
    type: 'petitioner_ability_to_pay',
    title: 'Petitioner\'s Ability to Pay',
    evidenceNeeded: [
      'Most recent 3 years\' federal tax returns (Form 1120 or 1120-S)',
      'Audited financial statements',
      'Annual reports',
      'Evidence of net income exceeding offered wage',
      'Evidence of net current assets exceeding offered wage',
      'If insufficient, letter of explanation with supplemental evidence',
    ],
    legalBasis: '8 C.F.R. §204.5(g)(2); Matter of Great Wall; Matter of Simeio Solutions',
  },
  job_offer_validity: { type: 'job_offer_validity', title: 'Job Offer Validity', evidenceNeeded: ['New signed offer letter on letterhead','Evidence position still exists','Updated job description'], legalBasis: '8 C.F.R. §204.5' },
  derivative_beneficiary: { type: 'derivative_beneficiary', title: 'Derivative Beneficiary', evidenceNeeded: ['Marriage certificate','Birth certificates','Proof of unmarried status for children 18+'], legalBasis: 'INA §203(d)' },
  priority_date: { type: 'priority_date', title: 'Priority Date', evidenceNeeded: ['Original PERM certification','I-140 approval notice','Priority date documentation'], legalBasis: 'INA §203(b)' },
  inadmissibility: { type: 'inadmissibility', title: 'Inadmissibility Grounds', evidenceNeeded: ['Waiver applications if applicable','Criminal records documentation','Medical examination results'], legalBasis: 'INA §212' },
  missing_documents: { type: 'missing_documents', title: 'Missing Documents', evidenceNeeded: ['All documents listed in the RFE notice'], legalBasis: '8 C.F.R. §103.2(b)(8)' },
  signature_missing: { type: 'signature_missing', title: 'Missing Signature', evidenceNeeded: ['Re-signed petition page'], legalBasis: '8 C.F.R. §103.2(a)(7)' },
  fee_error: { type: 'fee_error', title: 'Filing Fee Error', evidenceNeeded: ['Correct fee payment'], legalBasis: '8 C.F.R. §103.7' },
  specialty_occupation_degree: { type: 'specialty_occupation_degree', title: 'Degree in Specialty Occupation', evidenceNeeded: ['Degree transcripts showing specialized coursework','Course descriptions from official catalog','Expert evaluation of degree relevance'], legalBasis: '8 C.F.R. §214.2(h)(4)(iii)(C)' },
  other: { type: 'other', title: 'Other Issues', evidenceNeeded: ['Documents addressing the specific issue raised'], legalBasis: 'As applicable' },
}

// ── Parse RFE text → structured grounds ──────────────────────
export function parseRfeGrounds(rfeText: string): RfeGround[] {
  const grounds: RfeGround[] = []
  const seen = new Set<RfeGroundType>()

  for (const { pattern, ground } of RFE_PATTERNS) {
    if (pattern.test(rfeText) && !seen.has(ground)) {
      seen.add(ground)
      const def = GROUND_DEFINITIONS[ground]
      // Extract the relevant paragraph as description
      const match = rfeText.match(new RegExp(`.{0,200}${pattern.source}.{0,300}`, 'i'))
      grounds.push({
        ...def,
        description: match ? match[0].replace(/\s+/g, ' ').trim() : `USCIS has raised concerns regarding ${def.title}.`,
      })
    }
  }

  if (grounds.length === 0) {
    grounds.push({ ...GROUND_DEFINITIONS.other, description: 'USCIS has requested additional evidence. Please review the RFE notice for specific requirements.' })
  }

  return grounds
}

// ── Extract key metadata from RFE text ───────────────────────
export function extractRfeMetadata(rfeText: string): Partial<ParsedRfe> {
  const receiptMatch    = rfeText.match(/receipt number[:\s]+([A-Z]{3}\d{10})/i)
  const deadlineMatch   = rfeText.match(/(?:response|submit|due|deadline).{0,50}(\b\w+ \d{1,2},?\s*\d{4}\b)/i)
  const serviceCtrMatch = rfeText.match(/(nebraska|vermont|texas|california|potomac|national benefits)\s+service center/i)
  const issuedMatch     = rfeText.match(/date[:\s]+(\w+ \d{1,2},?\s*\d{4})/i)

  return {
    receiptNumber: receiptMatch?.[1] ?? '',
    deadlineText:  deadlineMatch?.[1] ?? '',
    serviceCenter: serviceCtrMatch?.[0] ?? 'USCIS Service Center',
    issuedDate:    issuedMatch?.[1] ?? '',
  }
}

// ── Build system prompt for RFE response draft ────────────────
export function buildRfeDraftPrompt(
  draftType: string,
  rfeText: string,
  grounds: RfeGround[],
  caseContext: {
    applicantName: string
    petitionerName: string | null
    visaCategory: string
    caseType: string
    receiptNumber?: string
    deadlineText?: string
  }
): { system: string; user: string } {
  const groundSummary = grounds.map((g, i) =>
    `Ground ${i + 1}: ${g.title}\n  Legal Basis: ${g.legalBasis}\n  Required Evidence: ${g.evidenceNeeded.slice(0,3).join('; ')}`
  ).join('\n\n')

  const system = `You are a senior U.S. immigration attorney with 20+ years of experience drafting successful RFE responses. You write in formal legal prose, cite applicable USCIS policy memoranda, AAO decisions, and regulations, and structure responses that directly and comprehensively address each ground raised.

Your drafts:
- Are professionally formatted for USCIS submission
- Address every issue raised in the RFE with specificity
- Cite relevant legal authority (regulations, case law, policy memos)
- Reference specific exhibits that would accompany the response
- Use the proper legal standard of review for each visa category
- Are written in first person from the petitioner/attorney's perspective
- Include a clear table of contents for multi-ground responses
- Are persuasive but objective and grounded in law

Format all responses in clean markdown with ## headers for each section.`

  const userPromptsByType: Record<string, string> = {
    rfe_response: `Draft a comprehensive RFE response for the following case:

CASE INFORMATION:
- Applicant: ${caseContext.applicantName}
- Petitioner: ${caseContext.petitionerName ?? 'Self-petitioned'}
- Visa Category: ${caseContext.visaCategory}
- Receipt Number: ${caseContext.receiptNumber ?? 'See petition'}
- RFE Deadline: ${caseContext.deadlineText ?? 'Per RFE notice'}

RFE NOTICE (OCR extracted):
"""
${rfeText.slice(0, 3000)}
"""

IDENTIFIED GROUNDS (${grounds.length} total):
${groundSummary}

Draft a complete RFE response with these sections:
1. Cover letter header (date, address, receipt number, re: line)
2. Introduction paragraph establishing the background and burden of proof
3. Legal Standard section applicable to ${caseContext.visaCategory}
4. For EACH ground: a dedicated section with (a) restatement of the issue, (b) applicable legal standard, (c) responsive argument, (d) evidence references as "[Exhibit A: ...]"
5. Conclusion with summary of evidence submitted and request for approval
6. Attorney certification block

Use "[Exhibit X: description]" placeholders for all supporting evidence.
Write in formal legal prose suitable for direct USCIS submission.`,

    cover_letter: `Draft a formal cover letter transmitting an RFE response to USCIS for:

- Applicant: ${caseContext.applicantName}
- Petitioner: ${caseContext.petitionerName ?? 'Self-petitioned'}
- Visa Category: ${caseContext.visaCategory}
- Receipt Number: ${caseContext.receiptNumber ?? '[Receipt Number]'}
- RFE Issues: ${grounds.map(g => g.title).join(', ')}

The cover letter should:
- Be addressed to the appropriate USCIS service center
- Reference the receipt number and applicant name
- List all exhibits being submitted with this response
- Briefly state that all grounds have been addressed
- Request expeditious processing
- Include attorney signature block

Format as a proper business letter in markdown.`,

    support_letter: `Draft an employer support letter responding to the following RFE grounds:

CASE: ${caseContext.applicantName} / ${caseContext.petitionerName ?? 'Petitioner'}
VISA: ${caseContext.visaCategory}
RFE ISSUES: ${grounds.map(g => g.title).join(', ')}

RFE CONTEXT:
"""
${rfeText.slice(0, 1500)}
"""

The support letter should be written from the employer's perspective and:
- Describe the company's business in detail
- Describe the specific position with full duties
- Address each RFE ground with factual statements
- Confirm education requirements for the position
- Confirm salary and working conditions
- Be signed by an authorized HR/management official
- Be on company letterhead (indicate [COMPANY LETTERHEAD] at top)

Write formal, specific business letter prose.`,

    personal_statement: `Draft a personal statement for ${caseContext.applicantName} responding to the following RFE issues in a ${caseContext.visaCategory} case:

RFE ISSUES: ${grounds.map(g => g.title).join(', ')}

RFE CONTEXT:
"""
${rfeText.slice(0, 1500)}
"""

The personal statement should:
- Be written in first person from the applicant's perspective
- Explain the applicant's qualifications, background, and experience
- Address each RFE ground with personal examples and specifics
- Describe the applicant's role, responsibilities, and expertise
- Explain how their work serves the national interest (if NIW)
- Be sincere, specific, and factually grounded
- Include a closing paragraph about future plans and contributions

Length: 2-3 pages (approximately 600-900 words). Write in clear, professional prose.`,
  }

  return { system, user: userPromptsByType[draftType] ?? userPromptsByType.rfe_response }
}

// ── Demo drafts for when no API key is set ────────────────────
export function generateDemoDraft(
  draftType: string,
  grounds: RfeGround[],
  caseContext: { applicantName: string; petitionerName: string | null; visaCategory: string; receiptNumber?: string }
): string {
  const date       = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const receipNum  = caseContext.receiptNumber ?? 'EAC-XX-XXX-XXXXX'
  const applicant  = caseContext.applicantName
  const petitioner = caseContext.petitionerName ?? 'Petitioner'
  const visa       = caseContext.visaCategory

  const groundSections = grounds.map((g, i) => `
## ${String.fromCharCode(73 + i)}. Response to Ground ${i + 1}: ${g.title}

### Issue

USCIS has raised concerns regarding ${g.title} in connection with the above-captioned petition.

### Applicable Legal Standard

${g.legalBasis ? `Pursuant to ${g.legalBasis}, USCIS evaluates this issue by considering the totality of evidence submitted.` : 'USCIS applies the preponderance of evidence standard to evaluate this issue.'}

### Response

The Petitioner respectfully submits that the evidence of record, combined with the supplemental evidence submitted herewith, fully demonstrates compliance with the applicable regulatory requirements. As detailed below and supported by the accompanying exhibits, ${applicant} meets the requirements for the classification requested.

${g.evidenceNeeded.slice(0, 3).map((ev, j) => `**[Exhibit ${String.fromCharCode(65 + i * 3 + j)}: ${ev}]** — This exhibit demonstrates that the requirements of ${g.title} are fully satisfied. The Petitioner respectfully refers USCIS to this evidence in support of the petition.`).join('\n\n')}

Based on the foregoing evidence, the Petitioner has established by a preponderance of the evidence that the requirements for ${g.title} are satisfied.
`).join('\n')

  const drafts: Record<string, string> = {
    rfe_response: `# Response to Request for Evidence
## ${visa} Petition for ${applicant}
**Receipt Number:** ${receipNum} | **Date:** ${date}

---

**VIA CERTIFIED MAIL — RETURN RECEIPT REQUESTED**

U.S. Citizenship and Immigration Services
[Service Center Address]

**RE:** Response to Request for Evidence
**Visa Classification:** ${visa}
**Receipt Number:** ${receipNum}
**Petitioner:** ${petitioner}
**Beneficiary:** ${applicant}

---

## I. Introduction

On behalf of the Petitioner, ${petitioner}, we respectfully submit this response to the Request for Evidence ("RFE") issued in connection with the above-referenced ${visa} petition filed on behalf of ${applicant} (the "Beneficiary"). The RFE, dated [RFE Date], requested additional evidence addressing ${grounds.length} issue${grounds.length > 1 ? 's' : ''}:

${grounds.map((g, i) => `${i + 1}. ${g.title}`).join('\n')}

As set forth herein, the Petitioner has fully addressed each ground raised. The supplemental evidence submitted with this response, combined with the evidence already of record, establishes by a preponderance of the evidence that all requirements for ${visa} classification are met.

## II. Legal Standard

The standard of proof in visa petition proceedings is the preponderance of the evidence. *Matter of Chawathe*, 25 I&N Dec. 369, 375 (AAO 2010). The petitioner must establish that the claim is "more likely than not" or "probably true." *Id.*

${groundSections}

## ${String.fromCharCode(73 + grounds.length)}. Conclusion

For the foregoing reasons, the Petitioner respectfully requests that USCIS approve the ${visa} petition for ${applicant}. The Petitioner has submitted substantial evidence demonstrating that all regulatory requirements are satisfied. Should USCIS require any additional evidence or clarification, we respectfully request the opportunity to submit supplemental materials.

Respectfully submitted,

___________________________
[Attorney Name], Esq.
[Law Firm Name]
[Address]
[Phone] | [Email]
[Bar Number / USCIS ID]

*Date: ${date}*

---
*⚠️ DRAFT — For attorney review and editing before submission. All exhibit references must be confirmed against actual documents submitted.*`,

    cover_letter: `# Cover Letter — RFE Response Submission
**Date:** ${date}

---

**VIA CERTIFIED MAIL — RETURN RECEIPT REQUESTED**

U.S. Citizenship and Immigration Services
[USCIS Service Center]
[Address]

**RE:** Response to Request for Evidence — ${visa}
**Receipt Number:** ${receipNum}
**Petitioner:** ${petitioner}
**Beneficiary:** ${applicant}

---

Dear Officer:

Enclosed please find the Response to Request for Evidence ("RFE") on behalf of the above-captioned ${visa} petition. The RFE was issued on [RFE Date] and a timely response is being submitted herewith.

The enclosed response addresses all issues raised in the RFE. The following exhibits are submitted in support:

${grounds.flatMap((g, i) => g.evidenceNeeded.slice(0, 2).map((ev, j) => `- **Exhibit ${String.fromCharCode(65 + i * 2 + j)}:** ${ev}`)).join('\n')}

We respectfully request that USCIS review the enclosed materials and approve the petition at the earliest opportunity. If you have any questions or require additional information, please do not hesitate to contact our office.

Thank you for your time and consideration.

Respectfully submitted,

___________________________
[Attorney Name], Esq.
[Law Firm Name]
[Phone] | [Email]

*⚠️ DRAFT — For attorney review before submission.*`,

    support_letter: `# Employer Support Letter — RFE Response
**[COMPANY LETTERHEAD]**

${date}

U.S. Citizenship and Immigration Services
[Service Center Address]

**RE:** Support Letter in Response to Request for Evidence
**Receipt Number:** ${receipNum}
**Employee/Beneficiary:** ${applicant}
**Visa Category:** ${visa}

---

Dear Immigration Officer:

I am writing on behalf of ${petitioner} (the "Company") in support of the above-referenced ${visa} petition and in response to the Request for Evidence issued by USCIS.

**About the Company**

${petitioner} is a [description of company, industry, and size]. The Company was founded in [year] and has grown to employ [number] employees across [locations]. Our annual revenue exceeds $[amount], and we specialize in [core business description].

**The Offered Position**

The Company has offered ${applicant} the position of [Job Title], which is a full-time, permanent position requiring a minimum of a Bachelor's degree in [relevant field] or a closely related discipline. The position involves the following core responsibilities:

${grounds.includes(grounds.find(g => g.type === 'specialty_occupation')!) ? '- Designing and developing [technical tasks requiring degree-level knowledge]\n- Applying theoretical and practical knowledge of [specialized area]\n- [Additional duties demonstrating specialty occupation]' : '- [Core job duties]\n- [Responsibilities requiring specialized expertise]'}

**Response to RFE Issues**

${grounds.map(g => `*Regarding ${g.title}:* The Company confirms that [specific factual statement addressing this ground with specificity].`).join('\n\n')}

**Conclusion**

The Company strongly supports the approval of this petition and affirms that ${applicant} is highly qualified for this position. Please feel free to contact our HR department at [contact information] if you require additional information.

Sincerely,

___________________________
[Authorized Signatory Name]
[Title]
${petitioner}
[Address] | [Phone] | [Email]

*⚠️ DRAFT — For employer review and signature on company letterhead before submission.*`,

    personal_statement: `# Personal Statement — ${applicant}
**${visa} — Response to Request for Evidence**

*Prepared: ${date} | Receipt Number: ${receipNum}*

---

I am ${applicant}, and I respectfully submit this personal statement in response to the Request for Evidence issued in connection with my ${visa} petition. I wish to address each of the concerns raised and provide context that I believe will demonstrate my qualifications and the merits of my petition.

## Background and Qualifications

I am a [professional description] with [X] years of experience in [field]. I obtained my [degree] from [institution] in [year], where I specialized in [area of study]. Since then, I have built a career focused on [professional focus], and I have had the privilege of working on [notable projects/achievements].

${grounds.map(g => `## Regarding ${g.title}

In response to USCIS's inquiry about ${g.title}, I would like to provide the following clarification and additional context:

[Personal statement addressing this specific ground with individual details, examples, and evidence references]

I believe the evidence submitted herewith — including [Exhibit X: description] — fully demonstrates that I meet the requirements for this aspect of my petition.`).join('\n\n')}

## Conclusion

I am deeply committed to contributing to [the United States / my employer / my field], and I respectfully request that USCIS approve my petition. I am grateful for the opportunity to provide this additional information and stand ready to submit any further evidence that may be helpful.

Respectfully,

___________________________
${applicant}
[Date]

*⚠️ DRAFT — For applicant review and personalization before submission.*`,
  }

  return drafts[draftType] ?? drafts.rfe_response
}

// ── Calculate confidence score ────────────────────────────────
export function calculateConfidenceScore(
  grounds: RfeGround[],
  rfeTextLength: number,
  hasAiGenerated: boolean
): number {
  let score = 50
  if (hasAiGenerated) score += 20
  if (rfeTextLength > 500) score += 10
  if (rfeTextLength > 1500) score += 5
  if (grounds.length > 0 && grounds[0].type !== 'other') score += 10
  if (grounds.length >= 2) score += 5
  return Math.min(score, 92) // never claim 100% — attorney must review
}
