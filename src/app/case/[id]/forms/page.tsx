import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFormsForCase, createForm } from '@/lib/actions/forms'
import { getRecommendedForms, getFormSchema, FORM_CATALOG } from '@/lib/form-schemas'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, FileText, Plus, CheckCircle2, Clock, Download,
  ChevronRight, Sparkles, ExternalLink, AlertCircle, Brain,
  FileCheck, RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: 'In Progress', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  complete:  { label: 'Complete',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  submitted: { label: 'Submitted',   color: 'text-brand-400',   bg: 'bg-brand-500/10',   border: 'border-brand-500/20'   },
  exported:  { label: 'Exported',    color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
}

function FormStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border', cfg.color, cfg.bg, cfg.border)}>
      {status === 'complete' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'draft'    && <Clock        className="w-3 h-3" />}
      {cfg.label}
    </span>
  )
}

async function StartFormButton({ caseId, formType }: { caseId: string; formType: string }) {
  return (
    <form action={async () => {
      'use server'
      await createForm(caseId, formType)
    }}>
      <button type="submit" className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg">
        <Plus className="w-3.5 h-3.5" /> Start
      </button>
    </form>
  )
}

export default async function FormsListPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return notFound()

  const caseData = await prisma.case.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, applicantName: true, visaCategory: true, caseType: true, status: true },
  })
  if (!caseData || caseData.userId !== session.user.id) return notFound()

  const forms      = await getFormsForCase(params.id)
  const recommended = getRecommendedForms(caseData.caseType, caseData.visaCategory)
  const allCatalog  = FORM_CATALOG

  // Partition into started and not-started
  const startedTypes  = new Set(forms.map((f:any) => f.formType))
  const notStarted    = recommended.filter((r:any) => !startedTypes.has(r.formType))
  const otherForms    = allCatalog.filter((f:any) => !startedTypes.has(f.formType) && !recommended.find((r:any) => r.formType === f.formType))

  // Aggregate stats
  const totalComplete   = forms.filter((f:any) => f.completionPercentage === 100).length
  const avgCompletion   = forms.length ? Math.round(forms.reduce((s:number, f:any) => s + f.completionPercentage, 0) / forms.length) : 0

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-start gap-3">
            <Link href={`/case/${params.id}`}>
              <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Form Generator</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {caseData.applicantName} · {caseData.visaCategory} ·{' '}
                {forms.length} form{forms.length !== 1 ? 's' : ''} started
              </p>
            </div>
          </div>
        </div>

        {/* ── Summary stats ───────────────────────────────────── */}
        {forms.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Forms Started',  value: String(forms.length),         color: 'text-brand-400'   },
              { label: 'Complete',       value: String(totalComplete),         color: 'text-emerald-400' },
              { label: 'Avg Completion', value: `${avgCompletion}%`,           color: 'text-violet-400'  },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className={`font-display font-bold text-3xl ${s.color} mb-0.5`}>{s.value}</div>
                <div className="text-slate-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left: Started forms ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {forms.length > 0 && (
              <div>
                <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-brand-400" />
                  Your Forms
                </h2>
                <div className="space-y-3">
                  {forms.map((form:any) => {
                    const schema = getFormSchema(form.formType)
                    const catalog = FORM_CATALOG.find((c:any) => c.formType === form.formType)
                    return (
                      <Card key={form.id} className="hover:border-white/[0.12] transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={cn(
                              'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0',
                              catalog?.color ?? 'from-slate-500/20 to-slate-600/5 border-slate-500/20'
                            )}>
                              {catalog?.icon ?? '📄'}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-display font-bold text-white text-lg">{form.formType}</span>
                                    <FormStatusBadge status={form.status} />
                                  </div>
                                  <p className="text-slate-500 text-sm">{schema?.title ?? form.formType}</p>
                                </div>
                              </div>

                              {/* Progress */}
                              <div className="mb-3">
                                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                                  <span>Completion</span>
                                  <span className={cn(
                                    'font-medium',
                                    form.completionPercentage >= 80 ? 'text-emerald-400' :
                                    form.completionPercentage >= 50 ? 'text-brand-400' : 'text-amber-400'
                                  )}>{form.completionPercentage}%</span>
                                </div>
                                <Progress
                                  value={form.completionPercentage}
                                  className="h-2"
                                  indicatorClassName={cn(
                                    form.completionPercentage >= 80 ? 'bg-emerald-500' :
                                    form.completionPercentage >= 50 ? 'bg-brand-500' : 'bg-amber-500'
                                  )}
                                />
                              </div>

                              {/* Section info */}
                              {schema && (
                                <p className="text-slate-600 text-xs mb-3">
                                  Section {form.currentSection + 1} of {schema.sections.length} ·{' '}
                                  Last saved {new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(form.lastSavedAt))}
                                </p>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/case/${params.id}/forms/${form.id}`}>
                                  <Button size="sm" className="h-8 text-xs gap-1.5">
                                    {form.completionPercentage === 100
                                      ? <><FileCheck className="w-3.5 h-3.5" /> Review</>
                                      : <><ChevronRight className="w-3.5 h-3.5" /> Continue</>
                                    }
                                  </Button>
                                </Link>

                                <a href={`/api/forms/${form.id}/export?format=pdf`} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                                    <ExternalLink className="w-3.5 h-3.5" /> PDF
                                  </Button>
                                </a>

                                <a href={`/api/forms/${form.id}/export?format=docx`} download>
                                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                                    <Download className="w-3.5 h-3.5" /> .docx
                                  </Button>
                                </a>

                                {schema?.uscisUrl && (
                                  <a href={schema.uscisUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-slate-500 hover:text-slate-300">
                                      <ExternalLink className="w-3 h-3" /> Official
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {forms.length === 0 && (
              <div className="card p-12 text-center">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">No forms started yet</h3>
                <p className="text-slate-500 text-sm mb-5 max-w-xs mx-auto">
                  Start a recommended form or choose from the full catalog on the right.
                  Fields auto-populate from your case data.
                </p>
              </div>
            )}

            {/* Recommended forms to start */}
            {notStarted.length > 0 && (
              <div>
                <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Recommended for {caseData.visaCategory}
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {notStarted.map(cat => {
                    const schema = getFormSchema(cat.formType)
                    return (
                      <div key={cat.formType} className={cn(
                        'card p-4 border bg-gradient-to-br flex items-start gap-3 hover:border-opacity-50 transition-colors',
                        cat.color
                      )}>
                        <span className="text-2xl flex-shrink-0">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-white text-base">{cat.formType}</div>
                          <p className="text-slate-400 text-xs mt-0.5 mb-3">{cat.subtitle}</p>
                          {schema && (
                            <p className="text-slate-600 text-[10px] mb-3">
                              {schema.sections.length} sections · ~{schema.sections.reduce((a,s)=>a+s.fields.length,0)} fields
                            </p>
                          )}
                          <form action={async () => {
                            'use server'
                            await createForm(params.id, cat.formType)
                          }}>
                            <button type="submit" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors">
                              <Plus className="w-3.5 h-3.5" /> Start Form
                            </button>
                          </form>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Catalog + info ────────────────────────────── */}
          <div className="space-y-5">

            {/* All available forms */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <CardTitle className="text-sm">All Forms</CardTitle>
                </div>
                <CardDescription>Available for any case type</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {FORM_CATALOG.map(cat => {
                  const alreadyStarted = startedTypes.has(cat.formType)
                  const existingForm   = forms.find((f:any) => f.formType === cat.formType)
                  return (
                    <div key={cat.formType}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                      <span className="text-lg flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-sm font-medium">{cat.formType}</span>
                          {alreadyStarted && <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                        </div>
                        <p className="text-slate-600 text-[10px] truncate">{cat.subtitle}</p>
                      </div>
                      {alreadyStarted ? (
                        <Link href={`/case/${params.id}/forms/${existingForm?.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-brand-400">Open</Button>
                        </Link>
                      ) : (
                        <form action={async () => {
                          'use server'
                          await createForm(params.id, cat.formType)
                        }}>
                          <button type="submit" className="text-[10px] px-2.5 py-1 rounded-lg border border-white/[0.08] text-slate-500 hover:text-white hover:border-brand-500/30 transition-colors">
                            Start
                          </button>
                        </form>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* AI info card */}
            <Card className="border-brand-500/20 bg-brand-500/[0.03]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-400" />
                  <CardTitle className="text-sm">AI Form Assistance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {[
                  { icon: '🤖', label: 'Auto-populate', desc: 'Fields filled from case data' },
                  { icon: '✍️', label: 'AI Narratives', desc: 'NIW, support letters, duty descriptions' },
                  { icon: '💾', label: 'Auto-save',      desc: 'Progress saved every 2 seconds' },
                  { icon: '📄', label: 'PDF export',     desc: 'Formatted for attorney review' },
                  { icon: '📝', label: 'Word export',    desc: '.docx with editable fields' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <div>
                      <p className="text-white text-xs font-medium">{item.label}</p>
                      <p className="text-slate-600 text-[10px]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
