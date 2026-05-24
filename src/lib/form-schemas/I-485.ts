import type { FormSchema } from './types'
import { COUNTRIES, US_STATES } from './countries'

export const I485_SCHEMA: FormSchema = {
  formType: 'I-485',
  title: 'Application to Register Permanent Residence',
  subtitle: 'Adjustment of status from nonimmigrant or other to lawful permanent resident',
  uscisUrl: 'https://www.uscis.gov/i-485',
  totalPages: 18,
  sections: [
    {
      id: 'personal_info',
      title: 'Part 1 — Information About You',
      subtitle: 'Applicant\'s current legal name and contact information',
      icon: '👤',
      fields: [
        { id: 'app_family_name',  label: 'Family Name (Last Name)',     type: 'text',  required: true,  width: 'half', caseMapping: 'applicantLastName'  },
        { id: 'app_given_name',   label: 'Given Name (First Name)',     type: 'text',  required: true,  width: 'half', caseMapping: 'applicantFirstName' },
        { id: 'app_middle_name',  label: 'Middle Name',                 type: 'text',  required: false, width: 'half' },
        { id: 'app_other_names',  label: 'Other Names Used (maiden, aliases, etc.)', type: 'text', required: false, width: 'full' },
        { id: 'app_dob',          label: 'Date of Birth',               type: 'date',  required: true,  width: 'third' },
        { id: 'app_gender',       label: 'Gender',                      type: 'radio', required: true,  width: 'third',
          options: [{value:'M',label:'Male'},{value:'F',label:'Female'}]
        },
        { id: 'app_marital_status', label: 'Marital Status', type: 'select', required: true, width: 'third',
          options: [
            {value:'single',label:'Single/Never Married'},{value:'married',label:'Married'},
            {value:'divorced',label:'Divorced'},{value:'widowed',label:'Widowed'},
          ]
        },
        { id: 'app_ssn',          label: 'U.S. Social Security Number', type: 'ssn',   required: false, width: 'half', placeholder: 'XXX-XX-XXXX' },
        { id: 'app_alien_number', label: 'USCIS A-Number (if any)',     type: 'alien_number', required: false, width: 'half' },
        { id: 'app_uscis_account',label: 'USCIS Online Account Number', type: 'text',  required: false, width: 'half' },
        { id: 'app_country_birth',label: 'Country of Birth',            type: 'country', required: true, width: 'half', options: COUNTRIES },
        { id: 'app_country_citizen',label:'Country of Citizenship',     type: 'country', required: true, width: 'half', options: COUNTRIES },
        { id: 'app_current_status', label: 'Current Immigration Status', type: 'select', required: true, width: 'half',
          options: [
            {value:'b1_b2',label:'B-1/B-2 Visitor'},{value:'f1',label:'F-1 Student'},
            {value:'h1b',label:'H-1B Worker'},{value:'l1',label:'L-1 Transferee'},
            {value:'j1',label:'J-1 Exchange'},{value:'k1',label:'K-1 Fiancé'},
            {value:'parolee',label:'Parolee'},{value:'asylee',label:'Asylee'},
            {value:'other',label:'Other'},
          ]
        },
        { id: 'app_i94_number',   label: 'I-94 Arrival/Departure Record Number', type: 'text', required: false, width: 'half', placeholder: '12345678901' },
        { id: 'app_passport_number', label: 'Passport Number',          type: 'text',  required: true,  width: 'half' },
        { id: 'app_passport_country', label: 'Passport Country of Issuance', type: 'country', required: true, width: 'half', options: COUNTRIES },
        { id: 'app_passport_expiry',  label: 'Passport Expiry Date',    type: 'date',  required: true,  width: 'half' },
      ],
    },
    {
      id: 'address',
      title: 'Part 2 — Current Address and Contact',
      subtitle: 'Your current physical address in the United States',
      icon: '🏠',
      fields: [
        { id: 'addr_street',  label: 'Street Address',          type: 'text',  required: true,  width: 'full', placeholder: '123 Main Street, Apt 4B' },
        { id: 'addr_city',    label: 'City',                    type: 'text',  required: true,  width: 'third' },
        { id: 'addr_state',   label: 'State',                   type: 'state', required: true,  width: 'third' },
        { id: 'addr_zip',     label: 'ZIP Code',                type: 'zip',   required: true,  width: 'third' },
        { id: 'phone_day',    label: 'Daytime Phone',           type: 'tel',   required: true,  width: 'half', placeholder: '(555) 000-0000' },
        { id: 'phone_mobile', label: 'Mobile Phone',            type: 'tel',   required: false, width: 'half' },
        { id: 'email',        label: 'Email Address',           type: 'email', required: false, width: 'half', caseMapping: 'applicantEmail' },
        { id: 'addr_since',   label: 'Moved to this address on', type: 'date', required: false, width: 'half' },
        { id: 'mailing_same', label: 'Mailing address is same as above', type: 'checkbox', required: false, width: 'full' },
      ],
    },
    {
      id: 'basis_for_eligibility',
      title: 'Part 3 — Processing Information',
      subtitle: 'Basis for eligibility to adjust status',
      icon: '⚖️',
      fields: [
        { id: 'basis', label: 'I am applying based on:', type: 'select', required: true, width: 'full',
          options: [
            {value:'family_imm_visa',   label:'An immigrant visa is immediately available based on an approved petition'},
            {value:'asylee',            label:'I was granted asylum and have been in the U.S. for at least 1 year'},
            {value:'refugee',           label:'I was admitted as a refugee at least 1 year ago'},
            {value:'spouse_usc',        label:'I am the spouse of a U.S. citizen who died within 2 years'},
            {value:'diversity',         label:'I was selected in the Diversity Visa lottery'},
            {value:'special_immigrant', label:'I am a special immigrant'},
            {value:'other',             label:'Other basis (explain below)'},
          ]
        },
        { id: 'priority_date',    label: 'Priority Date (from I-140/I-130 approval)', type: 'date',   required: false, width: 'half' },
        { id: 'receipt_number',   label: 'USCIS Receipt Number of underlying petition', type: 'text', required: false, width: 'half', placeholder: 'MSC1234567890' },
        { id: 'preference_cat',   label: 'Preference category (from Visa Bulletin)', type: 'text',   required: false, width: 'half', placeholder: 'e.g. EB-2, F2A' },
        { id: 'been_admitted',    label: 'Have you previously been lawfully admitted to the U.S.?', type: 'radio', required: true, width: 'full',
          options: [{value:'yes',label:'Yes'},{value:'no',label:'No'}]
        },
        { id: 'last_entry_date',  label: 'Date of last entry into U.S.',           type: 'date', required: false, width: 'half' },
        { id: 'last_entry_port',  label: 'Port of entry',                           type: 'text', required: false, width: 'half', placeholder: 'JFK, New York' },
        { id: 'status_expires',   label: 'Your authorized stay expires (from I-94)', type: 'date', required: false, width: 'half' },
      ],
    },
    {
      id: 'biographic',
      title: 'Part 8 — Biographic Information',
      subtitle: 'Physical description for USCIS records',
      icon: '📋',
      fields: [
        { id: 'ethnicity', label: 'Ethnicity', type: 'radio', required: true, width: 'full',
          options: [{value:'hispanic',label:'Hispanic or Latino'},{value:'not_hispanic',label:'Not Hispanic or Latino'}]
        },
        { id: 'race', label: 'Race', type: 'select', required: true, width: 'full',
          options: [
            {value:'white',label:'White'},{value:'asian',label:'Asian'},{value:'black',label:'Black or African American'},
            {value:'aian',label:'American Indian or Alaska Native'},{value:'nhopi',label:'Native Hawaiian/Other Pacific Islander'},
          ]
        },
        { id: 'height_ft', label: 'Height (feet)', type: 'number', required: true,  width: 'third', placeholder: '5' },
        { id: 'height_in', label: 'Height (inches)',type: 'number', required: true,  width: 'third', placeholder: '8' },
        { id: 'weight',    label: 'Weight (lbs)',   type: 'number', required: true,  width: 'third', placeholder: '155' },
        { id: 'eye_color', label: 'Eye Color',      type: 'select', required: true,  width: 'half',
          options: [{value:'black',label:'Black'},{value:'blue',label:'Blue'},{value:'brown',label:'Brown'},
                    {value:'gray',label:'Gray'},{value:'green',label:'Green'},{value:'hazel',label:'Hazel'},{value:'other',label:'Other'}]
        },
        { id: 'hair_color',label: 'Hair Color',     type: 'select', required: true,  width: 'half',
          options: [{value:'bald',label:'Bald'},{value:'black',label:'Black'},{value:'blond',label:'Blond'},
                    {value:'brown',label:'Brown'},{value:'gray',label:'Gray'},{value:'red',label:'Red'},{value:'white',label:'White'},{value:'other',label:'Other'}]
        },
      ],
    },
    {
      id: 'background',
      title: 'Part 9 — General Eligibility and Inadmissibility Grounds',
      subtitle: 'Questions about your background and immigration history',
      icon: '🔍',
      fields: [
        { id: 'ever_removed',      label: 'Have you EVER been removed or deported from the U.S.?', type: 'radio', required: true, width: 'full', options: [{value:'yes',label:'Yes'},{value:'no',label:'No'}] },
        { id: 'ever_overstayed',   label: 'Have you EVER remained in the U.S. beyond the date authorized on your I-94?', type: 'radio', required: true, width: 'full', options: [{value:'yes',label:'Yes'},{value:'no',label:'No'}] },
        { id: 'ever_visa_waiver',  label: 'Did you enter under the Visa Waiver Program?', type: 'radio', required: true, width: 'full', options: [{value:'yes',label:'Yes'},{value:'no',label:'No'}] },
        { id: 'ever_convicted',    label: 'Have you EVER been convicted of or pled no contest to a crime?', type: 'radio', required: true, width: 'full', options: [{value:'yes',label:'Yes'},{value:'no',label:'No'}] },
        { id: 'ever_public_charge',label: 'Have you EVER received public benefits (welfare, Medicaid, etc.)?', type: 'radio', required: true, width: 'full', options: [{value:'yes',label:'Yes'},{value:'no',label:'No'}] },
      ],
    },
    {
      id: 'signature',
      title: 'Part 12 — Applicant\'s Statement',
      subtitle: 'Declaration and certification',
      icon: '✍️',
      fields: [
        { id: 'interpreter_used', label: 'An interpreter was used to prepare this application', type: 'checkbox', required: false, width: 'full' },
        { id: 'interpreter_name', label: 'Interpreter\'s Name', type: 'text', required: false, width: 'half' },
        { id: 'interpreter_lang', label: 'Language Interpreted', type: 'text', required: false, width: 'half' },
        { id: 'preparer_name',    label: 'Preparer\'s Full Name (if not applicant)', type: 'text', required: false, width: 'half' },
        { id: 'certify_true',     label: 'I certify under penalty of perjury that the contents of this application are true and correct', type: 'checkbox', required: true, width: 'full' },
      ],
    },
  ],
}
