'use client'

import { cn } from '@/lib/utils'
import type { LanguageCode } from '@/lib/chatEngine'

interface QuickRepliesProps {
  language: LanguageCode
  onSelect: (text: string) => void
  disabled?: boolean
}

const SUGGESTIONS: Record<LanguageCode, { label: string; text: string }[]> = {
  en: [
    { label: '💼 H-1B Visa',          text: 'Can you explain the H-1B specialty occupation visa?' },
    { label: '💚 Green Card',          text: 'What are the pathways to get a green card?' },
    { label: '❤️ Spouse Visa',         text: 'How can I get a visa for my foreign spouse?' },
    { label: '🎓 Student Visa',        text: 'I want to study in the US. What visa do I need?' },
    { label: '⭐ Extraordinary Ability',text: 'I have extraordinary ability in my field. What options do I have?' },
    { label: '🏢 Corporate Transfer',  text: 'I work for a multinational company. Can I transfer to the US?' },
    { label: '💰 Investor Visa',       text: 'I want to invest in the US. What are my visa options?' },
    { label: '📋 Start Intake',        text: 'I would like to provide my information for a consultation.' },
  ],
  es: [
    { label: '💼 Visa H-1B',          text: '¿Puedes explicarme la visa H-1B de ocupación especializada?' },
    { label: '💚 Tarjeta Verde',       text: '¿Cuáles son las vías para obtener una tarjeta verde?' },
    { label: '❤️ Visa para Cónyuge',  text: '¿Cómo puedo obtener una visa para mi cónyuge extranjero?' },
    { label: '🎓 Visa de Estudiante',  text: 'Quiero estudiar en EE. UU. ¿Qué visa necesito?' },
    { label: '📋 Comenzar Intake',    text: 'Me gustaría proporcionar mi información para una consulta.' },
  ],
  ar: [
    { label: '💼 تأشيرة H-1B',       text: 'هل يمكنك شرح تأشيرة H-1B للمهن المتخصصة؟' },
    { label: '💚 البطاقة الخضراء',   text: 'ما هي طرق الحصول على البطاقة الخضراء؟' },
    { label: '❤️ تأشيرة الزوج/الزوجة', text: 'كيف يمكنني الحصول على تأشيرة لزوجي/زوجتي الأجنبي؟' },
    { label: '📋 بدء الاستقبال',     text: 'أود تقديم معلوماتي للحصول على استشارة.' },
  ],
  hi: [
    { label: '💼 H-1B वीज़ा',        text: 'क्या आप H-1B वीज़ा के बारे में समझा सकते हैं?' },
    { label: '💚 ग्रीन कार्ड',       text: 'ग्रीन कार्ड पाने के रास्ते क्या हैं?' },
    { label: '❤️ पति/पत्नी वीज़ा',   text: 'मैं अपने विदेशी जीवनसाथी के लिए वीज़ा कैसे प्राप्त करूं?' },
    { label: '📋 जानकारी देना शुरू', text: 'मैं परामर्श के लिए अपनी जानकारी देना चाहता/चाहती हूं।' },
  ],
  zh: [
    { label: '💼 H-1B签证',          text: '能解释一下H-1B专业职位签证吗？' },
    { label: '💚 绿卡',              text: '获得绿卡有哪些途径？' },
    { label: '❤️ 配偶签证',          text: '如何为我的外籍配偶申请签证？' },
    { label: '🎓 学生签证',           text: '我想在美国学习，需要什么签证？' },
    { label: '📋 开始登记',          text: '我想提供我的信息以进行咨询。' },
  ],
}

export function QuickReplies({ language, onSelect, disabled }: QuickRepliesProps) {
  const suggestions = SUGGESTIONS[language] ?? SUGGESTIONS.en

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1">
      {suggestions.map(s => (
        <button
          key={s.label}
          onClick={() => !disabled && onSelect(s.text)}
          disabled={disabled}
          className={cn(
            'text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium',
            'border-white/[0.1] bg-white/[0.03] text-slate-400',
            'hover:border-brand-500/40 hover:bg-brand-500/[0.07] hover:text-brand-300',
            disabled && 'opacity-40 cursor-not-allowed'
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
