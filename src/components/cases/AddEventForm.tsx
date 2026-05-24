'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { addTimelineEvent } from '@/lib/actions/cases'

const EVENT_TYPES = [
  { value: 'note',               label: 'Note'               },
  { value: 'document_uploaded',  label: 'Document Uploaded'  },
  { value: 'stage_change',       label: 'Stage Change'       },
  { value: 'rfe',                label: 'RFE Event'          },
  { value: 'approval',           label: 'Approval'           },
  { value: 'denial',             label: 'Denial'             },
]

interface AddEventFormProps {
  caseId: string
  onSuccess?: () => void
}

export function AddEventForm({ caseId, onSuccess }: AddEventFormProps) {
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType]   = useState('note')
  const [error, setError]           = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.')
      return
    }

    startTransition(async () => {
      const res = await addTimelineEvent({ caseId, eventType, title, description })
      if (!res.success) {
        setError(res.error ?? 'Something went wrong')
      } else {
        setTitle('')
        setDescription('')
        setEventType('note')
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Event Type</Label>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-title">Title</Label>
        <Input
          id="event-title"
          placeholder="e.g. Client meeting completed"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-desc">Description</Label>
        <Textarea
          id="event-desc"
          placeholder="Describe what happened…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} variant="secondary" className="w-full">
        <Plus className="w-4 h-4" />
        {isPending ? 'Adding…' : 'Add Event'}
      </Button>
    </form>
  )
}
