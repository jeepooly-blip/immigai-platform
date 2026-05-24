import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await prisma.form.findUnique({
      where: { id: params.id },
      include: { case: { select: { userId: true, organizationId: true, applicantName: true, visaCategory: true, caseType: true } } },
    })
    if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { fieldId, aiPrompt, currentFieldData } = await req.json()
    if (!fieldId || !aiPrompt) return NextResponse.json({ error: 'fieldId and aiPrompt required' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Demo fallback
      return NextResponse.json({
        text: generateDemoText(form.formType, fieldId, form.case),
        source: 'demo',
      })
    }

    // Build context from existing field data
    const existingData = JSON.parse(form.fieldData) as Record<string, string>
    const contextFields = Object.entries({ ...existingData, ...currentFieldData })
      .filter(([,v]) => v && String(v).trim())
      .slice(0, 15)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')

    const systemPrompt = `You are an expert U.S. immigration attorney helping prepare USCIS and State Department forms.
You write clear, professional, legally accurate content for immigration petitions.
Always write in first person (from the petitioner/applicant's perspective) unless instructed otherwise.
Be specific, persuasive, and thorough. Avoid vague language.
Respond with ONLY the requested text — no preamble, no "Here is..." no markdown formatting.`

    const userPrompt = `Form type: ${form.formType}
Applicant: ${form.case.applicantName}
Visa Category: ${form.case.visaCategory}
Case Type: ${form.case.caseType}

Existing form data context:
${contextFields || 'No other fields filled yet'}

Field to write: ${fieldId}

Instructions: ${aiPrompt}

Write the content for this field:`

    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type':       'application/json',
        'x-api-key':          apiKey,
        'anthropic-version':  '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 800,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ text: generateDemoText(form.formType, fieldId, form.case), source: 'fallback' })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text?.trim() ?? ''

    return NextResponse.json({ text, source: 'ai' })
  } catch (err: any) {
    console.error('AI assist error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function generateDemoText(formType: string, fieldId: string, caseData: any): string {
  const applicant = caseData?.applicantName ?? 'the beneficiary'
  const visa      = caseData?.visaCategory  ?? 'the requested visa'

  const demos: Record<string, string> = {
    job_description: `The position of Software Engineer requires a minimum of a Bachelor's degree in Computer Science, Software Engineering, or a closely related technical field. The role involves designing and developing complex software systems using specialized knowledge of distributed computing, machine learning frameworks, and cloud infrastructure. The position requires theoretical and practical knowledge typically obtained through formal academic training at the bachelor's degree level or higher. This role clearly qualifies as a specialty occupation under INA 214(i)(1) as the work is so specialized and complex that it is normally performed only by individuals with at least a bachelor's degree in a relevant field.`,

    specialty_duties: `${applicant} will perform the following specialty occupation duties as ${visa}: (1) Design and architect complex distributed software systems requiring advanced knowledge of computer science principles; (2) Develop and optimize machine learning models using specialized mathematical and statistical expertise obtained through graduate-level education; (3) Lead technical architecture decisions involving cloud infrastructure design that requires deep domain expertise; (4) Collaborate with cross-functional teams to translate complex business requirements into technical specifications requiring a bachelor's degree minimum. These duties require theoretical and practical application of highly specialized knowledge in computer science and software engineering, attainable only through formal academic training.`,

    niw_merit: `${applicant}'s proposed endeavor — advancing research in artificial intelligence and its applications to healthcare diagnostics — has both substantial merit and national importance. The field of AI-driven healthcare represents one of the most significant technological frontiers in modern medicine, with the potential to transform diagnostic accuracy, reduce healthcare costs, and extend quality of life for millions of Americans. The applicant's research directly addresses critical national priorities identified by the National Institutes of Health and the National Science Foundation in their strategic plans for precision medicine and AI in healthcare. The work has intrinsic value extending far beyond the applicant's employer.`,

    niw_positioned: `${applicant} is exceptionally well-positioned to advance this endeavor based on their outstanding academic credentials, demonstrated record of research success, and unique combination of technical expertise. With a doctoral degree from a leading research institution, multiple peer-reviewed publications in top-tier journals, and research cited over 500 times in the scientific literature, the applicant has established themselves as a recognized leader in their field. Their specific expertise in applying transformer-based neural architectures to medical imaging analysis represents a rare and highly specialized skill set that few researchers worldwide possess.`,

    niw_benefit: `The United States would greatly benefit from waiving the usual labor certification requirements for ${applicant}. Their research is urgently needed and would be substantially impaired if subject to the ordinary process of labor market testing, which is designed primarily for filling existing job vacancies rather than recognizing individuals of unique expertise who will create new knowledge and capabilities. The applicant's work directly serves national interests in maintaining U.S. technological leadership in artificial intelligence, a strategic priority explicitly identified in the National AI Initiative Act of 2020. The immediate benefit to be gained by the U.S. from the applicant's continued research substantially outweighs any marginal benefit to the labor market from the certification process.`,

    support_letter_text: `[EMPLOYER LETTERHEAD]\n\n${new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}\n\nU.S. Citizenship and Immigration Services\n[Service Center Address]\n\nRe: I-129 Petition for ${applicant} — ${visa} Classification\n\nDear USCIS Officer:\n\nWe are writing in strong support of our petition for ${applicant} to work in the United States in ${visa} classification. [Company Name] is a leading technology company with over [X] employees and $[X] million in annual revenue, operating in [industry] since [year].\n\nWe have offered ${applicant} the position of [Job Title], a full-time, permanent role within our [Department] team. This position requires a minimum of a Bachelor's degree in [field] or a closely related discipline, along with [X] years of specialized experience in [specific skills].\n\n${applicant} is uniquely qualified for this position by virtue of their [describe key qualifications]. We have been unable to find a qualified U.S. worker for this highly specialized role despite our good-faith recruitment efforts.\n\nWe respectfully request USCIS approve this petition at your earliest convenience.\n\nSincerely,\n[Authorized Signatory]\n[Title]\n[Company Name]`,

    intent_statement: `I am applying for an immigrant visa to the United States to be reunited with my family and to build a life contributing to American society. I have a strong desire to integrate fully into the United States, where I intend to establish permanent residence, pursue my career, and contribute to my community. I have deep family ties in the United States, including my [relationship] who is a U.S. citizen/lawful permanent resident. I understand and fully respect the laws and values of the United States and am committed to being a law-abiding, productive resident. I believe my professional skills and personal background will allow me to make meaningful contributions to the United States.`,
  }

  // Check for partial match
  for (const [key, text] of Object.entries(demos)) {
    if (fieldId.includes(key)) return text
  }

  return `[AI demo text for ${fieldId} — add ANTHROPIC_API_KEY for full AI generation based on your specific case details for ${applicant}]`
}
