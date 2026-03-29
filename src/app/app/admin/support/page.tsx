import { createServiceClient } from '@/lib/supabase/server'
import { CheckCircle2, Clock, AlertCircle, MessageSquare } from 'lucide-react'

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', Icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', Icon: Clock },
  resolved: { label: 'Resolved', color: 'text-green-400 bg-green-400/10 border-green-400/20', Icon: CheckCircle2 },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open
  const { Icon } = cfg
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusFilter } = await searchParams
  const supabase = createServiceClient()

  let query = supabase
    .from('support_tickets')
    .select('id, created_at, name, email, subject, message, status, conversation, admin_notes')
    .order('created_at', { ascending: false })
    .limit(200)

  if (statusFilter) query = query.eq('status', statusFilter)

  const { data: tickets, error } = await query

  const counts = {
    open: tickets?.filter((t) => t.status === 'open').length ?? 0,
    in_progress: tickets?.filter((t) => t.status === 'in_progress').length ?? 0,
    resolved: tickets?.filter((t) => t.status === 'resolved').length ?? 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Support Tickets</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {tickets?.length ?? 0} ticket{tickets?.length !== 1 ? 's' : ''}
          {statusFilter ? ` · filtered by "${statusFilter}"` : ''}
        </p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/app/admin/support"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !statusFilter
              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
              : 'border-[#1E293B] text-[#64748B] hover:border-[#334155] hover:text-white'
          }`}
        >
          All
        </a>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = counts[key as keyof typeof counts]
          return (
            <a
              key={key}
              href={`/app/admin/support?status=${key}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === key
                  ? `${cfg.color}`
                  : 'border-[#1E293B] text-[#64748B] hover:border-[#334155] hover:text-white'
              }`}
            >
              {cfg.label}
              {count > 0 && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
                  {count}
                </span>
              )}
            </a>
          )
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load tickets: {error.message}
        </div>
      )}

      {/* Tickets list */}
      {!tickets?.length ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#1E293B] bg-[#0A1628] py-16 text-center">
          <MessageSquare className="size-10 text-[#1E293B]" />
          <p className="text-sm font-medium text-[#64748B]">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const chatLength = Array.isArray(ticket.conversation) ? ticket.conversation.length : 0
            return (
              <details
                key={ticket.id}
                className="group rounded-2xl border border-[#1E293B] bg-[#0A1628] transition-colors hover:border-[#334155]"
              >
                <summary className="flex cursor-pointer items-start gap-4 px-5 py-4 list-none">
                  <div className="mt-0.5 shrink-0">
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">
                        {ticket.subject || ticket.message.slice(0, 60) + (ticket.message.length > 60 ? '…' : '')}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 flex-wrap text-xs text-[#64748B]">
                      <span>{ticket.name}</span>
                      <span>·</span>
                      <span>{ticket.email}</span>
                      {chatLength > 0 && (
                        <>
                          <span>·</span>
                          <span>{chatLength} AI messages</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-[#334155] font-mono">
                    #{ticket.id.slice(0, 8).toUpperCase()}
                  </span>
                </summary>

                {/* Expanded detail */}
                <div className="border-t border-[#1E293B] px-5 py-4 space-y-4">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Message</p>
                    <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                  </div>

                  {chatLength > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">AI Chat History</p>
                      <div className="space-y-2 rounded-xl border border-[#1E293B] bg-[#060E1C] p-3">
                        {(ticket.conversation as { role: string; content: string }[]).map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-xs ${
                              m.role === 'user'
                                ? 'bg-blue-600/20 text-blue-200'
                                : 'bg-[#0F1E33] text-[#94A3B8]'
                            }`}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ticket.admin_notes && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Admin Notes</p>
                      <p className="text-sm text-[#64748B] italic">{ticket.admin_notes}</p>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`mailto:${ticket.email}?subject=Re: [Support #${ticket.id.slice(0, 8).toUpperCase()}] ${ticket.subject ?? ''}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E293B] px-3 py-1.5 text-xs font-medium text-[#64748B] hover:border-blue-500/50 hover:text-blue-400 transition-colors"
                    >
                      Reply via email
                    </a>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
