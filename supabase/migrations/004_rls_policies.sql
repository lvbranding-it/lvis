-- LVIS™ — RLS Policies
-- Migration 004

-- ── is_admin() helper ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- ── Profiles ────────────────────────────────────────────────────────────────

CREATE POLICY "profiles_select_own"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin"  ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profiles_insert_own"    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── Cases ────────────────────────────────────────────────────────────────────

CREATE POLICY "cases_select_own"       ON public.cases FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "cases_select_admin"     ON public.cases FOR SELECT USING (public.is_admin());
CREATE POLICY "cases_insert_own"       ON public.cases FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "cases_update_pending"   ON public.cases FOR UPDATE USING (auth.uid() = client_id AND status = 'pending');
CREATE POLICY "cases_update_admin"     ON public.cases FOR UPDATE USING (public.is_admin());
CREATE POLICY "cases_delete_admin"     ON public.cases FOR DELETE USING (public.is_admin());

-- ── Case Files ───────────────────────────────────────────────────────────────

CREATE POLICY "case_files_select_own" ON public.case_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE id = case_files.case_id AND client_id = auth.uid())
);
CREATE POLICY "case_files_select_admin" ON public.case_files FOR SELECT USING (public.is_admin());
CREATE POLICY "case_files_insert_own"  ON public.case_files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cases WHERE id = case_files.case_id AND client_id = auth.uid())
);
CREATE POLICY "case_files_all_service" ON public.case_files FOR ALL USING (TRUE);

-- ── Metadata Reports ─────────────────────────────────────────────────────────

CREATE POLICY "metadata_select_own" ON public.metadata_reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.case_files cf
    JOIN public.cases c ON c.id = cf.case_id
    WHERE cf.id = metadata_reports.case_file_id AND c.client_id = auth.uid()
  )
);
CREATE POLICY "metadata_select_admin"  ON public.metadata_reports FOR SELECT USING (public.is_admin());
CREATE POLICY "metadata_all_service"   ON public.metadata_reports FOR ALL USING (TRUE);

-- ── Forensic Reviews ─────────────────────────────────────────────────────────

CREATE POLICY "forensic_select_own" ON public.forensic_reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE id = forensic_reviews.case_id AND client_id = auth.uid())
);
CREATE POLICY "forensic_select_admin" ON public.forensic_reviews FOR SELECT USING (public.is_admin());
CREATE POLICY "forensic_all_service"  ON public.forensic_reviews FOR ALL USING (TRUE);

-- ── Reports ──────────────────────────────────────────────────────────────────

CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE id = reports.case_id AND client_id = auth.uid())
);
CREATE POLICY "reports_select_admin"  ON public.reports FOR SELECT USING (public.is_admin());
CREATE POLICY "reports_all_service"   ON public.reports FOR ALL USING (TRUE);

-- ── Subscriptions ─────────────────────────────────────────────────────────────

CREATE POLICY "subscriptions_select_own"   ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_select_admin" ON public.subscriptions FOR SELECT USING (public.is_admin());
CREATE POLICY "subscriptions_all_service"  ON public.subscriptions FOR ALL USING (TRUE);

CREATE POLICY "usage_select_own"   ON public.usage_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_select_admin" ON public.usage_records FOR SELECT USING (public.is_admin());
CREATE POLICY "usage_all_service"  ON public.usage_records FOR ALL USING (TRUE);
