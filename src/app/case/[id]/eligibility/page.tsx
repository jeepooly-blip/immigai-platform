'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { EligibilityInput, EligibilityResult } from '@/lib/ai-engines/eligibility'

const LIKELIHOOD_COLOR = {
  high:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low:    'text-red-600 bg-red-50 border-red-200',
}

export default function EligibilityPage({ params }: { params: { id: string } }) {
  const [form, setForm]     = useState<Partial<EligibilityInput>>({})
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const set = (k: keyof EligibilityInput, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function analyze() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, caseId: params.id }),
      })
      setResult(await res.json())
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Eligibility Analysis</h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered visa pathway screening — not a substitute for legal advice</p>
        </div>

        {!result && (
          <Card>
            <CardHeader><CardTitle className="text-base">Client Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Nationality</label>
                  <input className="input w-full" placeholder="e.g. India" onChange={e => set('nationality', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Current Status</label>
                  <select className="input w-full" onChange={e => set('current_visa_status', e.target.value)}>
                    <option value="">Select…</option>
                    <option value="h1b">H-1B</option>
                    <option value="f1">F-1 Student</option>
                    <option value="lpr">LPR / Green Card</option>
                    <option value="us_citizen">US Citizen</option>
                    <option value="b1b2">B-1/B-2 Visitor</option>
                    <option value="out_of_status">Out of Status</option>
                    <option value="abroad">Abroad</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Immigration Goal</label>
                  <select className="input w-full" onChange={e => set('immigration_goal', e.target.value)}>
                    <option value="">Select…</option>
                    <option value="work">Work Visa / Authorization</option>
                    <option value="pr">Permanent Residence (Green Card)</option>
                    <option value="study">Study (F-1)</option>
                    <option value="family">Family-based</option>
                    <option value="visit">Visit / Tourism</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Education Level</label>
                  <select className="input w-full" onChange={e => set('education_level', e.target.value)}>
                    <option value="">Select…</option>
                    <option value="high_school">High School</option>
                    <option value="associates">Associate's</option>
                    <option value="bachelors">Bachelor's</option>
                    <option value="masters">Master's</option>
                    <option value="phd">PhD</option>
                    <option value="professional">Professional (JD/MD)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Employment Situation</label>
                  <select className="input w-full" onChange={e => set('employment_situation', e.target.value)}>
                    <option value="">Select…</option>
                    <option value="employer_sponsorship">US Employer Willing to Sponsor</option>
                    <option value="extraordinary_ability">Extraordinary Ability / Top Field</option>
                    <option value="multinational_manager">Multinational Manager/Executive</option>
                    <option value="self_employed">Self-employed / Entrepreneur</option>
                    <option value="none">None / Not Working</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Family Ties (US)</label>
                  <select className="input w-full" onChange={e => set('family_relationships', e.target.value ? [e.target.value] : [])}>
                    <option value="">None</option>
                    <option value="us_citizen_spouse">US Citizen Spouse</option>
                    <option value="us_citizen_parent">US Citizen Parent</option>
                    <option value="lpr_spouse">LPR Spouse</option>
                    <option value="us_citizen_child">US Citizen Child (21+)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Prior Immigration Violations?</label>
                <select className="input w-full" onChange={e => set('prior_violations', e.target.value)}>
                  <option value="none">None</option>
                  <option value="visa_overstay">Visa overstay</option>
                  <option value="removal">Removal / Deportation</option>
                  <option value="criminal">Criminal history</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Button onClick={analyze} disabled={loading || !form.nationality} className="w-full">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing…</> : <><Brain className="w-4 h-4 mr-2" />Run Eligibility Analysis</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            <div className="card p-4 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">{result.plain_language_summary}</p>
              {result.consult_attorney && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">⚖️ Attorney consultation required for case-specific advice</p>
              )}
            </div>

            {result.barriers?.length > 0 && (
              <div className="card p-4 border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Potential Barriers</span>
                </div>
                <ul className="space-y-1">
                  {result.barriers.map((b, i) => <li key={i} className="text-xs text-amber-700 dark:text-amber-400">• {b}</li>)}
                </ul>
              </div>
            )}

            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Eligible Pathways ({result.eligible_pathways.length})</h2>
              <div className="space-y-3">
                {result.eligible_pathways.map(p => (
                  <div key={p.visa_type} className="card overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === p.visa_type ? null : p.visa_type)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">{p.visa_type}</div>
                          <div className="text-xs text-slate-500">{p.full_name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${LIKELIHOOD_COLOR[p.likelihood]}`}>
                          {p.likelihood} likelihood
                        </span>
                        {expanded === p.visa_type ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                    {expanded === p.visa_type && (
                      <div className="px-4 pb-4 border-t border-slate-200 dark:border-white/[0.05] pt-4 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-slate-500 mb-1">Timeline</div>
                          <div className="text-sm text-slate-700 dark:text-slate-300">{p.estimated_timeline}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-500 mb-1">Key Requirements</div>
                          <ul className="space-y-0.5">
                            {p.key_requirements.map((r, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-400">• {r}</li>)}
                          </ul>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs font-medium text-slate-500 mb-1">Next Steps</div>
                          <ul className="space-y-0.5">
                            {p.next_steps.map((s, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-400">{i + 1}. {s}</li>)}
                          </ul>
                        </div>
                        {p.notes && (
                          <div className="col-span-2 text-xs text-slate-500 italic">{p.notes}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {result.ineligible_pathways?.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Ineligible Pathways</h2>
                <div className="space-y-2">
                  {result.ineligible_pathways.map(p => (
                    <div key={p.visa_type} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
                      <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.visa_type}</span>
                        <span className="text-xs text-slate-500 ml-2">— {p.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" onClick={() => setResult(null)} className="w-full">Run New Analysis</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
