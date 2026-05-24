'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  Users, Plus, Search, MessageSquare, Globe, Mail,
  Phone, FolderOpen, CheckCircle2, Clock, ChevronRight,
  Building2, Star, MoreHorizontal
} from 'lucide-react'

const CLIENTS = [
  { id: 'CL-001', name: 'Zhang, Wei', company: 'TechCorp Inc.', country: '🇨🇳 China', email: 'w.zhang@techcorp.com', type: 'Individual', cases: 2, status: 'Active', lang: 'Mandarin', rating: 5 },
  { id: 'CL-002', name: 'Patel, Raj', company: 'InnovateTech', country: '🇮🇳 India', email: 'r.patel@innovate.com', type: 'Corporate', cases: 5, status: 'Active', lang: 'Hindi', rating: 4 },
  { id: 'CL-003', name: 'Garcia, Ana', company: 'Global Solutions', country: '🇧🇷 Brazil', email: 'a.garcia@global.com', type: 'Individual', cases: 1, status: 'RFE Pending', lang: 'Portuguese', rating: 4 },
  { id: 'CL-004', name: 'Kim, Ji-Yeon', company: 'Creative Agency', country: '🇰🇷 South Korea', email: 'j.kim@creative.com', type: 'Individual', cases: 1, status: 'Active', lang: 'Korean', rating: 5 },
  { id: 'CL-005', name: 'Novak, Elena', company: 'Finance Group', country: '🇨🇿 Czech Rep.', email: 'e.novak@finance.com', type: 'Individual', cases: 3, status: 'Approved', lang: 'Czech', rating: 5 },
  { id: 'CL-006', name: 'Hassan, Omar', company: 'Energy Corp', country: '🇪🇬 Egypt', email: 'o.hassan@energy.com', type: 'Corporate', cases: 4, status: 'Urgent', lang: 'Arabic', rating: 3 },
  { id: 'CL-007', name: 'Müller, Hans', company: 'AutoGroup AG', country: '🇩🇪 Germany', email: 'h.muller@auto.com', type: 'Corporate', cases: 8, status: 'Active', lang: 'German', rating: 5 },
  { id: 'CL-008', name: 'Sharma, Priya', company: 'PharmaCo', country: '🇮🇳 India', email: 'p.sharma@pharma.com', type: 'Individual', cases: 2, status: 'Active', lang: 'Hindi', rating: 4 },
]

const clientStatusColors: Record<string, string> = {
  'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Approved': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'RFE Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Urgent': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Clients</h1>
            <p className="text-slate-500 text-sm mt-0.5">{CLIENTS.length} clients · {CLIENTS.filter(c => c.type === 'Corporate').length} corporate accounts</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Clients', value: '184', icon: Users, color: 'text-brand-400', bg: 'bg-brand-500/10' },
            { label: 'Corporate Accounts', value: '42', icon: Building2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Languages Supported', value: '12', icon: Globe, color: 'text-teal-400', bg: 'bg-teal-500/10' },
            { label: 'Active Portals', value: '167', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="card p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</div>
                  <div className="text-slate-500 text-xs">{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1 border border-white/[0.07]">
            {(['grid', 'list'] as const).map(v => (
              <button key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${view === v ? 'bg-white/[0.1] text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {v === 'grid' ? '⊞ Grid' : '☰ List'}
              </button>
            ))}
          </div>
        </div>

        {/* Client grid */}
        {view === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(client => (
              <div key={client.id} className="card card-hover p-5 cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/30 to-violet-500/30 flex items-center justify-center text-white font-bold text-lg">
                    {client.name[0]}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${clientStatusColors[client.status] ?? clientStatusColors['Active']}`}>
                      {client.status}
                    </span>
                    <button className="p-1 rounded hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-white font-medium text-sm mb-0.5">{client.name}</div>
                  <div className="text-slate-500 text-xs">{client.company}</div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Globe className="w-3 h-3 flex-shrink-0" />
                    <span>{client.country}</span>
                    <span className="ml-auto text-slate-600">{client.lang}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FolderOpen className="w-3 h-3 flex-shrink-0" />
                    <span>{client.cases} {client.cases === 1 ? 'case' : 'cases'}</span>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${client.type === 'Corporate' ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-500/10 text-slate-400'}`}>
                      {client.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 pt-3 border-t border-white/[0.06]">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all text-xs">
                    <Mail className="w-3 h-3" />
                    Email
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all text-xs">
                    <MessageSquare className="w-3 h-3" />
                    Chat
                  </button>
                  <button className="flex items-center justify-center py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {['Client', 'Company', 'Country', 'Type', 'Cases', 'Language', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(client => (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/30 to-violet-500/30 flex items-center justify-center text-white text-sm font-bold">
                          {client.name[0]}
                        </div>
                        <span className="text-white text-sm font-medium">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-sm">{client.company}</td>
                    <td className="px-4 py-3.5 text-slate-300 text-sm">{client.country}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded ${client.type === 'Corporate' ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-500/10 text-slate-400'}`}>
                        {client.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-sm">{client.cases}</td>
                    <td className="px-4 py-3.5 text-slate-400 text-sm">{client.lang}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${clientStatusColors[client.status] ?? clientStatusColors['Active']}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
