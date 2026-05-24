'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload, X, FileText, Image as ImageIcon, Brain,
  CheckCircle2, AlertCircle, Loader2, Scan, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DOCUMENT_TYPE_LABELS, MAX_FILE_SIZE_MB } from '@/types'
import { useRouter } from 'next/navigation'

interface UploadZoneProps {
  caseId:          string
  checklistItems?: { id: string; itemLabel: string; formCode: string | null; completed: boolean; category: string }[]
  onUploadComplete?: () => void
}

type UploadStage = 'idle' | 'reading' | 'ocr' | 'uploading' | 'reviewing' | 'done' | 'error'

interface FilePreview {
  file:           File
  previewUrl:     string
  documentType:   string
  checklistItemId: string
  stage:          UploadStage
  progress:       number
  message:        string
  error?:         string
  docId?:         string
}

const DOCUMENT_TYPES = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))

// ── Tesseract OCR (dynamic import, fails gracefully) ──────────
async function runOCR(file: File): Promise<string> {
  // Only run OCR on images — PDFs handled server-side
  if (!file.type.startsWith('image/')) {
    return `[PDF document: ${file.name}]`
  }
  try {
    // Dynamic import avoids SSR issues with tesseract.js
    const Tesseract = await import('tesseract.js')
    const { createWorker } = Tesseract
    const worker = await createWorker('eng', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
      langPath:   'https://tessdata.projectnaptha.com/4.0.0',
      corePath:   'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd.wasm.js',
      logger:     () => {}, // suppress verbose logging
    })
    const { data: { text } } = await worker.recognize(file)
    await worker.terminate()
    return text.trim()
  } catch (e) {
    console.warn('OCR failed (non-fatal):', e)
    return ''
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function inferDocumentType(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.includes('passport'))          return 'passport'
  if (lower.includes('birth'))             return 'birth_certificate'
  if (lower.includes('marriage'))          return 'marriage_certificate'
  if (lower.includes('tax') || lower.includes('1040') || lower.includes('w2')) return 'tax_return'
  if (lower.includes('bank'))              return 'bank_statement'
  if (lower.includes('degree') || lower.includes('diploma')) return 'degree_certificate'
  if (lower.includes('transcript'))        return 'transcript'
  if (lower.includes('i-130') || lower.includes('i130')) return 'i130'
  if (lower.includes('i-485') || lower.includes('i485')) return 'i485'
  if (lower.includes('i-140') || lower.includes('i140')) return 'i140'
  if (lower.includes('i-129') || lower.includes('i129')) return 'i129'
  if (lower.includes('i-864') || lower.includes('i864')) return 'i864'
  if (lower.includes('lca'))               return 'lca'
  if (lower.includes('medical') || lower.includes('i-693')) return 'i693'
  return 'other'
}

export function UploadZone({ caseId, checklistItems = [], onUploadComplete }: UploadZoneProps) {
  const router                = useRouter()
  const dropRef               = useRef<HTMLDivElement>(null)
  const inputRef              = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [queue, setQueue]     = useState<FilePreview[]>([])

  function updateItem(idx: number, patch: Partial<FilePreview>) {
    setQueue(q => q.map((item, i) => i === idx ? { ...item, ...patch } : item))
  }

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024
    const valid = arr.filter(f => {
      if (f.size > maxBytes) { alert(`${f.name} exceeds ${MAX_FILE_SIZE_MB} MB limit`); return false }
      const ok = ['image/jpeg','image/png','image/webp','image/tiff','application/pdf'].includes(f.type)
      if (!ok) { alert(`${f.name} is not a supported file type`); return false }
      return true
    })
    const previews: FilePreview[] = valid.map(f => ({
      file:            f,
      previewUrl:      f.type.startsWith('image/') ? URL.createObjectURL(f) : '',
      documentType:    inferDocumentType(f.name),
      checklistItemId: '',
      stage:           'idle',
      progress:        0,
      message:         'Ready to upload',
    }))
    setQueue(q => [...q, ...previews])
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function removeItem(idx: number) {
    setQueue(q => {
      const item = q[idx]
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      return q.filter((_, i) => i !== idx)
    })
  }

  async function processItem(idx: number) {
    const item = queue[idx]
    if (!item || item.stage === 'uploading' || item.stage === 'reviewing' || item.stage === 'done') return

    try {
      // 1 — Read file
      updateItem(idx, { stage: 'reading', progress: 5, message: 'Reading file…' })

      // 2 — OCR (images only)
      let ocrText = ''
      if (item.file.type.startsWith('image/')) {
        updateItem(idx, { stage: 'ocr', progress: 20, message: 'Running OCR — extracting text…' })
        ocrText = await runOCR(item.file)
        updateItem(idx, { progress: 45, message: `OCR complete — ${ocrText.length} characters extracted` })
      }

      // 3 — Upload file
      updateItem(idx, { stage: 'uploading', progress: 55, message: 'Uploading to secure storage…' })
      const fd = new FormData()
      fd.append('file',            item.file)
      fd.append('caseId',          caseId)
      fd.append('documentType',    item.documentType)
      if (item.checklistItemId) fd.append('checklistItemId', item.checklistItemId)

      const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || 'Upload failed')
      }
      const { document: doc } = await uploadRes.json()
      updateItem(idx, { progress: 70, message: 'Uploaded. Running AI review…', docId: doc.id })

      // 4 — AI Review
      updateItem(idx, { stage: 'reviewing', progress: 80, message: 'AI analyzing document…' })
      const reviewRes = await fetch(`/api/documents/${doc.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrText }),
      })
      if (!reviewRes.ok) {
        // Review failure is non-fatal — document is still uploaded
        updateItem(idx, { stage: 'done', progress: 100, message: 'Uploaded (AI review failed — retryable)' })
      } else {
        const { result } = await reviewRes.json()
        const statusMsg =
          result.verificationStatus === 'verified' ? '✓ Verified by AI' :
          result.verificationStatus === 'flagged'  ? '⚠ Flagged — review required' :
          'Review complete'
        updateItem(idx, { stage: 'done', progress: 100, message: `${statusMsg} · ${result.completenessScore}% complete` })
      }

      onUploadComplete?.()
      router.refresh()
    } catch (err: any) {
      updateItem(idx, { stage: 'error', progress: 0, message: '', error: err.message || 'Upload failed' })
    }
  }

  async function uploadAll() {
    const idleIdxs = queue.map((item, i) => item.stage === 'idle' ? i : -1).filter(i => i >= 0)
    // Process concurrently (max 2 at a time)
    for (let i = 0; i < idleIdxs.length; i += 2) {
      await Promise.all(idleIdxs.slice(i, i + 2).map(idx => processItem(idx)))
    }
  }

  const allDone  = queue.length > 0 && queue.every(i => i.stage === 'done')
  const anyIdle  = queue.some(i => i.stage === 'idle')
  const anyBusy  = queue.some(i => ['reading','ocr','uploading','reviewing'].includes(i.stage))

  const documentItems = checklistItems.filter(i => ['document','form'].includes(i.category))

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
            : 'border-white/[0.1] hover:border-brand-500/40 hover:bg-brand-500/[0.03]'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.tiff,.tif,.pdf"
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
            isDragging ? 'bg-brand-500/20' : 'bg-white/[0.05]'
          )}>
            <Upload className={cn('w-6 h-6 transition-colors', isDragging ? 'text-brand-400' : 'text-slate-500')} />
          </div>
          <div>
            <p className="text-white font-medium text-sm">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              JPG, PNG, WEBP, TIFF, PDF · Max {MAX_FILE_SIZE_MB} MB per file
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-600">
            <span className="flex items-center gap-1"><Scan className="w-3 h-3" /> Auto OCR</span>
            <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> AI Classification</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Field Extraction</span>
          </div>
        </div>
      </div>

      {/* File queue */}
      {queue.length > 0 && (
        <div className="space-y-3">
          {/* Upload all button */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{queue.length} file{queue.length > 1 ? 's' : ''} queued</span>
            <div className="flex items-center gap-2">
              {allDone && (
                <span className="flex items-center gap-1 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All uploaded
                </span>
              )}
              {anyIdle && (
                <Button size="sm" onClick={uploadAll} disabled={anyBusy}>
                  {anyBusy ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5" /> Upload All</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {queue.map((item, idx) => (
            <div key={idx} className={cn(
              'card p-4 border',
              item.stage === 'done' && item.message.includes('⚠') && 'border-amber-500/20',
              item.stage === 'done' && item.message.includes('✓')  && 'border-emerald-500/15',
              item.stage === 'error' && 'border-rose-500/25',
            )}>
              <div className="flex items-start gap-3">
                {/* Thumbnail / icon */}
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.previewUrl
                    ? <img src={item.previewUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    : <FileText className="w-5 h-5 text-brand-400" />
                  }
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {/* File name + remove */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white text-sm truncate font-medium">{item.file.name}</span>
                    {(item.stage === 'idle' || item.stage === 'done' || item.stage === 'error') && (
                      <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Document type + checklist link (idle only) */}
                  {item.stage === 'idle' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] mb-1 block">Document Type</Label>
                        <Select value={item.documentType} onValueChange={v => updateItem(idx, { documentType: v })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map(dt => (
                              <SelectItem key={dt.value} value={dt.value} className="text-xs">{dt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {documentItems.length > 0 && (
                        <div>
                          <Label className="text-[10px] mb-1 block">Link to Checklist</Label>
                          <Select
                            value={item.checklistItemId || ''}
                            onValueChange={v => updateItem(idx, { checklistItemId: v })}
                          >
                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Optional…" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="" className="text-xs text-slate-500">No link</SelectItem>
                              {documentItems.map(ci => (
                                <SelectItem key={ci.id} value={ci.id} className="text-xs">
                                  {ci.formCode ? `${ci.formCode} — ` : ''}{ci.itemLabel.slice(0,40)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress bar (while processing) */}
                  {['reading','ocr','uploading','reviewing'].includes(item.stage) && (
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          {item.message}
                        </span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Done / error state */}
                  {item.stage === 'done' && (
                    <p className={cn(
                      'text-xs',
                      item.message.includes('⚠') ? 'text-amber-400' : 'text-emerald-400'
                    )}>{item.message}</p>
                  )}
                  {item.stage === 'error' && (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <p className="text-rose-400 text-xs">{item.error}</p>
                      <button
                        className="ml-auto text-[10px] text-brand-400 hover:text-brand-300"
                        onClick={() => { updateItem(idx, { stage: 'idle', error: undefined }); processItem(idx) }}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Upload button for idle */}
                  {item.stage === 'idle' && (
                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => processItem(idx)}>
                      <Upload className="w-3 h-3" /> Upload & Review
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
