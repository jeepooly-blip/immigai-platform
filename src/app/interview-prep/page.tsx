'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Mic, Brain, ChevronRight, RotateCcw, CheckCircle, Loader2, MessageSquare } from 'lucide-react'

const VISA_TYPES = ['H-1B', 'F-1', 'O-1A', 'I-485 AOS', 'K-1 Fiancé', 'B-1/B-2', 'L-1', 'EB-1', 'EB-2 NIW', 'Green Card Interview']

type Question = { q: string; tips: string; followUps: string[] }
type AnswerEntry = { question: string; answer: string; feedback: string; score: number }

export default function InterviewPrepPage() {
  const [visaType, setVisaType]   = useState('')
  const [mode, setMode]           = useState<'practice' | 'mock'>('practice')
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent]     = useState(0)
  const [answer, setAnswer]       = useState('')
  const [answers, setAnswers]     = useState<AnswerEntry[]>([])
  const [loading, setLoading]     = useState(false)
  const [phase, setPhase]         = useState<'setup' | 'session' | 'review'>('setup')

  async function startSession() {
    if (!visaType) return
    setLoading(true)
    try {
      const res = await fetch('/api/interview-prep/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visaType, mode }),
      })
      const data = await res.json()
      setQuestions(data.questions)
      setCurrent(0)
      setAnswers([])
      setPhase('session')
    } finally { setLoading(false) }
  }

  async function submitAnswer() {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/interview-prep/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questions[current].q, answer, visaType }),
      })
      const { feedback, score } = await res.json()
      setAnswers(prev => [...prev, { question: questions[current].q, answer, feedback, score }])
      setAnswer('')
      if (current + 1 >= questions.length) {
        setPhase('review')
      } else {
        setCurrent(c => c + 1)
      }
    } finally { setLoading(false) }
  }

  const avgScore = answers.length
    ? Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length)
    : 0

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Interview Prep</h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered practice for USCIS and consular interviews</p>
        </div>

        {phase === 'setup' && (
          <div className="card p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Visa / Interview Type</label>
              <div className="grid grid-cols-2 gap-2">
                {VISA_TYPES.map(v => (
                  <button key={v} onClick={() => setVisaType(v)}
                    className={`text-xs px-3 py-2 rounded-lg border text-left transition-all ${
                      visaType === v
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium'
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                    }`}>{v}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {(['practice', 'mock'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      mode === m
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                    }`}>
                    <div className="font-medium text-sm text-slate-900 dark:text-white capitalize">{m}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {m === 'practice' ? 'Tips shown, take your time' : 'Timed, realistic simulation'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={startSession} disabled={!visaType || loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
              Start Session
            </Button>
          </div>
        )}

        {phase === 'session' && questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Question {current + 1} of {questions.length}</span>
              <div className="h-1.5 flex-1 mx-4 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${((current) / questions.length) * 100}%` }} />
              </div>
              <span className="text-xs font-medium text-brand-600 dark:text-brand-400">{visaType}</span>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm leading-relaxed">
                    {questions[current].q}
                  </p>
                  {mode === 'practice' && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mb-1">💡 Tip</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">{questions[current].tips}</p>
                      {questions[current].followUps?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Possible follow-ups:</p>
                          <ul className="mt-1 space-y-0.5">
                            {questions[current].followUps.map((f, i) => (
                              <li key={i} className="text-xs text-amber-600 dark:text-amber-500">• {f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <textarea
                className="input w-full resize-none"
                rows={5}
                placeholder="Type your answer here…"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
              />

              <div className="flex gap-3 mt-4">
                <Button onClick={submitAnswer} disabled={!answer.trim() || loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                  {current + 1 >= questions.length ? 'Finish' : 'Next Question'}
                </Button>
                <Button variant="outline" onClick={() => setPhase('setup')}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === 'review' && (
          <div className="space-y-4">
            <div className="card p-6 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">Session Complete</h2>
              <p className="text-slate-500 text-sm mt-1">{answers.length} questions answered for {visaType}</p>
              <div className="mt-4">
                <span className={`text-4xl font-bold ${avgScore >= 70 ? 'text-emerald-600' : avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {avgScore}
                </span>
                <span className="text-slate-400 text-lg">/100</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Average score</p>
            </div>

            <div className="space-y-3">
              {answers.map((a, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.question}</p>
                    <span className={`text-sm font-bold flex-shrink-0 ${a.score >= 70 ? 'text-emerald-600' : a.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {a.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 bg-slate-50 dark:bg-white/[0.03] p-2 rounded mb-2 italic">"{a.answer}"</p>
                  <div className="flex items-start gap-2">
                    <Brain className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">{a.feedback}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={() => setPhase('setup')} className="w-full" variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" /> Start New Session
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
