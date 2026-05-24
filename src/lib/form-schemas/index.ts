import type { FormSchema } from './types'
import { I130_SCHEMA }  from './I-130'
import { I485_SCHEMA }  from './I-485'
import { I140_SCHEMA }  from './I-140'
import { I129_SCHEMA }  from './I-129'
import { DS260_SCHEMA } from './DS-260'

export * from './types'
export * from './countries'
export { I130_SCHEMA, I485_SCHEMA, I140_SCHEMA, I129_SCHEMA, DS260_SCHEMA }

export const FORM_SCHEMAS: Record<string, FormSchema> = {
  'I-130':  I130_SCHEMA,
  'I-485':  I485_SCHEMA,
  'I-140':  I140_SCHEMA,
  'I-129':  I129_SCHEMA,
  'DS-260': DS260_SCHEMA,
}

export const FORM_CATALOG: {
  formType: string
  title: string
  subtitle: string
  caseTypes: string[]
  icon: string
  color: string
}[] = [
  {
    formType: 'I-130',
    title: 'I-130',
    subtitle: 'Petition for Alien Relative',
    caseTypes: ['family'],
    icon: '❤️',
    color: 'from-pink-500/20 to-pink-600/5 border-pink-500/20',
  },
  {
    formType: 'I-485',
    title: 'I-485',
    subtitle: 'Application to Register Permanent Residence',
    caseTypes: ['family', 'employment', 'investor'],
    icon: '🏠',
    color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
  },
  {
    formType: 'I-140',
    title: 'I-140',
    subtitle: 'Immigrant Petition for Alien Workers',
    caseTypes: ['employment'],
    icon: '💼',
    color: 'from-brand-500/20 to-brand-600/5 border-brand-500/20',
  },
  {
    formType: 'I-129',
    title: 'I-129',
    subtitle: 'Petition for Nonimmigrant Worker',
    caseTypes: ['employment'],
    icon: '⚡',
    color: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
  },
  {
    formType: 'DS-260',
    title: 'DS-260',
    subtitle: 'Immigrant Visa Electronic Application',
    caseTypes: ['family', 'employment', 'investor'],
    icon: '🌍',
    color: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
  },
]

export function getFormSchema(formType: string): FormSchema | null {
  return FORM_SCHEMAS[formType] ?? null
}

export function getRecommendedForms(caseType: string, visaCategory: string): typeof FORM_CATALOG {
  const byType = FORM_CATALOG.filter(f => f.caseTypes.includes(caseType))
  // Special overrides
  if (visaCategory.startsWith('H-1B') || visaCategory.startsWith('L-1') ||
      visaCategory.startsWith('O-1') || visaCategory === 'TN' || visaCategory === 'E-3') {
    return byType.filter(f => ['I-129', 'I-485'].includes(f.formType))
  }
  if (visaCategory.startsWith('EB-') || visaCategory === 'EB-5') {
    return byType.filter(f => ['I-140', 'I-485', 'DS-260'].includes(f.formType))
  }
  return byType
}

export function calculateCompletion(schema: FormSchema, fieldData: Record<string, any>): number {
  let total = 0, filled = 0
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!field.required) continue
      total++
      const val = fieldData[field.id]
      if (val !== undefined && val !== null && val !== '' && val !== false) filled++
    }
  }
  return total === 0 ? 0 : Math.round((filled / total) * 100)
}

export function autoPopulateFromCase(
  schema: FormSchema,
  caseData: {
    applicantName: string
    applicantEmail: string | null
    petitionerName: string | null
    petitionerType: string | null
    visaCategory: string
    caseType: string
  }
): Record<string, string> {
  const populated: Record<string, string> = {}

  // Parse applicant name: "Last, First" or "First Last"
  const parts = caseData.applicantName.split(',').map(s => s.trim())
  const applicantLast  = parts[0] ?? ''
  const applicantFirst = parts[1] ?? ''
  const petitionerParts = (caseData.petitionerName ?? '').split(',').map(s => s.trim())
  const petitionerLast  = petitionerParts[0] ?? caseData.petitionerName ?? ''
  const petitionerFirst = petitionerParts[1] ?? ''

  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!field.caseMapping) continue
      switch (field.caseMapping) {
        case 'applicantLastName':   populated[field.id] = applicantLast;  break
        case 'applicantFirstName':  populated[field.id] = applicantFirst; break
        case 'applicantEmail':      populated[field.id] = caseData.applicantEmail ?? ''; break
        case 'petitionerName':      populated[field.id] = caseData.petitionerName ?? ''; break
        case 'petitionerLastName':  populated[field.id] = petitionerLast; break
        case 'petitionerFirstName': populated[field.id] = petitionerFirst; break
        case 'petitionerEmail':     populated[field.id] = ''; break
      }
    }
  }
  return populated
}
