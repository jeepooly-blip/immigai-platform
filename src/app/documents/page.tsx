'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  FileText, Upload, Brain, CheckCircle2, Clock, AlertTriangle,
  Download, Eye, Sparkles, Plus, Search, ChevronRight,
  FileCheck, FilePen, FileWarning, Zap
} from 'lucide-react'

const DOCS = [
  { id: 'D-001', name: 'I-129 Petition', case: 'Zhang, Wei (H-1B)', status: 'AI Verified', type: 'Form', updated: '2h ago', pages: 12 },
  { id: 'D-002', name: 'RFE Response Draft', case: 'Garcia, Ana (EB-2)', status: 'Draft Ready', type: 'Legal', updated: '4h ago', pages: 8 },
  { id: 'D-003', name: 'Support Letter', case: 'Patel, Raj (L-1A)', status: 'In Review', type: 'Evidence', updated: '1d ago', pages: 3 },
  { id: 'D-004', name: 'I-140 Petition', case: 'Sharma, Priya (EB-1A)', status: 'AI Verified', type: 'Form', updated: '1d ago', pages: 18 },
  { id: 'D-005', name: 'ETA-9089 Labor Cert.', case: 'Dubois, Marc (H-1B)', status: 'Needs Revision', type: 'Form', updated: '2d ago', pages: 6 },
  { id: 'D-006', name: 'Educational Credentials', case: 'Kim, Ji-Yeon (O-1A)', status: 'Uploaded', type: 'Evidence', updated: '2d ago', pages: 5 },
  { id: 'D-007', name: 'I-485 Adjustment', case: 'Novak, Elena (TN)', status: 'AI Verified', type: 'Form', updated: '3d ago', pages: 14 },
  { id: 'D-008', name: 'Expert Opinion Letter', case: 'Hassan, Omar (H-1B Ext.)', status: 'Draft Ready', type: 'Legal', updated: '3d ago', pages: 4 },
]

const docStatusColors: Record<string, { cls: string; icon: typeof CheckCircle2 }> = {
  'AI Verified': { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  'Draft Ready': { cls: 'bg-brand-500/10 text-brand-400 border-brand-500/20', icon: FilePen },
  'In Review': { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  'Needs Revision': { cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: FileWarning },
  'Uploaded': { cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: FileCheck },
}

const FORM_TYPES = [
  { name: 'I-129 H-1B Petition', desc: 'Non-immigrant worker petition', time: '~8 min', fields: 24 },
  { name: 'I-140 Immigration Petition', desc: 'Immigrant worker petition', time: '~12 min', fields: 31 },
  { name: 'I-485 Adjustment', desc: 'Permanent residence adjustment', time: '~15 min', fields: 47 },
  { name: 'RFE Response', desc: 'Request for evidence response', time: '~20 min', fields: null },
  { name: 'ETA-9089', desc: 'PERM labor certification', time: '~10 min', fields: 38 },
  { name: 'DS-160', desc: 'Nonimmigrant visa application', time: '~6 min', fields: 19 },
]

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'generate'>('all')

  const filtered = DOCS.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.case.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Documents</h1>
            <p className="text-slate-500 text-sm mt-0.5">AI-powered form automation & document management</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Form
            </button>
          </div>
        </div>

        {/* AI Banner */}
        <div className="card border-brand-500/20 bg-brand-500/[0.04] p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-white text-sm font-semibold">AI Document Engine Active</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>
            <p className="text-slate-400 text-xs">2 RFE drafts ready for review · 3 forms auto-completed today · 0 compliance flags</p>
          </div>
          <button className="btn-secondary text-xs flex items-center gap-1.5 flex-shrink-0">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-white/[0.06]">
          {[['all', 'All Documents'], ['generate', 'AI Form Generator']].map(([val, label]) => (
            <button key={val}
              onClick={() => setActiveTab(val as 'all' | 'generate')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === val
                ? 'text-brand-400 border-brand-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'all' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Documents', value: '1,284', icon: FileText, color: 'text-slate-300' },
                { label: 'AI Verified', value: '847', icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'Awaiting Review', value: '23', icon: Clock, color: 'text-amber-400' },
                { label: 'Need Revision', value: '8', icon: AlertTriangle, color: 'text-rose-400' },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="card p-4 flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${s.color} flex-shrink-0`} />
                    <div>
                      <div className={`font-display font-bold text-xl ${s.color}`}>{s.value}</div>
                      <div className="text-slate-500 text-xs">{s.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>

            {/* Document list */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      {['Document', 'Case', 'Type', 'Status', 'Pages', 'Updated', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filtered.map(doc => {
                      const statusInfo = docStatusColors[doc.status] ?? docStatusColors['Uploaded']
                      const StatusIcon = statusInfo.icon
                      return (
                        <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <div className="text-white text-sm font-medium">{doc.name}</div>
                                <div className="text-slate-600 text-xs font-mono">{doc.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 text-sm">{doc.case}</td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs px-2 py-0.5 rounded bg-white/[0.04] text-slate-400">{doc.type}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.cls}`}>
                              <StatusIcon className="w-3 h-3" />
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 text-sm">{doc.pages}p</td>
                          <td className="px-4 py-3.5 text-slate-600 text-xs">{doc.updated}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 rounded hover:bg-white/[0.08] transition-colors">
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                              <button className="p-1.5 rounded hover:bg-white/[0.08] transition-colors">
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* AI Form Generator */
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-1">Select Form Type</h3>
              <p className="text-slate-500 text-sm mb-4">AI will auto-populate from case data</p>
              <div className="space-y-3">
                {FORM_TYPES.map(f => (
                  <button key={f.name}
                    className="w-full card card-hover p-4 flex items-center gap-4 text-left group">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">{f.name}</div>
                      <div className="text-slate-500 text-xs">{f.desc}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-brand-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {f.time}
                      </div>
                      {f.fields && <div className="text-xs text-slate-600 mt-0.5">{f.fields} fields</div>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">RFE Response Generator</h3>
              <p className="text-slate-500 text-sm mb-4">Upload RFE notice and AI will draft the response</p>
              <div className="card p-6 border-dashed border-white/[0.12] hover:border-brand-500/30 transition-colors cursor-pointer mb-4">
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-brand-400" />
                  </div>
                  <p className="text-white text-sm font-medium mb-1">Upload RFE Notice</p>
                  <p className="text-slate-500 text-xs">PDF, DOCX up to 50MB</p>
                </div>
              </div>
              <div className="card p-4 bg-brand-500/[0.03] border-brand-500/20">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium mb-1">AI will automatically:</p>
                    <ul className="space-y-1.5 text-slate-400 text-xs">
                      {[
                        'Analyze RFE grounds and identify required evidence',
                        'Draft persuasive legal arguments',
                        'Pull relevant supporting documents from case file',
                        'Format response per USCIS requirements',
                        'Flag any missing evidence with recommendations',
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
