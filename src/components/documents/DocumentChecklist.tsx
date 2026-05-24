'use client'

import { useState } from 'react'
import {
  CheckCircle2, Circle, FileText, AlertCircle, Link2,
  ChevronDown, ChevronRight, Image, DollarSign, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VerificationBadge } from './VerificationBadge'
import { DOCUMENT_TYPE_LABELS } from '@/types'

interface ChecklistDoc {
  id:                 string
  originalName:       string
  mimeType:           string
  verificationStatus: string
  uploadedAt:         Date | string
}

interface ChecklistItemWithDoc {
  id:         string
  itemLabel:  string
  category:   string
  formCode:   string | null
  required:   boolean
  completed:  boolean
  documentId: string | null
  document?:  ChecklistDoc | null
}

interface DocumentChecklistProps {
  items:              ChecklistItemWithDoc[]
  onItemClick?:       (item: ChecklistItemWithDoc) => void
  activeItemId?:      string
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  form:     FileText,
  document: Image,
  action:   Zap,
  fee:      DollarSign,
}

const CATEGORY_LABELS: Record<string, string> = {
  form:     'Forms & Applications',
  document: 'Supporting Documents',
  action:   'Required Actions',
  fee:      'Filing Fees',
}

const CATEGORY_ORDER = ['form', 'document', 'action', 'fee']

export function DocumentChecklist({
  items,
  onItemClick,
  activeItemId,
}: DocumentChecklistProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // Group items by category
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat)
    return acc
  }, {} as Record<string, ChecklistItemWithDoc[]>)

  const totalRequired = items.filter(i => i.required).length
  const totalDone     = items.filter(i => i.required && i.completed).length
  const pct           = totalRequired === 0 ? 0 : Math.round((totalDone / totalRequired) * 100)

  return (
    <div className="h-full flex flex-col">
      {/* Header summary */}
      <div className="p-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Document Checklist</h3>
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            pct === 100
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-brand-500/10 text-brand-400'
          )}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-2">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              pct === 100 ? 'bg-emerald-500' : 'bg-brand-500'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          {totalDone} of {totalRequired} required items complete
        </p>
      </div>

      {/* Grouped items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {CATEGORY_ORDER.map(cat => {
          const catItems = grouped[cat]
          if (!catItems || catItems.length === 0) return null

          const Icon       = CATEGORY_ICONS[cat] ?? FileText
          const catDone    = catItems.filter(i => i.completed).length
          const isCollapsed = collapsed[cat]

          return (
            <div key={cat} className="rounded-xl border border-white/[0.06] overflow-hidden">
              {/* Category header */}
              <button
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
                onClick={() => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))}
              >
                <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-300 flex-1">
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-[10px] text-slate-600">
                  {catDone}/{catItems.length}
                </span>
                {isCollapsed
                  ? <ChevronRight className="w-3 h-3 text-slate-600" />
                  : <ChevronDown  className="w-3 h-3 text-slate-600" />
                }
              </button>

              {/* Items */}
              {!isCollapsed && (
                <div className="divide-y divide-white/[0.04]">
                  {catItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => onItemClick?.(item)}
                      className={cn(
                        'w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-all duration-150',
                        'hover:bg-white/[0.04]',
                        activeItemId === item.id && 'bg-brand-500/[0.08] border-l-2 border-brand-500'
                      )}
                    >
                      {/* Status icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {item.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : item.required ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500/70" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-700" />
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-xs leading-snug',
                          item.completed ? 'text-slate-500 line-through' : 'text-slate-300'
                        )}>
                          {item.formCode && (
                            <span className="text-brand-400 font-mono font-medium mr-1">
                              {item.formCode}
                            </span>
                          )}
                          {item.itemLabel}
                        </p>

                        {/* Linked document */}
                        {item.document && (
                          <div className="flex items-center gap-1 mt-1">
                            <Link2 className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
                            <span className="text-[10px] text-slate-600 truncate max-w-[140px]">
                              {item.document.originalName}
                            </span>
                            <VerificationBadge
                              status={item.document.verificationStatus}
                              size="sm"
                              showIcon={false}
                            />
                          </div>
                        )}
                      </div>

                      {/* Required badge */}
                      {item.required && !item.completed && (
                        <span className="text-[9px] text-amber-500/60 flex-shrink-0 mt-0.5 uppercase tracking-wide">
                          req
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
