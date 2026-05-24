import { Brain, Flag, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExtractedDocumentFields } from '@/types/prisma'

const FIELD_LABELS: Record<string, string> = {
  fullName:         'Full Name',
  dateOfBirth:      'Date of Birth',
  documentNumber:   'Document Number',
  expiryDate:       'Expiry Date',
  issueDate:        'Issue Date',
  nationality:      'Nationality',
  issuingAuthority: 'Issuing Authority',
  address:          'Address',
  taxYear:          'Tax Year',
  income:           'Income',
  employer:         'Employer',
}

interface ExtractedFieldsPanelProps {
  extractedFields: string | null
  flags:           string | null
  completeness:    number | null
  aiSummary:       string | null
}

export function ExtractedFieldsPanel({
  extractedFields, flags, completeness, aiSummary,
}: ExtractedFieldsPanelProps) {
  const fields = extractedFields ? (JSON.parse(extractedFields) as ExtractedDocumentFields) : {}
  const flagList: string[] = flags ? JSON.parse(flags) : []
  const fieldEntries = Object.entries(fields).filter(([, v]) => v && String(v).trim())

  return (
    <div className="space-y-4">
      {/* AI Summary */}
      {aiSummary && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-500/[0.05] border border-brand-500/20">
          <Brain className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
          <p className="text-slate-300 text-xs leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Completeness bar */}
      {completeness !== null && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Completeness</span>
            <span className={cn(
              'font-medium',
              completeness >= 80 ? 'text-emerald-400' : completeness >= 50 ? 'text-amber-400' : 'text-rose-400'
            )}>{completeness}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                completeness >= 80 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              )}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      )}

      {/* Extracted fields */}
      {fieldEntries.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Extracted Fields</h4>
          <div className="space-y-1.5">
            {fieldEntries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <CheckCircle2 className="w-3 h-3 text-emerald-500/60 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-600 block">{FIELD_LABELS[key] ?? key}</span>
                  <span className="text-xs text-slate-300 font-medium break-words">{String(value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flags */}
      {flagList.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-rose-500/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Flag className="w-3 h-3" /> Issues Found
          </h4>
          <div className="space-y-1.5">
            {flagList.map((flag, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/[0.06] border border-rose-500/20">
                <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-rose-300">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fieldEntries.length === 0 && flagList.length === 0 && !aiSummary && (
        <p className="text-slate-600 text-xs text-center py-3">AI review not yet run.</p>
      )}
    </div>
  )
}
