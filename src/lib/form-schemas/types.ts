// ── Core form schema types ────────────────────────────────────

export type FieldType =
  | 'text' | 'email' | 'tel' | 'date' | 'number'
  | 'select' | 'radio' | 'checkbox' | 'textarea'
  | 'ssn' | 'alien_number' | 'country' | 'state' | 'zip'
  | 'pattern'
  | 'ai_narrative' // AI-assisted free text with prompts

export interface SelectOption {
  value: string
  label: string
}

export interface FormField {
  id:           string       // unique within form, used as JSON key
  label:        string
  type:         FieldType
  required?:    boolean
  placeholder?: string
  helpText?:    string
  options?:     SelectOption[]
  maxLength?:   number
  rows?:        number        // for textarea
  caseMapping?: string        // dot path into case data for auto-populate, e.g. "applicantName"
  aiPrompt?:    string        // context for AI narrative generation
  pattern?:     string        // regex validation
  width?:       'full' | 'half' | 'third'  // layout hint
}

export interface FormSection {
  id:       string
  title:    string
  subtitle?: string
  icon?:    string
  fields:   FormField[]
}

export interface FormSchema {
  formType:     string        // e.g. "I-130"
  title:        string        // "Petition for Alien Relative"
  subtitle:     string        // short description
  uscisUrl?:    string        // link to official form PDF
  totalPages?:  number        // official page count for reference
  sections:     FormSection[]
}

// Populated field data stored in DB as JSON
export type FieldData = Record<string, string | boolean | number>

export interface FormProgress {
  completionPercentage: number
  completedFields:      number
  totalRequired:        number
  currentSection:       number
}

// Case data shape for auto-population
export interface CaseAutoPopulate {
  applicantName:    string
  applicantEmail:   string | null
  petitionerName:   string | null
  petitionerType:   string | null
  visaCategory:     string
  caseType:         string
}
