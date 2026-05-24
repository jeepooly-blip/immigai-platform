'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { RfeUploader }    from '@/components/rfe/RfeUploader'
import { RfeDraftEditor } from '@/components/rfe/RfeDraftEditor'
import { Button } from '@/components/ui/button'
import { Badge }   from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft, Brain, FileText, Clock, CheckCircle2, AlertTriangle,
  Plus, ChevronRight, Download, ExternalLink, Trash2,
  History, Sparkles, Shield, Scale
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Draft {
  id: string; draftType: string; title: string; content: string
  userEdits: string | null; confidenceScore: number; status: string
  reviewedByUser: boolean; rfeGrounds: string | null; reviewNotes: string | null
  createdAt: string; updatedAt: string
}

interface CaseInfo {
  id: string; applicantName: string; visaCategory: string; caseType: string; status: string
}

const DRAFT_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  rfe_response:     { label: 'RFE Response',       icon: '📋', color: 'text-brand-400' },
  cover_letter:     { label: 'Cover Letter',        icon: '✉️',  color: 'text-violet-400' },
  support_letter:   { label: 'Support Letter',      icon: '🏢', color: 'text-teal-400' },
  personal_statement:{ label: 'Personal Statement', icon: '👤', color: 'text-pink-400' },
}

export default function RfePage() {
  const params    = useParams()
  const router    = useRouter()
  const caseId    = params.id as string

  const [caseInfo, setCaseInfo]         = useState<CaseInfo | null>(null)
  const [drafts, setDrafts]             = useState<Draft[]>([])
  const [activeDraft, setActiveDraft]   = useState<Draft | null>(null)
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [view, setView]                 = useState<'upload' | 'drafts'>('upload')
  const [isPending, startTransition]    = useTransition()

  // Load case info and existing drafts
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [caseRes, draftsRes] = await Promise.all([
          fetch(`/api/case/${caseId}`),
          fetch(`/api/rfe/draft?caseId=${caseId}`),
        ])
        if (caseRes.ok)   { const d = await caseRes.json();   setCaseInfo(d.case) }
        if (draftsRes.ok) {
          const d = await draftsRes.json()
          setDrafts(d.drafts ?? [])
          if (d.drafts?.length > 0) { setActiveDraft(d.drafts[0]); setView('drafts') }
        }
      } finally { setLoading(false) }
    }
    load()
  }, [caseId])

  function handleDraftCreated(draftId: string) {
    // Reload drafts
    fetch(`/api/rfe/draft?caseId=${caseId}`)
      .then(r => r.json())
      .then(d => {
        const newDrafts = d.drafts ?? []
        setDrafts(newDrafts)
        const created = newDrafts.find((dr: Draft) => dr.id === draftId) ?? newDrafts[0]
        if (created) { setActiveDraft(created); setView('drafts') }
      })
  }

  async function handleSaveDraft(content: string, notes: string) {
    if (!activeDraft) return
    setSaving(true)
    try {
      const res = await fetch(`/api/rfe/${activeDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEdits: content, reviewNotes: notes, reviewedByUser: true, status: 'reviewed' }),
      })
      if (res.ok) {
        const { draft } = await res.json()
        setActiveDraft(draft)
        setDrafts(prev => prev.map(d => d.id === draft.id ? draft : d))
      }
    } finally { setSaving(false) }
  }

  async function handleDeleteDraft(draftId: string) {
    if (!confirm('Delete this draft? This cannot be undone.')) return
    // In a real app we'd have a DELETE endpoint
    setDrafts(prev => prev.filter(d => d.id !== draftId))
    if (activeDraft?.id === draftId) {
      const remaining = drafts.filter(d => d.id !== draftId)
      setActiveDraft(remaining[0] ?? null)
      if (remaining.length === 0) setView('upload')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
            <p className="text-slate-500 text-sm">Loading RFE system…</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1300px] mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-start gap-3">
            <Link href={`/case/${caseId}`}>
              <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h1 className="font-display font-bold text-2xl text-white">RFE Response Generator</h1>
              </div>
              <p className="text-slate-500 text-sm">
                {caseInfo?.applicantName} · {caseInfo?.visaCategory} ·{' '}
                {drafts.length} draft{drafts.length !== 1 ? 's' : ''} generated
              </p>
            </div>
          </div>
          <Button onClick={() => setView('upload')} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> New Draft
          </Button>
        </div>

        {/* ── Legal banner ────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 mb-6">
          <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-300 text-sm font-semibold mb-0.5">Attorney Review Required Before Submission</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              All AI-generated drafts are starting points for attorney review and editing.
              Legal citations, exhibit references, dates, names, and arguments must be verified by a licensed immigration attorney.
              Never submit an unreviewed AI draft to USCIS. Doing so may result in denial or other adverse consequences.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">

          {/* ── Left: drafts list ────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="card p-3 sticky top-6 space-y-2">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold px-1 pb-1">Drafts</p>

              {/* Upload new */}
              <button
                onClick={() => setView('upload')}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border',
                  view === 'upload' && !activeDraft
                    ? 'bg-brand-600/15 text-brand-400 border-brand-500/20'
                    : 'border-dashed border-white/[0.1] text-slate-600 hover:text-slate-300 hover:border-brand-500/30'
                )}
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs">Generate New Draft</span>
              </button>

              {/* Draft list */}
              {drafts.map(draft => {
                const cfg    = DRAFT_TYPE_CONFIG[draft.draftType] ?? DRAFT_TYPE_CONFIG.rfe_response
                const isActive = activeDraft?.id === draft.id && view === 'drafts'
                return (
                  <div key={draft.id} className={cn(
                    'group relative rounded-xl border transition-all cursor-pointer',
                    isActive
                      ? 'bg-brand-600/10 border-brand-500/25'
                      : 'border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.03]'
                  )}>
                    <button
                      onClick={() => { setActiveDraft(draft); setView('drafts') }}
                      className="w-full text-left p-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">{cfg.icon}</span>
                        <span className={cn('text-xs font-medium', isActive ? 'text-brand-300' : 'text-slate-300')}>
                          {cfg.label}
                        </span>
                      </div>
                      {/* Confidence mini bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full',
                              draft.confidenceScore >= 80 ? 'bg-emerald-500' :
                              draft.confidenceScore >= 60 ? 'bg-brand-500' : 'bg-amber-500'
                            )}
                            style={{ width: `${draft.confidenceScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-600">{draft.confidenceScore}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {draft.reviewedByUser && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        <span className={cn(
                          'text-[10px] capitalize',
                          draft.status === 'reviewed' ? 'text-emerald-400' :
                          draft.status === 'exported' ? 'text-violet-400' : 'text-slate-600'
                        )}>{draft.status}</span>
                        <span className="text-slate-700 text-[10px]">
                          {new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(draft.createdAt))}
                        </span>
                      </div>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-700 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}

              {drafts.length === 0 && (
                <div className="text-center py-6">
                  <History className="w-7 h-7 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-700 text-xs">No drafts yet</p>
                </div>
              )}

              {/* Info */}
              <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                <div className="flex items-start gap-2">
                  <Brain className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Upload RFE notice to auto-generate structured response with point-by-point legal arguments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: main content ──────────────────────────── */}
          <div className="lg:col-span-3">
            {view === 'upload' ? (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-white text-lg">AI RFE Response Generator</h2>
                    <p className="text-slate-500 text-sm">Upload or paste the RFE notice to generate a structured legal response</p>
                  </div>
                </div>

                {/* How it works */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { step: '1', icon: '📤', title: 'Upload RFE', desc: 'Upload image or PDF of the USCIS RFE notice' },
                    { step: '2', icon: '🔍', title: 'AI Analysis', desc: 'System identifies grounds, legal standards, and evidence needed' },
                    { step: '3', icon: '📋', title: 'Draft Generated', desc: 'Structured response with point-by-point legal arguments' },
                  ].map(s => (
                    <div key={s.step} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                      <div className="text-2xl mb-2">{s.icon}</div>
                      <p className="text-white text-xs font-semibold mb-1">{s.title}</p>
                      <p className="text-slate-600 text-[10px] leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <RfeUploader caseId={caseId} onDraftCreated={handleDraftCreated} />
              </div>
            ) : activeDraft ? (
              <RfeDraftEditor
                draft={activeDraft}
                onSave={handleSaveDraft}
              />
            ) : (
              <div className="card p-12 text-center">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">No draft selected</p>
                <p className="text-slate-500 text-sm mb-5">Generate a new draft or select one from the list.</p>
                <Button onClick={() => setView('upload')}>
                  <Plus className="w-4 h-4" /> Generate Draft
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
