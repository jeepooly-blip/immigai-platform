'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { FormSectionPanel } from '@/components/forms/FormSectionPanel'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, ArrowRight, Save, Download, CheckCircle2,
  Clock, AlertCircle, FileText, ChevronRight, Printer,
  RotateCcw, Brain, ExternalLink, Sparkles, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getFormSchema, calculateCompletion } from '@/lib/form-schemas'
import { saveFormProgress } from '@/lib/actions/forms'

interface FormData {
  id: string; formType: string; completionPercentage: number; currentSection: number
  status: string; fieldData: string; lastSavedAt: string; caseId: string
  case: { applicantName: string; visaCategory: string; caseType: string }
}

async function fetchForm(formId: string): Promise<FormData | null> {
  const res = await fetch(`/api/forms/${formId}`)
  if (!res.ok) return null
  const { form } = await res.json()
  return form
}

export default function FormBuilderPage() {
  const router = useRouter()
  const params = useParams()
  const caseId = params.id as string
  const formId = params.formId as string

  const [formMeta, setFormMeta]         = useState<FormData | null>(null)
  const [fieldData, setFieldData]       = useState<Record<string, any>>({})
  const [currentSection, setCurrentSection] = useState(0)
  const [errors, setErrors]             = useState<Record<string, string>>({})
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [completion, setCompletion]     = useState(0)
  const [loading, setLoading]           = useState(true)
  const [exporting, setExporting]       = useState<'pdf'|'docx'|null>(null)
  const autoSaveTimer                   = useRef<NodeJS.Timeout>()

  // Load form
  useEffect(() => {
    fetchForm(formId).then(form => {
      if (!form) { router.push(`/case/${caseId}/forms`); return }
      setFormMeta(form)
      setCurrentSection(form.currentSection)
      try { setFieldData(JSON.parse(form.fieldData)) } catch { setFieldData({}) }
      setCompletion(form.completionPercentage)
      setLoading(false)
    })
  }, [formId, caseId, router])

  const schema = formMeta ? getFormSchema(formMeta.formType) : null
  const sections = schema?.sections ?? []
  const currentSectionData = sections[currentSection]

  // Field change handler with auto-save debounce
  const handleFieldChange = useCallback((id: string, value: any) => {
    setFieldData(prev => {
      const updated = { ...prev, [id]: value }
      if (schema) setCompletion(calculateCompletion(schema, updated))

      // Debounced auto-save
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        doSave(updated, currentSection)
      }, 2000)

      return updated
    })
  }, [schema, currentSection])

  async function doSave(data: Record<string, any>, section: number) {
    setSaving(true)
    await saveFormProgress(formId, data, section)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Validate current section
  function validateSection(): boolean {
    if (!currentSectionData) return true
    const newErrors: Record<string, string> = {}
    for (const field of currentSectionData.fields) {
      if (!field.required) continue
      const val = fieldData[field.id]
      if (val === undefined || val === null || val === '' || val === false) {
        newErrors[field.id] = 'This field is required'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (!validateSection()) return
    const next = Math.min(currentSection + 1, sections.length - 1)
    setCurrentSection(next)
    doSave(fieldData, next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handlePrev() {
    const prev = Math.max(currentSection - 1, 0)
    setCurrentSection(prev)
    doSave(fieldData, prev)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleManualSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    doSave(fieldData, currentSection)
  }

  async function handleExport(format: 'pdf' | 'docx') {
    setExporting(format)
    await doSave(fieldData, currentSection)
    const url = `/api/forms/${formId}/export?format=${format}`
    if (format === 'pdf') {
      window.open(url, '_blank')
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = `${formMeta?.formType}_${formMeta?.case.applicantName.replace(/[^a-z0-9]/gi,'_')}.docx`
      a.click()
    }
    setExporting(null)
  }

  if (loading || !schema || !formMeta) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
            <p className="text-slate-500 text-sm">Loading form…</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const sectionCompleted = (idx: number) => {
    const sec = sections[idx]
    if (!sec) return false
    return sec.fields.filter(f => f.required).every(f => {
      const v = fieldData[f.id]
      return v !== undefined && v !== null && v !== '' && v !== false
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-start gap-3">
            <Link href={`/case/${caseId}/forms`}>
              <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="purple">{formMeta.formType}</Badge>
                <Badge variant={formMeta.status === 'complete' ? 'approved' : formMeta.status === 'submitted' ? 'submitted' : 'outline'}>
                  {formMeta.status}
                </Badge>
                {saved && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 animate-fade-in">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
                {saving && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3 animate-spin" /> Saving…
                  </span>
                )}
              </div>
              <h1 className="font-display font-bold text-xl text-white">{schema.title}</h1>
              <p className="text-slate-500 text-sm">{formMeta.case.applicantName} · {formMeta.case.visaCategory}</p>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleManualSave} disabled={saving}>
              <Save className="w-4 h-4" /> Save
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={!!exporting}>
              {exporting === 'pdf'
                ? <><Clock className="w-4 h-4 animate-spin" /> Exporting…</>
                : <><Printer className="w-4 h-4" /> PDF Preview</>
              }
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport('docx')} disabled={!!exporting}>
              {exporting === 'docx'
                ? <><Clock className="w-4 h-4 animate-spin" /> Exporting…</>
                : <><Download className="w-4 h-4" /> Download .docx</>
              }
            </Button>
            {schema.uscisUrl && (
              <a href={schema.uscisUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" /> Official Form
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* ── Progress bar ───────────────────────────────────── */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Form Completion</span>
            <span className={cn(
              'text-sm font-bold',
              completion >= 80 ? 'text-emerald-400' : completion >= 50 ? 'text-brand-400' : 'text-amber-400'
            )}>{completion}%</span>
          </div>
          <Progress value={completion} indicatorClassName={cn(
            completion >= 80 ? 'bg-emerald-500' : completion >= 50 ? 'bg-brand-500' : 'bg-amber-500'
          )} />
        </div>

        {/* ── Two-column layout ──────────────────────────────── */}
        <div className="grid lg:grid-cols-4 gap-6">

          {/* Section navigation sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-3 sticky top-6">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-2 px-1">Sections</p>
              <nav className="space-y-0.5">
                {sections.map((sec, idx) => {
                  const isActive    = idx === currentSection
                  const isCompleted = sectionCompleted(idx)
                  const hasErrors   = !isCompleted && idx < currentSection

                  return (
                    <button key={sec.id}
                      onClick={() => { setCurrentSection(idx); doSave(fieldData, idx) }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all duration-150',
                        isActive
                          ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                      )}>
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all',
                        isCompleted ? 'bg-emerald-500 text-white' :
                        hasErrors   ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        isActive    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' :
                                      'bg-white/[0.05] text-slate-600 border border-white/[0.08]'
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                      </div>
                      <span className="truncate leading-tight">{sec.title.replace(/^Part \d+ — /, '')}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Quick stats */}
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">Total sections</span>
                  <span className="text-slate-400">{sections.length}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">Completed</span>
                  <span className="text-emerald-400">{sections.filter((_,i) => sectionCompleted(i)).length}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">Last saved</span>
                  <span className="text-slate-400">
                    {new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date(formMeta.lastSavedAt))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form section */}
          <div className="lg:col-span-3">
            <div className="card p-6 mb-4">
              {currentSectionData && (
                <FormSectionPanel
                  section={currentSectionData}
                  formId={formId}
                  fieldData={fieldData}
                  errors={errors}
                  onFieldChange={handleFieldChange}
                />
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handlePrev} disabled={currentSection === 0}>
                <ArrowLeft className="w-4 h-4" /> Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-slate-600 text-xs">
                  {currentSection + 1} of {sections.length}
                </span>
              </div>

              {currentSection < sections.length - 1 ? (
                <Button onClick={handleNext}>
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => { handleManualSave(); router.push(`/case/${caseId}/forms`) }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete Form
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
