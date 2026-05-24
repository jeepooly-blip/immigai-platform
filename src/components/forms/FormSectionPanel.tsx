'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { FormSection } from '@/lib/form-schemas'
import { FieldRenderer } from './FieldRenderer'
import { AIAssistPanel } from './AIAssistPanel'

interface FormSectionPanelProps {
  section:         FormSection
  formId:          string
  fieldData:       Record<string, any>
  errors:          Record<string, string>
  onFieldChange:   (id: string, value: any) => void
}

export function FormSectionPanel({
  section, formId, fieldData, errors, onFieldChange,
}: FormSectionPanelProps) {
  const handleInsert = useCallback((fieldId: string, text: string) => {
    onFieldChange(fieldId, text)
  }, [onFieldChange])

  // Group fields into rows by width
  const rows: typeof section.fields[0][][] = []
  let currentRow: typeof section.fields[0][] = []
  let currentWidth = 0

  const widthMap = { full: 3, half: 1.5, third: 1 }

  for (const field of section.fields) {
    const w = widthMap[field.width ?? 'full']
    if (currentWidth + w > 3 && currentRow.length > 0) {
      rows.push(currentRow)
      currentRow = []
      currentWidth = 0
    }
    currentRow.push(field)
    currentWidth += w
  }
  if (currentRow.length > 0) rows.push(currentRow)

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display font-bold text-xl text-white mb-1">{section.title}</h2>
        {section.subtitle && (
          <p className="text-slate-500 text-sm leading-relaxed">{section.subtitle}</p>
        )}
      </div>

      <div className="space-y-5">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className={cn(
            'grid gap-4',
            row.length === 1 ? 'grid-cols-1' :
            row.length === 2 ? 'grid-cols-2' :
            'grid-cols-3'
          )}>
            {row.map(field => {
              const isFullWidth = field.width === 'full' || !field.width
              return (
                <div key={field.id} className={cn(isFullWidth && row.length > 1 ? 'col-span-full' : '')}>
                  <FieldRenderer
                    field={field}
                    value={fieldData[field.id]}
                    onChange={onFieldChange}
                    error={errors[field.id]}
                  />
                  {field.type === 'ai_narrative' && field.aiPrompt && (
                    <AIAssistPanel
                      formId={formId}
                      fieldId={field.id}
                      aiPrompt={field.aiPrompt}
                      fieldLabel={field.label}
                      currentFieldData={fieldData}
                      onInsert={text => handleInsert(field.id, text)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
