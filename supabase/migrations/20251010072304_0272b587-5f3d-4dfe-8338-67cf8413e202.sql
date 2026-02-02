-- Add onboarding and assessment tracking fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS selected_domain TEXT CHECK (selected_domain IN ('sales', 'crm'));

-- Add domain field to resumes table
ALTER TABLE public.resumes
ADD COLUMN IF NOT EXISTS domain TEXT CHECK (domain IN ('sales', 'crm'));

-- Create assessment_progress table to track user progress
CREATE TABLE IF NOT EXISTS public.assessment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  scorecard_completed BOOLEAN DEFAULT FALSE,
  red_flags_completed BOOLEAN DEFAULT FALSE,
  behavioral_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  ai_score NUMERIC,
  user_score NUMERIC,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, resume_id)
);

ALTER TABLE public.assessment_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for assessment_progress
CREATE POLICY "Users can view own assessment progress"
ON public.assessment_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment progress"
ON public.assessment_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessment progress"
ON public.assessment_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessment progress"
ON public.assessment_progress FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Update profiles RLS to allow users to update their own onboarding info
CREATE POLICY "Users can update own onboarding info"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);