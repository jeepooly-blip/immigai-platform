import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runEligibilityEngine, EligibilityInput } from '@/lib/ai-engines/eligibility'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: EligibilityInput & { caseId?: string } = await req.json()
  const { caseId, ...input } = body

  try {
    const result = await runEligibilityEngine(input)

    // If linked to a case, update approval probability
    if (caseId) {
      const topPathway = result.eligible_pathways[0]
      const score = topPathway?.likelihood === 'high' ? 85 :
                    topPathway?.likelihood === 'medium' ? 60 : 35

      await prisma.case.update({
        where: { id: caseId, userId: session.user.id },
        data:  { approvalProbabilityScore: score },
      })

      // Create timeline event
      await prisma.timelineEvent.create({
        data: {
          caseId,
          eventType:   'eligibility_analysis',
          title:       'Eligibility analysis completed',
          description: `Recommended pathway: ${result.recommended_pathway}`,
          isAutomated: true,
        },
      })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[eligibility]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
