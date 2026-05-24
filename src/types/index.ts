import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string; email: string; name?: string | null
      role: string; firm?: string; organizationId?: string
    }
  }
  interface User {
    id: string; role: string; firm?: string; organizationId?: string
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    id: string; role: string; firm?: string; organizationId?: string
  }
}

export type CaseStatus = 'active' | 'submitted' | 'approved' | 'denied' | 'rfe_received'
export type CaseType   = 'family' | 'employment' | 'investor' | 'student'

export const CASE_STAGES = [
  'Intake', 'Petition Preparation', 'Document Collection', 'Attorney Review',
  'Form Preparation', 'USCIS Filing', 'USCIS Review', 'NVC Processing',
  'Embassy Interview', 'Biometrics', 'RFE Response', 'Decision Pending',
  'Approved', 'Denied',
] as const

export const CASE_TYPE_COLORS: Record<string, string> = {
  family:     'bg-pink-500/10 text-pink-400 border-pink-500/20',
  employment: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
  investor:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  student:    'bg-teal-500/10 text-teal-400 border-teal-500/20',
}

export const CASE_TYPE_ICONS: Record<string, string> = {
  family: '👨‍👩‍👧', employment: '💼', investor: '💰', student: '🎓',
}

export const DEADLINE_TYPE_COLORS: Record<string, string> = {
  rfe_response: 'text-rose-400',
  filing:       'text-amber-400',
  biometrics:   'text-brand-400',
  interview:    'text-violet-400',
  renewal:      'text-orange-400',
  medical:      'text-teal-400',
  fee_payment:  'text-emerald-400',
}

// ── Document types ────────────────────────────────────────────
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  passport:           'Passport',
  birth_certificate:  'Birth Certificate',
  marriage_certificate:'Marriage Certificate',
  divorce_decree:     'Divorce Decree',
  tax_return:         'Tax Return',
  bank_statement:     'Bank Statement',
  employment_letter:  'Employment Letter',
  degree_certificate: 'Degree Certificate',
  transcript:         'Transcript',
  photo_id:           'Government Photo ID',
  i130:               'Form I-130',
  i485:               'Form I-485',
  i140:               'Form I-140',
  i129:               'Form I-129',
  i693:               'Form I-693 (Medical)',
  i864:               'Form I-864',
  lca:                'Labor Condition Application',
  ds160:              'Form DS-160',
  i20:                'Form I-20',
  ds2019:             'Form DS-2019',
  i526:               'Form I-526E',
  other:              'Other Document',
}

export const VERIFICATION_STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string
}> = {
  pending:  { label: 'Pending Review',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  verified: { label: 'Verified',        color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  flagged:  { label: 'Flagged',         color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20'    },
  expired:  { label: 'Expired',         color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20'   },
}

export const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/tiff': ['.tiff', '.tif'],
  'application/pdf': ['.pdf'],
}

export const MAX_FILE_SIZE_MB = 10
