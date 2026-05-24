import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding ImmigAI database…')

  // Demo organization
  const org = await prisma.organization.upsert({
    where:  { id: 'demo-org' },
    update: {},
    create: { id: 'demo-org', name: 'Demo Immigration Law Firm', domain: 'democorp.com' },
  })

  // Admin user
  const adminHash = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where:  { email: 'admin@immigai.com' },
    update: {},
    create: {
      email: 'admin@immigai.com', name: 'Platform Admin',
      password: adminHash, role: 'admin', isAdmin: true,
      subscriptionStatus: 'active', creditsRemaining: 99999,
    },
  })

  // Demo attorney
  const hash = await bcrypt.hash('demo1234', 12)
  const attorney = await prisma.user.upsert({
    where:  { email: 'demo@immigai.com' },
    update: {},
    create: {
      email: 'demo@immigai.com', name: 'Sarah Chen',
      password: hash, role: 'attorney', firm: 'Demo Immigration Law Firm',
      organizationId: org.id, subscriptionStatus: 'active', creditsRemaining: 500,
    },
  })

  // Demo cases
  const cases = [
    { applicantName: 'Raj Patel',    visaCategory: 'H-1B',        status: 'active',      currentStage: 'RFE Response',  approvalProbabilityScore: 72 },
    { applicantName: 'Maria Garcia', visaCategory: 'I-485',        status: 'active',      currentStage: 'Biometrics',    approvalProbabilityScore: 88 },
    { applicantName: 'Wei Zhang',    visaCategory: 'EB-2 NIW',     status: 'submitted',   currentStage: 'USCIS Review',  approvalProbabilityScore: 65 },
    { applicantName: 'Aisha Hassan', visaCategory: 'O-1A',         status: 'active',      currentStage: 'Intake',        approvalProbabilityScore: 91 },
    { applicantName: 'Carlos Lima',  visaCategory: 'I-130',        status: 'approved',    currentStage: 'Completed',     approvalProbabilityScore: 95 },
    { applicantName: 'Priya Nair',   visaCategory: 'H-1B',         status: 'rfe_received',currentStage: 'RFE Response',  approvalProbabilityScore: 58 },
  ]

  for (const c of cases) {
    await prisma.case.upsert({
      where:  { id: `demo-case-${c.applicantName.replace(' ', '-').toLowerCase()}` },
      update: {},
      create: {
        id: `demo-case-${c.applicantName.replace(' ', '-').toLowerCase()}`,
        userId: attorney.id, organizationId: org.id,
        visaCategory: c.visaCategory, status: c.status as any,
        currentStage: c.currentStage, applicantName: c.applicantName,
        applicantEmail: `${c.applicantName.split(' ')[0].toLowerCase()}@example.com`,
        caseType: c.visaCategory.startsWith('I-') ? 'family' : 'employment',
        approvalProbabilityScore: c.approvalProbabilityScore,
      },
    })
  }

  // Demo regulatory alerts
  const alerts = [
    { alertType: 'fee_change',     severity: 'high',   title: 'USCIS Filing Fee Increases Effective April 1, 2026', summary: 'USCIS has announced significant fee increases across most immigration forms. I-129 increases from $460 to $780. I-485 increases from $1,440 to $1,740.', sourceName: 'USCIS', affectedVisaTypes: JSON.stringify(['H-1B', 'O-1A', 'L-1', 'I-485']) },
    { alertType: 'policy_update',  severity: 'medium', title: 'H-1B Cap Registration Period Opens March 1, 2026',   summary: 'USCIS has announced the H-1B cap registration period for FY2027. Employers must register between March 1-18. The lottery will be conducted shortly after.', sourceName: 'USCIS', affectedVisaTypes: JSON.stringify(['H-1B']), affectsAllCases: false },
    { alertType: 'processing_time',severity: 'info',   title: 'EB-2 NIW Processing Times Reduced to 12 Months',   summary: 'USCIS has updated EB-2 National Interest Waiver processing times. Current average is 12 months, down from 18 months in Q3 2025.', sourceName: 'USCIS', affectedVisaTypes: JSON.stringify(['EB-2 NIW']) },
    { alertType: 'form_change',    severity: 'medium', title: 'New Edition of Form I-485 Required as of May 2026',  summary: 'USCIS has released a new edition of Form I-485. Only the 02/28/2026 edition will be accepted after the 90-day grace period ends July 1, 2026.', sourceName: 'USCIS', affectedVisaTypes: JSON.stringify(['I-485']), affectsAllCases: false },
  ]

  for (const a of alerts) {
    await prisma.regulatoryAlert.create({ data: { ...a, externalId: `seed-${a.alertType}-${Date.now()}-${Math.random()}` } }).catch(() => {})
  }

  console.log('✅ Seed complete!')
  console.log('   → Admin:    admin@immigai.com / admin123')
  console.log('   → Attorney: demo@immigai.com  / demo1234')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
