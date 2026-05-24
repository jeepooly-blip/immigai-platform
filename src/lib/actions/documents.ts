'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  return session.user
}

async function requireDocumentAccess(docId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { case: { select: { userId: true, organizationId: true } } },
  })
  if (!doc) throw new Error('Document not found')

  const ownDoc  = doc.userId === userId
  const ownCase = doc.case.userId === userId
  if (ownDoc || ownCase) return doc

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, organizationId: true } })
  if (user?.role === 'corporate_admin' && user.organizationId === doc.case.organizationId) return doc

  throw new Error('Unauthorized')
}

// ─────────────────────────────────────────────────────────────
// getDocumentsForCase()
// ─────────────────────────────────────────────────────────────
export async function getDocumentsForCase(caseId: string) {
  const user = await requireAuth()

  const c = await prisma.case.findUnique({ where: { id: caseId }, select: { userId: true, organizationId: true } })
  if (!c) return []

  const ownCase = c.userId === user.id
  const dbUser  = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, organizationId: true } })
  const corpAdmin = dbUser?.role === 'corporate_admin' && dbUser.organizationId === c.organizationId

  if (!ownCase && !corpAdmin) return []

  return prisma.document.findMany({
    where: { caseId },
    orderBy: { uploadedAt: 'desc' },
  })
}

// ─────────────────────────────────────────────────────────────
// deleteDocument()
// ─────────────────────────────────────────────────────────────
export async function deleteDocument(docId: string) {
  const user = await requireAuth()
  const doc  = await requireDocumentAccess(docId, user.id)

  await prisma.document.delete({ where: { id: docId } })

  // Unlink checklist item
  if (doc.checklistItemId) {
    await prisma.checklistItem.update({
      where: { id: doc.checklistItemId },
      data:  { documentId: null, completed: false },
    }).catch(() => {})
  }

  revalidatePath(`/case/${doc.caseId}/documents`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// updateVerificationStatus()
// ─────────────────────────────────────────────────────────────
export async function updateVerificationStatus(
  docId: string,
  status: 'pending' | 'verified' | 'flagged' | 'expired'
) {
  const user = await requireAuth()
  const doc  = await requireDocumentAccess(docId, user.id)

  await prisma.document.update({
    where: { id: docId },
    data: {
      verificationStatus: status,
      verifiedAt: status === 'verified' ? new Date() : null,
      updatedAt:  new Date(),
    },
  })

  // Auto-complete linked checklist item on manual verify
  if (status === 'verified' && doc.checklistItemId) {
    await prisma.checklistItem.update({
      where: { id: doc.checklistItemId },
      data:  { completed: true },
    }).catch(() => {})
  }

  revalidatePath(`/case/${doc.caseId}/documents`)
  revalidatePath(`/case/${doc.caseId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// linkDocumentToChecklist()
// ─────────────────────────────────────────────────────────────
export async function linkDocumentToChecklist(docId: string, checklistItemId: string) {
  const user = await requireAuth()
  const doc  = await requireDocumentAccess(docId, user.id)

  await prisma.document.update({ where: { id: docId }, data: { checklistItemId } })
  await prisma.checklistItem.update({ where: { id: checklistItemId }, data: { documentId: docId } })

  revalidatePath(`/case/${doc.caseId}/documents`)
  return { success: true }
}
