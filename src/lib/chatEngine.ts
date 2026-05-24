/**
 * ImmigAI Chat Engine
 * ─────────────────────────────────────────────────────────────
 * Multilingual immigration assistant with:
 *  - Intake data collection
 *  - Visa eligibility screening
 *  - Document guidance
 *  - Legal disclaimer enforcement
 *  - Automatic response translation
 */

import type { ChatMessage, IntakeData } from '@/types/prisma'

// ── Language config ──────────────────────────────────────────
export const SUPPORTED_LANGUAGES = {
  en: { label: 'English',    flag: '🇺🇸', dir: 'ltr', greet: 'Hello' },
  es: { label: 'Español',    flag: '🇪🇸', dir: 'ltr', greet: 'Hola'  },
  ar: { label: 'العربية',    flag: '🇸🇦', dir: 'rtl', greet: 'مرحباً' },
  hi: { label: 'हिंदी',       flag: '🇮🇳', dir: 'ltr', greet: 'नमस्ते'  },
  zh: { label: '中文',         flag: '🇨🇳', dir: 'ltr', greet: '你好'   },
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

// ── Legal disclaimer (per language) ─────────────────────────
export const LEGAL_DISCLAIMER: Record<LanguageCode, string> = {
  en: '⚖️ **Legal Disclaimer:** I provide general immigration information only and do not provide legal advice. Immigration law is complex and fact-specific. For advice about your specific situation, please consult a licensed immigration attorney. Nothing in this conversation creates an attorney-client relationship.',
  es: '⚖️ **Aviso Legal:** Proporciono solo información general sobre inmigración y no brindo asesoramiento legal. La ley de inmigración es compleja y específica para cada caso. Para obtener asesoramiento sobre su situación específica, consulte a un abogado de inmigración con licencia. Nada en esta conversación crea una relación abogado-cliente.',
  ar: '⚖️ **إخلاء المسؤولية القانونية:** أقدم معلومات عامة فقط حول الهجرة ولا أقدم استشارات قانونية. قانون الهجرة معقد ومرتبط بالحالة الفردية. للحصول على مشورة بشأن وضعك الخاص، يرجى استشارة محامي هجرة مرخص. لا يُنشئ أي شيء في هذه المحادثة علاقة محامٍ-موكل.',
  hi: '⚖️ **कानूनी अस्वीकरण:** मैं केवल सामान्य आप्रवासन जानकारी प्रदान करता हूं और कानूनी सलाह नहीं देता। आप्रवासन कानून जटिल और तथ्य-विशिष्ट है। अपनी विशिष्ट स्थिति के बारे में सलाह के लिए, कृपया एक लाइसेंस प्राप्त आप्रवासन वकील से परामर्श करें।',
  zh: '⚖️ **法律免责声明：** 我仅提供一般移民信息，不提供法律建议。移民法律复杂且因情况而异。如需针对您具体情况的建议，请咨询持牌移民律师。本次对话不构成律师-委托人关系。',
}

// ── Welcome messages ─────────────────────────────────────────
export const WELCOME_MESSAGES: Record<LanguageCode, string> = {
  en: `Hello! 👋 I'm **ImmigAI**, your immigration assistant.

I can help you with:
- 🗺️ Understanding visa options and eligibility
- 📋 Document requirements for your case
- 📝 Collecting your intake information
- 🔍 Preliminary screening for immigration pathways

${LEGAL_DISCLAIMER.en}

**How can I help you today?** You can start by telling me your situation, or ask me anything about U.S. immigration.`,

  es: `¡Hola! 👋 Soy **ImmigAI**, tu asistente de inmigración.

Puedo ayudarte con:
- 🗺️ Comprensión de opciones y elegibilidad de visas
- 📋 Requisitos de documentos para tu caso
- 📝 Recopilación de tu información inicial
- 🔍 Evaluación preliminar de vías de inmigración

${LEGAL_DISCLAIMER.es}

**¿Cómo puedo ayudarte hoy?** Puedes comenzar contándome tu situación, o preguntarme cualquier cosa sobre inmigración en los EE. UU.`,

  ar: `مرحباً! 👋 أنا **ImmigAI**، مساعدك في شؤون الهجرة.

يمكنني مساعدتك في:
- 🗺️ فهم خيارات التأشيرة وأحقيتك
- 📋 متطلبات المستندات لحالتك
- 📝 جمع معلومات استقبالك
- 🔍 الفرز الأولي لمسارات الهجرة

${LEGAL_DISCLAIMER.ar}

**كيف يمكنني مساعدتك اليوم؟** يمكنك البدء بإخباري بوضعك، أو اسألني أي شيء عن الهجرة إلى الولايات المتحدة.`,

  hi: `नमस्ते! 👋 मैं **ImmigAI** हूं, आपका आप्रवासन सहायक।

मैं इनमें आपकी सहायता कर सकता हूं:
- 🗺️ वीज़ा विकल्पों और पात्रता को समझना
- 📋 आपके मामले के लिए दस्तावेज़ आवश्यकताएं
- 📝 आपकी प्रारंभिक जानकारी एकत्र करना
- 🔍 आप्रवासन मार्गों की प्रारंभिक स्क्रीनिंग

${LEGAL_DISCLAIMER.hi}

**आज मैं आपकी कैसे मदद कर सकता हूं?** आप अपनी स्थिति बताकर शुरू कर सकते हैं।`,

  zh: `你好！👋 我是 **ImmigAI**，您的移民助理。

我可以帮助您：
- 🗺️ 了解签证选项和资格
- 📋 您案件所需的文件
- 📝 收集您的基本信息
- 🔍 移民途径的初步筛查

${LEGAL_DISCLAIMER.zh}

**今天我能为您做什么？** 您可以告诉我您的情况，或问我任何关于美国移民的问题。`,
}

// ── Intake questions flow ────────────────────────────────────
export const INTAKE_QUESTIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    nationality:         "What is your country of citizenship/nationality?",
    currentStatus:       "What is your current immigration status in the U.S.? (e.g., visitor, student, worker, out of status, abroad)",
    immigrationGoal:     "What is your immigration goal? (e.g., work visa, green card, family petition, student visa)",
    employmentSituation: "Are you currently employed, and do you have a U.S. job offer?",
    familyTies:          "Do you have any family members who are U.S. citizens or lawful permanent residents?",
    educationLevel:      "What is your highest level of education?",
    urgency:             "Is there any urgency to your immigration matter? (e.g., visa expiring soon, travel plans)",
    priorViolations:     "Have you ever been denied a U.S. visa, been removed/deported, or had any immigration violations?",
    name:                "What is your name? (optional, for our records)",
    email:               "What is your email address? An attorney can follow up with you. (optional)",
  },
  es: {
    nationality:         "¿Cuál es su país de ciudadanía/nacionalidad?",
    currentStatus:       "¿Cuál es su estatus migratorio actual en los EE. UU.?",
    immigrationGoal:     "¿Cuál es su objetivo de inmigración?",
    employmentSituation: "¿Está empleado actualmente y tiene una oferta de trabajo en los EE. UU.?",
    familyTies:          "¿Tiene familiares que sean ciudadanos estadounidenses o residentes permanentes legales?",
    educationLevel:      "¿Cuál es su nivel de educación más alto?",
    urgency:             "¿Existe alguna urgencia en su trámite migratorio?",
    priorViolations:     "¿Alguna vez le han negado una visa estadounidense, ha sido deportado/a o ha tenido violaciones migratorias?",
    name:                "¿Cuál es su nombre? (opcional)",
    email:               "¿Cuál es su correo electrónico? (opcional)",
  },
  ar: {
    nationality:         "ما هي جنسيتك/بلد مواطنتك؟",
    currentStatus:       "ما وضعك الهجري الحالي في الولايات المتحدة؟",
    immigrationGoal:     "ما هو هدفك الهجري؟",
    employmentSituation: "هل أنت موظف حاليًا وهل لديك عرض عمل في الولايات المتحدة؟",
    familyTies:          "هل لديك أفراد عائلة من المواطنين الأمريكيين أو المقيمين الدائمين القانونيين؟",
    educationLevel:      "ما هو أعلى مستوى تعليمي حصلت عليه؟",
    urgency:             "هل هناك إلحاح في موضوع الهجرة الخاص بك؟",
    priorViolations:     "هل سبق رفض منحك تأشيرة أمريكية أو ترحيلك أو انتهاك قوانين الهجرة؟",
    name:                "ما اسمك؟ (اختياري)",
    email:               "ما بريدك الإلكتروني؟ (اختياري)",
  },
  hi: {
    nationality:         "आपकी नागरिकता/राष्ट्रीयता का देश क्या है?",
    currentStatus:       "अमेरिका में आपकी वर्तमान आप्रवासन स्थिति क्या है?",
    immigrationGoal:     "आपका आप्रवासन लक्ष्य क्या है?",
    employmentSituation: "क्या आप वर्तमान में कार्यरत हैं और क्या आपके पास अमेरिकी नौकरी का प्रस्ताव है?",
    familyTies:          "क्या आपके परिवार में कोई अमेरिकी नागरिक या वैध स्थायी निवासी है?",
    educationLevel:      "आपकी सबसे उच्च शिक्षा का स्तर क्या है?",
    urgency:             "क्या आपके आप्रवासन मामले में कोई तात्कालिकता है?",
    priorViolations:     "क्या आपको कभी अमेरिकी वीज़ा से वंचित किया गया, निर्वासित किया गया, या आप्रवासन उल्लंघन हुआ है?",
    name:                "आपका नाम क्या है? (वैकल्पिक)",
    email:               "आपका ईमेल पता क्या है? (वैकल्पिक)",
  },
  zh: {
    nationality:         "您的国籍/公民身份是哪个国家？",
    currentStatus:       "您目前在美国的移民身份是什么？",
    immigrationGoal:     "您的移民目标是什么？",
    employmentSituation: "您目前是否受雇，是否有美国工作邀请？",
    familyTies:          "您是否有美国公民或合法永久居民的家庭成员？",
    educationLevel:      "您的最高教育水平是什么？",
    urgency:             "您的移民事务是否有紧急情况？",
    priorViolations:     "您是否曾被拒绝美国签证、被驱逐出境或有任何移民违规记录？",
    name:                "您的姓名是？（可选）",
    email:               "您的电子邮件地址是？（可选）",
  },
}

// ── System prompt builder ────────────────────────────────────
export function buildSystemPrompt(language: LanguageCode, intakeData: IntakeData): string {
  const langName = SUPPORTED_LANGUAGES[language].label
  const intakeSummary = Object.entries(intakeData)
    .filter(([,v]) => v)
    .map(([k,v]) => `- ${k}: ${v}`)
    .join('\n')

  return `You are ImmigAI, an expert U.S. immigration assistant for a law firm platform.

CRITICAL RULES (ALWAYS FOLLOW):
1. You MUST include this disclaimer at the start of EVERY first response in a new conversation, and periodically remind users:
   "I provide general immigration information only and do not provide legal advice. For your specific situation, consult a licensed immigration attorney."
2. NEVER give specific legal advice about a person's case. Use phrases like "generally speaking," "typically," "in many cases," "you may want to ask an attorney about."
3. NEVER guarantee outcomes, timelines, or approval chances.
4. If a user's situation involves potential immigration violations, removal proceedings, or criminal history, STRONGLY recommend consulting an attorney immediately.
5. Always be empathetic, clear, and non-judgmental.

LANGUAGE: Respond ENTIRELY in ${langName}. Every word of your response must be in ${langName}. If the user writes in another language, still respond in ${langName}.

CAPABILITIES:
- Answer questions about U.S. immigration processes, visa categories, and requirements
- Guide users through preliminary eligibility screening
- Collect intake information naturally through conversation
- Recommend visa categories based on the user's situation
- Explain document requirements
- Clarify USCIS processes and timelines (with appropriate uncertainty)

INTAKE DATA COLLECTED SO FAR:
${intakeSummary || 'None collected yet — gather this naturally through conversation.'}

INTAKE FIELDS TO COLLECT (weave these naturally into conversation, don't ask all at once):
- nationality (country of citizenship)
- currentStatus (immigration status in US or abroad)
- immigrationGoal (what they want to achieve)
- employmentSituation (employed, job offer)
- familyTies (US citizen/LPR relatives)
- educationLevel (highest degree)
- urgency (any time pressure)
- priorViolations (previous denials, removal, violations)
- name (optional)
- email (optional, for attorney follow-up)

VISA RECOMMENDATION LOGIC (use as guidance, not legal advice):
- Work authorization + specialty degree → H-1B, O-1, TN
- Family member USC/LPR → I-130 family petition
- Investment → E-2, EB-5
- Extraordinary ability → O-1A, EB-1A
- Self-petition research → EB-2 NIW
- Student → F-1, J-1
- Marriage to USC → Marriage Green Card, K-1

RESPONSE FORMAT:
- Use markdown formatting with headers, bullet points, and **bold** for emphasis
- Keep responses conversational but informative
- End each response with a follow-up question to continue the conversation
- When recommending visa categories, explain why they might apply
- Use emojis sparingly for friendliness

When you have collected enough intake data to make a preliminary assessment, provide:
1. A summary of visa pathways that may apply
2. Key next steps
3. A clear recommendation to consult with the firm's attorneys`
}

// ── Translate text to target language ───────────────────────
export async function translateText(
  text: string,
  targetLanguage: LanguageCode,
  apiKey: string
): Promise<string> {
  if (targetLanguage === 'en') return text

  const langName = SUPPORTED_LANGUAGES[targetLanguage].label

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':       'application/json',
      'x-api-key':          apiKey,
      'anthropic-version':  '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role:    'user',
        content: `Translate the following text to ${langName}. Preserve all markdown formatting, emojis, and line breaks. Translate only — do not add any explanation or preamble. If the text is already in ${langName}, return it unchanged.\n\n${text}`,
      }],
    }),
  })

  if (!res.ok) return text
  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? text
}

// ── Extract intake fields from AI response ───────────────────
export function extractIntakeFromMessages(
  messages: ChatMessage[],
  currentIntake: IntakeData
): IntakeData {
  const updated = { ...currentIntake }
  const fullText = messages
    .filter(m => m.role === 'user')
    .map(m => m.contentEn || m.content)
    .join('\n')
    .toLowerCase()

  // Simple heuristic extraction from user messages
  // In production, the AI itself tags intake fields in metadata
  if (!updated.priorViolations) {
    if (fullText.includes('never') || fullText.includes('no violation') || fullText.includes('no denial')) {
      updated.priorViolations = 'None reported'
    }
  }

  return updated
}

// ── Demo response generator (no API key) ─────────────────────
export function generateDemoResponse(
  userMessage: string,
  language: LanguageCode,
  intakeData: IntakeData
): string {
  const msg = userMessage.toLowerCase()

  const responses: Record<LanguageCode, Record<string, string>> = {
    en: {
      h1b: `## H-1B Specialty Occupation Visa\n\nThe H-1B is one of the most common work visas for skilled professionals. Here's what you need to know:\n\n**Eligibility Requirements:**\n- A bachelor's degree or higher in a specialty field\n- A U.S. employer willing to sponsor you\n- The job must qualify as a "specialty occupation"\n\n**Key Facts:**\n- Annual cap of 65,000 visas (plus 20,000 for U.S. master's degree holders)\n- Requires a lottery selection in April\n- Initial period of 3 years, extendable to 6 years\n\n⚖️ *I provide general information only — consult an immigration attorney for advice specific to your situation.*\n\nWould you like to know more about the H-1B process, or shall I ask you a few questions to see if it's the right fit for you?`,
      green_card: `## Pathways to a U.S. Green Card\n\nThere are several ways to obtain lawful permanent residence. The most common paths are:\n\n**1. Family-Based**\n- Immediate relative of a U.S. citizen (spouse, parent, child under 21)\n- Generally faster processing\n\n**2. Employment-Based**\n- EB-1: Extraordinary ability, outstanding researchers, multinational managers\n- EB-2: Advanced degree professionals, national interest waiver\n- EB-3: Skilled workers and professionals\n\n**3. Diversity Visa Lottery**\n- For nationals of countries with low immigration to the U.S.\n\n⚖️ *General information only — not legal advice.*\n\nTo help me understand which pathway might apply to you, could you tell me: **Do you have any U.S. citizen or permanent resident family members?**`,
      default: `Thank you for reaching out to ImmigAI! 👋\n\nI can help you explore U.S. immigration options. To give you the most relevant information, let me ask:\n\n**What brings you here today?** For example:\n- 💼 Looking for a work visa\n- 👨‍👩‍👧 Wanting to join family in the U.S.\n- 🎓 Planning to study in the U.S.\n- 💚 Pursuing a green card\n- ❓ Have a general immigration question\n\n⚖️ *Reminder: I provide general immigration information only, not legal advice. For advice specific to your situation, please consult a licensed immigration attorney.*`,
    },
    es: {
      default: `¡Gracias por contactar a ImmigAI! 👋\n\nPuedo ayudarte a explorar opciones de inmigración a los EE. UU. Para darte la información más relevante, permíteme preguntarte:\n\n**¿Qué te trae aquí hoy?**\n- 💼 Buscar una visa de trabajo\n- 👨‍👩‍👧 Reunirse con familia en los EE. UU.\n- 🎓 Planear estudiar en los EE. UU.\n- 💚 Obtener una tarjeta verde\n- ❓ Pregunta general de inmigración\n\n⚖️ *Proporciono solo información general, no asesoramiento legal.*`,
      h1b: `## Visa H-1B de Ocupación Especializada\n\nLa H-1B es una de las visas de trabajo más comunes para profesionales calificados.\n\n**Requisitos de Elegibilidad:**\n- Título universitario o superior en un campo especializado\n- Un empleador en EE. UU. dispuesto a patrocinarte\n\n⚖️ *Solo información general — consulte a un abogado.*\n\n¿Le gustaría saber más sobre el proceso H-1B?`,
    },
    ar: {
      default: `شكراً لتواصلك مع ImmigAI! 👋\n\nيمكنني مساعدتك في استكشاف خيارات الهجرة إلى الولايات المتحدة.\n\n**ما الذي يقودك إلى هنا اليوم؟**\n- 💼 البحث عن تأشيرة عمل\n- 👨‍👩‍👧 الانضمام إلى العائلة في الولايات المتحدة\n- 🎓 التخطيط للدراسة\n- 💚 السعي للحصول على بطاقة خضراء\n\n⚖️ *أقدم معلومات عامة فقط، وليس استشارات قانونية.*`,
    },
    hi: {
      default: `ImmigAI से संपर्क करने के लिए धन्यवाद! 👋\n\nमैं आपको अमेरिकी आप्रवासन विकल्पों के बारे में जानकारी देने में मदद कर सकता हूं।\n\n**आज आप यहाँ क्यों आए हैं?**\n- 💼 वर्क वीज़ा की तलाश\n- 👨‍👩‍👧 परिवार से मिलना\n- 🎓 पढ़ाई की योजना\n- 💚 ग्रीन कार्ड\n\n⚖️ *मैं केवल सामान्य जानकारी प्रदान करता हूं — कानूनी सलाह नहीं।*`,
    },
    zh: {
      default: `感谢您联系 ImmigAI！👋\n\n我可以帮助您了解美国移民选项。\n\n**今天是什么让您来到这里？**\n- 💼 寻求工作签证\n- 👨‍👩‍👧 与在美家人团聚\n- 🎓 计划赴美学习\n- 💚 申请绿卡\n\n⚖️ *我仅提供一般信息，不提供法律建议。*`,
    },
  }

  const langResponses = responses[language] ?? responses.en
  if (msg.includes('h-1b') || msg.includes('h1b') || msg.includes('work visa') || msg.includes('specialty')) {
    return langResponses.h1b ?? langResponses.default
  }
  if (msg.includes('green card') || msg.includes('permanent') || msg.includes('greencard')) {
    return langResponses.green_card ?? langResponses.default
  }
  return langResponses.default
}
