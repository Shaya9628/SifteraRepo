-- Phase 1: Critical Data Integrity Protection

-- 1. Add UPDATE policy to resumes (only admins can update)
CREATE POLICY "Admins can update resumes"
ON public.resumes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add DELETE policy to resumes (prevent deletion entirely)
CREATE POLICY "Prevent resume deletion"
ON public.resumes
FOR DELETE
USING (false);

-- 3. Add INSERT policy to profiles (only through trigger, not direct inserts)
CREATE POLICY "Profiles can only be created by system"
ON public.profiles
FOR INSERT
WITH CHECK (false);

-- 4. Add UPDATE/DELETE policies to resume_scores (prevent tampering)
CREATE POLICY "Users cannot update scores after submission"
ON public.resume_scores
FOR UPDATE
USING (false);

CREATE POLICY "Users cannot delete scores"
ON public.resume_scores
FOR DELETE
USING (false);

-- 5. Add UPDATE/DELETE policies to red_flags (prevent modification)
CREATE POLICY "Users cannot update red flags"
ON public.red_flags
FOR UPDATE
USING (false);

CREATE POLICY "Users cannot delete red flags"
ON public.red_flags
FOR DELETE
USING (false);

-- 6. Add UPDATE/DELETE policies to call_simulations (prevent answer manipulation)
CREATE POLICY "Users cannot update call simulations"
ON public.call_simulations
FOR UPDATE
USING (false);

CREATE POLICY "Users cannot delete call simulations"
ON public.call_simulations
FOR DELETE
USING (false);

-- 7. Add UPDATE/DELETE policies to user_badges (prevent badge farming)
CREATE POLICY "Users cannot update badges"
ON public.user_badges
FOR UPDATE
USING (false);

CREATE POLICY "Users cannot delete badges"
ON public.user_badges
FOR DELETE
USING (false);

-- 8. Add DELETE policy to assessment_progress (prevent progress deletion)
CREATE POLICY "Users cannot delete assessment progress"
ON public.assessment_progress
FOR DELETE
USING (false);

-- Phase 3: Remove duplicate RLS policies on profiles
DROP POLICY IF EXISTS "Users view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own onboarding info" ON public.profiles;