'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFormSchema, calculateCompletion, autoPopulateFromCase } from '@/lib/form-schemas'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  return session.user
}

async function requireCaseAccess(caseId: string, userId: string) {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, userId: true, organizationId: true, applicantName: true, applicantEmail: true, petitionerName: true, petitionerType: true, visaCategory: true, caseType: true },
  })
  if (!c) throw new Error('Case not found')
  if (c.userId === userId) return c
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, organizationId: true } })
  if (user?.role === 'corporate_admin' && user.organizationId === c.organizationId) return c
  throw new Error('Unauthorized')
}

// ─────────────────────────────────────────────────────────────
// createForm()
// ─────────────────────────────────────────────────────────────
export async function createForm(caseId: string, formType: string) {
  const user    = await requireAuth()
  const caseData = await requireCaseAccess(caseId, user.id)

  const schema = getFormSchema(formType)
  if (!schema) return { success: false, error: `Unknown form type: ${formType}` }

  // Check if form already exists for this case+type
  const existing = await prisma.form.findFirst({
    where: { caseId, formType, status: { not: 'submitted' } },
  })
  if (existing) return { success: true, formId: existing.id }

  // Auto-populate from case data
  const populated = autoPopulateFromCase(schema, {
    applicantName:  caseData.applicantName,
    applicantEmail: caseData.applicantEmail,
    petitionerName: caseData.petitionerName,
    petitionerType: caseData.petitionerType,
    visaCategory:   caseData.visaCategory,
    caseType:       caseData.caseType,
  })

  const completion = calculateCompletion(schema, populated)

  const form = await prisma.form.create({
    data: {
      caseId,
      userId:              user.id,
      formType,
      completionPercentage: completion,
      currentSection:      0,
      status:              'draft',
      fieldData:           JSON.stringify(populated),
    },
  })

  // Log timeline event
  await prisma.timelineEvent.create({
    data: {
      caseId,
      eventType:       'document',
      title:           `Form ${formType} Started`,
      description:     `${schema.title} initiated. ${Object.keys(populated).length} fields auto-populated from case data.`,
      eventDate:       new Date(),
      isAutomated:     true,
      notificationSent: false,
    },
  })

  revalidatePath(`/case/${caseId}/forms`)
  return { success: true, formId: form.id }
}

// ─────────────────────────────────────────────────────────────
// saveFormProgress()  — called on auto-save
// ─────────────────────────────────────────────────────────────
export async function saveFormProgress(
  formId: string,
  fieldData: Record<string, any>,
  currentSection: number
) {
  const user = await requireAuth()

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { case: { select: { userId: true, organizationId: true, applicantName: true, applicantEmail: true, petitionerName: true, petitionerType: true, visaCategory: true, caseType: true } } },
  })
  if (!form) return { success: false, error: 'Form not found' }

  // Auth check
  const ownForm = form.userId === user.id
  const ownCase = form.case.userId === user.id
  if (!ownForm && !ownCase) {
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, organizationId: true } })
    if (u?.role !== 'corporate_admin' || u.organizationId !== form.case.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }
  }

  const schema     = getFormSchema(form.formType)
  const completion = schema ? calculateCompletion(schema, fieldData) : 0

  await prisma.form.update({
    where: { id: formId },
    data: {
      fieldData:           JSON.stringify(fieldData),
      currentSection,
      completionPercentage: completion,
      lastSavedAt:         new Date(),
      status:              completion === 100 ? 'complete' : 'draft',
    },
  })

  return { success: true, completion }
}

// ─────────────────────────────────────────────────────────────
// getFormsForCase()
// ─────────────────────────────────────────────────────────────
export async function getFormsForCase(caseId: string) {
  const user = await requireAuth()
  await requireCaseAccess(caseId, user.id)

  return prisma.form.findMany({
    where: { caseId },
    orderBy: { createdAt: 'desc' },
  })
}

// ─────────────────────────────────────────────────────────────
// getFormById()
// ─────────────────────────────────────────────────────────────
export async function getFormById(formId: string) {
  const user = await requireAuth()

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      case: {
        select: {
          id: true, userId: true, organizationId: true,
          applicantName: true, applicantEmail: true,
          petitionerName: true, petitionerType: true,
          visaCategory: true, caseType: true,
        },
      },
    },
  })
  if (!form) return null

  try {
    await requireCaseAccess(form.caseId, user.id)
    return form
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────
// deleteForm()
// ─────────────────────────────────────────────────────────────
export async function deleteForm(formId: string) {
  const user = await requireAuth()
  const form = await getFormById(formId)
  if (!form) return { success: false, error: 'Not found' }

  await prisma.form.delete({ where: { id: formId } })
  revalidatePath(`/case/${form.caseId}/forms`)
  return { success: true }
}
