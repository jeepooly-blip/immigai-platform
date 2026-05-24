import type { FormSchema } from './types'
import { COUNTRIES } from './countries'

export const I140_SCHEMA: FormSchema = {
  formType: 'I-140',
  title: 'Immigrant Petition for Alien Workers',
  subtitle: 'Employment-based immigrant visa petition — EB-1, EB-2, EB-3, and EB-2 NIW',
  uscisUrl: 'https://www.uscis.gov/i-140',
  totalPages: 10,
  sections: [
    {
      id: 'petition_type',
      title: 'Part 1 — Petition Type',
      subtitle: 'Select the immigrant classification you are filing under',
      icon: '⚖️',
      fields: [
        { id: 'petition_basis', label: 'I am filing this petition for:', type: 'radio', required: true, width: 'full',
          options: [
            {value:'eb1a',  label:'EB-1A — Alien of Extraordinary Ability (self-petition)'},
            {value:'eb1b',  label:'EB-1B — Outstanding Researcher or Professor'},
            {value:'eb1c',  label:'EB-1C — Multinational Manager or Executive'},
            {value:'eb2_adv',label:'EB-2 — Advanced Degree Professional (with PERM or NIW)'},
            {value:'eb2_niw',label:'EB-2 NIW — National Interest Waiver (self-petition)'},
            {value:'eb3_sk', label:'EB-3 — Skilled Worker (2+ years training)'},
            {value:'eb3_pro',label:'EB-3 — Professional (bachelor\'s degree required)'},
            {value:'eb3_ow', label:'EB-3 — Other Worker (unskilled, less than 2 years training)'},
          ]
        },
        { id: 'self_petition', label: 'This is a self-petition (applicant is filing for themselves)', type: 'checkbox', required: false, width: 'full' },
      ],
    },
    {
      id: 'petitioner_employer',
      title: 'Part 2 — Petitioner Information (Employer)',
      subtitle: 'If an employer is filing, provide their information. Skip if self-petition.',
      icon: '🏢',
      fields: [
        { id: 'emp_org_name',   label: 'Employer/Organization Name',    type: 'text',  required: false, width: 'full',  caseMapping: 'petitionerName' },
        { id: 'emp_ein',        label: 'Employer Identification Number (EIN)', type: 'text', required: false, width: 'half', placeholder: 'XX-XXXXXXX' },
        { id: 'emp_address',    label: 'Business Street Address',        type: 'text',  required: false, width: 'full',  placeholder: '100 Corporate Blvd, Suite 200' },
        { id: 'emp_city',       label: 'City',                           type: 'text',  required: false, width: 'third' },
        { id: 'emp_state',      label: 'State',                          type: 'text',  required: false, width: 'third' },
        { id: 'emp_zip',        label: 'ZIP Code',                       type: 'text',  required: false, width: 'third' },
        { id: 'emp_phone',      label: 'Business Phone',                 type: 'tel',   required: false, width: 'half', placeholder: '(555) 000-0000' },
        { id: 'emp_website',    label: 'Business Website',               type: 'text',  required: false, width: 'half', placeholder: 'www.company.com' },
        { id: 'emp_type',       label: 'Business Type', type: 'select', required: false, width: 'half',
          options: [
            {value:'private',label:'Private Company'},{value:'public',label:'Publicly Traded Company'},
            {value:'nonprofit',label:'Non-Profit'},{value:'government',label:'Government Entity'},
            {value:'education',label:'Educational Institution'},{value:'self_employed',label:'Self-Employed'},
          ]
        },
        { id: 'emp_employees',  label: 'Number of Employees',           type: 'number', required: false, width: 'half' },
        { id: 'emp_gross_income',label:'Annual Gross Income (USD)',      type: 'number', required: false, width: 'half', placeholder: '5000000' },
        { id: 'emp_net_income', label: 'Net Annual Income (USD)',        type: 'number', required: false, width: 'half', placeholder: '1000000' },
      ],
    },
    {
      id: 'beneficiary',
      title: 'Part 3 — Beneficiary Information',
      subtitle: 'The foreign national worker being petitioned for',
      icon: '👤',
      fields: [
        { id: 'ben_family_name',   label: 'Family Name',      type: 'text',  required: true,  width: 'half', caseMapping: 'applicantLastName'  },
        { id: 'ben_given_name',    label: 'First Name',       type: 'text',  required: true,  width: 'half', caseMapping: 'applicantFirstName' },
        { id: 'ben_middle_name',   label: 'Middle Name',      type: 'text',  required: false, width: 'half' },
        { id: 'ben_dob',           label: 'Date of Birth',    type: 'date',  required: true,  width: 'half' },
        { id: 'ben_country_birth', label: 'Country of Birth', type: 'country', required: true, width: 'half', options: COUNTRIES },
        { id: 'ben_country_citizen',label:'Country of Citizenship', type: 'country', required: true, width: 'half', options: COUNTRIES },
        { id: 'ben_alien_number',  label: 'A-Number (if any)', type: 'alien_number', required: false, width: 'half' },
        { id: 'ben_ssn',           label: 'U.S. Social Security Number', type: 'ssn', required: false, width: 'half' },
        { id: 'ben_highest_edu',   label: 'Highest Level of Education', type: 'select', required: true, width: 'half',
          options: [
            {value:'none',label:'None'},{value:'high_school',label:'High School Diploma/GED'},
            {value:'associates',label:"Associate's Degree"},{value:'bachelors',label:"Bachelor's Degree"},
            {value:'masters',label:"Master's Degree"},{value:'phd',label:'Doctorate (Ph.D.)'},
            {value:'jd',label:'J.D. / Law Degree'},{value:'md',label:'M.D. / Medical Degree'},
            {value:'other_grad',label:'Other Graduate Degree'},
          ]
        },
        { id: 'ben_years_experience', label: 'Years of Relevant Work Experience', type: 'number', required: false, width: 'half', placeholder: '10' },
      ],
    },
    {
      id: 'employment_offer',
      title: 'Part 4 — Job Offer Information',
      subtitle: 'Details about the offered U.S. position (not required for EB-1A or EB-2 NIW)',
      icon: '💼',
      fields: [
        { id: 'job_title',     label: 'Job Title',                     type: 'text',   required: false, width: 'full',  placeholder: 'Senior Software Engineer' },
        { id: 'job_soc_code',  label: 'SOC Code (from LCA if applicable)', type: 'text', required: false, width: 'half', placeholder: '15-1256' },
        { id: 'job_wage',      label: 'Offered Wage (annual, USD)',    type: 'number', required: false, width: 'half',  placeholder: '150000' },
        { id: 'job_full_time', label: 'This is a full-time, permanent position', type: 'checkbox', required: false, width: 'full' },
        { id: 'job_description', label: 'Job Duties and Requirements', type: 'textarea', required: false, width: 'full', rows: 5,
          placeholder: 'Describe the specific job duties, minimum education/experience requirements, and why a U.S. worker could not be found...',
          aiPrompt: 'Write a detailed job description for an immigration I-140 petition highlighting the specialized nature, minimum requirements, and why the role qualifies as a specialty occupation.'
        },
        { id: 'perm_number',   label: 'PERM Certification Number (ETA-9089)', type: 'text', required: false, width: 'half', placeholder: 'A-12345-12345' },
        { id: 'perm_date',     label: 'PERM Certification Date',        type: 'date',  required: false, width: 'half' },
      ],
    },
    {
      id: 'extraordinary_ability',
      title: 'Part 5 — Extraordinary Ability / Outstanding Researcher Evidence',
      subtitle: 'For EB-1A and EB-1B petitions. Describe the evidence establishing extraordinary ability.',
      icon: '⭐',
      fields: [
        { id: 'ea_awards',       label: 'Major Awards and Prizes', type: 'checkbox', required: false, width: 'full',
          helpText: 'Check if the beneficiary has received nationally/internationally recognized awards'
        },
        { id: 'ea_membership',   label: 'Membership in Exclusive Associations', type: 'checkbox', required: false, width: 'full' },
        { id: 'ea_published',    label: 'Published Material About Work', type: 'checkbox', required: false, width: 'full' },
        { id: 'ea_judging',      label: 'Participated as Judge of Others\' Work', type: 'checkbox', required: false, width: 'full' },
        { id: 'ea_original_contributions', label: 'Original Scientific/Scholarly Contributions', type: 'checkbox', required: false, width: 'full' },
        { id: 'ea_scholarly_articles',     label: 'Authored Scholarly Articles in Peer-Reviewed Journals', type: 'checkbox', required: false, width: 'full' },
        { id: 'ea_critical_role',          label: 'Critical Role in Distinguished Organizations', type: 'checkbox', required: false, width: 'full' },
        { id: 'ea_high_salary',            label: 'Commands High Salary Relative to Others in Field', type: 'checkbox', required: false, width: 'full' },
        { id: 'ea_summary', label: 'Summary of Extraordinary Ability Evidence', type: 'ai_narrative', required: false, width: 'full', rows: 8,
          aiPrompt: 'Write a compelling narrative for an I-140 EB-1A petition describing the beneficiary\'s extraordinary ability in their field, citing specific achievements, publications, citations, awards, and their impact on the field. This should demonstrate sustained national or international acclaim.'
        },
      ],
    },
    {
      id: 'niw_argument',
      title: 'Part 6 — National Interest Waiver Statement',
      subtitle: 'For EB-2 NIW petitions only — demonstrate why a labor certification waiver is in the national interest',
      icon: '🇺🇸',
      fields: [
        { id: 'niw_field',    label: 'Proposed Field of Endeavor',     type: 'text',     required: false, width: 'full', placeholder: 'Artificial Intelligence and Machine Learning Research' },
        { id: 'niw_merit',    label: 'Substantial Merit and National Importance', type: 'ai_narrative', required: false, width: 'full', rows: 6,
          aiPrompt: 'Write the first prong of an EB-2 NIW argument for Matter of Dhanasar: explain why the proposed endeavor has both substantial merit (demonstrating importance and benefit to the field) and national importance (impact beyond the beneficiary\'s employer and local area).'
        },
        { id: 'niw_positioned', label: 'Beneficiary Well-Positioned to Advance the Endeavor', type: 'ai_narrative', required: false, width: 'full', rows: 6,
          aiPrompt: 'Write the second prong of an EB-2 NIW argument: explain why this specific beneficiary is well-positioned to advance the proposed endeavor based on their education, skills, knowledge, record of success, and plan.'
        },
        { id: 'niw_benefit',  label: 'On Balance Beneficial to Waive Requirements', type: 'ai_narrative', required: false, width: 'full', rows: 5,
          aiPrompt: 'Write the third prong of an EB-2 NIW argument: explain why, on balance, it would be beneficial to the United States to waive the job offer and labor certification requirements, considering the beneficiary\'s contributions and the urgency of their work.'
        },
      ],
    },
    {
      id: 'signature',
      title: 'Part 8 — Petitioner\'s Declaration',
      subtitle: 'Certification under penalty of perjury',
      icon: '✍️',
      fields: [
        { id: 'contact_name',  label: 'Contact Person\'s Name',        type: 'text',  required: false, width: 'half' },
        { id: 'contact_phone', label: 'Contact Phone',                  type: 'tel',   required: false, width: 'half' },
        { id: 'attorney_name', label: 'Attorney / Representative Name', type: 'text',  required: false, width: 'half' },
        { id: 'attorney_bar',  label: 'Attorney Bar / USCIS ID Number', type: 'text',  required: false, width: 'half' },
        { id: 'certify_true',  label: 'I certify under penalty of perjury that all information is true and correct', type: 'checkbox', required: true, width: 'full' },
      ],
    },
  ],
}
