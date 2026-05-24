'use client'

import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/chatEngine'
import { cn } from '@/lib/utils'

interface LanguagePickerProps {
  value:    LanguageCode
  onChange: (lang: LanguageCode) => void
  compact?: boolean
}

export function LanguagePicker({ value, onChange, compact = false }: LanguagePickerProps) {
  return (
    <div className={cn('flex items-center gap-1', compact ? 'gap-0.5' : 'gap-1')}>
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, cfg]) => (
        <button
          key={code}
          onClick={() => onChange(code as LanguageCode)}
          title={cfg.label}
          className={cn(
            'flex items-center gap-1.5 rounded-lg transition-all duration-150 font-medium',
            compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
            value === code
              ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
          )}
        >
          <span className={compact ? 'text-sm' : 'text-base'}>{cfg.flag}</span>
          {!compact && <span>{cfg.label}</span>}
        </button>
      ))}
    </div>
  )
}
