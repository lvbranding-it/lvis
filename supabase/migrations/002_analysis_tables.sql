-- LVIS™ — Analysis Tables
-- Migration 002

CREATE TABLE public.metadata_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_file_id    UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  exif_json       JSONB NOT NULL DEFAULT '{}'::JSONB,
  xmp_json        JSONB NOT NULL DEFAULT '{}'::JSONB,
  iptc_json       JSONB NOT NULL DEFAULT '{}'::JSONB,
  raw_metadata    JSONB NOT NULL DEFAULT '{}'::JSONB,
  extracted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.metadata_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_metadata_reports_case_file_id ON public.metadata_reports(case_file_id);

CREATE TABLE public.forensic_reviews (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                   UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  case_file_id              UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  technical_evidence        JSONB NOT NULL DEFAULT '{}'::JSONB,
  claude_findings           JSONB NOT NULL DEFAULT '{}'::JSONB,
  provenance_score          NUMERIC(5,2) NOT NULL DEFAULT 0,
  file_integrity_score      NUMERIC(5,2) NOT NULL DEFAULT 0,
  visual_consistency_score  NUMERIC(5,2) NOT NULL DEFAULT 0,
  manipulation_score        NUMERIC(5,2) NOT NULL DEFAULT 0,
  synthetic_risk_score      NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_score               NUMERIC(5,2) NOT NULL DEFAULT 0,
  classification            TEXT NOT NULL DEFAULT '',
  confidence_level          TEXT NOT NULL DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),
  analysis_status           public.analysis_status NOT NULL DEFAULT 'pending',
  error_message             TEXT,
  analyzed_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forensic_reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_forensic_reviews_case_id      ON public.forensic_reviews(case_id);
CREATE INDEX idx_forensic_reviews_case_file_id ON public.forensic_reviews(case_file_id);

CREATE TABLE public.reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  forensic_review_id  UUID REFERENCES public.forensic_reviews(id) ON DELETE SET NULL,
  storage_path        TEXT,
  version             INTEGER NOT NULL DEFAULT 1,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reports_case_id ON public.reports(case_id);
