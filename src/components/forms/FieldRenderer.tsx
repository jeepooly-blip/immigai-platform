'use client'

import { COUNTRIES, US_STATES } from '@/lib/form-schemas'
import type { FormField } from '@/lib/form-schemas'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface FieldRendererProps {
  field:    FormField
  value:    any
  onChange: (id: string, value: any) => void
  error?:   string
  disabled?: boolean
}

export function FieldRenderer({ field, value, onChange, error, disabled }: FieldRendererProps) {
  const baseInputClass = cn(error && 'border-rose-500/50 focus:border-rose-500/70')

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'ssn':
      case 'alien_number':
      case 'zip':
      case 'pattern':
        return (
          <Input
            id={field.id}
            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
            value={value ?? ''}
            onChange={e => onChange(field.id, e.target.value)}
            placeholder={field.placeholder ?? ''}
            maxLength={field.maxLength}
            disabled={disabled}
            className={baseInputClass}
          />
        )

      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={value ?? ''}
            onChange={e => onChange(field.id, e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
        )

      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={value ?? ''}
            onChange={e => onChange(field.id, e.target.value)}
            placeholder={field.placeholder ?? ''}
            rows={field.rows ?? 4}
            maxLength={field.maxLength}
            disabled={disabled}
            className={cn('resize-none', baseInputClass)}
          />
        )

      case 'select':
      case 'state': {
        const opts = field.type === 'state' ? US_STATES : (field.options ?? [])
        return (
          <Select value={value ?? ''} onValueChange={v => onChange(field.id, v)} disabled={disabled}>
            <SelectTrigger id={field.id} className={baseInputClass}>
              <SelectValue placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {opts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )
      }

      case 'country':
        return (
          <Select value={value ?? ''} onValueChange={v => onChange(field.id, v)} disabled={disabled}>
            <SelectTrigger id={field.id} className={baseInputClass}>
              <SelectValue placeholder="Select country..." />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )

      case 'radio':
        return (
          <div className="flex flex-wrap gap-3 mt-1">
            {(field.options ?? []).map(opt => (
              <label key={opt.value}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 text-sm',
                  value === opt.value
                    ? 'border-brand-500/50 bg-brand-500/10 text-brand-300'
                    : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.14] hover:text-slate-300',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}>
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0',
                  value === opt.value ? 'border-brand-500 bg-brand-500' : 'border-slate-600'
                )}>
                  {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <input type="radio" name={field.id} value={opt.value}
                  checked={value === opt.value}
                  onChange={() => !disabled && onChange(field.id, opt.value)}
                  className="sr-only" />
                {opt.label}
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <label className={cn(
            'flex items-start gap-3 cursor-pointer group',
            disabled && 'opacity-50 cursor-not-allowed'
          )}>
            <div className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
              value ? 'border-brand-500 bg-brand-500' : 'border-slate-600 group-hover:border-slate-400'
            )}>
              {value && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <input type="checkbox" checked={!!value}
              onChange={e => !disabled && onChange(field.id, e.target.checked)}
              className="sr-only" />
            <span className="text-sm text-slate-300 leading-relaxed">{field.label}</span>
          </label>
        )

      // ai_narrative is handled by parent with AI assist button
      case 'ai_narrative':
        return (
          <Textarea
            id={field.id}
            value={value ?? ''}
            onChange={e => onChange(field.id, e.target.value)}
            placeholder={field.placeholder ?? 'Write narrative here, or use AI Assist to generate a draft...'}
            rows={field.rows ?? 6}
            disabled={disabled}
            className={cn('resize-none font-mono text-xs leading-relaxed', baseInputClass)}
          />
        )

      default:
        return <Input value={value ?? ''} onChange={e => onChange(field.id, e.target.value)} disabled={disabled} />
    }
  }

  // For checkbox, label is inline
  if (field.type === 'checkbox') {
    return (
      <div className="py-1">
        {renderField()}
        {error && <p className="flex items-center gap-1 mt-1.5 text-xs text-rose-400"><AlertCircle className="w-3 h-3" />{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.id} className={cn(field.required && 'after:content-["*"] after:text-rose-400 after:ml-0.5')}>
        {field.type === 'ai_narrative' ? (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">AI</span>
            {field.label}
          </span>
        ) : field.label}
      </Label>
      {field.helpText && <p className="text-[11px] text-slate-600 leading-relaxed -mt-0.5">{field.helpText}</p>}
      {renderField()}
      {error && <p className="flex items-center gap-1 text-xs text-rose-400"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  )
}
