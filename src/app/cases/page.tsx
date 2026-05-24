'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'
import {
  Plus, Search, FolderOpen,
  AlertCircle, CheckCircle2, Clock, Brain
} from 'lucide-react'

const ALL_CASES = [
  { id: 'C-2241', name: 'Zhang, Wei',    company: 'TechCorp Inc.',    type: 'H-1B Cap',        status: 'Approved',     attorney: 'S. Chen',   deadline: 'Apr 1',  prob: 94, priority: 'low'    },
  { id: 'C-2240', name: 'Patel, Raj',    company: 'InnovateTech',     type: 'L-1A Petition',   status: 'In Review',    attorney: 'M. Torres', deadline: 'Apr 15', prob: 82, priority: 'medium' },
  { id: 'C-2239', name: 'Garcia, Ana',   company: 'Global Solutions', type: 'EB-2 NIW',         status: 'RFE Received', attorney: 'S. Chen',   deadline: 'Apr 5',  prob: 71, priority: 'high'   },
  { id: 'C-2238', name: 'Kim, Ji-Yeon',  company: 'Creative Agency',  type: 'O-1A',             status: 'Filed',        attorney: 'A. Patel',  deadline: 'May 2',  prob: 88, priority: 'low'    },
  { id: 'C-2237', name: 'Novak, Elena',  company: 'Finance Group',    type: 'TN Visa',          status: 'Approved',     attorney: 'M. Torres', deadline: '–',      prob: 96, priority: 'low'    },
  { id: 'C-2236', name: 'Hassan, Omar',  company: 'Energy Corp',      type: 'H-1B Extension',  status: 'Pending',      attorney: 'S. Chen',   deadline: 'Mar 29', prob: 79, priority: 'high'   },
  { id: 'C-2235', name: 'Lee, Joon',     company: 'MediaTech',        type: 'L-1B',             status: 'In Review',    attorney: 'A. Patel',  deadline: 'Apr 20', prob: 85, priority: 'medium' },
  { id: 'C-2234', name: 'Sharma, Priya', company: 'PharmaCo',         type: 'EB-1A',            status: 'Filed',        attorney: 'S. Chen',   deadline: 'Jun 1',  prob: 91, priority: 'low'    },
  { id: 'C-2233', name: 'Müller, Hans',  company: 'AutoGroup',        type: 'E-3',              status: 'Approved',     attorney: 'M. Torres', deadline: '–',      prob: 97, priority: 'low'    },
  { id: 'C-2232', name: 'Dubois, Marc',  company: 'Consulting LLC',   type: 'H-1B Cap',         status: 'Pending',      attorney: 'A. Patel',  deadline: 'Apr 10', prob: 76, priority: 'medium' },
]

const STATUS_FILTERS = ['All', 'Pending', 'In Review', 'Filed', 'Approved', 'RFE Received']

const statusColors: Record<string, string> = {
  'Approved':     'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  'In Review':    'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  'RFE Received': 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  'Filed':        'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
  'Pending':      'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
}

const priorityDot: Record<string, string> = {
  high: 'bg-rose-500', medium: 'bg-amber-500', low: 'bg-emerald-500',
}

export default function CasesPage() {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = ALL_CASES.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white">Cases</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {ALL_CASES.length} total · {ALL_CASES.filter(c => c.priority === 'high').length} high priority
            </p>
          </div>
          <Link href="/case/create"
            className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> New Case
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {[
            { label: 'Total Active',        value: '248', icon: FolderOpen,   color: 'text-brand-600 dark:text-brand-400',   bg: 'bg-brand-50 dark:bg-brand-500/10'   },
            { label: 'High Priority',       value: '14',  icon: AlertCircle,  color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-50 dark:bg-rose-500/10'     },
            { label: 'Due This Week',       value: '7',   icon: Clock,        color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10'   },
            { label: 'Approved YTD',        value: '312', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="card p-3 sm:p-4 flex items-center gap-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
                </div>
                <div>
                  <div className={`font-display font-bold text-xl sm:text-2xl ${s.color}`}>{s.value}</div>
                  <div className="text-slate-500 text-xs leading-tight">{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Search + filters */}
        <div className="card p-3 sm:p-4 mb-4 sm:mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, type, company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          {/* Status filters — scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  statusFilter === f
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14]'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Cases table — card list on mobile, table on desktop */}
        <div className="card overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_120px_100px_80px_80px] gap-4 px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wide">
            <span>Applicant</span>
            <span>Type</span>
            <span>Status</span>
            <span>Attorney</span>
            <span>Deadline</span>
            <span>Score</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No cases match your search</div>
            ) : filtered.map(c => (
              <div key={c.id} className="group">
                {/* Mobile card view */}
                <div className="md:hidden p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[c.priority]}`} />
                        <span className="font-medium text-slate-900 dark:text-white text-sm">{c.name}</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5 ml-4">{c.company}</div>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[c.status] ?? ''}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between ml-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{c.type}</span>
                    <span className="flex items-center gap-1">
                      <Brain className="w-3 h-3" />{c.prob}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between ml-4 text-xs text-slate-400">
                    <span>{c.attorney}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.deadline}</span>
                  </div>
                </div>

                {/* Desktop row view */}
                <div className="hidden md:grid grid-cols-[1fr_1fr_120px_100px_80px_80px] gap-4 px-4 py-3.5 items-center hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[c.priority]}`} />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white text-sm truncate">{c.name}</div>
                      <div className="text-slate-400 text-xs truncate">{c.company}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm truncate">{c.type}</div>
                    <div className="text-slate-400 text-xs">{c.id}</div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${statusColors[c.status] ?? ''}`}>
                    {c.status}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 text-sm">{c.attorney}</span>
                  <span className="text-slate-600 dark:text-slate-400 text-sm">{c.deadline}</span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-sm">
                    <Brain className="w-3 h-3 text-brand-500" />{c.prob}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-400 text-xs mt-3 text-center">{filtered.length} of {ALL_CASES.length} cases shown</p>
      </div>
    </DashboardLayout>
  )
}
