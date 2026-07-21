-- Emergency profiles RLS policies
-- Keeps RLS enabled and grants authenticated users access to only their own row.

-- SELECT
CREATE POLICY IF NOT EXISTS "ep_select_own" ON public.emergency_profiles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY IF NOT EXISTS "ep_insert_own" ON public.emergency_profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY IF NOT EXISTS "ep_update_own" ON public.emergency_profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY IF NOT EXISTS "ep_delete_own" ON public.emergency_profiles
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

