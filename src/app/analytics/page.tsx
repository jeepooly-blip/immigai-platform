'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Brain, TrendingUp, Clock, BarChart3, Target, Activity } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Cell
} from 'recharts'

const MONTHLY_DATA = [
  { month: 'Aug', h1b: 18, l1: 9, eb2: 7, other: 8 },
  { month: 'Sep', h1b: 22, l1: 11, eb2: 9, other: 13 },
  { month: 'Oct', h1b: 25, l1: 13, eb2: 10, other: 12 },
  { month: 'Nov', h1b: 19, l1: 10, eb2: 8, other: 11 },
  { month: 'Dec', h1b: 28, l1: 14, eb2: 12, other: 11 },
  { month: 'Jan', h1b: 31, l1: 16, eb2: 11, other: 14 },
  { month: 'Feb', h1b: 34, l1: 18, eb2: 14, other: 14 },
  { month: 'Mar', h1b: 29, l1: 15, eb2: 11, other: 12 },
]

const APPROVAL_TREND = [
  { month: 'Aug', rate: 87 },
  { month: 'Sep', rate: 89 },
  { month: 'Oct', rate: 88 },
  { month: 'Nov', rate: 91 },
  { month: 'Dec', rate: 92 },
  { month: 'Jan', rate: 90 },
  { month: 'Feb', rate: 94 },
  { month: 'Mar', rate: 94 },
]

const PROC_TIMES = [
  { type: 'H-1B Regular', avg: 4.2, predicted: 4.5, unit: 'months' },
  { type: 'H-1B Premium', avg: 0.5, predicted: 0.5, unit: 'months' },
  { type: 'L-1A', avg: 6.1, predicted: 6.8, unit: 'months' },
  { type: 'EB-1A', avg: 8.2, predicted: 9.0, unit: 'months' },
  { type: 'EB-2 NIW', avg: 11.4, predicted: 12.1, unit: 'months' },
  { type: 'O-1A', avg: 5.3, predicted: 5.6, unit: 'months' },
]

const PREDICTIONS = [
  { name: 'Zhang, Wei — H-1B', prob: 94, trend: 'up', uscisTime: '3.8 mo' },
  { name: 'Patel, Raj — L-1A', prob: 82, trend: 'stable', uscisTime: '6.2 mo' },
  { name: 'Garcia, Ana — EB-2', prob: 71, trend: 'down', uscisTime: '12.0 mo' },
  { name: 'Kim, Ji-Yeon — O-1A', prob: 88, trend: 'up', uscisTime: '5.1 mo' },
  { name: 'Hassan, Omar — H-1B Ext.', prob: 79, trend: 'stable', uscisTime: '4.2 mo' },
]

const tooltipStyle = {
  backgroundColor: '#161d2e',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 12,
}

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Analytics & Predictions</h1>
            <p className="text-slate-500 text-sm mt-0.5">AI-powered insights from USCIS historical data</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/[0.04] px-3 py-2 rounded-lg border border-white/[0.07]">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Live data · Updated 2h ago
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Avg Approval Rate', value: '94%', sub: '+2% vs last quarter', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Cases Analyzed', value: '3,841', sub: 'AI-processed this year', icon: Brain, color: 'text-brand-400', bg: 'bg-brand-500/10' },
            { label: 'Avg Processing Time', value: '4.8mo', sub: 'H-1B regular processing', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Prediction Accuracy', value: '91%', sub: 'vs actual USCIS outcomes', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 text-xs">{s.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <div className={`font-display font-bold text-2xl ${s.color} mb-1`}>{s.value}</div>
                <div className="text-slate-600 text-xs">{s.sub}</div>
              </div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-5 gap-6 mb-6">
          {/* Filing volume chart */}
          <div className="lg:col-span-3 card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-white">Filing Volume by Visa Type</h3>
                <p className="text-slate-500 text-xs mt-0.5">Monthly breakdown · Last 8 months</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MONTHLY_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="h1b" name="H-1B" fill="#3b8ef8" radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="l1" name="L-1" fill="#a78bfa" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="eb2" name="EB-2/3" fill="#10b981" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="other" name="Other" fill="#374151" radius={[3, 3, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Approval rate trend */}
          <div className="lg:col-span-2 card p-5">
            <div className="mb-5">
              <h3 className="font-semibold text-white">Approval Rate Trend</h3>
              <p className="text-slate-500 text-xs mt-0.5">Your firm vs USCIS avg (78%)</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={APPROVAL_TREND} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="rate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <Area type="monotone" dataKey="rate" name="Approval %" stroke="#10b981" strokeWidth={2} fill="url(#rate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Processing time predictions */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="font-semibold text-white">Processing Time Forecast</h3>
                <p className="text-slate-500 text-xs">AI predicted vs USCIS current avg</p>
              </div>
            </div>
            <div className="space-y-4">
              {PROC_TIMES.map(pt => (
                <div key={pt.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 text-sm">{pt.type}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">Avg: <span className="text-slate-300">{pt.avg}mo</span></span>
                      <span className="text-brand-400 font-medium">Pred: {pt.predicted}mo</span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="absolute h-full bg-white/[0.08] rounded-full" style={{ width: `${(pt.avg / 14) * 100}%` }} />
                    <div
                      className="absolute h-full bg-amber-500/70 rounded-full"
                      style={{ width: `${(pt.predicted / 14) * 100}%`, left: 0 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Case predictions */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Brain className="w-4 h-4 text-brand-400" />
              <div>
                <h3 className="font-semibold text-white">Active Case Predictions</h3>
                <p className="text-slate-500 text-xs">AI approval probability scores</p>
              </div>
            </div>
            <div className="space-y-3">
              {PREDICTIONS.map(p => (
                <div key={p.name} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate mb-1">{p.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.prob >= 90 ? 'bg-emerald-500' : p.prob >= 75 ? 'bg-brand-500' : 'bg-amber-500'}`}
                          style={{ width: `${p.prob}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${p.prob >= 90 ? 'text-emerald-400' : p.prob >= 75 ? 'text-brand-400' : 'text-amber-400'}`}>
                        {p.prob}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-500">Est. time</div>
                    <div className="text-xs text-amber-400 font-medium">{p.uscisTime}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
