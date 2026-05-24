import type { FormSchema } from './types'
import { COUNTRIES } from './countries'

export const I129_SCHEMA: FormSchema = {
  formType: 'I-129',
  title: 'Petition for Nonimmigrant Worker',
  subtitle: 'H-1B, L-1, O-1, TN, and other temporary worker classifications',
  uscisUrl: 'https://www.uscis.gov/i-129',
  totalPages: 36,
  sections: [
    {
      id: 'employer',
      title: 'Part 1 — Employer/Petitioner Information',
      subtitle: 'The U.S. employer filing this petition',
      icon: '🏢',
      fields: [
        { id: 'emp_name',    label: 'Employer / Organization Name',    type: 'text',   required: true, width: 'full',  caseMapping: 'petitionerName' },
        { id: 'emp_ein',     label: 'Federal Employer ID Number (FEIN/EIN)', type: 'text', required: true, width: 'half', placeholder: 'XX-XXXXXXX' },
        { id: 'emp_address', label: 'Street Address',                   type: 'text',   required: true, width: 'full',  placeholder: '1 Infinite Loop' },
        { id: 'emp_city',    label: 'City',                             type: 'text',   required: true, width: 'third' },
        { id: 'emp_state',   label: 'State',                            type: 'text',   required: true, width: 'third' },
        { id: 'emp_zip',     label: 'ZIP Code',                         type: 'text',   required: true, width: 'third' },
        { id: 'emp_phone',   label: 'Phone Number',                     type: 'tel',    required: true, width: 'half',  placeholder: '(408) 000-0000' },
        { id: 'emp_type',    label: 'Type of Employer', type: 'select', required: true, width: 'half',
          options: [{value:'private',label:'Private Company'},{value:'public',label:'Publicly Traded'},
                    {value:'nonprofit',label:'Non-Profit'},{value:'education',label:'Educational Institution'},
                    {value:'government',label:'Government'},{value:'individual',label:'Individual'}]
        },
        { id: 'naics_code',  label: 'NAICS Code', type: 'text', required: false, width: 'half', placeholder: '511210' },
        { id: 'emp_gross_income', label: 'Gross Annual Income (USD)', type: 'number', required: false, width: 'half' },
      ],
    },
    {
      id: 'worker',
      title: 'Part 2 — Beneficiary / Worker Information',
      subtitle: 'The worker being petitioned for',
      icon: '👤',
      fields: [
        { id: 'worker_family_name', label: 'Family Name',        type: 'text',    required: true,  width: 'half', caseMapping: 'applicantLastName'  },
        { id: 'worker_given_name',  label: 'First Name',         type: 'text',    required: true,  width: 'half', caseMapping: 'applicantFirstName' },
        { id: 'worker_middle_name', label: 'Middle Name',        type: 'text',    required: false, width: 'half' },
        { id: 'worker_dob',         label: 'Date of Birth',      type: 'date',    required: true,  width: 'half' },
        { id: 'worker_country_birth',label:'Country of Birth',   type: 'country', required: true,  width: 'half', options: COUNTRIES },
        { id: 'worker_country_citizen',label:'Citizenship',      type: 'country', required: true,  width: 'half', options: COUNTRIES },
        { id: 'worker_alien_number', label: 'A-Number (if any)', type: 'alien_number', required: false, width: 'half' },
        { id: 'worker_ssn',          label: 'U.S. SSN (if any)', type: 'ssn',    required: false, width: 'half' },
        { id: 'worker_passport',     label: 'Passport Number',   type: 'text',   required: true,  width: 'half' },
        { id: 'worker_passport_exp', label: 'Passport Expiry',   type: 'date',   required: true,  width: 'half' },
        { id: 'worker_current_status',label:'Current Status',    type: 'text',   required: false, width: 'half', placeholder: 'e.g. F-1, H-1B, Out of Status' },
        { id: 'worker_status_expiry', label: 'Status Expires',   type: 'date',   required: false, width: 'half' },
      ],
    },
    {
      id: 'classification',
      title: 'Part 3 — Classification',
      subtitle: 'Select the nonimmigrant classification being requested',
      icon: '📂',
      fields: [
        { id: 'visa_classification', label: 'Requested Classification', type: 'radio', required: true, width: 'full',
          options: [
            {value:'H-1B',  label:'H-1B — Specialty Occupation Worker'},
            {value:'H-1B1', label:'H-1B1 — Free Trade Agreement (Chile/Singapore)'},
            {value:'L-1A',  label:'L-1A — Intracompany Manager/Executive'},
            {value:'L-1B',  label:'L-1B — Intracompany Specialized Knowledge'},
            {value:'O-1A',  label:'O-1A — Extraordinary Ability (Science/Business/Athletics)'},
            {value:'O-1B',  label:'O-1B — Extraordinary Ability (Arts/Film/TV)'},
            {value:'TN',    label:'TN — USMCA Trade Nafta (Canada/Mexico)'},
            {value:'E-3',   label:'E-3 — Australian Specialty Occupation'},
            {value:'H-2A',  label:'H-2A — Agricultural Worker'},
            {value:'H-2B',  label:'H-2B — Nonagricultural Temporary Worker'},
          ]
        },
        { id: 'requested_action', label: 'Requested Action', type: 'radio', required: true, width: 'full',
          options: [
            {value:'new',    label:'New petition'},
            {value:'change', label:'Change of status to this classification'},
            {value:'extend', label:'Extension of stay in this classification'},
            {value:'amend',  label:'Amended petition'},
            {value:'concurrent',label:'Concurrent petition'},
          ]
        },
        { id: 'start_date',   label: 'Requested Start Date', type: 'date', required: true,  width: 'half' },
        { id: 'end_date',     label: 'Requested End Date',   type: 'date', required: true,  width: 'half' },
        { id: 'full_time',    label: 'Full-time position',   type: 'radio', required: true,  width: 'half',
          options: [{value:'yes',label:'Full-time (35+ hours/week)'},{value:'no',label:'Part-time'}]
        },
        { id: 'wage',         label: 'Offered Wage (annual USD)', type: 'number', required: true, width: 'half', placeholder: '120000' },
        { id: 'wage_source',  label: 'Wage Source', type: 'radio', required: true, width: 'full',
          options: [{value:'petitioner',label:'Paid by petitioner'},{value:'third_party',label:'Paid by third party'},
                    {value:'self',label:'Self-employed'},{value:'contingency',label:'Contingent basis'}]
        },
        { id: 'worksite_address', label: 'Primary Worksite Address', type: 'text', required: true, width: 'full', placeholder: '1 Infinite Loop, Cupertino, CA 95014' },
        { id: 'multiple_sites',   label: 'Worker will work at multiple worksites', type: 'checkbox', required: false, width: 'full' },
      ],
    },
    {
      id: 'specialty_occupation',
      title: 'Part 4 — H-1B Specialty Occupation Details',
      subtitle: 'For H-1B petitions — demonstrate the position qualifies as a specialty occupation',
      icon: '💡',
      fields: [
        { id: 'job_title',   label: 'Job Title',                      type: 'text', required: false, width: 'full', placeholder: 'Senior Software Engineer' },
        { id: 'soc_code',    label: 'SOC Code',                       type: 'text', required: false, width: 'half', placeholder: '15-1256' },
        { id: 'soc_title',   label: 'SOC Occupation Title',           type: 'text', required: false, width: 'half', placeholder: 'Software Developer' },
        { id: 'lca_number',  label: 'LCA Case Number (ETA-9035)',     type: 'text', required: false, width: 'half', placeholder: 'I-200-XXXXX-XXXXXX' },
        { id: 'lca_period_start', label: 'LCA Validity Start',        type: 'date', required: false, width: 'half' },
        { id: 'specialty_duties', label: 'Specialty Occupation Duties', type: 'ai_narrative', required: false, width: 'full', rows: 6,
          aiPrompt: 'Write a detailed H-1B specialty occupation job duties narrative demonstrating that the position: (1) normally requires a bachelor\'s or higher degree, (2) the degree requirement is common in the industry, (3) the employer normally requires a degree for the position, and (4) the nature of the specific duties is so specialized and complex that the knowledge required is typically associated with a bachelor\'s or higher degree. Include specific technical skills and how they relate to the education requirement.'
        },
      ],
    },
    {
      id: 'support_letter',
      title: 'Part 5 — Employer Support Statement',
      subtitle: 'The employer\'s declaration supporting this petition',
      icon: '📝',
      fields: [
        { id: 'support_letter_text', label: 'Employer Support Letter / Statement', type: 'ai_narrative', required: false, width: 'full', rows: 10,
          aiPrompt: 'Write a formal employer support letter for an I-129 nonimmigrant worker petition. The letter should be addressed to USCIS, describe the employer\'s business, the specific position offered, the beneficiary\'s qualifications, and why the employer is sponsoring this visa. Include a paragraph about the business need for this position and the beneficiary\'s unique skills. Sign off with the employer\'s contact information.'
        },
      ],
    },
    {
      id: 'signature',
      title: 'Part 9 — Petitioner Signature',
      subtitle: 'Certification and declaration',
      icon: '✍️',
      fields: [
        { id: 'auth_name',       label: 'Name of Person Authorized to Sign', type: 'text',  required: true,  width: 'half' },
        { id: 'auth_title',      label: 'Title / Position',                  type: 'text',  required: true,  width: 'half', placeholder: 'HR Manager' },
        { id: 'certify_true',    label: 'I certify under penalty of perjury that the contents of this petition are true and correct', type: 'checkbox', required: true, width: 'full' },
        { id: 'attorney_name',   label: 'Attorney / Representative Name',    type: 'text',  required: false, width: 'half' },
        { id: 'attorney_bar',    label: 'Bar Number / USCIS ID',             type: 'text',  required: false, width: 'half' },
        { id: 'attorney_phone',  label: 'Attorney Phone',                    type: 'tel',   required: false, width: 'half' },
        { id: 'attorney_email',  label: 'Attorney Email',                    type: 'email', required: false, width: 'half' },
      ],
    },
  ],
}
