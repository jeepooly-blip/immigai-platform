'use client'

import { useState, useTransition } from 'react'
import {
  FileText, Image, Trash2, ExternalLink, Brain, Eye,
  MoreHorizontal, RefreshCw, CheckCircle2, Link
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VerificationBadge } from './VerificationBadge'
import { ExtractedFieldsPanel } from './ExtractedFieldsPanel'
import { Button } from '@/components/ui/button'
import { deleteDocument, updateVerificationStatus } from '@/lib/actions/documents'
import { DOCUMENT_TYPE_LABELS } from '@/types'

interface DocumentCardProps {
  doc: {
    id: string; caseId: string; documentType: string; originalName: string
    mimeType: string; fileSizeBytes: number; fileUrl: string
    verificationStatus: string; uploadedAt: Date | string; expiryDate: Date | string | null
    extractedFields: string | null; flags: string | null
    completenessScore: number | null; aiSummary: string | null
  }
  onPreview?: (docId: string) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const isImage = mimeType.startsWith('image/')
  const Icon    = isImage ? Image : FileText
  return <Icon className={cn('flex-shrink-0', className)} />
}

export function DocumentCard({ doc, onPreview }: DocumentCardProps) {
  const [expanded, setExpanded]     = useState(false)
  const [reviewing, setReviewing]   = useState(false)
  const [isPending, startTransition] = useTransition()

  const flagList: string[]   = doc.flags ? JSON.parse(doc.flags) : []
  const hasReview            = doc.completenessScore !== null
  const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()

  function handleDelete() {
    if (!confirm(`Delete "${doc.originalName}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteDocument(doc.id)
    })
  }

  function handleManualVerify(status: 'verified' | 'flagged' | 'expired') {
    startTransition(async () => {
      await updateVerificationStatus(doc.id, status)
    })
  }

  return (
    <div className={cn(
      'card border transition-all duration-200',
      doc.verificationStatus === 'flagged' && 'border-rose-500/25',
      doc.verificationStatus === 'verified' && 'border-emerald-500/15',
      isPending && 'opacity-60 pointer-events-none'
    )}>
      {/* Card header */}
      <div className="p-4 flex items-start gap-3">
        {/* File type icon */}
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          doc.mimeType.startsWith('image/') ? 'bg-violet-500/10' : 'bg-brand-500/10'
        )}>
          <FileIcon mimeType={doc.mimeType} className={cn(
            'w-5 h-5',
            doc.mimeType.startsWith('image/') ? 'text-violet-400' : 'text-brand-400'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight" title={doc.originalName}>
                {doc.originalName}
              </p>
              <p className="text-slate-500 text-[10px] mt-0.5">
                {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType.replace(/_/g,' ')}
                {' · '}{formatBytes(doc.fileSizeBytes)}
                {' · '}{new Intl.DateTimeFormat('en-US',{ month:'short', day:'numeric' }).format(new Date(doc.uploadedAt))}
              </p>
            </div>
            <VerificationBadge status={isExpired ? 'expired' : doc.verificationStatus} />
          </div>

          {/* Expiry warning */}
          {isExpired && (
            <p className="text-rose-400 text-[10px] mt-1">
              ⚠ Expired {new Intl.DateTimeFormat('en-US',{ month:'short', day:'numeric', year:'numeric' }).format(new Date(doc.expiryDate!))}
            </p>
          )}
          {doc.expiryDate && !isExpired && (
            <p className="text-amber-400/70 text-[10px] mt-1">
              Expires {new Intl.DateTimeFormat('en-US',{ month:'short', day:'numeric', year:'numeric' }).format(new Date(doc.expiryDate))}
            </p>
          )}

          {/* Flag preview */}
          {flagList.length > 0 && (
            <p className="text-rose-400 text-[10px] mt-1 truncate">⚑ {flagList[0]}{flagList.length > 1 && ` +${flagList.length-1} more`}</p>
          )}
        </div>
      </div>

      {/* Actions bar */}
      <div className="px-4 pb-3 flex items-center gap-1.5 border-t border-white/[0.04] pt-3">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-slate-400 hover:text-white"
          onClick={() => onPreview?.(doc.id)}>
          <Eye className="w-3.5 h-3.5" /> Preview
        </Button>

        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-slate-400 hover:text-white"
          onClick={() => setExpanded(!expanded)}>
          <Brain className="w-3.5 h-3.5" />
          {hasReview ? 'AI Results' : 'Review'}
          <span className={cn(
            'ml-0.5 transition-transform text-[10px]',
            expanded && 'rotate-180'
          )}>▾</span>
        </Button>

        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-slate-400 hover:text-white">
            <ExternalLink className="w-3.5 h-3.5" /> Open
          </Button>
        </a>

        <div className="ml-auto flex items-center gap-1">
          {doc.verificationStatus !== 'verified' && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => handleManualVerify('verified')}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Verify
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10"
            onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded AI results */}
      {expanded && (
        <div className="border-t border-white/[0.06] p-4 bg-white/[0.01]">
          <ExtractedFieldsPanel
            extractedFields={doc.extractedFields}
            flags={doc.flags}
            completeness={doc.completenessScore}
            aiSummary={doc.aiSummary}
          />
        </div>
      )}
    </div>
  )
}
