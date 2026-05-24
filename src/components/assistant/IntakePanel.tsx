'use client'

import { User, MapPin, Briefcase, GraduationCap, Heart, AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IntakeData } from '@/types/prisma'

const FIELD_CONFIG: { key: keyof IntakeData; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'name',                 label: 'Name',                  icon: User,         color: 'text-brand-400'   },
  { key: 'email',                label: 'Email',                 icon: Mail,         color: 'text-teal-400'    },
  { key: 'nationality',          label: 'Nationality',           icon: MapPin,       color: 'text-violet-400'  },
  { key: 'currentStatus',        label: 'Current Status',        icon: AlertCircle,  color: 'text-amber-400'   },
  { key: 'immigrationGoal',      label: 'Immigration Goal',      icon: CheckCircle2, color: 'text-emerald-400' },
  { key: 'employmentSituation',  label: 'Employment',            icon: Briefcase,    color: 'text-brand-400'   },
  { key: 'familyTies',           label: 'Family Ties',           icon: Heart,        color: 'text-pink-400'    },
  { key: 'educationLevel',       label: 'Education',             icon: GraduationCap,color: 'text-violet-400'  },
  { key: 'urgency',              label: 'Urgency',               icon: AlertCircle,  color: 'text-rose-400'    },
  { key: 'priorViolations',      label: 'Prior Issues',          icon: AlertCircle,  color: 'text-amber-400'   },
]

interface IntakePanelProps {
  intakeData: IntakeData
}

export function IntakePanel({ intakeData }: IntakePanelProps) {
  const filled   = FIELD_CONFIG.filter(f => intakeData[f.key])
  const unfilled = FIELD_CONFIG.filter(f => !intakeData[f.key])
  const pct      = Math.round((filled.length / FIELD_CONFIG.length) * 100)

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">Intake Progress</span>
          <span className={cn(
            'text-xs font-bold',
            pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-brand-400' : 'text-amber-400'
          )}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500',
              pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-brand-500' : 'bg-amber-500'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Filled fields */}
      {filled.length > 0 && (
        <div className="space-y-1.5">
          {filled.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', color)} />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-600">{label}</p>
                <p className="text-xs text-slate-300 truncate">{String(intakeData[key])}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending fields */}
      {unfilled.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Still needed</p>
          <div className="flex flex-wrap gap-1.5">
            {unfilled.map(({ key, label, icon: Icon }) => (
              <span key={key} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-600">
                <Icon className="w-2.5 h-2.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {pct >= 80 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300 leading-relaxed">
            Intake nearly complete! An attorney can now review your case.
          </p>
        </div>
      )}
    </div>
  )
}
