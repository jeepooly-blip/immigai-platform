import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Users, FolderOpen, CreditCard, Shield, ArrowRight, Activity } from 'lucide-react'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) redirect('/dashboard')

  const [userCount, caseCount, paidCount, recentLogs] = await Promise.all([
    prisma.user.count(),
    prisma.case.count(),
    prisma.user.count({ where: { subscriptionStatus: 'active' } }),
    prisma.adminLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { adminUser: { select: { name: true, email: true } } },
    }),
  ])

  const mrr = paidCount * 79 // simple estimate

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Admin Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Platform oversight and management</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users',    value: userCount,        icon: Users,    color: 'text-brand-600 dark:text-brand-400',    bg: 'bg-brand-50 dark:bg-brand-500/10'    },
            { label: 'Total Cases',    value: caseCount,        icon: FolderOpen, color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-500/10'  },
            { label: 'Paid Accounts',  value: paidCount,        icon: CreditCard, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10'},
            { label: 'Est. MRR',       value: `$${mrr.toLocaleString()}`, icon: Activity, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 text-xs">{s.label}</span>
                  <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                  </div>
                </div>
                <div className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/admin/users"
            className="card p-5 flex items-center justify-between group hover:border-brand-300 dark:hover:border-brand-500/30 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="font-semibold text-slate-900 dark:text-white text-sm">User Management</span>
              </div>
              <p className="text-xs text-slate-500">View, search, and manage all platform users</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
          </Link>
          <Link href="/compliance"
            className="card p-5 flex items-center justify-between group hover:border-brand-300 dark:hover:border-brand-500/30 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="font-semibold text-slate-900 dark:text-white text-sm">Regulatory Alerts</span>
              </div>
              <p className="text-xs text-slate-500">Fetch and manage USCIS alerts</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
          </Link>
        </div>

        <div className="card">
          <div className="p-4 border-b border-slate-200 dark:border-white/[0.05]">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Audit Log</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.03]">
            {recentLogs.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No admin actions recorded yet</div>
            )}
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-xs font-mono bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 mr-2">
                    {log.actionType}
                  </span>
                  <span className="text-xs text-slate-500">by {log.adminUser?.name ?? log.adminUser?.email}</span>
                </div>
                <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
