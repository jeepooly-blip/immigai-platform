'use client'

import { useState } from 'react'
import { Bot, User, Copy, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/prisma'

// Simple markdown renderer (bold, bullet lists, headers, line breaks)
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm,  '<h3 class="text-sm font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm,   '<h2 class="text-base font-bold text-white mt-4 mb-1.5">$1</h2>')
    .replace(/^# (.+)$/gm,    '<h1 class="text-lg font-bold text-white mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,'<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em class="italic">$1</em>')
    .replace(/^- (.+)$/gm,    '<li class="ml-4 flex items-start gap-1.5"><span class="text-brand-400 mt-0.5 flex-shrink-0">•</span><span>$1</span></li>')
    .replace(/(<li.*<\/li>\n?)+/g, (m) => `<ul class="space-y-1 my-2">${m}</ul>`)
    .replace(/\n\n/g, '<br class="block my-2" />')
    .replace(/\n/g, '<br />')
    .replace(/⚖️ \*(.+?)\*/g, '<div class="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs"><span class="flex-shrink-0">⚖️</span><em>$1</em></div>')
}

interface MessageBubbleProps {
  message:   ChatMessage
  isLatest?: boolean
  dir?:      'ltr' | 'rtl'
}

export function MessageBubble({ message, isLatest, dir = 'ltr' }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  function handleCopy() {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasDisclaimer = message.content.includes('⚖️') || message.content.includes('legal')

  return (
    <div className={cn(
      'flex gap-3 group',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )} dir={dir}>

      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser
          ? 'bg-brand-600'
          : 'bg-gradient-to-br from-[#1a3a6e] to-[#2d5eb5] border border-brand-500/30'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot  className="w-4 h-4 text-brand-300" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        'flex-1 max-w-[85%]',
        isUser ? 'items-end' : 'items-start',
        'flex flex-col'
      )}>
        {/* Label */}
        <span className={cn(
          'text-[10px] font-medium mb-1 px-1',
          isUser ? 'text-slate-500 text-right' : 'text-brand-400'
        )}>
          {isUser ? 'You' : 'ImmigAI'}
        </span>

        {/* Content */}
        <div className={cn(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed relative',
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-[#161d2e] border border-white/[0.07] text-slate-300 rounded-tl-sm'
        )}>
          {isUser ? (
            <p dir={dir}>{message.content}</p>
          ) : (
            <div
              dir={dir}
              className="prose prose-invert prose-sm max-w-none [&_h2]:mt-4 [&_h3]:mt-3 [&_ul]:my-2"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          )}
        </div>

        {/* Footer row */}
        <div className={cn(
          'flex items-center gap-2 mt-1 px-1',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          <span className="text-[10px] text-slate-700">
            {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(message.timestamp))}
          </span>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-700 hover:text-slate-400"
            >
              {copied
                ? <Check className="w-3 h-3 text-emerald-400" />
                : <Copy className="w-3 h-3" />
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────
export function TypingIndicator({ dir = 'ltr' }: { dir?: 'ltr' | 'rtl' }) {
  return (
    <div className="flex gap-3" dir={dir}>
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1a3a6e] to-[#2d5eb5] border border-brand-500/30 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-brand-300" />
      </div>
      <div className="bg-[#161d2e] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          {[0,1,2].map(i => (
            <div key={i}
              className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
