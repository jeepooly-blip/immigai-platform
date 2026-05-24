import type { FormSchema } from './types'
import { COUNTRIES } from './countries'

export const DS260_SCHEMA: FormSchema = {
  formType: 'DS-260',
  title: 'Immigrant Visa Electronic Application',
  subtitle: 'Online application for immigrant visa (consular processing)',
  uscisUrl: 'https://ceac.state.gov/',
  totalPages: 15,
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      subtitle: 'Your full legal name and biographical data',
      icon: '👤',
      fields: [
        { id: 'surname',       label: 'Surname (Last/Family Name, as in passport)', type: 'text', required: true, width: 'half', caseMapping: 'applicantLastName'  },
        { id: 'given_names',   label: 'Given Names (First/Middle, as in passport)', type: 'text', required: true, width: 'half', caseMapping: 'applicantFirstName' },
        { id: 'native_surname',label: 'Surname in Native Alphabet (if applicable)', type: 'text', required: false, width: 'half' },
        { id: 'native_given',  label: 'Given Names in Native Alphabet',            type: 'text', required: false, width: 'half' },
        { id: 'other_names',   label: 'Other Names Used (maiden name, aliases)',   type: 'text', required: false, width: 'full' },
        { id: 'dob',           label: 'Date of Birth',             type: 'date',    required: true,  width: 'third' },
        { id: 'city_of_birth', label: 'City of Birth',             type: 'text',    required: true,  width: 'third', placeholder: 'Beijing' },
        { id: 'country_birth', label: 'Country of Birth',          type: 'country', required: true,  width: 'third', options: COUNTRIES },
        { id: 'gender',        label: 'Gender',                    type: 'radio',   required: true,  width: 'half',
          options: [{value:'M',label:'Male'},{value:'F',label:'Female'}]
        },
        { id: 'marital_status',label: 'Marital Status',            type: 'select',  required: true,  width: 'half',
          options: [
            {value:'single',label:'Single'},{value:'married',label:'Married'},{value:'divorced',label:'Divorced'},
            {value:'widowed',label:'Widowed'},{value:'separated',label:'Legally Separated'},{value:'other',label:'Other'},
          ]
        },
        { id: 'nationality',   label: 'Primary Nationality',       type: 'country', required: true,  width: 'half', options: COUNTRIES },
        { id: 'second_nationality', label: 'Second Nationality (if any)', type: 'country', required: false, width: 'half', options: COUNTRIES },
        { id: 'national_id',   label: 'National ID Number (if applicable)', type: 'text', required: false, width: 'half' },
        { id: 'us_ssn',        label: 'U.S. Social Security Number (if assigned)', type: 'ssn', required: false, width: 'half' },
        { id: 'alien_number',  label: 'U.S. Alien Registration Number (if any)', type: 'alien_number', required: false, width: 'half' },
      ],
    },
    {
      id: 'passport',
      title: 'Passport Information',
      subtitle: 'Valid travel document details',
      icon: '📘',
      fields: [
        { id: 'passport_number',  label: 'Passport/Travel Document Number', type: 'text', required: true,  width: 'half', placeholder: 'E12345678' },
        { id: 'passport_book',    label: 'Passport Book Number (if applicable)', type: 'text', required: false, width: 'half' },
        { id: 'passport_country', label: 'Country/Authority That Issued Passport', type: 'country', required: true, width: 'half', options: COUNTRIES },
        { id: 'passport_city',    label: 'City Where Issued',      type: 'text', required: false, width: 'half', placeholder: 'Beijing' },
        { id: 'passport_issued',  label: 'Date Issued',             type: 'date', required: true,  width: 'half' },
        { id: 'passport_expiry',  label: 'Expiration Date',         type: 'date', required: true,  width: 'half' },
        { id: 'lost_passport',    label: 'Do you have a lost or stolen passport?', type: 'radio', required: true, width: 'full',
          options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}]
        },
      ],
    },
    {
      id: 'contact',
      title: 'Address and Contact Information',
      subtitle: 'Current and mailing address',
      icon: '🏠',
      fields: [
        { id: 'home_address',  label: 'Home Address (Street + Apt/Unit)',      type: 'text',  required: true,  width: 'full' },
        { id: 'home_city',     label: 'City',                                  type: 'text',  required: true,  width: 'third' },
        { id: 'home_state',    label: 'State/Province/Region',                 type: 'text',  required: false, width: 'third' },
        { id: 'home_postal',   label: 'Postal Code',                           type: 'text',  required: false, width: 'third' },
        { id: 'home_country',  label: 'Country',                               type: 'country', required: true, width: 'half', options: COUNTRIES },
        { id: 'phone_home',    label: 'Home Telephone',                        type: 'tel',   required: false, width: 'half', placeholder: '+86 10 1234 5678' },
        { id: 'phone_mobile',  label: 'Mobile Telephone',                      type: 'tel',   required: false, width: 'half' },
        { id: 'phone_work',    label: 'Work Telephone',                        type: 'tel',   required: false, width: 'half' },
        { id: 'email',         label: 'Email Address',                         type: 'email', required: true,  width: 'half', caseMapping: 'applicantEmail' },
        { id: 'us_contact_name',   label: 'U.S. Contact Person (Name)',        type: 'text',  required: true,  width: 'half', caseMapping: 'petitionerName' },
        { id: 'us_contact_rel',    label: 'Relationship to U.S. Contact',      type: 'text',  required: true,  width: 'half', placeholder: 'Spouse, employer, attorney' },
        { id: 'us_contact_address',label: 'U.S. Contact Address',              type: 'text',  required: true,  width: 'full' },
        { id: 'us_contact_phone',  label: 'U.S. Contact Phone',                type: 'tel',   required: true,  width: 'half' },
        { id: 'us_contact_email',  label: 'U.S. Contact Email',                type: 'email', required: false, width: 'half' },
      ],
    },
    {
      id: 'employment',
      title: 'Work / Education / Training',
      subtitle: 'Employment and educational background',
      icon: '💼',
      fields: [
        { id: 'current_occupation', label: 'Current Occupation', type: 'select', required: true, width: 'half',
          options: [
            {value:'administrative',label:'Administrative Support'},{value:'agriculture',label:'Agriculture'},
            {value:'arts',label:'Arts/Entertainment'},{value:'business',label:'Business/Management'},
            {value:'construction',label:'Construction/Labor'},{value:'education',label:'Education'},
            {value:'engineering',label:'Engineering'},{value:'finance',label:'Finance/Banking'},
            {value:'healthcare',label:'Healthcare/Medical'},{value:'homemaker',label:'Homemaker'},
            {value:'information',label:'Information Technology'},{value:'legal',label:'Legal'},
            {value:'research',label:'Research/Science'},{value:'retired',label:'Retired'},
            {value:'self_employed',label:'Self-Employed'},{value:'student',label:'Student'},
            {value:'unemployed',label:'Unemployed'},{value:'other',label:'Other'},
          ]
        },
        { id: 'employer_name',     label: 'Employer/School Name',       type: 'text', required: false, width: 'half' },
        { id: 'employer_address',  label: 'Employer/School Address',    type: 'text', required: false, width: 'full' },
        { id: 'monthly_income',    label: 'Monthly Income (local currency)', type: 'number', required: false, width: 'half' },
        { id: 'edu_highest',       label: 'Highest Education Level', type: 'select', required: true, width: 'half',
          options: [
            {value:'none',label:'No formal education'},{value:'primary',label:'Primary school'},
            {value:'secondary',label:'Secondary/High school'},{value:'vocational',label:'Vocational/Technical'},
            {value:'some_college',label:'Some college'},{value:'bachelors',label:"Bachelor's degree"},
            {value:'masters',label:"Master's degree"},{value:'doctorate',label:'Doctorate'},
            {value:'professional',label:'Professional degree (MD, JD, etc.)'},
          ]
        },
        { id: 'military_service',  label: 'Have you ever served in the military?', type: 'radio', required: true, width: 'full',
          options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}]
        },
      ],
    },
    {
      id: 'immigration_intent',
      title: 'Immigration Intent',
      subtitle: 'Describe your plans and intentions in the United States',
      icon: '🇺🇸',
      fields: [
        { id: 'planned_address',   label: 'Planned U.S. Address (street)', type: 'text',  required: false, width: 'full', placeholder: 'c/o petitioner\'s address' },
        { id: 'planned_city',      label: 'City',                          type: 'text',  required: false, width: 'third' },
        { id: 'planned_state',     label: 'State',                         type: 'text',  required: false, width: 'third' },
        { id: 'planned_zip',       label: 'ZIP',                           type: 'text',  required: false, width: 'third' },
        { id: 'intent_statement',  label: 'Statement of Immigration Intent', type: 'ai_narrative', required: false, width: 'full', rows: 6,
          aiPrompt: 'Write a sincere and legally appropriate statement of immigration intent for a DS-260 immigrant visa application. This should describe the applicant\'s reasons for immigrating to the United States, their family ties, their plans for settling and contributing, their professional background, and their commitment to following U.S. laws. The tone should be formal, authentic, and clearly non-threatening.'
        },
        { id: 'previous_us_travel', label: 'Have you previously traveled to the U.S.?', type: 'radio', required: true, width: 'full',
          options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}]
        },
        { id: 'previous_visa_refusal', label: 'Have you ever been refused a U.S. visa?', type: 'radio', required: true, width: 'full',
          options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}]
        },
        { id: 'previous_overstay',    label: 'Have you ever overstayed a U.S. visa?',   type: 'radio', required: true, width: 'full',
          options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}]
        },
      ],
    },
    {
      id: 'background_security',
      title: 'Security and Background',
      subtitle: 'Required background questions for all immigrant visa applicants',
      icon: '🔒',
      fields: [
        { id: 'bg_crimes',      label: 'Have you EVER been arrested or convicted for any offense?', type: 'radio', required: true, width: 'full', options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}] },
        { id: 'bg_controlled',  label: 'Have you ever violated laws relating to controlled substances?', type: 'radio', required: true, width: 'full', options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}] },
        { id: 'bg_terrorist',   label: 'Have you ever engaged in or planned terrorist activities?', type: 'radio', required: true, width: 'full', options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}] },
        { id: 'bg_persecuted',  label: 'Have you ever committed or participated in genocide or torture?', type: 'radio', required: true, width: 'full', options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}] },
        { id: 'bg_human_trafficking', label: 'Have you ever engaged in or profited from human trafficking?', type: 'radio', required: true, width: 'full', options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}] },
        { id: 'bg_public_charge',    label: 'Are you likely to become a public charge (dependent on government benefits)?', type: 'radio', required: true, width: 'full', options: [{value:'no',label:'No'},{value:'yes',label:'Yes'}] },
      ],
    },
    {
      id: 'signature',
      title: 'Electronic Signature and Certification',
      subtitle: 'Certify the accuracy of all information provided',
      icon: '✍️',
      fields: [
        { id: 'application_complete', label: 'All information has been reviewed and is accurate to the best of my knowledge', type: 'checkbox', required: true, width: 'full' },
        { id: 'certify_penalties',    label: 'I understand that providing false information may result in visa denial and bars from future admission', type: 'checkbox', required: true, width: 'full' },
        { id: 'certify_true',         label: 'I certify that all information provided is true and correct under penalty of perjury', type: 'checkbox', required: true, width: 'full' },
      ],
    },
  ],
}
