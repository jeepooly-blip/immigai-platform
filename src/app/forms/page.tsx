import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileText, ChevronRight, Download, ExternalLink, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FORM_CATALOG } from '@/lib/form-schemas'

export default async function FormsGlobalPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const forms = await prisma.form.findMany({
    where: { userId: session.user.id },
    include: { case: { select: { id: true, applicantName: true, visaCategory: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  const catalog = FORM_CATALOG

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-white">All Forms</h1>
          <p className="text-slate-500 text-sm mt-0.5">{forms.length} form{forms.length !== 1 ? 's' : ''} across all cases</p>
        </div>

        {forms.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-1">No forms yet</h3>
            <p className="text-slate-500 text-sm mb-5">Open a case to start generating forms.</p>
            <Link href="/cases"><Button>Go to Cases</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {forms.map((form:any) => {
              const cat = catalog.find(c => c.formType === form.formType)
              return (
                <div key={form.id} className="card p-4 hover:border-white/[0.12] transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl flex-shrink-0">{cat?.icon ?? '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-display font-bold text-white">{form.formType}</span>
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                          form.completionPercentage === 100 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        )}>
                          {form.completionPercentage === 100 ? 'Complete' : 'In Progress'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs">{form.case.applicantName} · {form.case.visaCategory}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 max-w-[120px]">
                          <Progress value={form.completionPercentage} className="h-1" />
                        </div>
                        <span className="text-[10px] text-slate-500">{form.completionPercentage}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/case/${form.case.id}/forms/${form.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5" /> Open
                        </Button>
                      </Link>
                      <a href={`/api/forms/${form.id}/export?format=pdf`} target="_blank">
                        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-slate-400">
                          <ExternalLink className="w-3.5 h-3.5" /> PDF
                        </Button>
                      </a>
                      <a href={`/api/forms/${form.id}/export?format=docx`} download>
                        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-slate-400">
                          <Download className="w-3.5 h-3.5" /> .docx
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
