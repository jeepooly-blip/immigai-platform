'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWorkflow } from '@/lib/workflow'

// ─────────────────────────────────────────────────────────────
// Auth Helpers
// ─────────────────────────────────────────────────────────────
async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  return session.user
}

/**
 * Security: a user may access a case if:
 *   1. They own it (userId match), OR
 *   2. They are a corporate_admin in the same organization
 */
async function requireCaseAccess(caseId: string, userId: string): Promise<{ id: string; currentStage: string; applicantName: string; visaCategory: string; organizationId: string | null }> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, userId: true, currentStage: true, applicantName: true, visaCategory: true, organizationId: true },
  })
  if (!c) throw new Error('Case not found')

  if (c.userId === userId) return c

  // Corporate admin check
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, organizationId: true } })
  if (user?.role === 'corporate_admin' && user.organizationId && user.organizationId === c.organizationId) {
    return c
  }

  throw new Error('Unauthorized: You do not have access to this case.')
}

// ─────────────────────────────────────────────────────────────
// createCase()  — uses workflow engine to bootstrap everything
// ─────────────────────────────────────────────────────────────
const createCaseSchema = z.object({
  applicantName:           z.string().min(2, 'Applicant name must be at least 2 characters'),
  applicantEmail:          z.string().email().optional().or(z.literal('')),
  visaCategory:            z.string().min(1, 'Visa category is required'),
  caseType:                z.enum(['family', 'employment', 'investor', 'student']),
  petitionerName:          z.string().optional(),
  petitionerType:          z.enum(['individual', 'company']).default('individual'),
  notes:                   z.string().optional(),
  estimatedCompletionDate: z.string().optional(),
  organizationId:          z.string().optional(),
})

export async function createCase(formData: FormData) {
  const user = await requireAuth()

  const raw = {
    applicantName:           formData.get('applicantName') as string,
    applicantEmail:          (formData.get('applicantEmail') as string) || undefined,
    visaCategory:            formData.get('visaCategory') as string,
    caseType:                formData.get('caseType') as 'family' | 'employment' | 'investor' | 'student',
    petitionerName:          (formData.get('petitionerName') as string) || undefined,
    petitionerType:          (formData.get('petitionerType') as 'individual' | 'company') ?? 'individual',
    notes:                   (formData.get('notes') as string) || undefined,
    estimatedCompletionDate: (formData.get('estimatedCompletionDate') as string) || undefined,
    organizationId:          (formData.get('organizationId') as string) || undefined,
  }

  const parsed = createCaseSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const data    = parsed.data
  const workflow = getWorkflow(data.visaCategory)
  const now      = new Date()

  const newCase = await prisma.$transaction(async (tx: any) => {
    // 1 — Create the case
    const c = await tx.case.create({
      data: {
        userId:                  user.id,
        organizationId:          data.organizationId ?? null,
        caseType:                data.caseType,
        visaCategory:            data.visaCategory,
        currentStage:            workflow.initialStage,
        status:                  'active',
        applicantName:           data.applicantName,
        applicantEmail:          data.applicantEmail || null,
        petitionerName:          data.petitionerName ?? null,
        petitionerType:          data.petitionerType,
        notes:                   data.notes ?? null,
        approvalProbabilityScore: workflow.approvalProbabilityScore,
        estimatedProcessingTime:  workflow.estimatedProcessingTime,
        estimatedCompletionDate:  data.estimatedCompletionDate
          ? new Date(data.estimatedCompletionDate)
          : new Date(Date.now() + workflow.estimatedProcessingTime * 30 * 24 * 60 * 60 * 1000),
      },
    })

    // 2 — Create checklist items
    await tx.checklistItem.createMany({
      data: workflow.checklist.map(item => ({
        caseId:    c.id,
        itemLabel: item.itemLabel,
        category:  item.category,
        formCode:  item.formCode ?? null,
        required:  item.required,
        completed: false,
        sortOrder: item.sortOrder,
      })),
    })

    // 3 — Create timeline events
    await tx.timelineEvent.createMany({
      data: workflow.timelineEvents.map(ev => ({
        caseId:          c.id,
        eventType:       ev.eventType,
        title:           ev.title,
        description:     ev.description,
        eventDate:       new Date(now.getTime() + ev.daysFromNow * 86400000),
        isAutomated:     ev.isAutomated,
        notificationSent: false,
      })),
    })

    // 4 — Create deadline events
    await tx.deadlineEvent.createMany({
      data: workflow.deadlines.map(dl => ({
        caseId:       c.id,
        deadlineType: dl.deadlineType,
        title:        dl.title,
        description:  dl.description,
        dueDate:      new Date(now.getTime() + dl.daysFromNow * 86400000),
        completed:    false,
        alertDays:    dl.alertDays,
      })),
    })

    return c
  })

  revalidatePath('/dashboard')
  revalidatePath('/cases')
  redirect(`/case/${newCase.id}`)
}

// ─────────────────────────────────────────────────────────────
// updateCaseStage()
// ─────────────────────────────────────────────────────────────
const STATUS_VALUES = ['active', 'submitted', 'approved', 'denied', 'rfe_received'] as const

const updateStageSchema = z.object({
  caseId:    z.string().uuid(),
  newStage:  z.string().min(1),
  newStatus: z.enum(STATUS_VALUES).optional(),
  note:      z.string().optional(),
})

export async function updateCaseStage(input: z.infer<typeof updateStageSchema>) {
  const user   = await requireAuth()
  const parsed = updateStageSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { caseId, newStage, newStatus, note } = parsed.data
  const existing = await requireCaseAccess(caseId, user.id)

  await prisma.$transaction(async (tx: any) => {
    await tx.case.update({
      where: { id: caseId },
      data: {
        currentStage: newStage,
        ...(newStatus ? { status: newStatus } : {}),
        updatedAt: new Date(),
      },
    })

    await tx.timelineEvent.create({
      data: {
        caseId,
        eventType:       'stage_change',
        title:           `Stage Updated: ${newStage}`,
        description:     note ?? `Case moved from "${existing.currentStage}" to "${newStage}" for ${existing.applicantName}.`,
        eventDate:       new Date(),
        isAutomated:     false,
        notificationSent: false,
      },
    })

    if (newStatus === 'rfe_received') {
      await tx.timelineEvent.create({
        data: {
          caseId,
          eventType:       'rfe',
          title:           'RFE Received',
          description:     'USCIS issued a Request for Evidence. AI is generating a draft response. Attorney review required.',
          eventDate:       new Date(),
          isAutomated:     true,
          notificationSent: false,
        },
      })
      // Auto-add RFE deadline (87 days is typical)
      await tx.deadlineEvent.create({
        data: {
          caseId,
          deadlineType: 'rfe_response',
          title:        'RFE Response Due',
          description:  'USCIS Response to Request for Evidence must be submitted',
          dueDate:      new Date(Date.now() + 87 * 86400000),
          completed:    false,
          alertDays:    14,
        },
      })
    }
  })

  revalidatePath(`/case/${caseId}`)
  revalidatePath('/dashboard')
  revalidatePath('/cases')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// addTimelineEvent()
// ─────────────────────────────────────────────────────────────
const addEventSchema = z.object({
  caseId:      z.string().uuid(),
  eventType:   z.string().min(1),
  title:       z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  eventDate:   z.string().optional(),
})

export async function addTimelineEvent(input: z.infer<typeof addEventSchema>) {
  const user   = await requireAuth()
  const parsed = addEventSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { caseId, eventType, title, description, eventDate } = parsed.data
  await requireCaseAccess(caseId, user.id)

  await prisma.timelineEvent.create({
    data: {
      caseId, eventType, title, description,
      eventDate:       eventDate ? new Date(eventDate) : new Date(),
      isAutomated:     false,
      notificationSent: false,
    },
  })

  revalidatePath(`/case/${caseId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// toggleChecklistItem()
// ─────────────────────────────────────────────────────────────
export async function toggleChecklistItem(itemId: string, completed: boolean) {
  const user = await requireAuth()

  const item = await prisma.checklistItem.findUnique({
    where:   { id: itemId },
    include: { case: { select: { userId: true, id: true, organizationId: true } } },
  })
  if (!item) return { success: false, error: 'Item not found' }
  await requireCaseAccess(item.case.id, user.id)

  await prisma.checklistItem.update({
    where: { id: itemId },
    data:  { completed, updatedAt: new Date() },
  })

  revalidatePath(`/case/${item.case.id}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// toggleDeadline()
// ─────────────────────────────────────────────────────────────
export async function toggleDeadline(deadlineId: string, completed: boolean) {
  const user = await requireAuth()

  const dl = await prisma.deadlineEvent.findUnique({
    where:   { id: deadlineId },
    include: { case: { select: { id: true, userId: true, organizationId: true } } },
  })
  if (!dl) return { success: false, error: 'Deadline not found' }
  await requireCaseAccess(dl.case.id, user.id)

  await prisma.deadlineEvent.update({
    where: { id: deadlineId },
    data:  { completed, updatedAt: new Date() },
  })

  revalidatePath(`/case/${dl.case.id}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// getCasesForUser()
// ─────────────────────────────────────────────────────────────
export async function getCasesForUser() {
  const user = await requireAuth()

  // Get user's own cases
  const ownCases = await prisma.case.findMany({
    where: { userId: user.id },
    include: {
      checklistItems: { select: { completed: true, required: true } },
      timelineEvents: { orderBy: { eventDate: 'desc' }, take: 1 },
      deadlineEvents: { where: { completed: false }, orderBy: { dueDate: 'asc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Corporate admins also see org cases
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, organizationId: true } })
  if (dbUser?.role === 'corporate_admin' && dbUser.organizationId) {
    const orgCases = await prisma.case.findMany({
      where: { organizationId: dbUser.organizationId, userId: { not: user.id } },
      include: {
        checklistItems: { select: { completed: true, required: true } },
        timelineEvents: { orderBy: { eventDate: 'desc' }, take: 1 },
        deadlineEvents: { where: { completed: false }, orderBy: { dueDate: 'asc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return [...ownCases, ...orgCases]
  }

  return ownCases
}

// ─────────────────────────────────────────────────────────────
// getCaseById()
// ─────────────────────────────────────────────────────────────
export async function getCaseById(id: string) {
  const user = await requireAuth()

  const c = await prisma.case.findUnique({
    where:   { id },
    include: {
      checklistItems: { orderBy: { sortOrder: 'asc' } },
      timelineEvents: { orderBy: { eventDate: 'desc' } },
      deadlineEvents: { orderBy: { dueDate: 'asc' } },
    },
  })
  if (!c) return null

  try {
    await requireCaseAccess(id, user.id)
    return c
  } catch {
    return null
  }
}
