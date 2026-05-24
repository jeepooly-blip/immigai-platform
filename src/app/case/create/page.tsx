'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, ArrowRight, User, Building2, Calendar, Brain,
  CheckCircle2, Sparkles, Heart, Briefcase, DollarSign, GraduationCap,
  FileText, Clock
} from 'lucide-react'
import { createCase } from '@/lib/actions/cases'
import { getAllVisaCategories, getWorkflow } from '@/lib/workflow'
import { CASE_TYPE_COLORS, CASE_TYPE_ICONS } from '@/types'
import { cn } from '@/lib/utils'

type CaseType = 'family' | 'employment' | 'investor' | 'student'

const CASE_TYPES: { value: CaseType; label: string; desc: string; icon: React.ElementType; examples: string[] }[] = [
  { value: 'family',     label: 'Family',     icon: Heart,         desc: 'Spouse, children, fiancé petitions',       examples: ['Marriage Green Card', 'K-1 Fiancé Visa', 'IR-2 Child'] },
  { value: 'employment', label: 'Employment', icon: Briefcase,     desc: 'Work visas and employment green cards',    examples: ['H-1B', 'L-1A', 'O-1A', 'EB-2 NIW', 'EB-1A'] },
  { value: 'investor',   label: 'Investor',   icon: DollarSign,    desc: 'Treaty investors and EB-5 programs',       examples: ['EB-5 Regional Center', 'E-2 Treaty'] },
  { value: 'student',    label: 'Student',    icon: GraduationCap, desc: 'Academic and exchange visitor visas',      examples: ['F-1 Student', 'J-1 Exchange', 'F-1 OPT'] },
]

const allCategories = getAllVisaCategories()

export default function CreateCasePage() {
  const router       = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError]            = useState('')
  const [step, setStep]              = useState<1 | 2 | 3>(1)

  // Form state
  const [caseType, setCaseType]             = useState<CaseType | ''>('')
  const [visaCategory, setVisaCategory]     = useState('')
  const [petitionerType, setPetitionerType] = useState<'individual' | 'company'>('individual')

  const filteredCategories = caseType ? allCategories.filter(c => c.caseType === caseType) : []
  const workflow            = visaCategory ? getWorkflow(visaCategory) : null

  function handleSubmit(formData: FormData) {
    setError('')
    formData.set('visaCategory', visaCategory)
    formData.set('caseType',     caseType)
    formData.set('petitionerType', petitionerType)
    startTransition(async () => {
      try {
        await createCase(formData)
      } catch (err: any) {
        if (!err?.message?.includes('NEXT_REDIRECT')) {
          setError(err?.message ?? 'Failed to create case.')
        }
      }
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(s => (s - 1) as 1|2|3) : router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Open New Case</h1>
            <p className="text-slate-500 text-sm mt-0.5">AI auto-generates checklist, timeline, and deadlines</p>
          </div>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-2">
            {([1,2,3] as const).map(s => (
              <div key={s} className={cn(
                'w-8 h-1.5 rounded-full transition-all duration-300',
                step >= s ? 'bg-brand-500' : 'bg-white/[0.08]'
              )} />
            ))}
          </div>
        </div>

        {/* ── Step 1: Case Type ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h2 className="font-display font-semibold text-xl text-white mb-2">What type of case is this?</h2>
            <p className="text-slate-500 text-sm mb-6">This determines the visa categories and workflow available.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {CASE_TYPES.map(ct => {
                const Icon = ct.icon
                const selected = caseType === ct.value
                return (
                  <button key={ct.value} onClick={() => { setCaseType(ct.value); setVisaCategory('') }}
                    className={cn(
                      'p-5 rounded-2xl border text-left transition-all duration-200 group',
                      selected
                        ? 'border-brand-500/50 bg-brand-500/10 shadow-glow-sm'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]'
                    )}>
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors text-xl',
                        selected ? 'bg-brand-500/20' : 'bg-white/[0.06] group-hover:bg-white/[0.09]'
                      )}>
                        {CASE_TYPE_ICONS[ct.value]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('font-display font-semibold text-base', selected ? 'text-brand-300' : 'text-white')}>
                            {ct.label}
                          </span>
                          {selected && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                        </div>
                        <p className="text-slate-500 text-sm mb-3">{ct.desc}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ct.examples.map(e => (
                            <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-500 border border-white/[0.06]">
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!caseType} size="lg">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Visa Category ─────────────────────────────────── */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h2 className="font-display font-semibold text-xl text-white mb-2">Select visa category</h2>
            <p className="text-slate-500 text-sm mb-6">AI will auto-generate the full workflow for this category.</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {filteredCategories.map(cat => {
                const wf       = getWorkflow(cat.value)
                const selected = visaCategory === cat.value
                return (
                  <button key={cat.value} onClick={() => setVisaCategory(cat.value)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all duration-200 group',
                      selected
                        ? 'border-brand-500/50 bg-brand-500/10'
                        : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                    )}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={cn('font-medium text-sm', selected ? 'text-brand-300' : 'text-white')}>
                        {cat.label}
                      </span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{wf.estimatedProcessingTime}mo</span>
                      <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> {wf.approvalProbabilityScore}% avg</span>
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {wf.checklist.length} items</span>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!visaCategory} size="lg">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Case Details ──────────────────────────────────── */}
        {step === 3 && (
          <form action={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-6 animate-fade-up">
              <div className="lg:col-span-2 space-y-5">

                {/* Summary banner */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/[0.06] border border-brand-500/20">
                  <span className="text-2xl">{CASE_TYPE_ICONS[caseType]}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{visaCategory}</p>
                    <p className="text-slate-500 text-xs capitalize">{caseType} · ~{workflow?.estimatedProcessingTime} months · {workflow?.approvalProbabilityScore}% avg approval</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)} className="ml-auto text-xs">Change</Button>
                </div>

                {/* Applicant */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-brand-400" /><CardTitle>Applicant</CardTitle></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="applicantName">Full Name <span className="text-rose-400">*</span></Label>
                        <Input id="applicantName" name="applicantName" placeholder="Last, First" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="applicantEmail">Email Address</Label>
                        <Input id="applicantEmail" name="applicantEmail" type="email" placeholder="applicant@email.com" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Petitioner */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-teal-400" /><CardTitle>Petitioner</CardTitle></div>
                    <CardDescription>Who is sponsoring / filing on behalf of the applicant?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {(['individual', 'company'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setPetitionerType(t)}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all',
                            petitionerType === t
                              ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                              : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/[0.14]'
                          )}>
                          {t === 'company' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="petitionerName">{petitionerType === 'company' ? 'Company Name' : 'Petitioner Name'}</Label>
                      <Input id="petitionerName" name="petitionerName" placeholder={petitionerType === 'company' ? 'e.g. TechCorp Inc.' : 'e.g. Self-petitioned'} />
                    </div>
                  </CardContent>
                </Card>

                {/* Dates + notes */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-400" /><CardTitle>Additional Details</CardTitle></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="estimatedCompletionDate">Target Completion Date</Label>
                      <Input id="estimatedCompletionDate" name="estimatedCompletionDate" type="date" min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="notes">Internal Notes</Label>
                      <Textarea id="notes" name="notes" placeholder="Client preferences, special considerations, strategy notes…" rows={3} />
                    </div>
                  </CardContent>
                </Card>

                {error && <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>}

                <div className="flex items-center justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={isPending}>Back</Button>
                  <Button type="submit" size="lg" disabled={isPending}>
                    {isPending ? (
                      <><span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Creating…</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Create Case & Generate Workflow</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right: Workflow preview */}
              <div className="space-y-4">
                {workflow && (
                  <>
                    <Card className="border-brand-500/20 bg-brand-500/[0.03]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-brand-400" /><CardTitle className="text-sm">AI Will Generate</CardTitle></div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        {[
                          { icon: '📋', label: `${workflow.checklist.length} checklist items`, sub: `${workflow.checklist.filter(i=>i.required).length} required` },
                          { icon: '📅', label: `${workflow.timelineEvents.length} timeline events`, sub: 'auto-scheduled' },
                          { icon: '⏰', label: `${workflow.deadlines.length} deadlines`, sub: 'with alerts' },
                          { icon: '🎯', label: `${workflow.approvalProbabilityScore}% base approval`, sub: 'AI probability' },
                          { icon: '🕐', label: `~${workflow.estimatedProcessingTime} month timeline`, sub: 'estimated processing' },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-2.5">
                            <span className="text-base">{item.icon}</span>
                            <div>
                              <p className="text-white text-xs font-medium">{item.label}</p>
                              <p className="text-slate-600 text-[10px]">{item.sub}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Key Forms Required</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5">
                          {workflow.checklist.filter(i => i.formCode).map(i => (
                            <span key={i.formCode} className="text-xs px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono">
                              {i.formCode}
                            </span>
                          ))}
                          {workflow.checklist.filter(i => i.formCode).length === 0 && (
                            <span className="text-slate-600 text-xs">No USCIS forms required</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Checklist Preview</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-1.5">
                        {workflow.checklist.slice(0, 6).map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-slate-700 flex-shrink-0 mt-0.5" />
                            <span className={item.required ? '' : 'opacity-60'}>{item.itemLabel}{!item.required && ' (optional)'}</span>
                          </div>
                        ))}
                        {workflow.checklist.length > 6 && (
                          <p className="text-slate-700 text-xs pl-5">+{workflow.checklist.length - 6} more items…</p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
