import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { del } from '@vercel/blob'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireDocumentAccess(docId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { case: { select: { userId: true, organizationId: true } } },
  })
  if (!doc) return null
  if (doc.userId === userId) return doc
  if (doc.case.userId === userId) return doc
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true },
  })
  if (user?.role === 'corporate_admin' && user.organizationId === doc.case.organizationId) return doc
  return null
}

// GET: redirect to the Vercel Blob public URL (no proxying needed)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const doc = await requireDocumentAccess(params.id, session.user.id)
    if (!doc) {
      return new NextResponse('Not found or access denied', { status: 404 })
    }

    // Files are now stored in Vercel Blob — redirect directly to the blob URL
    if (!doc.fileUrl) {
      return new NextResponse('File URL missing', { status: 404 })
    }

    return NextResponse.redirect(doc.fileUrl)
  } catch (err: any) {
    console.error('File serve error:', err)
    return new NextResponse('Server error', { status: 500 })
  }
}

// DELETE: remove from Vercel Blob + database
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doc = await requireDocumentAccess(params.id, session.user.id)
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete from Vercel Blob (best-effort)
    if (doc.fileUrl) {
      await del(doc.fileUrl).catch(() => {})
    }

    // Delete DB record
    await prisma.document.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
