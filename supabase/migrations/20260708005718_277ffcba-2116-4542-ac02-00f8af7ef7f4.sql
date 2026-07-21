
-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================
-- profiles
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  date_of_birth DATE,
  blood_group TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- health_records
-- =========================
CREATE TABLE public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Reports',
  place TEXT,
  record_date DATE,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX health_records_user_idx ON public.health_records(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_records TO authenticated;
GRANT ALL ON public.health_records TO service_role;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_select_own" ON public.health_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "hr_insert_own" ON public.health_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hr_update_own" ON public.health_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hr_delete_own" ON public.health_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_hr_updated_at BEFORE UPDATE ON public.health_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- medications
-- =========================
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  time_of_day TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX medications_user_idx ON public.medications(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meds_select_own" ON public.medications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "meds_insert_own" ON public.medications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meds_update_own" ON public.medications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meds_delete_own" ON public.medications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_meds_updated_at BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- appointments
-- =========================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  doctor TEXT,
  location TEXT,
  appointment_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX appointments_user_idx ON public.appointments(user_id, appointment_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appt_select_own" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "appt_insert_own" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appt_update_own" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appt_delete_own" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_appt_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- emergency_contacts
-- =========================
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ec_user_idx ON public.emergency_contacts(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ec_select_own" ON public.emergency_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ec_insert_own" ON public.emergency_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ec_update_own" ON public.emergency_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ec_delete_own" ON public.emergency_contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_ec_updated_at BEFORE UPDATE ON public.emergency_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- timeline
-- =========================
CREATE TABLE public.timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  related_record_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX timeline_user_idx ON public.timeline(user_id, event_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline TO authenticated;
GRANT ALL ON public.timeline TO service_role;
ALTER TABLE public.timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tl_select_own" ON public.timeline FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tl_insert_own" ON public.timeline FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tl_update_own" ON public.timeline FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tl_delete_own" ON public.timeline FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_tl_updated_at BEFORE UPDATE ON public.timeline FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Storage RLS on storage.objects (private buckets: avatars, medical_records)
-- Users can only access files inside a folder named after their auth.uid()
-- =========================
CREATE POLICY "avatars_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "medrec_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'medical_records' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "medrec_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'medical_records' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "medrec_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'medical_records' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "medrec_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'medical_records' AND (storage.foldername(name))[1] = auth.uid()::text);
