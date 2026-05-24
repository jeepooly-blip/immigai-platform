'use client'

import { useState } from 'react'
import { Brain, Sparkles, Copy, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AIAssistPanelProps {
  formId:     string
  fieldId:    string
  aiPrompt:   string
  fieldLabel: string
  currentFieldData: Record<string, any>
  onInsert:   (text: string) => void
}

export function AIAssistPanel({
  formId, fieldId, aiPrompt, fieldLabel, currentFieldData, onInsert
}: AIAssistPanelProps) {
  const [expanded, setExpanded]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [generated, setGenerated]     = useState('')
  const [copied, setCopied]           = useState(false)
  const [error, setError]             = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setGenerated('')
    try {
      const res = await fetch(`/api/forms/${formId}/ai-assist`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fieldId, aiPrompt, currentFieldData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI request failed')
      setGenerated(data.text ?? '')
      setExpanded(true)
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate text')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleInsert() {
    onInsert(generated)
    setExpanded(false)
  }

  return (
    <div className="mt-2 rounded-xl border border-brand-500/20 bg-brand-500/[0.04] overflow-hidden">
      {/* Trigger bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Brain className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
        <span className="text-xs text-brand-400 font-medium flex-1">AI Assist — {fieldLabel}</span>
        <Button
          type="button"
          size="sm"
          variant="default"
          className="h-7 text-xs gap-1.5"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading
            ? <><RefreshCw className="w-3 h-3 animate-spin" /> Generating…</>
            : <><Sparkles className="w-3 h-3" /> {generated ? 'Regenerate' : 'Generate Draft'}</>
          }
        </Button>
        {generated && (
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 pb-2 text-xs text-rose-400">{error}</div>
      )}

      {/* Generated text */}
      {expanded && generated && (
        <div className="border-t border-brand-500/20">
          <div className="p-3 max-h-60 overflow-y-auto">
            <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-mono">{generated}</p>
          </div>
          <div className="flex items-center gap-2 px-3 pb-3">
            <Button type="button" size="sm" className="h-7 text-xs gap-1.5 flex-1" onClick={handleInsert}>
              <Check className="w-3 h-3" /> Insert into Field
            </Button>
            <Button type="button" variant="secondary" size="sm" className="h-7 text-xs gap-1.5" onClick={handleCopy}>
              {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </Button>
          </div>
        </div>
      )}

      {/* Prompt preview (collapsed) */}
      {!expanded && !generated && (
        <div className="px-3 pb-2">
          <p className="text-slate-600 text-[10px] leading-relaxed line-clamp-2">{aiPrompt}</p>
        </div>
      )}
    </div>
  )
}
