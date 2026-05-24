/**
 * Immigration Case Workflow Engine
 * ---------------------------------------------------------------------------
 * Given a visa category + case type, generates the complete initial workflow:
 *   - Document & form checklist (with categories and form codes)
 *   - Timeline events (with relative dates from today)
 *   - Deadline events (with days-from-now offsets)
 *   - Initial stage, base approval score, estimated processing time (months)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkflowChecklistItem {
  itemLabel:  string
  category:   'form' | 'document' | 'action' | 'fee'
  formCode?:  string
  required:   boolean
  sortOrder:  number
}

export interface WorkflowTimelineEvent {
  eventType:   string
  title:       string
  description: string
  daysFromNow: number  // negative = past, 0 = today, positive = future projected
  isAutomated: boolean
}

export interface WorkflowDeadline {
  deadlineType: string
  title:        string
  description:  string
  daysFromNow:  number  // days until due from case creation
  alertDays:    number
}

export interface WorkflowDefinition {
  initialStage:            string
  approvalProbabilityScore: number
  estimatedProcessingTime: number  // months
  checklist:               WorkflowChecklistItem[]
  timelineEvents:          WorkflowTimelineEvent[]
  deadlines:               WorkflowDeadline[]
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function days(n: number) { return n }

// ─── Family Workflows ─────────────────────────────────────────────────────────

const MARRIAGE_GREEN_CARD: WorkflowDefinition = {
  initialStage: 'Petition Filed',
  approvalProbabilityScore: 88,
  estimatedProcessingTime: 18,
  checklist: [
    // Forms
    { itemLabel: 'Form I-130 — Petition for Alien Relative',         category: 'form',     formCode: 'I-130',   required: true,  sortOrder: 1  },
    { itemLabel: 'Form I-130A — Supplemental Info for Spouse',       category: 'form',     formCode: 'I-130A',  required: true,  sortOrder: 2  },
    { itemLabel: 'Form I-485 — Application to Adjust Status',        category: 'form',     formCode: 'I-485',   required: true,  sortOrder: 3  },
    { itemLabel: 'Form I-131 — Advance Parole (travel document)',    category: 'form',     formCode: 'I-131',   required: false, sortOrder: 4  },
    { itemLabel: 'Form I-765 — Employment Authorization',            category: 'form',     formCode: 'I-765',   required: false, sortOrder: 5  },
    { itemLabel: 'Form I-864 — Affidavit of Support',                category: 'form',     formCode: 'I-864',   required: true,  sortOrder: 6  },
    { itemLabel: 'Form I-693 — Medical Examination',                 category: 'form',     formCode: 'I-693',   required: true,  sortOrder: 7  },
    // Documents — Petitioner
    { itemLabel: 'U.S. citizenship / LPR proof (petitioner)',        category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: 'Valid passport (petitioner)',                       category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'Petitioner birth certificate',                     category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'Prior marriage termination docs (if applicable)',  category: 'document', required: false, sortOrder: 13 },
    // Documents — Beneficiary
    { itemLabel: 'Valid passport (beneficiary)',                     category: 'document', required: true,  sortOrder: 20 },
    { itemLabel: 'Beneficiary birth certificate',                   category: 'document', required: true,  sortOrder: 21 },
    { itemLabel: 'Two passport-style photos (beneficiary)',          category: 'document', required: true,  sortOrder: 22 },
    // Marriage evidence
    { itemLabel: 'Official marriage certificate',                   category: 'document', required: true,  sortOrder: 30 },
    { itemLabel: 'Joint financial account statements (6 months)',   category: 'document', required: true,  sortOrder: 31 },
    { itemLabel: 'Lease / mortgage showing joint residence',        category: 'document', required: true,  sortOrder: 32 },
    { itemLabel: 'Joint tax returns (most recent 2 years)',         category: 'document', required: false, sortOrder: 33 },
    { itemLabel: 'Photos together (min. 10 across years)',          category: 'document', required: true,  sortOrder: 34 },
    { itemLabel: 'Beneficiary utility bills / correspondence',      category: 'document', required: false, sortOrder: 35 },
    // Actions
    { itemLabel: 'Biometrics appointment attended',                 category: 'action',   required: true,  sortOrder: 40 },
    { itemLabel: 'USCIS interview completed',                       category: 'action',   required: true,  sortOrder: 41 },
    { itemLabel: 'Medical examination (civil surgeon)',             category: 'action',   required: true,  sortOrder: 42 },
    // Fees
    { itemLabel: 'I-130 filing fee paid ($675)',                    category: 'fee',      required: true,  sortOrder: 50 },
    { itemLabel: 'I-485 filing fee paid ($1,440)',                  category: 'fee',      required: true,  sortOrder: 51 },
    { itemLabel: 'Biometrics fee paid ($85)',                       category: 'fee',      required: true,  sortOrder: 52 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',              description: 'Marriage-based green card case initiated. I-130 package preparation in progress.', daysFromNow: 0,   isAutomated: true  },
    { eventType: 'stage_change', title: 'I-130 Package Assembled',  description: 'Initial petition package assembled. Attorney review in progress.',               daysFromNow: 7,   isAutomated: true  },
    { eventType: 'document',     title: 'I-485 Package Initiated',  description: 'Adjustment of status package initiated. Awaiting supporting documents.',         daysFromNow: 14,  isAutomated: true  },
    { eventType: 'stage_change', title: 'Filed with USCIS',         description: 'Concurrent I-130 + I-485 filed at USCIS. Receipt notices expected in 2-3 weeks.', daysFromNow: 30,  isAutomated: false },
    { eventType: 'biometrics',   title: 'Biometrics Appointment',   description: 'USCIS biometrics appointment scheduled. Fingerprints and photos required.',       daysFromNow: 90,  isAutomated: true  },
    { eventType: 'stage_change', title: 'Interview Scheduled',      description: 'USCIS interview scheduled at local field office. Prepare joint evidence.',        daysFromNow: 270, isAutomated: true  },
    { eventType: 'stage_change', title: 'Interview Completed',      description: 'USCIS interview completed. Decision pending.',                                    daysFromNow: 300, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'filing',     title: 'File I-130 + I-485',          description: 'Submit concurrent filing to USCIS',                         daysFromNow: 30,  alertDays: 7  },
    { deadlineType: 'biometrics', title: 'Biometrics Appointment',       description: 'Attend ASC appointment for fingerprints',                   daysFromNow: 90,  alertDays: 7  },
    { deadlineType: 'medical',    title: 'Medical Exam (I-693)',         description: 'Complete civil surgeon medical examination',                 daysFromNow: 120, alertDays: 14 },
    { deadlineType: 'interview',  title: 'USCIS Interview',              description: 'Attend USCIS field office interview with joint evidence',    daysFromNow: 270, alertDays: 30 },
  ],
}

const K1_FIANCE: WorkflowDefinition = {
  initialStage: 'Petition Preparation',
  approvalProbabilityScore: 85,
  estimatedProcessingTime: 12,
  checklist: [
    { itemLabel: 'Form I-129F — Petition for Alien Fiancé',          category: 'form',     formCode: 'I-129F',  required: true,  sortOrder: 1  },
    { itemLabel: 'DS-160 — Nonimmigrant Visa Application',           category: 'form',     formCode: 'DS-160',  required: true,  sortOrder: 2  },
    { itemLabel: 'Form I-485 — Adjust Status (after marriage)',      category: 'form',     formCode: 'I-485',   required: true,  sortOrder: 3  },
    { itemLabel: 'Petitioner U.S. citizenship proof',                category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: 'Proof of meeting in person within 2 years',       category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'Photos together (min. 10)',                        category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'Communication records (messages, emails)',         category: 'document', required: true,  sortOrder: 13 },
    { itemLabel: 'Valid passport — beneficiary',                    category: 'document', required: true,  sortOrder: 14 },
    { itemLabel: 'Birth certificates — both parties',               category: 'document', required: true,  sortOrder: 15 },
    { itemLabel: 'Intent to marry within 90 days statement',        category: 'action',   required: true,  sortOrder: 20 },
    { itemLabel: 'US Embassy interview (fiancé)',                   category: 'action',   required: true,  sortOrder: 21 },
    { itemLabel: 'Medical examination at embassy-approved physician',category: 'action',  required: true,  sortOrder: 22 },
    { itemLabel: 'I-129F filing fee paid ($675)',                   category: 'fee',      required: true,  sortOrder: 30 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'K-1 Case Opened',           description: 'K-1 fiancé visa petition initiated.',                           daysFromNow: 0,   isAutomated: true  },
    { eventType: 'stage_change', title: 'I-129F Filed',              description: 'Petition for Alien Fiancé filed with USCIS.',                    daysFromNow: 14,  isAutomated: false },
    { eventType: 'stage_change', title: 'Petition Approved',         description: 'I-129F approved and forwarded to NVC for consular processing.',  daysFromNow: 120, isAutomated: true  },
    { eventType: 'stage_change', title: 'Embassy Interview',         description: 'K-1 visa interview at U.S. Embassy.',                            daysFromNow: 240, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'filing',    title: 'File I-129F',               description: 'Submit K-1 fiancé petition to USCIS',                          daysFromNow: 14,  alertDays: 7  },
    { deadlineType: 'interview', title: 'Embassy Interview',         description: 'K-1 visa interview appointment',                               daysFromNow: 240, alertDays: 30 },
    { deadlineType: 'filing',    title: 'Enter USA (90-day clock)',  description: 'Must enter USA within K-1 visa validity; marry within 90 days', daysFromNow: 300, alertDays: 14 },
  ],
}

const IR2_CHILD: WorkflowDefinition = {
  initialStage: 'Petition Filed',
  approvalProbabilityScore: 92,
  estimatedProcessingTime: 14,
  checklist: [
    { itemLabel: 'Form I-130 — Petition for Alien Relative (child)', category: 'form',     formCode: 'I-130',   required: true,  sortOrder: 1 },
    { itemLabel: 'Form I-864 — Affidavit of Support',               category: 'form',     formCode: 'I-864',   required: true,  sortOrder: 2 },
    { itemLabel: 'Form I-485 (if in USA) or DS-260 (consular)',     category: 'form',     formCode: 'I-485',   required: true,  sortOrder: 3 },
    { itemLabel: "Child's birth certificate (with petitioner name)", category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: "Child's valid passport",                           category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'Petitioner U.S. citizenship / LPR proof',         category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'Adoption decree (if adopted)',                    category: 'document', required: false, sortOrder: 13 },
    { itemLabel: 'DNA test results (if biological relationship questionable)', category: 'document', required: false, sortOrder: 14 },
    { itemLabel: 'Petitioner tax returns (2 years)',                category: 'document', required: true,  sortOrder: 15 },
    { itemLabel: 'Medical examination (child)',                     category: 'action',   required: true,  sortOrder: 20 },
    { itemLabel: 'Biometrics appointment attended',                 category: 'action',   required: true,  sortOrder: 21 },
    { itemLabel: 'I-130 filing fee ($675)',                         category: 'fee',      required: true,  sortOrder: 30 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',              description: 'IR-2 child petition initiated.',                                 daysFromNow: 0,   isAutomated: true  },
    { eventType: 'stage_change', title: 'I-130 Filed',              description: 'Petition for Alien Relative filed for qualifying child.',        daysFromNow: 14,  isAutomated: false },
    { eventType: 'biometrics',   title: 'Biometrics Scheduled',     description: 'Biometrics appointment scheduled at local ASC.',                 daysFromNow: 60,  isAutomated: true  },
    { eventType: 'stage_change', title: 'NVC Processing',           description: 'Case transferred to National Visa Center.',                      daysFromNow: 120, isAutomated: true  },
  ],
  deadlines: [
    { deadlineType: 'filing',     title: 'File I-130',              description: 'Submit petition to USCIS',            daysFromNow: 14,  alertDays: 7  },
    { deadlineType: 'biometrics', title: 'Biometrics',              description: 'Attend ASC appointment',              daysFromNow: 60,  alertDays: 7  },
    { deadlineType: 'medical',    title: 'Medical Exam',            description: 'Child medical examination',           daysFromNow: 100, alertDays: 14 },
  ],
}

// ─── Employment Workflows ─────────────────────────────────────────────────────

const H1B_CAP: WorkflowDefinition = {
  initialStage: 'Registration',
  approvalProbabilityScore: 78,
  estimatedProcessingTime: 8,
  checklist: [
    { itemLabel: 'Form I-129 — Petition for Nonimmigrant Worker',    category: 'form',     formCode: 'I-129',   required: true,  sortOrder: 1 },
    { itemLabel: 'Labor Condition Application (LCA) — ETA-9035',    category: 'form',     formCode: 'ETA-9035',required: true,  sortOrder: 2 },
    { itemLabel: 'H-1B Data Collection Supplement (I-129W)',        category: 'form',     formCode: 'I-129W',  required: true,  sortOrder: 3 },
    { itemLabel: 'Employer support letter / offer letter',           category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: "Beneficiary degree certificates (all)",            category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'Official transcripts',                             category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'Professional evaluations (if foreign degree)',    category: 'document', required: false, sortOrder: 13 },
    { itemLabel: 'Prior H-1B approval notices (if any)',            category: 'document', required: false, sortOrder: 14 },
    { itemLabel: 'Passport copy (beneficiary)',                     category: 'document', required: true,  sortOrder: 15 },
    { itemLabel: 'Resume / CV',                                     category: 'document', required: true,  sortOrder: 16 },
    { itemLabel: 'Company organizational chart',                    category: 'document', required: false, sortOrder: 17 },
    { itemLabel: 'Specialty occupation evidence (job description)', category: 'document', required: true,  sortOrder: 18 },
    { itemLabel: 'DOL LCA certified',                               category: 'action',   required: true,  sortOrder: 20 },
    { itemLabel: 'H-1B electronic registration submitted (cap)',    category: 'action',   required: true,  sortOrder: 21 },
    { itemLabel: 'I-129 filing fee paid ($460+)',                   category: 'fee',      required: true,  sortOrder: 30 },
    { itemLabel: 'ACWIA training fee paid ($750 or $1,500)',        category: 'fee',      required: true,  sortOrder: 31 },
    { itemLabel: 'Fraud prevention fee paid ($500)',                category: 'fee',      required: true,  sortOrder: 32 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',             description: 'H-1B cap-subject petition initiated. Registration window preparation in progress.', daysFromNow: 0,  isAutomated: true  },
    { eventType: 'stage_change', title: 'LCA Filed with DOL',      description: 'Labor Condition Application submitted to Department of Labor for certification.',    daysFromNow: 7,  isAutomated: false },
    { eventType: 'stage_change', title: 'LCA Certified',           description: 'DOL certified the Labor Condition Application. Ready for I-129 filing.',            daysFromNow: 14, isAutomated: true  },
    { eventType: 'stage_change', title: 'I-129 Filed',             description: 'H-1B petition filed with USCIS service center.',                                    daysFromNow: 30, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'filing',     title: 'LCA Filing Deadline',     description: 'Submit LCA to DOL at least 7 days before I-129',           daysFromNow: 7,   alertDays: 3  },
    { deadlineType: 'filing',     title: 'I-129 Filing Deadline',   description: 'Submit H-1B petition to USCIS',                            daysFromNow: 30,  alertDays: 7  },
    { deadlineType: 'fee_payment','title': 'All Fees Due',          description: 'All filing fees must accompany the petition',              daysFromNow: 30,  alertDays: 7  },
  ],
}

const L1A: WorkflowDefinition = {
  initialStage: 'Document Collection',
  approvalProbabilityScore: 80,
  estimatedProcessingTime: 6,
  checklist: [
    { itemLabel: 'Form I-129 — L Classification',                    category: 'form',     formCode: 'I-129',   required: true,  sortOrder: 1 },
    { itemLabel: 'L Supplement to I-129',                            category: 'form',     formCode: 'I-129L',  required: true,  sortOrder: 2 },
    { itemLabel: 'Proof of qualifying relationship (foreign + US co.)',category:'document', required: true,  sortOrder: 10 },
    { itemLabel: 'Evidence of managerial or executive role',         category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'Evidence of 1-year employment abroad (past 3 yrs)',category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'Organizational charts (both companies)',           category: 'document', required: true,  sortOrder: 13 },
    { itemLabel: 'Company registration / articles of incorporation', category: 'document', required: true,  sortOrder: 14 },
    { itemLabel: 'Financial statements (both entities)',             category: 'document', required: true,  sortOrder: 15 },
    { itemLabel: 'Detailed job description (US role)',              category: 'document', required: true,  sortOrder: 16 },
    { itemLabel: 'Passport copy',                                   category: 'document', required: true,  sortOrder: 17 },
    { itemLabel: 'Prior L-1 approval notices (if extending)',       category: 'document', required: false, sortOrder: 18 },
    { itemLabel: 'I-129 filing fee paid',                          category: 'fee',      required: true,  sortOrder: 30 },
    { itemLabel: 'Premium processing fee (if requested)',           category: 'fee',      required: false, sortOrder: 31 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',             description: 'L-1A intracompany transferee petition initiated.',                             daysFromNow: 0,  isAutomated: true  },
    { eventType: 'document',     title: 'Evidence Compilation',    description: 'Compiling qualifying relationship and managerial capacity evidence.',           daysFromNow: 7,  isAutomated: true  },
    { eventType: 'stage_change', title: 'I-129 Filed',             description: 'L-1A petition filed with USCIS.',                                              daysFromNow: 21, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'filing', title: 'I-129 Filing', description: 'Submit L-1A petition to USCIS', daysFromNow: 21, alertDays: 7 },
  ],
}

const EB2_NIW: WorkflowDefinition = {
  initialStage: 'Petition Preparation',
  approvalProbabilityScore: 70,
  estimatedProcessingTime: 18,
  checklist: [
    { itemLabel: 'Form I-140 — Immigrant Worker Petition',           category: 'form',     formCode: 'I-140',   required: true,  sortOrder: 1  },
    { itemLabel: 'Form I-485 (Adjustment of Status, if in USA)',    category: 'form',     formCode: 'I-485',   required: false, sortOrder: 2  },
    { itemLabel: 'Advanced degree evidence (PhD/Masters/equiv.)',   category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: 'NIW support statement (substantial merit)',       category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'Expert recommendation letters (min. 3)',          category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'Publication list + full copies of key papers',   category: 'document', required: true,  sortOrder: 13 },
    { itemLabel: 'Citation evidence (Google Scholar, WoS)',        category: 'document', required: true,  sortOrder: 14 },
    { itemLabel: 'Evidence of national / international impact',    category: 'document', required: true,  sortOrder: 15 },
    { itemLabel: 'Membership in professional associations',        category: 'document', required: false, sortOrder: 16 },
    { itemLabel: 'Awards and honors',                              category: 'document', required: false, sortOrder: 17 },
    { itemLabel: 'Media coverage / press mentions',               category: 'document', required: false, sortOrder: 18 },
    { itemLabel: 'Passport copy',                                 category: 'document', required: true,  sortOrder: 19 },
    { itemLabel: 'I-140 filing fee paid ($715)',                  category: 'fee',      required: true,  sortOrder: 30 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',              description: 'EB-2 National Interest Waiver self-petition initiated.',                     daysFromNow: 0,   isAutomated: true  },
    { eventType: 'document',     title: 'Evidence Compilation',     description: 'Compiling publications, citations, and expert recommendation letters.',      daysFromNow: 14,  isAutomated: true  },
    { eventType: 'stage_change', title: 'I-140 Filed',              description: 'EB-2 NIW petition filed with USCIS Nebraska Service Center.',                daysFromNow: 45,  isAutomated: false },
    { eventType: 'stage_change', title: 'Priority Date Established',description: 'Priority date established. Monitor Visa Bulletin for current cutoff.',      daysFromNow: 60,  isAutomated: true  },
  ],
  deadlines: [
    { deadlineType: 'filing',     title: 'File I-140',              description: 'Submit EB-2 NIW petition to USCIS',   daysFromNow: 45,  alertDays: 14 },
    { deadlineType: 'fee_payment','title': 'I-140 Filing Fee',      description: 'Pay $715 filing fee',                 daysFromNow: 45,  alertDays: 7  },
  ],
}

const EB1A: WorkflowDefinition = {
  initialStage: 'Evidence Compilation',
  approvalProbabilityScore: 72,
  estimatedProcessingTime: 12,
  checklist: [
    { itemLabel: 'Form I-140 — Immigrant Worker Petition',           category: 'form',     formCode: 'I-140',   required: true,  sortOrder: 1  },
    { itemLabel: 'Major awards / prizes in the field',               category: 'document', required: false, sortOrder: 10 },
    { itemLabel: 'Membership in exclusive professional associations', category: 'document', required: false, sortOrder: 11 },
    { itemLabel: 'Published material about your work',              category: 'document', required: false, sortOrder: 12 },
    { itemLabel: 'Evidence of judging others\' work',               category: 'document', required: false, sortOrder: 13 },
    { itemLabel: 'Original scientific / scholarly contributions',   category: 'document', required: false, sortOrder: 14 },
    { itemLabel: 'Authorship of scholarly articles',               category: 'document', required: false, sortOrder: 15 },
    { itemLabel: 'Artistic displays of your work',                 category: 'document', required: false, sortOrder: 16 },
    { itemLabel: 'Evidence of critical role in distinguished org.', category: 'document', required: false, sortOrder: 17 },
    { itemLabel: 'High salary / remuneration evidence',            category: 'document', required: false, sortOrder: 18 },
    { itemLabel: 'Commercial success in performing arts',          category: 'document', required: false, sortOrder: 19 },
    { itemLabel: 'Expert recommendation letters (3+)',             category: 'document', required: true,  sortOrder: 20 },
    { itemLabel: 'I-140 filing fee ($715)',                        category: 'fee',      required: true,  sortOrder: 30 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',              description: 'EB-1A extraordinary ability self-petition initiated.',                          daysFromNow: 0,  isAutomated: true  },
    { eventType: 'document',     title: 'Criteria Analysis',        description: 'Evaluating which of 10 USCIS extraordinary ability criteria applicant meets.',  daysFromNow: 7,  isAutomated: true  },
    { eventType: 'stage_change', title: 'I-140 Filed',              description: 'EB-1A petition filed with USCIS.',                                              daysFromNow: 30, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'filing', title: 'File I-140', description: 'Submit EB-1A petition', daysFromNow: 30, alertDays: 14 },
  ],
}

const O1A: WorkflowDefinition = {
  initialStage: 'Petition Preparation',
  approvalProbabilityScore: 82,
  estimatedProcessingTime: 4,
  checklist: [
    { itemLabel: 'Form I-129 — O Classification',                    category: 'form',     formCode: 'I-129',   required: true,  sortOrder: 1 },
    { itemLabel: 'O Supplement to I-129',                            category: 'form',     formCode: 'I-129O',  required: true,  sortOrder: 2 },
    { itemLabel: 'Peer review letters (3+ experts)',                 category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: 'Awards and major recognitions',                   category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'High salary / remuneration evidence',             category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'Published work / media coverage',                category: 'document', required: true,  sortOrder: 13 },
    { itemLabel: 'Critical role evidence (leading org.)',           category: 'document', required: true,  sortOrder: 14 },
    { itemLabel: 'Advisory opinion (peer group or union)',          category: 'document', required: false, sortOrder: 15 },
    { itemLabel: 'Itinerary of events / activities',               category: 'document', required: true,  sortOrder: 16 },
    { itemLabel: 'Employer support letter',                        category: 'document', required: true,  sortOrder: 17 },
    { itemLabel: 'I-129 filing fee paid',                          category: 'fee',      required: true,  sortOrder: 30 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',             description: 'O-1A extraordinary ability petition initiated.',           daysFromNow: 0,  isAutomated: true  },
    { eventType: 'document',     title: 'Evidence Package',        description: 'Compiling extraordinary ability evidence portfolio.',      daysFromNow: 7,  isAutomated: true  },
    { eventType: 'stage_change', title: 'I-129 Filed',             description: 'O-1A petition filed with USCIS.',                         daysFromNow: 21, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'filing', title: 'File I-129', description: 'Submit O-1A petition to USCIS', daysFromNow: 21, alertDays: 7 },
  ],
}

const TN: WorkflowDefinition = {
  initialStage: 'Document Collection',
  approvalProbabilityScore: 92,
  estimatedProcessingTime: 1,
  checklist: [
    { itemLabel: 'Offer letter / job description (USMCA category)', category: 'document', required: true,  sortOrder: 1 },
    { itemLabel: 'Proof of Canadian or Mexican citizenship',        category: 'document', required: true,  sortOrder: 2 },
    { itemLabel: 'Educational credentials for TN category',        category: 'document', required: true,  sortOrder: 3 },
    { itemLabel: 'Professional license (if applicable)',           category: 'document', required: false, sortOrder: 4 },
    { itemLabel: 'DS-160 (if applying at consulate)',              category: 'form',     formCode: 'DS-160', required: false, sortOrder: 5 },
    { itemLabel: 'TN entry fee ($56) or I-129 fee (employer)',    category: 'fee',      required: true,  sortOrder: 10 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',            description: 'TN visa case initiated. Document compilation in progress.', daysFromNow: 0, isAutomated: true  },
    { eventType: 'stage_change', title: 'Documents Ready',        description: 'All TN documents compiled. Ready for POE or consular.',    daysFromNow: 7, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'filing', title: 'POE / Consular Appointment', description: 'Present TN documents at port of entry or consulate', daysFromNow: 14, alertDays: 3 },
  ],
}

// ─── Investor Workflows ───────────────────────────────────────────────────────

const EB5: WorkflowDefinition = {
  initialStage: 'Investment Verification',
  approvalProbabilityScore: 68,
  estimatedProcessingTime: 36,
  checklist: [
    { itemLabel: 'Form I-526E — Immigrant Petition (Regional Center)', category: 'form',   formCode: 'I-526E',  required: true,  sortOrder: 1 },
    { itemLabel: 'Form I-485 (Adjustment) or DS-260 (Consular)',      category: 'form',   formCode: 'I-485',   required: true,  sortOrder: 2 },
    { itemLabel: 'Form I-829 — Removal of Conditions',               category: 'form',   formCode: 'I-829',   required: true,  sortOrder: 3 },
    { itemLabel: 'Proof of lawful investment ($800K or $1.05M)',     category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: 'Source of funds documentation (5-year history)',  category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'Investment business plan',                        category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'TEA designation letter (if $800K investment)',    category: 'document', required: false, sortOrder: 13 },
    { itemLabel: 'Regional center approval documentation',          category: 'document', required: true,  sortOrder: 14 },
    { itemLabel: 'Job creation evidence (10 full-time US jobs)',    category: 'document', required: true,  sortOrder: 15 },
    { itemLabel: 'Tax returns (5 years)',                           category: 'document', required: true,  sortOrder: 16 },
    { itemLabel: 'Bank statements',                                category: 'document', required: true,  sortOrder: 17 },
    { itemLabel: 'Foreign business records',                       category: 'document', required: true,  sortOrder: 18 },
    { itemLabel: 'I-526E filing fee ($11,160)',                    category: 'fee',      required: true,  sortOrder: 30 },
    { itemLabel: 'I-485 filing fee ($1,440)',                      category: 'fee',      required: true,  sortOrder: 31 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',              description: 'EB-5 investor visa case initiated. Source of funds review beginning.',         daysFromNow: 0,   isAutomated: true  },
    { eventType: 'document',     title: 'Investment Verification',  description: 'Documenting lawful source of funds and regional center compliance.',             daysFromNow: 30,  isAutomated: true  },
    { eventType: 'stage_change', title: 'I-526E Filed',             description: 'EB-5 Regional Center petition filed with USCIS.',                               daysFromNow: 60,  isAutomated: false },
    { eventType: 'stage_change', title: 'Priority Date Established',description: 'Priority date secured. Monitor China/India EB-5 cutoffs in Visa Bulletin.',     daysFromNow: 75,  isAutomated: true  },
  ],
  deadlines: [
    { deadlineType: 'filing',     title: 'File I-526E',             description: 'Submit EB-5 petition to USCIS',                     daysFromNow: 60,  alertDays: 14 },
    { deadlineType: 'fee_payment','title': 'I-526E Fee ($11,160)',  description: 'Pay EB-5 filing fee',                               daysFromNow: 60,  alertDays: 7  },
    { deadlineType: 'filing',     title: 'File I-829',              description: 'Remove conditions — file 90 days before 2-year anniversary', daysFromNow: 630, alertDays: 30 },
  ],
}

const E2_TREATY: WorkflowDefinition = {
  initialStage: 'Business Plan Preparation',
  approvalProbabilityScore: 80,
  estimatedProcessingTime: 3,
  checklist: [
    { itemLabel: 'DS-160 — Nonimmigrant Visa Application',           category: 'form',   formCode: 'DS-160',  required: true,  sortOrder: 1 },
    { itemLabel: 'E-2 Business plan (5-year projections)',           category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: 'Proof of investment (substantial and at risk)',    category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'Treaty country citizenship proof',                category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'Investment source of funds documentation',        category: 'document', required: true,  sortOrder: 13 },
    { itemLabel: 'US business registration documents',             category: 'document', required: true,  sortOrder: 14 },
    { itemLabel: 'Ownership structure / equity documentation',     category: 'document', required: true,  sortOrder: 15 },
    { itemLabel: 'US Embassy interview',                           category: 'action',   required: true,  sortOrder: 20 },
    { itemLabel: 'US consular visa application fee ($205)',        category: 'fee',      required: true,  sortOrder: 30 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',             description: 'E-2 treaty investor visa case initiated.',             daysFromNow: 0,  isAutomated: true  },
    { eventType: 'document',     title: 'Business Plan Review',    description: 'Attorney reviewing business plan and investment docs.', daysFromNow: 14, isAutomated: false },
    { eventType: 'stage_change', title: 'Embassy Application',     description: 'DS-160 submitted; embassy interview scheduled.',       daysFromNow: 30, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'interview', title: 'Embassy Interview', description: 'E-2 visa interview at US Embassy / Consulate', daysFromNow: 45, alertDays: 14 },
  ],
}

// ─── Student Workflows ────────────────────────────────────────────────────────

const F1_STUDENT: WorkflowDefinition = {
  initialStage: 'SEVIS Enrollment',
  approvalProbabilityScore: 85,
  estimatedProcessingTime: 3,
  checklist: [
    { itemLabel: 'DS-160 — Nonimmigrant Visa Application',           category: 'form',   formCode: 'DS-160',  required: true,  sortOrder: 1 },
    { itemLabel: 'Form I-20 from SEVIS-approved institution',        category: 'form',   formCode: 'I-20',    required: true,  sortOrder: 2 },
    { itemLabel: 'SEVIS fee payment (I-901)',                        category: 'fee',    required: true,  sortOrder: 3 },
    { itemLabel: 'University acceptance letter',                    category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: 'Financial support evidence (1 year tuition+living)',category:'document',required: true, sortOrder: 11 },
    { itemLabel: 'Bank statements (sponsor)',                       category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'Sponsorship letter (if applicable)',              category: 'document', required: false, sortOrder: 13 },
    { itemLabel: 'Academic transcripts',                           category: 'document', required: true,  sortOrder: 14 },
    { itemLabel: 'English proficiency test scores (TOEFL/IELTS)',  category: 'document', required: false, sortOrder: 15 },
    { itemLabel: 'Ties to home country evidence',                  category: 'document', required: true,  sortOrder: 16 },
    { itemLabel: 'Valid passport',                                 category: 'document', required: true,  sortOrder: 17 },
    { itemLabel: 'US Embassy / Consulate interview',              category: 'action',   required: true,  sortOrder: 20 },
    { itemLabel: 'Visa application fee paid ($185)',              category: 'fee',      required: true,  sortOrder: 30 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',             description: 'F-1 student visa case initiated.',                             daysFromNow: 0,  isAutomated: true  },
    { eventType: 'document',     title: 'I-20 Received',           description: 'I-20 form received from institution. SEVIS fee payment required.', daysFromNow: 7,  isAutomated: false },
    { eventType: 'stage_change', title: 'DS-160 Submitted',        description: 'Visa application submitted. Embassy interview scheduled.',      daysFromNow: 21, isAutomated: false },
    { eventType: 'stage_change', title: 'Visa Interview',          description: 'F-1 visa interview at US Embassy.',                            daysFromNow: 42, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'fee_payment','title': 'SEVIS Fee (I-901)',    description: 'Must pay SEVIS fee before interview',  daysFromNow: 14, alertDays: 3  },
    { deadlineType: 'interview',  title: 'Embassy Interview',      description: 'F-1 visa interview appointment',        daysFromNow: 42, alertDays: 7  },
    { deadlineType: 'filing',     title: 'Enroll at Institution',  description: 'Begin enrollment by SEVIS deadline',    daysFromNow: 90, alertDays: 14 },
  ],
}

const F1_OPT: WorkflowDefinition = {
  initialStage: 'OPT Application',
  approvalProbabilityScore: 90,
  estimatedProcessingTime: 5,
  checklist: [
    { itemLabel: 'Form I-765 — Employment Authorization',            category: 'form',   formCode: 'I-765',   required: true,  sortOrder: 1 },
    { itemLabel: 'DSO recommendation in SEVIS',                     category: 'action', required: true,  sortOrder: 2 },
    { itemLabel: 'OPT I-20 issued by DSO',                         category: 'form',   formCode: 'I-20',    required: true,  sortOrder: 3 },
    { itemLabel: 'Degree completion evidence',                     category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: 'Passport copy (valid 6+ months)',               category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'US visa stamp copy',                            category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'SEVIS registration record',                     category: 'document', required: true,  sortOrder: 13 },
    { itemLabel: 'I-94 Arrival/Departure record',                category: 'document', required: true,  sortOrder: 14 },
    { itemLabel: 'I-765 filing fee paid ($410)',                  category: 'fee',      required: true,  sortOrder: 20 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'OPT Application Started', description: 'F-1 OPT employment authorization application initiated.',              daysFromNow: 0,  isAutomated: true  },
    { eventType: 'stage_change', title: 'DSO Recommendation',      description: 'DSO has recommended OPT in SEVIS and issued OPT I-20.',                daysFromNow: 7,  isAutomated: false },
    { eventType: 'stage_change', title: 'I-765 Filed',             description: 'Employment Authorization Document application filed with USCIS.',        daysFromNow: 14, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'filing',    title: 'File I-765',              description: 'Must file up to 90 days before graduation',  daysFromNow: 14, alertDays: 7 },
    { deadlineType: 'filing',    title: 'STEM OPT Extension',      description: 'File STEM extension before initial OPT expires', daysFromNow: 150, alertDays: 30 },
  ],
}

const J1_EXCHANGE: WorkflowDefinition = {
  initialStage: 'DS-2019 Issuance',
  approvalProbabilityScore: 88,
  estimatedProcessingTime: 2,
  checklist: [
    { itemLabel: 'Form DS-160 — Nonimmigrant Visa Application',      category: 'form',   formCode: 'DS-160',  required: true,  sortOrder: 1 },
    { itemLabel: 'Form DS-2019 — Certificate of Eligibility',        category: 'form',   formCode: 'DS-2019', required: true,  sortOrder: 2 },
    { itemLabel: 'SEVIS fee payment',                               category: 'fee',    required: true,  sortOrder: 3 },
    { itemLabel: 'Program sponsor letter of acceptance',            category: 'document', required: true,  sortOrder: 10 },
    { itemLabel: 'Financial support evidence',                     category: 'document', required: true,  sortOrder: 11 },
    { itemLabel: 'Academic or professional credentials',           category: 'document', required: true,  sortOrder: 12 },
    { itemLabel: 'Ties to home country evidence',                  category: 'document', required: true,  sortOrder: 13 },
    { itemLabel: 'Valid passport',                                 category: 'document', required: true,  sortOrder: 14 },
    { itemLabel: 'Embassy visa interview',                         category: 'action',   required: true,  sortOrder: 20 },
    { itemLabel: 'Visa application fee paid ($185)',              category: 'fee',      required: true,  sortOrder: 30 },
  ],
  timelineEvents: [
    { eventType: 'created',      title: 'Case Opened',             description: 'J-1 exchange visitor visa case initiated.',                     daysFromNow: 0,  isAutomated: true  },
    { eventType: 'stage_change', title: 'DS-2019 Received',        description: 'Certificate of Eligibility issued by sponsor organization.',    daysFromNow: 7,  isAutomated: false },
    { eventType: 'stage_change', title: 'Visa Interview',          description: 'J-1 visa interview at US Embassy.',                            daysFromNow: 28, isAutomated: false },
  ],
  deadlines: [
    { deadlineType: 'fee_payment', title: 'SEVIS Fee',             description: 'Pay SEVIS I-901 fee before interview',      daysFromNow: 14, alertDays: 3  },
    { deadlineType: 'interview',   title: 'Embassy Interview',     description: 'J-1 visa interview at US Embassy',           daysFromNow: 28, alertDays: 7  },
  ],
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const WORKFLOW_REGISTRY: Record<string, WorkflowDefinition> = {
  // Family
  'Marriage Green Card':   MARRIAGE_GREEN_CARD,
  'K-1 Fiancé Visa':      K1_FIANCE,
  'IR-2 Child Petition':  IR2_CHILD,
  // Employment
  'H-1B':                 H1B_CAP,
  'L-1A':                 L1A,
  'L-1B':                 { ...L1A, approvalProbabilityScore: 75, estimatedProcessingTime: 5 },
  'O-1A':                 O1A,
  'O-1B':                 { ...O1A, approvalProbabilityScore: 80 },
  'EB-1A':                EB1A,
  'EB-1B':                { ...EB1A, approvalProbabilityScore: 74, estimatedProcessingTime: 14 },
  'EB-1C':                { ...L1A, approvalProbabilityScore: 85, estimatedProcessingTime: 8 },
  'EB-2 NIW':             EB2_NIW,
  'EB-2 PERM':            { ...EB2_NIW, approvalProbabilityScore: 76, estimatedProcessingTime: 24 },
  'EB-3':                 { ...EB2_NIW, approvalProbabilityScore: 78, estimatedProcessingTime: 24 },
  'TN':                   TN,
  'E-1':                  { ...E2_TREATY, approvalProbabilityScore: 82 },
  'E-3':                  { ...TN, approvalProbabilityScore: 88 },
  // Investor
  'EB-5':                 EB5,
  'E-2':                  E2_TREATY,
  // Student
  'F-1':                  F1_STUDENT,
  'F-1 OPT':              F1_OPT,
  'J-1':                  J1_EXCHANGE,
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getWorkflow(visaCategory: string): WorkflowDefinition {
  return WORKFLOW_REGISTRY[visaCategory] ?? {
    initialStage: 'Intake',
    approvalProbabilityScore: 75,
    estimatedProcessingTime: 8,
    checklist: [
      { itemLabel: 'Completed application form', category: 'form',     required: true,  sortOrder: 1 },
      { itemLabel: 'Passport copies',             category: 'document', required: true,  sortOrder: 2 },
      { itemLabel: 'Supporting documentation',    category: 'document', required: true,  sortOrder: 3 },
      { itemLabel: 'Filing fee payment',          category: 'fee',      required: true,  sortOrder: 4 },
    ],
    timelineEvents: [
      { eventType: 'created', title: 'Case Opened', description: `${visaCategory} case initiated.`, daysFromNow: 0, isAutomated: true },
    ],
    deadlines: [],
  }
}

export function getAllVisaCategories(): { value: string; label: string; caseType: string }[] {
  return [
    // Family
    { value: 'Marriage Green Card', label: 'Marriage Green Card (IR-1 / CR-1)',    caseType: 'family'     },
    { value: 'K-1 Fiancé Visa',    label: 'K-1 Fiancé Visa',                      caseType: 'family'     },
    { value: 'IR-2 Child Petition',label: 'IR-2 Child Petition',                  caseType: 'family'     },
    // Employment
    { value: 'H-1B',               label: 'H-1B Specialty Occupation',            caseType: 'employment' },
    { value: 'L-1A',               label: 'L-1A Intracompany Manager/Executive',  caseType: 'employment' },
    { value: 'L-1B',               label: 'L-1B Intracompany Specialized Knowledge', caseType: 'employment' },
    { value: 'O-1A',               label: 'O-1A Extraordinary Ability (Science/Business)', caseType: 'employment' },
    { value: 'O-1B',               label: 'O-1B Extraordinary Ability (Arts)',    caseType: 'employment' },
    { value: 'EB-1A',              label: 'EB-1A Extraordinary Ability (Green Card)', caseType: 'employment' },
    { value: 'EB-1B',              label: 'EB-1B Outstanding Researcher',         caseType: 'employment' },
    { value: 'EB-1C',              label: 'EB-1C Multinational Manager/Executive',caseType: 'employment' },
    { value: 'EB-2 NIW',           label: 'EB-2 National Interest Waiver',        caseType: 'employment' },
    { value: 'EB-2 PERM',          label: 'EB-2 PERM Labor Certification',        caseType: 'employment' },
    { value: 'EB-3',               label: 'EB-3 Skilled / Professional Worker',   caseType: 'employment' },
    { value: 'TN',                 label: 'TN USMCA (Canada/Mexico)',             caseType: 'employment' },
    { value: 'E-1',                label: 'E-1 Treaty Trader',                    caseType: 'employment' },
    { value: 'E-3',                label: 'E-3 Australian Specialty Occupation',  caseType: 'employment' },
    // Investor
    { value: 'EB-5',               label: 'EB-5 Immigrant Investor',              caseType: 'investor'   },
    { value: 'E-2',                label: 'E-2 Treaty Investor',                  caseType: 'investor'   },
    // Student
    { value: 'F-1',                label: 'F-1 Student Visa',                     caseType: 'student'    },
    { value: 'F-1 OPT',            label: 'F-1 OPT Employment Authorization',     caseType: 'student'    },
    { value: 'J-1',                label: 'J-1 Exchange Visitor',                 caseType: 'student'    },
  ]
}

export function getCaseTypeLabel(caseType: string): string {
  const map: Record<string, string> = {
    family: 'Family', employment: 'Employment', investor: 'Investor', student: 'Student',
  }
  return map[caseType] ?? caseType
}
