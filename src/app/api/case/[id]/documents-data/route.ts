import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function hasAccess(caseId: string, userId: string): Promise<boolean> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: { userId: true, organizationId: true },
  })
  if (!c) return false
  if (c.userId === userId) return true

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true },
  })
  return !!(
    user?.role === 'corporate_admin' &&
    user.organizationId &&
    user.organizationId === c.organizationId
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await hasAccess(params.id, session.user.id)
    if (!allowed) {
      return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 })
    }

    const caseData = await prisma.case.findUnique({
      where: { id: params.id },
      select: {
        id:            true,
        applicantName: true,
        visaCategory:  true,
        caseType:      true,
        currentStage:  true,
        status:        true,
        checklistItems: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id:         true,
            itemLabel:  true,
            category:   true,
            formCode:   true,
            required:   true,
            completed:  true,
            documentId: true,
            sortOrder:  true,
          },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
          select: {
            id:                 true,
            caseId:             true,
            userId:             true,
            checklistItemId:    true,
            documentType:       true,
            originalName:       true,
            mimeType:           true,
            fileSizeBytes:      true,
            fileUrl:            true,
            verificationStatus: true,
            verifiedAt:         true,
            expiryDate:         true,
            extractedFields:    true,
            ocrText:            false, // omit large field
            aiSummary:          true,
            completenessScore:  true,
            flags:              true,
            uploadedAt:         true,
          },
        },
      },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json(caseData)
  } catch (err: any) {
    console.error('documents-data error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
