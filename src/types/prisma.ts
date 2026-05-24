// Local mirror of Prisma-generated types.
// Kept in sync with prisma/schema.prisma manually so the codebase
// compiles without running `prisma generate` at type-check time.

export type CaseStatus = 'active' | 'submitted' | 'approved' | 'denied' | 'rfe_received'
export type CaseType   = 'family' | 'employment' | 'investor' | 'student'

export interface Organization {
  id:        string
  name:      string
  domain:    string | null
  createdAt: Date
}

export interface User {
  id:             string
  email:          string
  name:           string | null
  password:       string
  role:           string
  firm:           string | null
  organizationId: string | null
  createdAt:      Date
  updatedAt:      Date
}

export interface Case {
  id:                      string
  userId:                  string
  organizationId:          string | null
  caseType:                string
  visaCategory:            string
  currentStage:            string
  status:                  string
  applicantName:           string
  applicantEmail:          string | null
  petitionerName:          string | null
  petitionerType:          string | null
  approvalProbabilityScore: number
  estimatedProcessingTime: number | null
  estimatedCompletionDate: Date | null
  notes:                   string | null
  createdAt:               Date
  updatedAt:               Date
}

export interface TimelineEvent {
  id:               string
  caseId:           string
  eventType:        string
  title:            string
  description:      string
  eventDate:        Date
  isAutomated:      boolean
  notificationSent: boolean
  createdAt:        Date
}

export interface ChecklistItem {
  id:         string
  caseId:     string
  itemLabel:  string
  category:   string
  formCode:   string | null
  required:   boolean
  completed:  boolean
  documentId: string | null
  dueDate:    Date | null
  sortOrder:  number
  createdAt:  Date
  updatedAt:  Date
}

export interface DeadlineEvent {
  id:           string
  caseId:       string
  deadlineType: string
  title:        string
  description:  string | null
  dueDate:      Date
  completed:    boolean
  alertDays:    number
  createdAt:    Date
  updatedAt:    Date
}

export interface Document {
  id:                 string
  caseId:             string
  userId:             string
  checklistItemId:    string | null
  documentType:       string
  originalName:       string
  mimeType:           string
  fileSizeBytes:      number
  fileUrl:            string
  verificationStatus: string   // pending | verified | flagged | expired
  verifiedAt:         Date | null
  expiryDate:         Date | null
  extractedFields:    string | null  // JSON
  ocrText:            string | null
  aiSummary:          string | null
  completenessScore:  number | null
  flags:              string | null  // JSON array
  uploadedAt:         Date
  updatedAt:          Date
}

// Parsed extracted fields from AI
export interface ExtractedDocumentFields {
  fullName?:          string
  dateOfBirth?:       string
  documentNumber?:    string
  expiryDate?:        string
  issueDate?:         string
  nationality?:       string
  issuingAuthority?:  string
  address?:           string
  taxYear?:           string
  income?:            string
  employer?:          string
  [key: string]:      string | undefined
}

export interface Form {
  id:                   string
  caseId:               string
  userId:               string
  formType:             string
  completionPercentage: number
  currentSection:       number
  status:               string
  fieldData:            string
  lastSavedAt:          Date
  submittedAt:          Date | null
  exportedAt:           Date | null
  exportFormat:         string | null
  createdAt:            Date
  updatedAt:            Date
}

// ── Chat types ─────────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id:        string
  role:      MessageRole
  content:   string          // always the display language
  contentEn: string          // English source (for AI continuity)
  timestamp: string          // ISO string
  metadata?: {
    visaRecommendations?: string[]
    intakeFields?:        Record<string, string>
    needsAttorney?:       boolean
    followUpQuestions?:   string[]
  }
}

export interface ChatSession {
  id:         string
  userId:     string | null
  caseId:     string | null
  language:   string
  title:      string | null
  messages:   string    // JSON
  intakeData: string    // JSON
  resolved:   boolean
  createdAt:  Date
  updatedAt:  Date
}

export interface IntakeData {
  nationality?:        string
  currentStatus?:      string
  immigrationGoal?:    string
  employmentSituation?:string
  familyTies?:         string
  educationLevel?:     string
  hasJobOffer?:        string
  urgency?:            string
  priorViolations?:    string
  name?:               string
  email?:              string
}

export interface AiDraft {
  id:              string
  caseId:          string
  userId:          string
  draftType:       string
  title:           string
  rfeText:         string | null
  rfeGrounds:      string | null
  rfeDeadline:     Date | null
  content:         string
  contentSections: string | null
  confidenceScore: number
  status:          string
  reviewedByUser:  boolean
  userEdits:       string | null
  reviewNotes:     string | null
  exportedAt:      Date | null
  exportFormat:    string | null
  createdAt:       Date
  updatedAt:       Date
}
