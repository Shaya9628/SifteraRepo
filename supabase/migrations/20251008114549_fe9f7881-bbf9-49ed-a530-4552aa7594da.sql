-- Phase 1: Critical RLS Policy Fixes

-- 1.1 Fix profiles table RLS policies
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can only view their own complete profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Public leaderboard data - only id, full_name, total_points, avatar_url
CREATE POLICY "Public leaderboard data viewable"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: The above will allow viewing all profiles but in practice we'll filter in queries
-- A more secure approach would be to create a separate leaderboard view
-- For now, we'll rely on application-level filtering to only show leaderboard data

-- Better approach: Create a security definer function for leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  full_name text,
  total_points integer,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name, total_points, avatar_url
  FROM public.profiles
  ORDER BY total_points DESC
  LIMIT limit_count;
$$;

-- Drop the public policy and keep only own profile view
DROP POLICY IF EXISTS "Public leaderboard data viewable" ON public.profiles;

CREATE POLICY "Users view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 1.2 Add RLS policies to user_roles table
-- Users can only view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Deny all INSERT/UPDATE/DELETE - only database functions can modify
CREATE POLICY "No direct role modifications"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No role updates"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No role deletions"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);

-- 1.3 Fix user_badges table RLS policy
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Users can view all user badges" ON public.user_badges;

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
ON public.user_badges
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create function for public badge leaderboard data
CREATE OR REPLACE FUNCTION public.get_user_badges_for_leaderboard()
RETURNS TABLE (
  user_id uuid,
  badge_id uuid,
  earned_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, badge_id, earned_at
  FROM public.user_badges
  ORDER BY earned_at DESC;
$$;