'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Send, Bot, Scale, Plus, Trash2, MessageSquare, Globe,
  ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle2,
  Loader2, Info, X, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MessageBubble, TypingIndicator } from '@/components/assistant/MessageBubble'
import { LanguagePicker } from '@/components/assistant/LanguagePicker'
import { IntakePanel } from '@/components/assistant/IntakePanel'
import { QuickReplies } from '@/components/assistant/QuickReplies'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/chatEngine'
import type { ChatMessage, IntakeData } from '@/types/prisma'

// ── Persist sessions in localStorage ─────────────────────────
const LS_KEY = 'immigai_chat_history'
interface StoredSession {
  id: string; title: string; language: LanguageCode; createdAt: string; messageCount: number
}

export default function AssistantPage() {
  const [language, setLanguage]           = useState<LanguageCode>('en')
  const [messages, setMessages]           = useState<ChatMessage[]>([])
  const [sessionId, setSessionId]         = useState<string | null>(null)
  const [inputValue, setInputValue]       = useState('')
  const [loading, setLoading]             = useState(false)
  const [initializing, setInitializing]   = useState(true)
  const [intakeData, setIntakeData]       = useState<IntakeData>({})
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [rightOpen, setRightOpen]         = useState(true)
  const [sessions, setSessions]           = useState<StoredSession[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const dir = SUPPORTED_LANGUAGES[language].dir

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Load saved sessions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) setSessions(JSON.parse(stored))
    } catch {}
  }, [])

  // Start new chat
  const startNewChat = useCallback(async (lang: LanguageCode) => {
    setInitializing(true)
    setMessages([])
    setSessionId(null)
    setIntakeData({})
    setShowSuggestions(true)
    try {
      const res  = await fetch(`/api/chat?language=${lang}`)
      const data = await res.json()
      setSessionId(data.sessionId)
      setMessages([data.message])
    } catch (e) {
      console.error('Failed to start chat:', e)
    } finally {
      setInitializing(false)
    }
  }, [])

  // Initialize on mount
  useEffect(() => { startNewChat('en') }, [])

  // Handle language change — restart with new language
  async function handleLanguageChange(lang: LanguageCode) {
    setLanguage(lang)
    await startNewChat(lang)
  }

  // Send message
  async function sendMessage(text?: string) {
    const messageText = (text ?? inputValue).trim()
    if (!messageText || loading) return

    setInputValue('')
    setShowSuggestions(false)
    setLoading(true)

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id:        `opt-${Date.now()}`,
      role:      'user',
      content:   messageText,
      contentEn: messageText,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId, message: messageText, language }),
      })
      const data = await res.json()

      if (data.sessionId) setSessionId(data.sessionId)
      if (data.intakeData) setIntakeData(data.intakeData)

      // Replace optimistic + add assistant reply
      setMessages(prev => {
        const withoutOpt = prev.filter(m => m.id !== optimisticMsg.id)
        return [
          ...withoutOpt,
          { ...optimisticMsg, id: `user-${Date.now()}` },
          data.message,
        ]
      })

      // Save session to localStorage
      if (data.sessionId) {
        const stored: StoredSession = {
          id:           data.sessionId,
          title:        messageText.slice(0, 50),
          language,
          createdAt:    new Date().toISOString(),
          messageCount: messages.length + 2,
        }
        setSessions(prev => {
          const updated = [stored, ...prev.filter(s => s.id !== stored.id)].slice(0, 20)
          try { localStorage.setItem(LS_KEY, JSON.stringify(updated)) } catch {}
          return updated
        })
      }
    } catch (e) {
      console.error('Send error:', e)
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`, role: 'assistant',
          content: '⚠️ Sorry, I encountered an error. Please try again.',
          contentEn: '', timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleClearHistory() {
    if (!confirm('Clear all chat history?')) return
    setSessions([])
    try { localStorage.removeItem(LS_KEY) } catch {}
  }

  const hasIntake = Object.values(intakeData).some(Boolean)

  return (
    <div className="h-screen bg-[#0d1117] flex overflow-hidden" dir={dir}>

      {/* ── Left sidebar — session history ─────────────────── */}
      <div className={cn(
        'flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0d1117] transition-all duration-300',
        sidebarOpen ? 'w-72' : 'w-14'
      )}>
        {/* Sidebar header */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-white/[0.06]">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <Scale className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-white text-sm">ImmigAI</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-400 transition-colors ml-auto"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* New chat button */}
        <div className={cn('p-2', !sidebarOpen && 'flex justify-center')}>
          <button
            onClick={() => startNewChat(language)}
            className={cn(
              'flex items-center gap-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/25 text-brand-400 font-medium transition-all duration-150',
              sidebarOpen ? 'w-full px-3 py-2.5 text-sm' : 'w-9 h-9 justify-center'
            )}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && 'New Chat'}
          </button>
        </div>

        {/* Session list */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {sessions.length === 0 ? (
              <p className="text-slate-700 text-xs px-2 py-4 text-center">No previous chats</p>
            ) : (
              <>
                <p className="text-[10px] text-slate-700 uppercase tracking-widest px-2 py-1">Recent</p>
                {sessions.map(s => (
                  <button
                    key={s.id}
                    className={cn(
                      'w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-left transition-colors',
                      'hover:bg-white/[0.05]',
                      s.id === sessionId && 'bg-brand-600/10 border border-brand-500/20'
                    )}
                    onClick={() => {/* in future: load session */}}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-slate-400 text-xs truncate">{s.title || 'Chat'}</p>
                      <p className="text-slate-700 text-[10px] mt-0.5">
                        {SUPPORTED_LANGUAGES[s.language]?.flag} · {new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(s.createdAt))}
                      </p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={handleClearHistory}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:text-rose-400 transition-colors mt-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear History
                </button>
              </>
            )}
          </div>
        )}

        {/* Nav back */}
        {sidebarOpen && (
          <div className="p-3 border-t border-white/[0.06]">
            <Link href="/dashboard">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors text-xs">
                <ChevronLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Main chat area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="h-14 border-b border-white/[0.06] flex items-center px-4 gap-3 flex-shrink-0 bg-[#0d1117]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1a3a6e] to-[#2d5eb5] border border-brand-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-brand-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">ImmigAI Assistant</p>
            <p className="text-slate-600 text-[10px]">General immigration information · Not legal advice</p>
          </div>

          {/* Language picker */}
          <LanguagePicker value={language} onChange={handleLanguageChange} compact />

          {/* Toggle right panel */}
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-sm',
              rightOpen ? 'bg-brand-600/20 text-brand-400' : 'hover:bg-white/[0.06] text-slate-500'
            )}
            title="Toggle intake panel"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* ── Legal banner (dismissible) ─────────────────────── */}
        {!disclaimerDismissed && (
          <div className="flex-shrink-0 border-b border-amber-500/20 bg-amber-500/[0.04] px-4 py-2.5 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300/80 flex-1">
              <strong className="text-amber-300">Legal disclaimer:</strong>{' '}
              ImmigAI provides general immigration information only and does not provide legal advice.
              For your specific situation, consult a licensed immigration attorney.
            </p>
            <button onClick={() => setDisclaimerDismissed(true)} className="text-amber-500/60 hover:text-amber-400 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5" dir={dir}>

              {initializing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a3a6e] to-[#2d5eb5] border border-brand-500/30 flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-6 h-6 text-brand-300" />
                    </div>
                    <p className="text-slate-500 text-sm">Starting your session…</p>
                    <div className="flex justify-center gap-1 mt-2">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isLatest={i === messages.length - 1}
                      dir={dir}
                    />
                  ))}
                  {loading && <TypingIndicator dir={dir} />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Quick replies */}
            {showSuggestions && !loading && messages.length <= 2 && (
              <QuickReplies language={language} onSelect={sendMessage} disabled={loading || initializing} />
            )}

            {/* Input area */}
            <div className="border-t border-white/[0.06] p-4 flex-shrink-0">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={e => {
                      setInputValue(e.target.value)
                      // Auto-resize
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      language === 'es' ? 'Escribe tu pregunta...' :
                      language === 'ar' ? 'اكتب سؤالك...' :
                      language === 'hi' ? 'अपना प्रश्न लिखें...' :
                      language === 'zh' ? '输入您的问题...' :
                      'Ask about visas, green cards, immigration requirements…'
                    }
                    rows={1}
                    dir={dir}
                    disabled={loading || initializing}
                    className={cn(
                      'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white',
                      'placeholder-slate-600 resize-none overflow-y-hidden',
                      'focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-all duration-200',
                    )}
                    style={{ minHeight: '48px', maxHeight: '160px' }}
                  />
                </div>

                <button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || loading || initializing}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150',
                    'bg-brand-600 hover:bg-brand-500',
                    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600',
                    'shadow-glow-sm'
                  )}
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className={cn('w-4 h-4 text-white', dir === 'rtl' && 'rotate-180')} />
                  }
                </button>
              </div>

              {/* Bottom hint */}
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-[10px] text-slate-700">
                  {language === 'ar' ? 'Enter للإرسال · Shift+Enter لسطر جديد' :
                   language === 'zh' ? 'Enter 发送 · Shift+Enter 换行' :
                   'Enter to send · Shift+Enter for new line'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-700">
                  <Sparkles className="w-3 h-3 text-brand-500/60" />
                  Powered by Claude AI
                </div>
              </div>
            </div>
          </div>

          {/* ── Right panel — intake data ─────────────────────── */}
          {rightOpen && (
            <div className="w-72 flex-shrink-0 border-l border-white/[0.06] flex flex-col overflow-hidden bg-[#0d1117]">
              <div className="p-4 border-b border-white/[0.06]">
                <h3 className="font-semibold text-white text-sm mb-0.5">Intake Summary</h3>
                <p className="text-slate-600 text-[10px]">Collected from your conversation</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {hasIntake ? (
                  <IntakePanel intakeData={intakeData} />
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Information you share will appear here as your intake profile builds.
                    </p>
                  </div>
                )}
              </div>

              {/* Visa pathway summary (if intake is substantial) */}
              {Object.keys(intakeData).length >= 3 && (
                <div className="p-4 border-t border-white/[0.06] space-y-3">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider">Possible Pathways</p>
                  {getVisaPathways(intakeData).map(path => (
                    <div key={path.visa} className="flex items-center gap-2.5">
                      <span className="text-base">{path.icon}</span>
                      <div>
                        <p className="text-white text-xs font-medium">{path.visa}</p>
                        <p className="text-slate-600 text-[10px]">{path.reason}</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-700 italic leading-relaxed">
                    General guidance only — consult an attorney.
                  </p>
                </div>
              )}

              {/* CTA */}
              <div className="p-3 border-t border-white/[0.06]">
                <Link href="/case/create">
                  <Button size="sm" className="w-full text-xs gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Open a Formal Case
                  </Button>
                </Link>
                <p className="text-[10px] text-slate-700 text-center mt-1.5">
                  Connect with a licensed attorney
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple visa pathway inference from intake data
function getVisaPathways(intake: IntakeData): { visa: string; icon: string; reason: string }[] {
  const paths: { visa: string; icon: string; reason: string }[] = []
  const goal   = (intake.immigrationGoal ?? '').toLowerCase()
  const emp    = (intake.employmentSituation ?? '').toLowerCase()
  const family = (intake.familyTies ?? '').toLowerCase()
  const edu    = (intake.educationLevel ?? '').toLowerCase()

  if (family.includes('us citizen') || family.includes('citizen')) {
    paths.push({ visa: 'Family Green Card', icon: '❤️', reason: 'U.S. citizen family member' })
  }
  if (emp.includes('job offer') || emp.includes('employer') || goal.includes('work')) {
    if (edu.includes('bachelor') || edu.includes('master') || edu.includes('phd')) {
      paths.push({ visa: 'H-1B', icon: '💼', reason: 'Specialty occupation + degree' })
    }
  }
  if (goal.includes('extraordinary') || goal.includes('talent')) {
    paths.push({ visa: 'O-1A', icon: '⭐', reason: 'Extraordinary ability' })
  }
  if (goal.includes('invest') || emp.includes('invest')) {
    paths.push({ visa: 'E-2 / EB-5', icon: '💰', reason: 'Investment intent' })
  }
  if (goal.includes('study') || goal.includes('student')) {
    paths.push({ visa: 'F-1 Student', icon: '🎓', reason: 'Academic program' })
  }
  if (edu.includes('phd') || edu.includes('research')) {
    paths.push({ visa: 'EB-2 NIW', icon: '🔬', reason: 'Advanced research / national interest' })
  }

  return paths.slice(0, 4)
}
