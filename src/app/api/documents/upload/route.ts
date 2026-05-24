import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireCaseAccess(caseId: string, userId: string) {
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
  if (user?.role === 'corporate_admin' && user.organizationId === c.organizationId) return true
  return false
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData        = await req.formData()
    const file            = formData.get('file') as File | null
    const caseId          = formData.get('caseId') as string
    const documentType    = (formData.get('documentType') as string) || 'other'
    const checklistItemId = formData.get('checklistItemId') as string | null

    if (!file || !caseId) {
      return NextResponse.json({ error: 'File and caseId are required' }, { status: 400 })
    }

    const hasAccess = await requireCaseAccess(caseId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized to upload to this case' }, { status: 403 })
    }

    const MAX_BYTES = 10 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large. Max size is 10 MB.' }, { status: 400 })
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'application/pdf']
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Upload JPG, PNG, WEBP, TIFF, or PDF.' },
        { status: 400 }
      )
    }

    const documentId = uuidv4()
    const ext        = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg')
    const storedName = `immigai-docs/${documentId}${ext}`

    // Upload to Vercel Blob (persistent, production-grade storage)
    const blob = await put(storedName, file, {
      access: 'public',
      contentType: file.type,
    })

    const doc = await prisma.document.create({
      data: {
        id:                 documentId,
        caseId,
        userId:             session.user.id,
        checklistItemId:    checklistItemId || null,
        documentType,
        originalName:       file.name,
        mimeType:           file.type,
        fileSizeBytes:      file.size,
        fileUrl:            blob.url,
        verificationStatus: 'pending',
      },
    })

    if (checklistItemId) {
      await prisma.checklistItem.update({
        where: { id: checklistItemId },
        data:  { documentId },
      }).catch(() => {})
    }

    await prisma.timelineEvent.create({
      data: {
        caseId,
        eventType:        'document',
        title:            'Document Uploaded',
        description:      `${file.name} uploaded (${documentType.replace('_', ' ')}). AI review in progress.`,
        eventDate:        new Date(),
        isAutomated:      false,
        notificationSent: false,
      },
    })

    return NextResponse.json({ success: true, document: doc })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
