'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, Circle, AlertCircle, FileText,
  Upload, Brain, Shield, Clock, AlertTriangle, Filter,
  BarChart3, RefreshCw, ExternalLink, ChevronRight, X,
  CheckSquare, FileCheck, Sparkles, Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UploadZone } from '@/components/documents/UploadZone'
import { DocumentCard } from '@/components/documents/DocumentCard'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import { VerificationBadge } from '@/components/documents/VerificationBadge'
import {
  DOCUMENT_TYPE_LABELS,
  VERIFICATION_STATUS_CONFIG,
  CASE_TYPE_COLORS,
  CASE_TYPE_ICONS
} from '@/types'

// ── Types ─────────────────────────────────────────────────────
interface ChecklistItem {
  id: string; itemLabel: string; category: string; formCode: string | null
  required: boolean; completed: boolean; documentId: string | null; sortOrder: number
}

interface Document {
  id: string; caseId: string; userId: string; checklistItemId: string | null
  documentType: string; originalName: string; mimeType: string; fileSizeBytes: number
  fileUrl: string; verificationStatus: string; verifiedAt: Date | null
  expiryDate: Date | null; extractedFields: string | null; ocrText: string | null
  aiSummary: string | null; completenessScore: number | null; flags: string | null
  uploadedAt: Date
}

interface CaseData {
  id: string; applicantName: string; visaCategory: string; caseType: string
  currentStage: string; status: string
  checklistItems: ChecklistItem[]
  documents: Document[]
}

// ── Stats card ────────────────────────────────────────────────
function StatsCard({
  icon: Icon, label, value, sub, color, bg,
}: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; bg: string }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div>
        <div className={cn('font-display font-bold text-2xl leading-none', color)}>{value}</div>
        <div className="text-slate-500 text-xs mt-0.5">{label}</div>
        {sub && <div className="text-slate-700 text-[10px]">{sub}</div>}
      </div>
    </div>
  )
}

// ── Checklist panel (left) ────────────────────────────────────
function ChecklistPanel({
  items, documents, onSelectItem, selectedItem,
}: {
  items: ChecklistItem[]
  documents: Document[]
  onSelectItem: (id: string) => void
  selectedItem: string
}) {
  const docItems    = items.filter(i => ['document', 'form'].includes(i.category))
  const actionItems = items.filter(i => i.category === 'action')
  const feeItems    = items.filter(i => i.category === 'fee')

  function CheckRow({ item }: { item: ChecklistItem }) {
    const linked = documents.find(d => d.checklistItemId === item.id || d.id === item.documentId)
    const isSelected = selectedItem === item.id

    return (
      <button
        onClick={() => onSelectItem(item.id)}
        className={cn(
          'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-150 group',
          isSelected
            ? 'bg-brand-500/10 border border-brand-500/25'
            : 'hover:bg-white/[0.04] border border-transparent'
        )}
      >
        <div className="flex-shrink-0 mt-0.5">
          {item.completed
            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            : item.required
            ? <AlertCircle className="w-3.5 h-3.5 text-amber-500/70" />
            : <Circle className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <span className={cn(
              'text-xs leading-tight',
              item.completed ? 'text-slate-500 line-through' : 'text-slate-300'
            )}>
              {item.itemLabel}
            </span>
            {item.required && !item.completed && (
              <span className="text-[9px] text-amber-500/70 flex-shrink-0 font-medium">REQ</span>
            )}
          </div>
          {item.formCode && (
            <span className="text-[10px] font-mono text-brand-500/70 mt-0.5 block">{item.formCode}</span>
          )}
          {linked && (
            <div className="flex items-center gap-1 mt-1.5">
              <VerificationBadge status={linked.verificationStatus} size="sm" />
            </div>
          )}
        </div>
        <ChevronRight className={cn(
          'w-3.5 h-3.5 flex-shrink-0 mt-0.5 transition-colors',
          isSelected ? 'text-brand-400' : 'text-slate-700 group-hover:text-slate-500'
        )} />
      </button>
    )
  }

  function Section({ title, items: sectionItems }: { title: string; items: ChecklistItem[] }) {
    if (sectionItems.length === 0) return null
    const done = sectionItems.filter(i => i.completed).length
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{title}</span>
          <span className="text-[10px] text-slate-600">{done}/{sectionItems.length}</span>
        </div>
        <div className="space-y-0.5">
          {sectionItems.map(item => <CheckRow key={item.id} item={item} />)}
        </div>
      </div>
    )
  }

  const totalRequired   = items.filter(i => i.required).length
  const doneRequired    = items.filter(i => i.required && i.completed).length
  const pct             = totalRequired === 0 ? 0 : Math.round((doneRequired / totalRequired) * 100)

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-medium">Required items</span>
          <span className={cn('font-bold', pct === 100 ? 'text-emerald-400' : 'text-brand-400')}>{pct}%</span>
        </div>
        <Progress
          value={pct}
          indicatorClassName={pct === 100 ? 'bg-emerald-500' : 'bg-brand-500'}
          className="h-2 mb-1"
        />
        <p className="text-slate-600 text-[10px]">{doneRequired} of {totalRequired} required · {items.filter(i => i.completed).length} of {items.length} total</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3">
        <Section title="📄 Forms" items={docItems.filter(i => i.category === 'form')} />
        <Section title="🗂 Documents" items={docItems.filter(i => i.category === 'document')} />
        <Section title="✅ Actions" items={actionItems} />
        <Section title="💳 Fees" items={feeItems} />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function DocumentsPage({ params }: { params: { id: string } }) {
  const router                  = useRouter()
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [selectedItem, setSelectedItem] = useState('')
  const [previewDoc, setPreviewDoc]     = useState<Document | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isPending, startTransition]    = useTransition()

  async function loadData() {
    try {
      const res = await fetch(`/api/case/${params.id}/documents-data`)
      if (!res.ok) throw new Error('Failed to load case')
      const data = await res.json()
      setCaseData(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [params.id])

  if (loading) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="w-5 h-5 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
        Loading document portal…
      </div>
    </div>
  )

  if (error || !caseData) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">{error || 'Case not found'}</p>
        <Link href="/cases"><Button variant="secondary" size="sm">Back to cases</Button></Link>
      </div>
    </div>
  )

  const { checklistItems, documents } = caseData

  // Document stats
  const totalDocs     = documents.length
  const verified      = documents.filter(d => d.verificationStatus === 'verified').length
  const flagged       = documents.filter(d => d.verificationStatus === 'flagged').length
  const pending       = documents.filter(d => d.verificationStatus === 'pending').length

  const selectedChecklist = checklistItems.find(i => i.id === selectedItem)
  const linkedDoc = selectedChecklist
    ? documents.find(d => d.checklistItemId === selectedChecklist.id || d.id === selectedChecklist.documentId)
    : null

  // Filtered documents for right panel
  const filteredDocs = filterStatus === 'all'
    ? documents
    : documents.filter(d => d.verificationStatus === filterStatus)

  const typeColor = CASE_TYPE_COLORS[caseData.caseType] ?? CASE_TYPE_COLORS.employment
  const typeEmoji = CASE_TYPE_ICONS[caseData.caseType] ?? '📁'

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* ── Top nav ─────────────────────────────────────────── */}
      <header className="h-14 border-b border-white/[0.06] flex items-center px-5 gap-4 bg-[#0d1117] flex-shrink-0 sticky top-0 z-30">
        <Link href={`/case/${params.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white text-sm">Document Portal</span>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-slate-400 text-xs truncate">{caseData.applicantName}</span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border capitalize', typeColor)}>
            {typeEmoji} {caseData.caseType}
          </span>
          <Badge variant="purple">{caseData.visaCategory}</Badge>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
            <Lock className="w-3 h-3 text-emerald-500" />
            Encrypted Storage
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadData}>
            <RefreshCw className={cn('w-4 h-4', isPending && 'animate-spin')} />
          </Button>
        </div>
      </header>

      {/* ── Stats row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 border-b border-white/[0.06] bg-white/[0.01]">
        <StatsCard icon={FileText}      label="Total Documents" value={totalDocs}  color="text-brand-400"   bg="bg-brand-500/10"   />
        <StatsCard icon={CheckCircle2}  label="AI Verified"     value={verified}   color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatsCard icon={AlertTriangle} label="Flagged"         value={flagged}    color="text-rose-400"    bg="bg-rose-500/10"    sub={flagged > 0 ? 'Needs review' : undefined} />
        <StatsCard icon={Clock}         label="Pending Review"  value={pending}    color="text-amber-400"   bg="bg-amber-500/10"   />
      </div>

      {/* ── Main split layout ────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 14rem)' }}>

        {/* ── LEFT: Document checklist ─────────────────────── */}
        <aside className="w-80 flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0d1117] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-violet-400" />
              <span className="font-semibold text-white text-sm">Document Checklist</span>
            </div>
            <span className="text-xs text-slate-500">
              {checklistItems.filter(i => i.completed).length}/{checklistItems.length}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChecklistPanel
              items={checklistItems}
              documents={documents}
              onSelectItem={setSelectedItem}
              selectedItem={selectedItem}
            />
          </div>
        </aside>

        {/* ── RIGHT: Upload + Documents ─────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 max-w-4xl">
            <Tabs defaultValue="upload">
              <TabsList>
                <TabsTrigger value="upload">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload Documents
                </TabsTrigger>
                <TabsTrigger value="all">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  All Documents
                  {totalDocs > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[10px] text-slate-400">
                      {totalDocs}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="flagged">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                  Flagged
                  {flagged > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500/20 text-[10px] text-rose-400">
                      {flagged}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <Brain className="w-3.5 h-3.5 mr-1.5" />
                  AI Review
                </TabsTrigger>
              </TabsList>

              {/* ── Upload tab ──────────────────────────────── */}
              <TabsContent value="upload">
                <div className="space-y-5">
                  {/* Context banner for selected checklist item */}
                  {selectedChecklist && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-brand-500/[0.07] border border-brand-500/25">
                      <FileCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">
                          Uploading for: {selectedChecklist.itemLabel}
                        </p>
                        {selectedChecklist.formCode && (
                          <p className="text-brand-400/70 text-xs mt-0.5 font-mono">{selectedChecklist.formCode}</p>
                        )}
                        {linkedDoc && (
                          <p className="text-emerald-400 text-xs mt-0.5">
                            ✓ Document already uploaded — upload again to replace
                          </p>
                        )}
                      </div>
                      <button onClick={() => setSelectedItem('')} className="text-slate-600 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* AI pipeline explanation */}
                  <div className="card p-4 border-brand-500/15">
                    <div className="flex items-start gap-3">
                      <Brain className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-sm font-medium mb-1">Automatic AI Processing Pipeline</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          {[
                            { step: '1', label: 'OCR text extraction (Tesseract)', icon: '🔍' },
                            { step: '2', label: 'Document classification', icon: '🏷' },
                            { step: '3', label: 'Field extraction (name, DOB, etc.)', icon: '📋' },
                            { step: '4', label: 'Completeness scoring', icon: '📊' },
                            { step: '5', label: 'Case data consistency check', icon: '✅' },
                          ].map(s => (
                            <span key={s.step} className="flex items-center gap-1">
                              <span className="text-slate-700 font-mono">{s.step}.</span>
                              <span>{s.icon} {s.label}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <UploadZone
                    caseId={params.id}
                    checklistItems={checklistItems.filter(i => ['document','form'].includes(i.category))}
                    onUploadComplete={loadData}
                  />
                </div>
              </TabsContent>

              {/* ── All Documents tab ────────────────────────── */}
              <TabsContent value="all">
                {/* Filter bar */}
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  {['all', 'pending', 'verified', 'flagged', 'expired'].map(status => {
                    const cfg = status === 'all'
                      ? { label: 'All', color: 'text-white', bg: 'bg-white/[0.07]', border: 'border-white/[0.1]' }
                      : VERIFICATION_STATUS_CONFIG[status]
                    const count = status === 'all' ? totalDocs : documents.filter(d => d.verificationStatus === status).length
                    return (
                      <button key={status}
                        onClick={() => setFilterStatus(status)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                          filterStatus === status
                            ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                            : 'text-slate-500 bg-transparent border-white/[0.06] hover:border-white/[0.12] hover:text-slate-300'
                        )}>
                        {cfg.label}
                        <span className={cn(
                          'px-1.5 py-0.5 rounded-full text-[9px] font-bold',
                          filterStatus === status ? 'bg-white/[0.15]' : 'bg-white/[0.06]'
                        )}>{count}</span>
                      </button>
                    )
                  })}
                </div>

                {filteredDocs.length === 0 ? (
                  <div className="card p-12 text-center">
                    <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">No documents {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'uploaded yet'}</p>
                    <p className="text-slate-500 text-sm">Use the Upload tab to add documents to this case.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {filteredDocs.map(doc => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        onPreview={(id) => setPreviewDoc(documents.find(d => d.id === id) ?? null)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Flagged tab ──────────────────────────────── */}
              <TabsContent value="flagged">
                {flagged === 0 ? (
                  <div className="card p-12 text-center border-emerald-500/15">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">No flagged documents</p>
                    <p className="text-slate-500 text-sm">All reviewed documents have passed AI verification.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/[0.05] border border-rose-500/20">
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-rose-400 text-sm font-medium">{flagged} document{flagged > 1 ? 's' : ''} require attention</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          AI detected potential issues. Review each document and either verify manually or request re-upload.
                        </p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {documents.filter(d => d.verificationStatus === 'flagged').map(doc => (
                        <DocumentCard
                          key={doc.id}
                          doc={doc}
                          onPreview={(id) => setPreviewDoc(documents.find(d => d.id === id) ?? null)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── AI Review tab ────────────────────────────── */}
              <TabsContent value="ai">
                <div className="space-y-5">
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Avg Completeness',    value: totalDocs ? `${Math.round(documents.reduce((s, d) => s + (d.completenessScore ?? 0), 0) / totalDocs)}%` : '—', color: 'text-brand-400' },
                      { label: 'Fields Extracted',    value: documents.filter(d => d.extractedFields && d.extractedFields !== '{}').length, color: 'text-violet-400' },
                      { label: 'Expiring ≤ 90 days',  value: documents.filter(d => d.expiryDate && new Date(d.expiryDate) > new Date() && (new Date(d.expiryDate).getTime() - Date.now()) / 86400000 <= 90).length, color: 'text-amber-400' },
                      { label: 'Expired',             value: documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length, color: 'text-rose-400' },
                    ].map(s => (
                      <div key={s.label} className="card p-4">
                        <div className={cn('font-display font-bold text-2xl', s.color)}>{s.value}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Per-document AI breakdown */}
                  {documents.length === 0 ? (
                    <div className="card p-10 text-center">
                      <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">No documents to review yet.</p>
                    </div>
                  ) : (
                    <div className="card overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                        <Brain className="w-4 h-4 text-brand-400" />
                        <span className="font-semibold text-white text-sm">AI Review Results</span>
                      </div>
                      <div className="divide-y divide-white/[0.04]">
                        {documents.map(doc => {
                          const flags: string[] = doc.flags ? JSON.parse(doc.flags) : []
                          const fields = doc.extractedFields ? JSON.parse(doc.extractedFields) : {}
                          const fieldCount = Object.keys(fields).filter(k => fields[k]).length
                          const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()

                          return (
                            <div key={doc.id} className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                              {/* Status dot */}
                              <div className={cn(
                                'w-2 h-2 rounded-full flex-shrink-0 mt-1.5',
                                isExpired                               ? 'bg-slate-500'
                                : doc.verificationStatus === 'verified' ? 'bg-emerald-400'
                                : doc.verificationStatus === 'flagged'  ? 'bg-rose-400'
                                :                                          'bg-amber-400'
                              )} />

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-white text-sm font-medium truncate">{doc.originalName}</span>
                                  <span className="text-slate-600 text-xs">{DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}</span>
                                </div>

                                {doc.aiSummary && (
                                  <p className="text-slate-500 text-xs mb-2 leading-relaxed">{doc.aiSummary}</p>
                                )}

                                <div className="flex items-center gap-3 flex-wrap">
                                  {/* Completeness */}
                                  {doc.completenessScore !== null && (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-20 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                        <div
                                          className={cn(
                                            'h-full rounded-full',
                                            doc.completenessScore >= 80 ? 'bg-emerald-500' : doc.completenessScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                          )}
                                          style={{ width: `${doc.completenessScore}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-slate-500">{doc.completenessScore}% complete</span>
                                    </div>
                                  )}

                                  {fieldCount > 0 && (
                                    <span className="text-[10px] text-slate-600">
                                      {fieldCount} field{fieldCount > 1 ? 's' : ''} extracted
                                    </span>
                                  )}

                                  {isExpired && (
                                    <span className="text-[10px] text-rose-400 font-medium">
                                      ⚠ Document expired
                                    </span>
                                  )}
                                </div>

                                {/* Flags inline */}
                                {flags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {flags.map((flag, i) => (
                                      <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        ⚑ {flag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <VerificationBadge status={isExpired ? 'expired' : doc.verificationStatus} size="sm" />
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 text-slate-600 hover:text-white"
                                  onClick={() => setPreviewDoc(doc)}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* ── Document Preview Modal ───────────────────────────── */}
      {previewDoc && (
        <DocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}
