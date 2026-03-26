-- LVIS™ — Signup Trigger + Automation
-- Migration 005

-- ── updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forensic_reviews_updated_at
  BEFORE UPDATE ON public.forensic_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_usage_records_updated_at
  BEFORE UPDATE ON public.usage_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Case number sequence ─────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.case_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  NEW.case_number := 'LVIS-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(nextval('public.case_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_case_number
  BEFORE INSERT ON public.cases FOR EACH ROW EXECUTE FUNCTION public.generate_case_number();

-- ── Signup trigger ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_name TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, user_name, 'client');

  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
