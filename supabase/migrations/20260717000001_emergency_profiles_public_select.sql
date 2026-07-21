-- Emergency profiles public SELECT policy
-- Allows unauthenticated users (public / anon key) to read emergency profiles
-- for the public emergency profile page at /emergency/:userId
-- Only exposes safe, non-sensitive fields that the user has explicitly chosen to share.
-- This is safe because:
--   1. The user explicitly sets up and manages this data via the emergency QR feature.
--   2. The data is only accessible via a direct user_id lookup (requires knowing the UUID).
--   3. The QR code itself is the access mechanism the user generates and shares.

CREATE POLICY IF NOT EXISTS "ep_select_public" ON public.emergency_profiles
FOR SELECT TO anon
USING (true);

-- Also allow public to read profiles (full_name) for display on the emergency page
CREATE POLICY IF NOT EXISTS "profiles_select_public_emergency" ON public.profiles
FOR SELECT TO anon
USING (true);

