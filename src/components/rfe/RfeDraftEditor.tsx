'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import {
  Save, CheckCircle2, AlertTriangle, Copy, Check,
  ChevronDown, ChevronUp, Download, ExternalLink,
  Clock, Pencil, Eye, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface DraftEditorProps {
  draft: {
    id: string; draftType: string; title: string; content: string
    userEdits: string | null; confidenceScore: number; status: string
    reviewedByUser: boolean; rfeGrounds: string | null; reviewNotes: string | null
  }
  onSave?: (content: string, notes: string) => Promise<void>
}

const CONFIDENCE_COLORS = (score: number) =>
  score >= 80 ? { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
  : score >= 60 ? { bar: 'bg-brand-500',   text: 'text-brand-400',   bg: 'bg-brand-500/10',   border: 'border-brand-500/20'   }
  :               { bar: 'bg-amber-500',    text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   }

// ── Simple markdown preview renderer ─────────────────────────
function MarkdownPreview({ content }: { content: string }) {
  const html = content
    .replace(/^# (.+)$/gm,  '<h1 class="text-xl font-bold text-white mt-6 mb-2 pb-2 border-b border-white/10">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-white mt-5 mb-2 text-brand-300">$1</h2>')
    .replace(/^### (.+)$/gm,'<h3 class="text-sm font-semibold text-slate-300 mt-3 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g,'<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em class="italic text-slate-400">$1</em>')
    .replace(/^- (.+)$/gm,   '<li class="ml-5 list-disc text-slate-300 my-0.5">$1</li>')
    .replace(/(<li.*?<\/li>\n?)+/g, m => `<ul class="my-2">${m}</ul>`)
    .replace(/^---$/gm, '<hr class="border-white/10 my-4">')
    .replace(/\n\n/g, '</p><p class="my-2 text-slate-300 leading-relaxed">')
    .replace(/\n/g, '<br>')
  return (
    <div
      className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed text-sm"
      dangerouslySetInnerHTML={{ __html: `<p class="my-2">${html}</p>` }}
    />
  )
}

export function RfeDraftEditor({ draft, onSave }: DraftEditorProps) {
  const [mode, setMode]               = useState<'preview' | 'edit'>('preview')
  const [content, setContent]         = useState(draft.userEdits ?? draft.content)
  const [notes, setNotes]             = useState(draft.reviewNotes ?? '')
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [copied, setCopied]           = useState(false)
  const [groundsOpen, setGroundsOpen] = useState(true)
  const [isPending, startTransition]  = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const grounds    = draft.rfeGrounds ? JSON.parse(draft.rfeGrounds) : []
  const colors     = CONFIDENCE_COLORS(draft.confidenceScore)
  const hasEdits   = content !== draft.content
  const wordCount  = content.trim().split(/\s+/).length

  useEffect(() => {
    if (mode === 'edit' && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [mode, content])

  async function handleSave() {
    if (!onSave) return
    setSaving(true)
    await onSave(content, notes)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* ── Confidence + status bar ──────────────────────────── */}
      <div className={cn('card p-4 border', colors.border, colors.bg)}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={cn('font-bold text-lg', colors.text)}>{draft.confidenceScore}% confidence</span>
              <span className={cn(
                'text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize',
                draft.status === 'reviewed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                draft.status === 'exported' ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' :
                'text-amber-400 bg-amber-500/10 border-amber-500/20'
              )}>{draft.status}</span>
              {draft.reviewedByUser && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Attorney reviewed
                </span>
              )}
            </div>
            <Progress value={draft.confidenceScore} indicatorClassName={colors.bar} className="h-1.5 mb-2" />
            <p className={cn('text-xs leading-relaxed', colors.text)}>
              {draft.confidenceScore >= 80
                ? '✓ High confidence — comprehensive response with strong legal arguments. Review exhibits before submission.'
                : draft.confidenceScore >= 60
                ? '⚠ Moderate confidence — review all legal citations and customize placeholder text before submission.'
                : '⚠ Lower confidence — significant attorney editing required. Verify all arguments and evidence references.'
              }
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-slate-600">{wordCount.toLocaleString()} words</div>
            {hasEdits && <div className="text-xs text-amber-400 mt-0.5">Unsaved edits</div>}
          </div>
        </div>
      </div>

      {/* ── Legal disclaimer ─────────────────────────────────── */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/[0.05] border border-rose-500/20">
        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-rose-300 leading-relaxed">
          <strong>Attorney Review Required.</strong> This AI-generated draft is for attorney review and editing only.
          All exhibit references, dates, names, legal citations, and arguments must be verified by a licensed immigration attorney before submission to USCIS.
          Submitting an unreviewed draft may harm the petitioner's case.
        </p>
      </div>

      {/* ── RFE Grounds summary ──────────────────────────────── */}
      {grounds.length > 0 && (
        <div className="card overflow-hidden">
          <button
            onClick={() => setGroundsOpen(!groundsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white">
                RFE Grounds Addressed ({grounds.length})
              </span>
            </div>
            {groundsOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {groundsOpen && (
            <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
              {grounds.map((g: any, i: number) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{g.title}</p>
                      {g.legalBasis && (
                        <p className="text-slate-600 text-[10px] mt-0.5 font-mono">{g.legalBasis}</p>
                      )}
                      {g.evidenceNeeded?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {g.evidenceNeeded.slice(0, 3).map((ev: string, j: number) => (
                            <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-slate-500 border border-white/[0.06] truncate max-w-[200px]">
                              {ev}
                            </span>
                          ))}
                          {g.evidenceNeeded.length > 3 && (
                            <span className="text-[10px] text-slate-600">+{g.evidenceNeeded.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Editor toolbar ───────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1 border border-white/[0.07]">
          <button
            onClick={() => setMode('preview')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all',
              mode === 'preview' ? 'bg-white/[0.1] text-white' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => setMode('edit')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all',
              mode === 'edit' ? 'bg-white/[0.1] text-white' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={handleCopy}>
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </Button>
          <a href={`/api/rfe/${draft.id}/export?format=pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> PDF
            </Button>
          </a>
          <a href={`/api/rfe/${draft.id}/export?format=docx`} download>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" /> .docx
            </Button>
          </a>
          {onSave && (
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
              {saving ? <><Clock className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              : saved  ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Saved</>
              : <><Save className="w-3.5 h-3.5" /> Save</>}
            </Button>
          )}
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {mode === 'preview' ? (
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-2 right-3 text-[10px] text-slate-700 pointer-events-none">
              Markdown supported
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => {
                setContent(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 800) + 'px'
              }}
              className="w-full bg-transparent px-6 py-5 text-sm text-slate-300 font-mono leading-relaxed resize-none focus:outline-none"
              style={{ minHeight: '400px' }}
              spellCheck
            />
          </div>
        )}
      </div>

      {/* ── Review notes ─────────────────────────────────────── */}
      {onSave && (
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500">Attorney Review Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Record your review notes, changes made, or issues found…"
            rows={3}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-700 resize-none focus:outline-none focus:border-brand-500/40 transition-colors"
          />
        </div>
      )}
    </div>
  )
}
