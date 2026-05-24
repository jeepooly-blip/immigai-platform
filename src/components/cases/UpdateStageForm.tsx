'use client'

import { useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { updateCaseStage } from '@/lib/actions/cases'
import { CASE_STAGES } from '@/types'

type StatusValue = 'active' | 'submitted' | 'approved' | 'denied' | 'rfe_received'

const STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: 'active',       label: 'Active'       },
  { value: 'submitted',    label: 'Submitted'    },
  { value: 'approved',     label: 'Approved'     },
  { value: 'denied',       label: 'Denied'       },
  { value: 'rfe_received', label: 'RFE Received' },
]

interface UpdateStageFormProps {
  caseId: string
  currentStage: string
  currentStatus: string
  onSuccess?: () => void
}

export function UpdateStageForm({
  caseId,
  currentStage,
  currentStatus,
  onSuccess,
}: UpdateStageFormProps) {
  const [stage, setStage]   = useState(currentStage)
  const [status, setStatus] = useState<StatusValue>(currentStatus as StatusValue)
  const [note, setNote]     = useState('')
  const [error, setError]   = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await updateCaseStage({ caseId, newStage: stage, newStatus: status, note: note.trim() || undefined })
      if (!res.success) {
        setError(res.error ?? 'Something went wrong')
      } else {
        setNote('')
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="stage">Case Stage</Label>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger id="stage"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CASE_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Case Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusValue)}>
          <SelectTrigger id="status"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" placeholder="Add a note for the timeline…" value={note} onChange={e => setNote(e.target.value)} rows={3} />
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? 'Updating…' : 'Update Stage'}
      </Button>
    </form>
  )
}
