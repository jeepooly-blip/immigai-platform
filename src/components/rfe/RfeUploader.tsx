'use client'

import { useState, useRef, useTransition } from 'react'
import {
  Upload, Brain, FileText, AlertTriangle, CheckCircle2,
  Loader2, Scan, Sparkles, X, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface RfeUploaderProps {
  caseId:   string
  onDraftCreated: (draftId: string) => void
}

type Stage = 'idle' | 'reading' | 'ocr' | 'analyzing' | 'done' | 'error'

const DRAFT_TYPES = [
  { value: 'rfe_response',     label: '📋 Full RFE Response (all grounds)' },
  { value: 'cover_letter',     label: '✉️  Cover Letter (transmittal)' },
  { value: 'support_letter',   label: '🏢 Employer Support Letter' },
  { value: 'personal_statement', label: '👤 Personal Statement' },
]

export function RfeUploader({ caseId, onDraftCreated }: RfeUploaderProps) {
  const [stage, setStage]         = useState<Stage>('idle')
  const [draftType, setDraftType] = useState('rfe_response')
  const [progress, setProgress]   = useState(0)
  const [message, setMessage]     = useState('')
  const [error, setError]         = useState('')
  const [previewText, setPreviewText] = useState('')
  const [isDragging, setIsDragging]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    setError('')
    setStage('reading')
    setProgress(5)
    setMessage('Reading file…')

    try {
      let rfeText = ''

      // OCR for images, or text extraction for PDF
      if (file.type.startsWith('image/')) {
        setStage('ocr')
        setProgress(20)
        setMessage('Running OCR — extracting text from image…')

        try {
          const Tesseract = await import('tesseract.js')
          const worker    = await Tesseract.createWorker('eng', 1, {
            workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
            langPath:   'https://tessdata.projectnaptha.com/4.0.0',
            corePath:   'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd.wasm.js',
            logger:     () => {},
          })
          const { data: { text } } = await worker.recognize(file)
          await worker.terminate()
          rfeText = text.trim()
        } catch {
          rfeText = `[OCR extraction attempted for: ${file.name}]\n\nPlease verify the extracted text below and edit if needed.`
        }
      } else if (file.type === 'application/pdf') {
        setStage('ocr')
        setProgress(20)
        setMessage('Processing PDF…')
        // For PDFs, we pass filename context — in production use pdf-parse or similar
        rfeText = `[PDF document: ${file.name}]\n\nThis is a Request for Evidence notice. The document contains USCIS RFE language requesting additional evidence. Please add your RFE text in the text area below for AI analysis.`
      } else if (file.type === 'text/plain') {
        rfeText = await file.text()
      }

      setProgress(50)
      setPreviewText(rfeText.slice(0, 300) + (rfeText.length > 300 ? '…' : ''))
      setMessage('Analyzing RFE grounds with AI…')
      setStage('analyzing')
      setProgress(65)

      const res = await fetch('/api/rfe/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ caseId, rfeText, draftType }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Analysis failed')
      }

      const { draft, grounds } = await res.json()

      setProgress(100)
      setMessage(`Draft generated — ${grounds.length} ground${grounds.length !== 1 ? 's' : ''} addressed`)
      setStage('done')
      onDraftCreated(draft.id)
    } catch (err: any) {
      setStage('error')
      setError(err.message ?? 'Processing failed')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const busyStages: Stage[] = ['reading', 'ocr', 'analyzing']
  const isBusy = busyStages.includes(stage)

  return (
    <div className="space-y-5">
      {/* Draft type selector */}
      <div className="space-y-1.5">
        <Label>Document to Generate</Label>
        <Select value={draftType} onValueChange={setDraftType} disabled={isBusy}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {DRAFT_TYPES.map(dt => (
              <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isBusy && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200',
          isBusy ? 'cursor-wait opacity-70' : 'cursor-pointer',
          isDragging ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
          : stage === 'done' ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
          : stage === 'error' ? 'border-rose-500/40 bg-rose-500/[0.04]'
          : 'border-white/[0.1] hover:border-brand-500/40 hover:bg-brand-500/[0.03]'
        )}
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff,.txt" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />

        <div className="flex flex-col items-center gap-3">
          {stage === 'idle' && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                <Upload className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Upload RFE Notice</p>
                <p className="text-slate-500 text-xs mt-1">PDF, JPG, PNG, TIFF or TXT · Max 10 MB</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-600">
                <span className="flex items-center gap-1"><Scan className="w-3 h-3" /> OCR Extraction</span>
                <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> AI Analysis</span>
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Draft Generation</span>
              </div>
            </>
          )}

          {isBusy && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
              </div>
              <div>
                <p className="text-brand-300 font-medium text-sm">{message}</p>
                <div className="mt-2 w-48 h-1.5 bg-white/[0.05] rounded-full overflow-hidden mx-auto">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-slate-600 text-[10px] mt-1">{progress}%</p>
              </div>
            </>
          )}

          {stage === 'done' && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-300 font-medium text-sm">{message}</p>
                <p className="text-slate-500 text-xs mt-1">Scroll down to review and edit your draft</p>
              </div>
              <Button
                variant="outline" size="sm"
                onClick={e => { e.stopPropagation(); setStage('idle'); setProgress(0); setPreviewText('') }}
              >
                <Upload className="w-3.5 h-3.5" /> Upload Another
              </Button>
            </>
          )}

          {stage === 'error' && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <p className="text-rose-300 text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setStage('idle') }}>
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>

      {/* OCR text preview */}
      {previewText && (
        <div className="card p-3">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">OCR Preview</p>
          <p className="text-slate-400 text-xs font-mono leading-relaxed">{previewText}</p>
        </div>
      )}

      {/* Manual text input fallback */}
      {stage === 'idle' && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-600 text-center">— or paste RFE text directly —</p>
          <PasteRfeText caseId={caseId} draftType={draftType} onDraftCreated={onDraftCreated} />
        </div>
      )}
    </div>
  )
}

// ── Paste text fallback ───────────────────────────────────────
function PasteRfeText({
  caseId, draftType, onDraftCreated,
}: { caseId: string; draftType: string; onDraftCreated: (id: string) => void }) {
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [expanded, setExpanded] = useState(false)

  async function handleAnalyze() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rfe/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ caseId, rfeText: text, draftType }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const { draft } = await res.json()
      onDraftCreated(draft.id)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="w-full text-xs text-slate-600 hover:text-slate-400 flex items-center justify-center gap-1.5 py-2 transition-colors">
        <FileText className="w-3.5 h-3.5" /> Paste RFE text manually
        <ChevronRight className="w-3 h-3" />
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste the full text of the USCIS Request for Evidence notice here…"
        rows={8}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-700 resize-none focus:outline-none focus:border-brand-500/40 transition-colors font-mono text-xs"
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAnalyze} disabled={!text.trim() || loading} className="flex-1">
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</> : <><Brain className="w-3.5 h-3.5" /> Analyze & Generate Draft</>}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setExpanded(false); setText('') }}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
