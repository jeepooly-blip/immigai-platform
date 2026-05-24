/**
 * GET  /api/regulatory          — fetch active alerts for the dashboard
 * POST /api/regulatory/dismiss  — dismiss a single alert
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'

// ── GET /api/regulatory ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ alerts: [] })
  }

  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit      = limitParam ? parseInt(limitParam) : 20
  const dashboard  = req.nextUrl.searchParams.get('dashboard') === '1'

  // Get user's active cases to do case-impact matching
  const userCases = await prisma.case.findMany({
    where:  { userId: session.user.id, status: { in: ['active', 'submitted', 'rfe_received'] } },
    select: { visaCategory: true, caseType: true },
  })
  const userVisaTypes = new Set(userCases.map(c => c.visaCategory))

  // Fetch active (not dismissed) alerts
  const alerts = await prisma.regulatoryAlert.findMany({
    where:   { dismissedAt: null },
    orderBy: [
      { severity:    'asc' },   // critical first (alphabetically: critical < high < info < low < medium)
      { publishedAt: 'desc' },
      { createdAt:   'desc' },
    ],
    take: dashboard ? 5 : limit,
  })

  // Annotate each alert with whether it affects the user's cases
  const annotated = alerts.map(alert => {
    const affectedTypes: string[] = JSON.parse(alert.affectedVisaTypes as string || '[]')
    const affectsUserCases = alert.affectsAllCases ||
      affectedTypes.some(t => userVisaTypes.has(t))

    // How many of user's cases are affected
    const affectedCaseCount = alert.affectsAllCases
      ? userCases.length
      : userCases.filter(c => affectedTypes.includes(c.visaCategory)).length

    return {
      ...alert,
      affectedVisaTypes: affectedTypes,
      affectsUserCases,
      affectedCaseCount,
    }
  })

  // For dashboard, only return alerts that affect the user's cases
  const filtered = dashboard
    ? annotated.filter(a => a.affectsUserCases || a.severity === 'critical')
    : annotated

  return NextResponse.json({ alerts: filtered, total: filtered.length })
}
