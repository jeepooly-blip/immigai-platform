'use client'

import { useEffect, useState } from 'react'
import { X, Download, ExternalLink, Brain, FileText, AlertTriangle, CheckCircle2, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VerificationBadge } from './VerificationBadge'
import { ExtractedFieldsPanel } from './ExtractedFieldsPanel'
import { Button } from '@/components/ui/button'
import { DOCUMENT_TYPE_LABELS } from '@/types'

interface DocumentPreviewProps {
  doc: {
    id: string; originalName: string; mimeType: string; fileUrl: string
    documentType: string; verificationStatus: string; uploadedAt: Date | string
    extractedFields: string | null; flags: string | null
    completenessScore: number | null; aiSummary: string | null
    expiryDate: Date | string | null
  } | null
  onClose: () => void
}

export function DocumentPreview({ doc, onClose }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (!doc) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doc, onClose])

  if (!doc) return null

  const isImage = doc.mimeType.startsWith('image/')
  const isPdf   = doc.mimeType === 'application/pdf'
  const flagList: string[] = doc.flags ? JSON.parse(doc.flags) : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{doc.originalName}</p>
              <p className="text-slate-500 text-[10px]">
                {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                {' · '}
                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(doc.uploadedAt))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <VerificationBadge status={doc.verificationStatus} size="md" />
            <a href={doc.fileUrl} download={doc.originalName}>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
            </a>
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-4 h-4" /></Button>
            </a>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Document viewer */}
          <div className="flex-1 overflow-auto bg-[#0d1117] flex items-center justify-center relative min-w-0">
            {isImage ? (
              <div className="relative p-4">
                <img
                  src={doc.fileUrl}
                  alt={doc.originalName}
                  className="max-w-full rounded-lg shadow-xl transition-transform duration-200 select-none"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center', maxHeight: 'calc(80vh - 120px)' }}
                />
                {/* Zoom controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#161d2e]/90 backdrop-blur rounded-xl p-1.5 border border-white/[0.08]">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(1)}>
                    <span className="text-[10px]">1:1</span>
                  </Button>
                </div>
              </div>
            ) : isPdf ? (
              <iframe
                src={`${doc.fileUrl}#view=FitH`}
                className="w-full h-full border-0"
                title={doc.originalName}
              />
            ) : (
              <div className="text-center p-12">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Preview not available for this file type.</p>
                <a href={doc.fileUrl} download={doc.originalName} className="mt-3 inline-block">
                  <Button variant="secondary" size="sm"><Download className="w-4 h-4" /> Download to view</Button>
                </a>
              </div>
            )}
          </div>

          {/* Right panel: AI results */}
          <div className="w-72 flex-shrink-0 border-l border-white/[0.06] overflow-y-auto">
            <div className="p-4 space-y-5">
              {/* Verification status */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  AI Verification
                </h3>
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border',
                  doc.verificationStatus === 'verified' ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
                  : doc.verificationStatus === 'flagged' ? 'border-rose-500/20 bg-rose-500/[0.05]'
                  : 'border-white/[0.06] bg-white/[0.02]'
                )}>
                  {doc.verificationStatus === 'verified'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    : doc.verificationStatus === 'flagged'
                    ? <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    : <Brain className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  }
                  <span className={cn(
                    'text-sm font-medium',
                    doc.verificationStatus === 'verified' ? 'text-emerald-400'
                    : doc.verificationStatus === 'flagged' ? 'text-rose-400'
                    : 'text-amber-400'
                  )}>
                    {doc.verificationStatus === 'verified' ? 'Document Verified'
                     : doc.verificationStatus === 'flagged' ? 'Issues Found'
                     : 'Pending Review'}
                  </span>
                </div>
              </div>

              {/* Expiry */}
              {doc.expiryDate && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Expiry Date</h3>
                  <p className={cn(
                    'text-sm font-medium',
                    new Date(doc.expiryDate) < new Date() ? 'text-rose-400' : 'text-amber-400'
                  )}>
                    {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(doc.expiryDate))}
                    {new Date(doc.expiryDate) < new Date() && ' (Expired)'}
                  </p>
                </div>
              )}

              {/* Extracted fields + flags */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <Brain className="w-3 h-3 inline mr-1" />AI Analysis
                </h3>
                <ExtractedFieldsPanel
                  extractedFields={doc.extractedFields}
                  flags={doc.flags}
                  completeness={doc.completenessScore}
                  aiSummary={doc.aiSummary}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
