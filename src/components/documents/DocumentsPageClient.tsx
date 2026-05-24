'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Circle, AlertCircle, FileText, Clock,
  Filter, Brain, ChevronRight, Sparkles, Shield, Upload,
  Search, SlidersHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UploadZone } from './UploadZone'
import { DocumentCard } from './DocumentCard'
import { DocumentPreview } from './DocumentPreview'
import { VerificationBadge } from './VerificationBadge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { DOCUMENT_TYPE_LABELS, VERIFICATION_STATUS_CONFIG } from '@/types'
import { toggleChecklistItem } from '@/lib/actions/cases'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChecklistItemData {
  id: string
  itemLabel: string
  category: string
  formCode: string | null
  required: boolean
  completed: boolean
  documentId: string | null
  sortOrder: number
}

interface DocumentData {
  id: string
  caseId: string
  userId: string
  checklistItemId: string | null
  documentType: string
  originalName: string
  mimeType: string
  fileSizeBytes: number
  fileUrl: string
  verificationStatus: string
  verifiedAt: string | null
  expiryDate: string | null
  extractedFields: string | null
  ocrText: string | null
  aiSummary: string | null
  completenessScore: number | null
  flags: string | null
  uploadedAt: string
  updatedAt: string
}

interface DocumentsPageClientProps {
  caseId:          string
  initialDocuments: DocumentData[]
  checklistItems:  ChecklistItemData[]
  applicantName:   string
  visaCategory:    string
}

// ── Status filter options ──────────────────────────────────────────────────────

const STATUS_FILTERS = ['all', 'pending', 'verified', 'flagged', 'expired'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

// ── Checklist section component ───────────────────────────────────────────────

function ChecklistSection({
  items,
  documents,
  onItemClick,
  activeChecklistId,
}: {
  items:             ChecklistItemData[]
  documents:         DocumentData[]
  onItemClick:       (item: ChecklistItemData) => void
  activeChecklistId: string | null
}) {
  const [isPending, startTransition] = useTransition()

  const groups = [
    { key: 'form',     label: '📄 Forms & Applications' },
    { key: 'document', label: '🗂️ Supporting Documents'  },
    { key: 'action',   label: '✅ Required Actions'       },
    { key: 'fee',      label: '💳 Filing Fees'            },
  ].filter(g => items.some(i => i.category === g.key))

  function getLinkedDoc(item: ChecklistItemData): DocumentData | undefined {
    if (item.documentId) return documents.find(d => d.id === item.documentId)
    return documents.find(d => d.checklistItemId === item.id)
  }

  function handleToggle(item: ChecklistItemData) {
    startTransition(async () => {
      await toggleChecklistItem(item.id, !item.completed)
    })
  }

  const total    = items.length
  const done     = items.filter(i => i.completed).length
  const pct      = total === 0 ? 0 : Math.round((done / total) * 100)
  const required = items.filter(i => i.required)
  const reqDone  = required.filter(i => i.completed).length

  return (
    <div className="space-y-5">
      {/* Progress summary */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Checklist Progress</span>
          <span className={cn(
            'text-sm font-bold',
            pct === 100 ? 'text-emerald-400' : pct >= 60 ? 'text-brand-400' : 'text-amber-400'
          )}>{pct}%</span>
        </div>
        <Progress
          value={pct}
          className="h-2 mb-3"
          indicatorClassName={pct === 100 ? 'bg-emerald-500' : 'bg-brand-500'}
        />
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{done}/{total} completed</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{reqDone}/{required.length} required done</span>
          </div>
        </div>
      </div>

      {/* Groups */}
      {groups.map(group => {
        const groupItems = items
          .filter(i => i.category === group.key)
          .sort((a, b) => a.sortOrder - b.sortOrder)

        return (
          <div key={group.key}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
              {group.label}
            </h3>
            <div className="space-y-1.5">
              {groupItems.map(item => {
                const linked     = getLinkedDoc(item)
                const isActive   = activeChecklistId === item.id
                const hasDoc     = !!linked
                const isExpired  = linked?.expiryDate && new Date(linked.expiryDate) < new Date()
                const isFlagged  = linked?.verificationStatus === 'flagged'

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 group',
                      isActive
                        ? 'border-brand-500/40 bg-brand-500/10'
                        : 'border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03]',
                      isFlagged && 'border-amber-500/25',
                      isPending && 'opacity-60 pointer-events-none'
                    )}
                    onClick={() => onItemClick(item)}
                  >
                    {/* Checkbox */}
                    <button
                      className="flex-shrink-0 mt-0.5"
                      onClick={e => { e.stopPropagation(); handleToggle(item) }}
                    >
                      {item.completed
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <Circle className={cn(
                            'w-4 h-4 transition-colors',
                            hasDoc ? 'text-brand-400' : 'text-slate-700 group-hover:text-slate-500'
                          )} />
                      }
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={cn(
                            'text-sm leading-snug',
                            item.completed ? 'text-slate-500 line-through' : 'text-slate-300'
                          )}>
                            {item.formCode && (
                              <span className="text-[10px] font-mono text-brand-400 mr-1.5 bg-brand-500/10 px-1.5 py-0.5 rounded">
                                {item.formCode}
                              </span>
                            )}
                            {item.itemLabel}
                          </p>
                          {item.required && !item.completed && (
                            <span className="text-[10px] text-amber-500/70">Required</span>
                          )}
                        </div>

                        {/* Document status indicator */}
                        {linked && (
                          <div className="flex-shrink-0">
                            <VerificationBadge status={isExpired ? 'expired' : linked.verificationStatus} size="sm" />
                          </div>
                        )}
                      </div>

                      {/* Linked document name */}
                      {linked && (
                        <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1 truncate">
                          <FileText className="w-2.5 h-2.5 flex-shrink-0" />
                          {linked.originalName}
                        </p>
                      )}

                      {/* Upload prompt */}
                      {!linked && !item.completed && ['document', 'form'].includes(item.category) && (
                        <p className="text-[10px] text-brand-500/60 mt-1 flex items-center gap-1">
                          <Upload className="w-2.5 h-2.5" />
                          Click to upload document
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function DocumentStats({ documents }: { documents: DocumentData[] }) {
  const byStatus = {
    verified: documents.filter(d => d.verificationStatus === 'verified').length,
    flagged:  documents.filter(d => d.verificationStatus === 'flagged').length,
    pending:  documents.filter(d => d.verificationStatus === 'pending').length,
    expired:  documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length,
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { key: 'verified', label: 'Verified',  value: byStatus.verified, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { key: 'pending',  label: 'Pending',   value: byStatus.pending,  color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
        { key: 'flagged',  label: 'Flagged',   value: byStatus.flagged,  color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
        { key: 'expired',  label: 'Expired',   value: byStatus.expired,  color: 'text-slate-400',   bg: 'bg-slate-500/10'   },
      ].map(s => (
        <div key={s.key} className={cn('card p-3 text-center', s.bg, 'border-0')}>
          <div className={cn('font-display font-bold text-xl', s.color)}>{s.value}</div>
          <div className="text-slate-500 text-[10px] mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DocumentsPageClient({
  caseId,
  initialDocuments,
  checklistItems,
  applicantName,
  visaCategory,
}: DocumentsPageClientProps) {
  const router  = useRouter()
  const [docs, setDocs]                     = useState<DocumentData[]>(initialDocuments)
  const [previewDocId, setPreviewDocId]     = useState<string | null>(null)
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery]       = useState('')
  const [uploadTab, setUploadTab]           = useState<'upload' | 'manage'>('upload')

  const previewDoc = previewDocId ? docs.find(d => d.id === previewDocId) ?? null : null

  // Filter documents
  const filteredDocs = docs.filter(doc => {
    const matchStatus = statusFilter === 'all' || doc.verificationStatus === statusFilter
    const matchSearch = !searchQuery ||
      doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType).toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchSearch
  })

  // Checklist item click → scroll to upload panel and set default link
  function handleChecklistClick(item: ChecklistItemData) {
    setActiveChecklistId(item.id)
    setUploadTab('upload')
  }

  // Stats
  const verifiedCount = docs.filter(d => d.verificationStatus === 'verified').length
  const flaggedCount  = docs.filter(d => d.verificationStatus === 'flagged').length
  const pendingCount  = docs.filter(d => d.verificationStatus === 'pending').length

  return (
    <>
      {/* Preview modal */}
      {previewDoc && (
        <DocumentPreview
          doc={previewDoc}
          onClose={() => setPreviewDocId(null)}
        />
      )}

      {/* Stats row */}
      <DocumentStats documents={docs} />
      <div className="mt-5" />

      {/* AI banner — shown if there are flagged docs */}
      {flaggedCount > 0 && (
        <div className="card border-amber-500/25 bg-amber-500/[0.03] p-4 mb-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-400 text-sm font-semibold">
              {flaggedCount} document{flaggedCount > 1 ? 's' : ''} flagged by AI
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              Review the flagged items — possible name mismatches or expiry issues detected.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setStatusFilter('flagged')}>
            View Flagged
          </Button>
        </div>
      )}

      {/* Main split layout */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── LEFT: Checklist panel (2 cols) ───────────────────── */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-400" />
                  <CardTitle>Document Checklist</CardTitle>
                </div>
                <CardDescription>
                  Click an item to link a document. Check to mark complete.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[calc(100vh-220px)]">
                <ChecklistSection
                  items={checklistItems}
                  documents={docs}
                  onItemClick={handleChecklistClick}
                  activeChecklistId={activeChecklistId}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── RIGHT: Upload + document list (3 cols) ────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Upload / Manage tabs */}
          <Card>
            <CardContent className="pt-0 px-0">
              <Tabs value={uploadTab} onValueChange={v => setUploadTab(v as 'upload' | 'manage')}>
                <div className="px-5 pt-4">
                  <TabsList>
                    <TabsTrigger value="upload">
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Upload Documents
                    </TabsTrigger>
                    <TabsTrigger value="manage">
                      <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                      Manage ({docs.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="upload" className="px-5 pb-5">
                  {/* Context banner if a checklist item is active */}
                  {activeChecklistId && (() => {
                    const item = checklistItems.find(i => i.id === activeChecklistId)
                    return item ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/[0.06] border border-brand-500/20 mb-4">
                        <ChevronRight className="w-4 h-4 text-brand-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-brand-400 text-xs font-medium">
                            Uploading for: {item.formCode ? `${item.formCode} — ` : ''}{item.itemLabel}
                          </p>
                          <p className="text-slate-600 text-[10px]">Document will be auto-linked to this checklist item</p>
                        </div>
                        <button
                          onClick={() => setActiveChecklistId(null)}
                          className="text-slate-600 hover:text-slate-400 text-[10px] flex-shrink-0"
                        >
                          Clear
                        </button>
                      </div>
                    ) : null
                  })()}

                  <UploadZone
                    caseId={caseId}
                    checklistItems={checklistItems}
                    onUploadComplete={() => {
                      router.refresh()
                      setUploadTab('manage')
                    }}
                  />

                  {/* Security note */}
                  <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-600">
                    <Shield className="w-3 h-3 flex-shrink-0 mt-0.5 text-emerald-500/60" />
                    <p>Files are stored securely. Access is restricted to authorized users only. All uploads are logged.</p>
                  </div>
                </TabsContent>

                <TabsContent value="manage" className="pb-2">
                  {/* Search + filter bar */}
                  <div className="px-5 mb-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        type="text"
                        placeholder="Search documents…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/40 transition-colors"
                      />
                    </div>

                    {/* Status filter pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <Filter className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      {STATUS_FILTERS.map(f => (
                        <button
                          key={f}
                          onClick={() => setStatusFilter(f)}
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                            statusFilter === f
                              ? 'bg-brand-600 text-white'
                              : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                          )}
                        >
                          {f === 'all' ? `All (${docs.length})` : (
                            VERIFICATION_STATUS_CONFIG[f]?.label ?? f
                          ) + (
                            f === 'pending'  ? ` (${pendingCount})` :
                            f === 'verified' ? ` (${verifiedCount})` :
                            f === 'flagged'  ? ` (${flaggedCount})` : ''
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document cards */}
                  <div className="px-5 pb-5 space-y-3">
                    {filteredDocs.length === 0 ? (
                      <div className="py-12 text-center">
                        <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-white text-sm font-medium mb-1">
                          {docs.length === 0 ? 'No documents yet' : 'No documents match this filter'}
                        </p>
                        <p className="text-slate-500 text-xs mb-4">
                          {docs.length === 0
                            ? 'Upload documents using the Upload tab above'
                            : 'Try a different filter or search term'}
                        </p>
                        {docs.length === 0 && (
                          <Button size="sm" onClick={() => setUploadTab('upload')}>
                            <Upload className="w-4 h-4" /> Upload First Document
                          </Button>
                        )}
                      </div>
                    ) : (
                      filteredDocs.map(doc => (
                        <DocumentCard
                          key={doc.id}
                          doc={doc}
                          onPreview={id => setPreviewDocId(id)}
                        />
                      ))
                    )}
                  </div>

                  {/* AI summary footer */}
                  {docs.length > 0 && (
                    <div className="px-5 pb-4 pt-2 border-t border-white/[0.05] flex items-center gap-2 text-xs text-slate-600">
                      <Brain className="w-3.5 h-3.5 text-brand-500" />
                      {verifiedCount} verified · {pendingCount} pending AI review · {flaggedCount} flagged
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* AI Review info card */}
          <Card className="border-brand-500/20 bg-brand-500/[0.03]">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium mb-1">AI Document Review Active</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Every uploaded document runs through OCR + AI analysis. Fields like name, date of birth,
                    document number, and expiry date are automatically extracted and cross-checked against
                    case data. Inconsistencies are flagged for attorney review.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-500">
                    {['OCR Text Extraction', 'Field Classification', 'Name Verification', 'Expiry Detection', 'Completeness Scoring'].map(f => (
                      <span key={f} className="flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-brand-500/60" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
