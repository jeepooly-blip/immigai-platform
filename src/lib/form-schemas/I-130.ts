import type { FormSchema } from './types'
import { COUNTRIES } from './countries'

export const I130_SCHEMA: FormSchema = {
  formType: 'I-130',
  title: 'Petition for Alien Relative',
  subtitle: 'Used by a U.S. citizen or LPR to petition for a foreign-national family member',
  uscisUrl: 'https://www.uscis.gov/i-130',
  totalPages: 12,
  sections: [
    {
      id: 'petitioner_info',
      title: 'Part 1 — Petitioner Information',
      subtitle: 'Information about the U.S. citizen or lawful permanent resident filing this petition',
      icon: '👤',
      fields: [
        { id: 'pet_family_name',   label: 'Family Name (Last Name)', type: 'text', required: true, width: 'half', caseMapping: 'petitionerLastName', placeholder: 'Smith' },
        { id: 'pet_given_name',    label: 'Given Name (First Name)', type: 'text', required: true, width: 'half', caseMapping: 'petitionerFirstName', placeholder: 'Jane' },
        { id: 'pet_middle_name',   label: 'Middle Name',             type: 'text', required: false, width: 'third' },
        { id: 'pet_dob',           label: 'Date of Birth',           type: 'date', required: true,  width: 'third' },
        { id: 'pet_ssn',           label: 'U.S. Social Security Number', type: 'ssn', required: false, width: 'third', placeholder: 'XXX-XX-XXXX' },
        { id: 'pet_alien_number',  label: 'USCIS A-Number (if any)', type: 'alien_number', required: false, width: 'half', placeholder: 'A-000000000' },
        { id: 'pet_country_birth', label: 'Country of Birth',        type: 'country', required: true,  width: 'half', options: COUNTRIES },
        { id: 'pet_country_citizen',label:'Country of Citizenship',  type: 'country', required: true,  width: 'half', options: COUNTRIES },
        { id: 'pet_basis',         label: 'I am filing this petition as a:', type: 'radio', required: true, width: 'full',
          options: [
            { value: 'us_citizen',  label: 'U.S. Citizen' },
            { value: 'lpr',         label: 'Lawful Permanent Resident (LPR)' },
            { value: 'us_national', label: 'U.S. National' },
          ]
        },
        { id: 'pet_address_street',label: 'Street Address',           type: 'text',  required: true,  width: 'full', placeholder: '123 Main Street, Apt 4B' },
        { id: 'pet_address_city',  label: 'City',                     type: 'text',  required: true,  width: 'third' },
        { id: 'pet_address_state', label: 'State',                    type: 'state', required: true,  width: 'third' },
        { id: 'pet_address_zip',   label: 'ZIP Code',                 type: 'zip',   required: true,  width: 'third' },
        { id: 'pet_phone',         label: 'Daytime Phone Number',     type: 'tel',   required: true,  width: 'half', placeholder: '(555) 000-0000' },
        { id: 'pet_email',         label: 'Email Address',            type: 'email', required: false, width: 'half', caseMapping: 'petitionerEmail' },
      ],
    },
    {
      id: 'beneficiary_info',
      title: 'Part 3 — Beneficiary Information',
      subtitle: 'Information about the foreign national you are petitioning for',
      icon: '🌍',
      fields: [
        { id: 'ben_family_name',   label: 'Family Name (Last Name)',  type: 'text', required: true,  width: 'half', caseMapping: 'applicantLastName', placeholder: 'Smith' },
        { id: 'ben_given_name',    label: 'Given Name (First Name)',  type: 'text', required: true,  width: 'half', caseMapping: 'applicantFirstName', placeholder: 'Wei' },
        { id: 'ben_middle_name',   label: 'Middle Name',             type: 'text', required: false, width: 'third' },
        { id: 'ben_other_names',   label: 'Other Names Used',        type: 'text', required: false, width: 'full', placeholder: 'e.g. maiden name, aliases' },
        { id: 'ben_dob',           label: 'Date of Birth',           type: 'date', required: true,  width: 'third' },
        { id: 'ben_gender',        label: 'Gender',                  type: 'radio', required: true, width: 'third',
          options: [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]
        },
        { id: 'ben_marital_status',label:'Current Marital Status',   type: 'select', required: true, width: 'third',
          options: [
            { value: 'single',    label: 'Single/Never Married' },
            { value: 'married',   label: 'Married' },
            { value: 'divorced',  label: 'Divorced' },
            { value: 'widowed',   label: 'Widowed' },
            { value: 'annulled',  label: 'Marriage Annulled' },
            { value: 'separated', label: 'Legally Separated' },
          ]
        },
        { id: 'ben_country_birth', label: 'Country of Birth',        type: 'country', required: true,  width: 'half', options: COUNTRIES },
        { id: 'ben_country_citizen',label:'Country of Citizenship',  type: 'country', required: true,  width: 'half', options: COUNTRIES },
        { id: 'ben_alien_number',  label: 'USCIS A-Number (if any)', type: 'alien_number', required: false, width: 'half' },
        { id: 'ben_passport_number', label: 'Passport Number',       type: 'text', required: false, width: 'half', placeholder: 'A12345678' },
        { id: 'ben_passport_expiry', label: 'Passport Expiry Date',  type: 'date', required: false, width: 'half' },
        { id: 'ben_address_country', label: 'Country of Residence',  type: 'country', required: true,  width: 'half', options: COUNTRIES },
        { id: 'ben_address_street',  label: 'Street Address (abroad)',type: 'text',  required: false, width: 'full' },
        { id: 'ben_city',            label: 'City',                  type: 'text',  required: false, width: 'half' },
        { id: 'ben_province',        label: 'Province / State',      type: 'text',  required: false, width: 'half' },
      ],
    },
    {
      id: 'relationship',
      title: 'Part 2 — Relationship to Beneficiary',
      subtitle: 'Describe your relationship to the person you are petitioning for',
      icon: '❤️',
      fields: [
        { id: 'relationship_type', label: 'Relationship', type: 'select', required: true, width: 'full',
          options: [
            { value: 'spouse',       label: 'Husband/Wife (Spouse)' },
            { value: 'child_under21',label: 'Child (under 21, unmarried)' },
            { value: 'child_over21', label: 'Son or Daughter (21+, unmarried)' },
            { value: 'parent',       label: 'Parent' },
            { value: 'sibling',      label: 'Brother or Sister' },
          ]
        },
        { id: 'marriage_date',  label: 'Date of Marriage (if spouse)', type: 'date',   required: false, width: 'half' },
        { id: 'marriage_place', label: 'Place of Marriage (City, Country)', type: 'text', required: false, width: 'half', placeholder: 'San Francisco, CA, USA' },
        { id: 'prior_marriages_pet', label: 'Number of prior marriages (petitioner)', type: 'number', required: true, width: 'half', placeholder: '0' },
        { id: 'prior_marriages_ben', label: 'Number of prior marriages (beneficiary)', type: 'number', required: true, width: 'half', placeholder: '0' },
      ],
    },
    {
      id: 'petitioner_history',
      title: 'Part 4 — Biographic Information',
      subtitle: 'Petitioner\'s personal background',
      icon: '📋',
      fields: [
        { id: 'pet_ethnicity', label: 'Ethnicity', type: 'radio', required: true, width: 'full',
          options: [{ value: 'hispanic', label: 'Hispanic or Latino' }, { value: 'not_hispanic', label: 'Not Hispanic or Latino' }]
        },
        { id: 'pet_race', label: 'Race (check all that apply)', type: 'select', required: true, width: 'full',
          options: [
            { value: 'white',    label: 'White' },
            { value: 'asian',    label: 'Asian' },
            { value: 'black',    label: 'Black or African American' },
            { value: 'aian',     label: 'American Indian or Alaska Native' },
            { value: 'nhopi',    label: 'Native Hawaiian or Other Pacific Islander' },
          ]
        },
        { id: 'pet_height_ft', label: 'Height (feet)', type: 'number', required: true, width: 'third', placeholder: '5' },
        { id: 'pet_height_in', label: 'Height (inches)', type: 'number', required: true, width: 'third', placeholder: '8' },
        { id: 'pet_weight',    label: 'Weight (lbs)', type: 'number', required: true, width: 'third', placeholder: '160' },
        { id: 'pet_eye_color', label: 'Eye Color', type: 'select', required: true, width: 'half',
          options: [
            {value:'black',label:'Black'},{value:'blue',label:'Blue'},{value:'brown',label:'Brown'},
            {value:'gray',label:'Gray'},{value:'green',label:'Green'},{value:'hazel',label:'Hazel'},
            {value:'pink',label:'Pink'},{value:'maroon',label:'Maroon'},{value:'multicolored',label:'Multicolored'},
            {value:'unknown',label:'Unknown/Other'},
          ]
        },
        { id: 'pet_hair_color', label: 'Hair Color', type: 'select', required: true, width: 'half',
          options: [
            {value:'bald',label:'Bald'},{value:'black',label:'Black'},{value:'blond',label:'Blond'},
            {value:'brown',label:'Brown'},{value:'gray',label:'Gray'},{value:'red',label:'Red'},
            {value:'sandy',label:'Sandy'},{value:'white',label:'White'},{value:'unknown',label:'Unknown'},
          ]
        },
      ],
    },
    {
      id: 'statement',
      title: 'Part 9 — Petitioner\'s Statement',
      subtitle: 'Declaration and signature',
      icon: '✍️',
      fields: [
        { id: 'interpreter_used', label: 'An interpreter was used to complete this form', type: 'checkbox', required: false, width: 'full' },
        { id: 'interpreter_name', label: 'Interpreter\'s Full Name', type: 'text', required: false, width: 'half' },
        { id: 'interpreter_lang', label: 'Interpreter\'s Language', type: 'text', required: false, width: 'half' },
        { id: 'preparer_name',    label: 'Preparer\'s Full Name (if not applicant)', type: 'text', required: false, width: 'half' },
        { id: 'preparer_firm',    label: 'Preparer\'s Firm / Organization', type: 'text', required: false, width: 'half' },
        { id: 'certify_true',     label: 'I certify, under penalty of perjury, that all information provided is true and correct', type: 'checkbox', required: true, width: 'full' },
        { id: 'certify_attorney', label: 'I am an attorney or accredited representative and I have completed this form at the petitioner\'s request', type: 'checkbox', required: false, width: 'full' },
      ],
    },
  ],
}
