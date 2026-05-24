import { Badge } from '@/components/ui/badge'
import type { CaseStatus } from '@/types/prisma'

const CONFIG: Record<
  CaseStatus,
  { label: string; variant: 'active' | 'submitted' | 'approved' | 'denied' | 'rfe' }
> = {
  active:       { label: 'Active',       variant: 'active'    },
  submitted:    { label: 'Submitted',    variant: 'submitted' },
  approved:     { label: 'Approved',     variant: 'approved'  },
  denied:       { label: 'Denied',       variant: 'denied'    },
  rfe_received: { label: 'RFE Received', variant: 'rfe'       },
}

export function CaseStatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as CaseStatus] ?? CONFIG.active
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
