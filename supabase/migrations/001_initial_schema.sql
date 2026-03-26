-- LVIS™ — Initial Schema
-- Migration 001

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── ENUMs ──────────────────────────────────────────────────────────────────

CREATE TYPE public.user_role         AS ENUM ('admin', 'client');
CREATE TYPE public.case_status       AS ENUM ('pending', 'in_review', 'analyzing', 'completed', 'rejected');
CREATE TYPE public.case_priority     AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE public.analysis_status   AS ENUM ('pending', 'running', 'complete', 'failed');

-- ── Profiles ────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT,
  avatar_url          TEXT,
  role                public.user_role NOT NULL DEFAULT 'client',
  subscription_tier   public.subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id  TEXT UNIQUE,
  company_name        TEXT,
  phone               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── Cases ────────────────────────────────────────────────────────────────────

CREATE TABLE public.cases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number   TEXT UNIQUE NOT NULL,
  client_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  purpose       TEXT,
  status        public.case_status NOT NULL DEFAULT 'pending',
  priority      public.case_priority NOT NULL DEFAULT 'normal',
  due_date      DATE,
  client_notes  TEXT,
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cases_client_id  ON public.cases(client_id);
CREATE INDEX idx_cases_status     ON public.cases(status);
CREATE INDEX idx_cases_created_at ON public.cases(created_at DESC);

-- ── Case Files ───────────────────────────────────────────────────────────────

CREATE TABLE public.case_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     BIGINT NOT NULL,
  width         INTEGER,
  height        INTEGER,
  checksum      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_case_files_case_id ON public.case_files(case_id);
