import { CheckCircle2, Clock, AlertTriangle, XCircle, FileText } from 'lucide-react'

interface DocumentStatsProps {
  documents: { verificationStatus: string }[]
}

export function DocumentStats({ documents }: DocumentStatsProps) {
  const total    = documents.length
  const verified = documents.filter(d => d.verificationStatus === 'verified').length
  const pending  = documents.filter(d => d.verificationStatus === 'pending').length
  const flagged  = documents.filter(d => d.verificationStatus === 'flagged').length
  const expired  = documents.filter(d => d.verificationStatus === 'expired').length

  const stats = [
    { label: 'Total',    value: total,    icon: FileText,    color: 'text-slate-400',   bg: 'bg-white/[0.04]'    },
    { label: 'Verified', value: verified, icon: CheckCircle2,color: 'text-emerald-400', bg: 'bg-emerald-500/10'  },
    { label: 'Pending',  value: pending,  icon: Clock,       color: 'text-amber-400',   bg: 'bg-amber-500/10'    },
    { label: 'Flagged',  value: flagged,  icon: AlertTriangle,color:'text-rose-400',    bg: 'bg-rose-500/10'     },
    { label: 'Expired',  value: expired,  icon: XCircle,     color: 'text-slate-500',   bg: 'bg-slate-500/10'    },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {stats.map(s => {
        const Icon = s.icon
        return (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 flex flex-col items-center gap-1`}>
            <Icon className={`w-4 h-4 ${s.color}`} />
            <span className={`font-display font-bold text-xl ${s.color}`}>{s.value}</span>
            <span className="text-slate-600 text-[10px] uppercase tracking-wide">{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}
