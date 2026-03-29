-- Support tickets table
CREATE TABLE public.support_tickets (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  subject       TEXT,
  message       TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'open',  -- open | in_progress | resolved
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation  JSONB       DEFAULT '[]'::jsonb,       -- AI chat history before escalation
  resolved_at   TIMESTAMPTZ,
  admin_notes   TEXT
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone (including anonymous) can submit a ticket
CREATE POLICY "Anyone can insert tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (true);

-- Index for admin queries
CREATE INDEX support_tickets_status_idx   ON public.support_tickets (status);
CREATE INDEX support_tickets_created_idx  ON public.support_tickets (created_at DESC);
CREATE INDEX support_tickets_user_idx     ON public.support_tickets (user_id);
