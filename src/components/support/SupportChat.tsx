'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface UserInfo {
  name: string
  email: string
  userId?: string
}

export function SupportChat() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'chat' | 'contact'>('chat')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm the LVIS™ support assistant. Ask me anything about forensic analysis, your account, billing, or how to use the platform.",
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Try to get logged-in user info for pre-fill
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          const info: UserInfo = {
            name: profile?.full_name ?? '',
            email: data.user!.email ?? '',
            userId: data.user!.id,
          }
          setUserInfo(info)
          setForm((f) => ({
            ...f,
            name: info.name,
            email: info.email,
          }))
        })
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  useEffect(() => {
    if (open && view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, view])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setStreaming(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages((prev) => [...prev, assistantMsg])

    try {
      const resp = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!resp.ok || !resp.body) throw new Error('Chat unavailable')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content:
            "I'm having trouble connecting right now. Please try again or use the Contact Support button below.",
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }, [input, messages, streaming])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const submitTicket = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          conversation: messages,
          user_id: userInfo?.userId ?? null,
        }),
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 flex flex-col rounded-2xl border border-[#1E293B] shadow-2xl shadow-black/40"
          style={{
            width: 360,
            height: 520,
            background: '#0A1628',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[#1E293B] px-4 py-3 shrink-0">
            {view === 'contact' && (
              <button
                onClick={() => { setView('chat'); setSubmitted(false) }}
                className="text-[#64748B] hover:text-white transition-colors mr-1"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600">
              <MessageCircle className="size-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">LVIS™ Support</p>
              <p className="text-[10px] text-[#64748B]">
                {view === 'chat' ? 'AI assistant · Powered by Claude' : 'Contact our team'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-lg p-1.5 text-[#64748B] hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          {view === 'chat' ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-[#0F1E33] text-[#CBD5E1] border border-[#1E293B] rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                      {streaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                        <span className="inline-flex gap-1 items-center py-0.5">
                          <span className="size-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="size-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="size-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Contact support CTA */}
              <div className="shrink-0 border-t border-[#1E293B] px-4 py-2">
                <button
                  onClick={() => setView('contact')}
                  className="w-full text-center text-xs text-[#64748B] hover:text-[#93C5FD] transition-colors py-1"
                >
                  Need human support? → Contact our team
                </button>
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-[#1E293B] p-3 flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question…"
                  rows={1}
                  disabled={streaming}
                  className="flex-1 resize-none rounded-xl border border-[#1E293B] bg-[#0F1E33] px-3 py-2 text-sm text-white placeholder-[#475569] outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  style={{ maxHeight: 80 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={streaming || !input.trim()}
                  className="shrink-0 flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {streaming ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
            </>
          ) : submitted ? (
            /* Success state */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="size-7 text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Ticket submitted</p>
                <p className="text-sm text-[#64748B]">
                  We&apos;ll get back to you at <span className="text-[#93C5FD]">{form.email}</span> as soon as possible.
                </p>
              </div>
              <button
                onClick={() => { setView('chat'); setSubmitted(false) }}
                className="text-xs text-[#64748B] hover:text-white transition-colors"
              >
                ← Back to chat
              </button>
            </div>
          ) : (
            /* Contact form */
            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-3 gap-3">
              <p className="text-xs text-[#64748B]">
                Fill in the form and we&apos;ll reply to your email. Your chat history will be included.
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-[#1E293B] bg-[#0F1E33] px-3 py-2 text-sm text-white placeholder-[#475569] outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@email.com"
                    className="w-full rounded-lg border border-[#1E293B] bg-[#0F1E33] px-3 py-2 text-sm text-white placeholder-[#475569] outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Subject (optional)</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief summary"
                  className="w-full rounded-lg border border-[#1E293B] bg-[#0F1E33] px-3 py-2 text-sm text-white placeholder-[#475569] outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Describe the issue…"
                  rows={5}
                  className="w-full resize-none rounded-lg border border-[#1E293B] bg-[#0F1E33] px-3 py-2 text-sm text-white placeholder-[#475569] outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <button
                onClick={submitTicket}
                disabled={submitting || !form.name.trim() || !form.email.trim() || !form.message.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Support Request'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-50 flex size-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        style={{
          background: open ? '#1E293B' : '#1D4ED8',
          boxShadow: open ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(29,78,216,0.5)',
        }}
        aria-label="Support chat"
      >
        {open ? (
          <X className="size-5 text-white" />
        ) : (
          <MessageCircle className="size-5 text-white" />
        )}
      </button>
    </>
  )
}
