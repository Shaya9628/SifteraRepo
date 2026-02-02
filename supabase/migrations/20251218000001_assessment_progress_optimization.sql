-- Fix assessment progress tracking and ensure all required tables exist
-- This migration ensures proper three-stage assessment completion tracking

-- Create assessment_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.assessment_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scorecard_completed BOOLEAN DEFAULT false,
  red_flags_completed BOOLEAN DEFAULT false,
  behavioral_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(resume_id, user_id)
);

-- Enable RLS
ALTER TABLE public.assessment_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for assessment_progress
DROP POLICY IF EXISTS "Users can view own progress" ON public.assessment_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.assessment_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.assessment_progress;

CREATE POLICY "Users can view own progress"
ON public.assessment_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.assessment_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.assessment_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to update assessment progress automatically
CREATE OR REPLACE FUNCTION public.update_assessment_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update progress when any assessment component is completed
  INSERT INTO public.assessment_progress (resume_id, user_id, scorecard_completed, red_flags_completed, behavioral_completed)
  VALUES (
    COALESCE(NEW.resume_id, OLD.resume_id),
    COALESCE(NEW.user_id, OLD.user_id),
    CASE WHEN TG_TABLE_NAME = 'resume_scores' THEN true ELSE 
      COALESCE((SELECT scorecard_completed FROM public.assessment_progress 
               WHERE resume_id = COALESCE(NEW.resume_id, OLD.resume_id) 
               AND user_id = COALESCE(NEW.user_id, OLD.user_id)), false) END,
    CASE WHEN TG_TABLE_NAME = 'red_flags' THEN true ELSE 
      COALESCE((SELECT red_flags_completed FROM public.assessment_progress 
               WHERE resume_id = COALESCE(NEW.resume_id, OLD.resume_id) 
               AND user_id = COALESCE(NEW.user_id, OLD.user_id)), false) END,
    CASE WHEN TG_TABLE_NAME = 'call_simulations' THEN true ELSE 
      COALESCE((SELECT behavioral_completed FROM public.assessment_progress 
               WHERE resume_id = COALESCE(NEW.resume_id, OLD.resume_id) 
               AND user_id = COALESCE(NEW.user_id, OLD.user_id)), false) END
  )
  ON CONFLICT (resume_id, user_id) DO UPDATE SET
    scorecard_completed = CASE WHEN TG_TABLE_NAME = 'resume_scores' THEN true ELSE EXCLUDED.scorecard_completed END,
    red_flags_completed = CASE WHEN TG_TABLE_NAME = 'red_flags' THEN true ELSE EXCLUDED.red_flags_completed END,
    behavioral_completed = CASE WHEN TG_TABLE_NAME = 'call_simulations' THEN true ELSE EXCLUDED.behavioral_completed END,
    updated_at = timezone('utc'::text, now()),
    completed_at = CASE 
      WHEN EXCLUDED.scorecard_completed AND EXCLUDED.red_flags_completed AND EXCLUDED.behavioral_completed 
      THEN timezone('utc'::text, now()) 
      ELSE NULL 
    END;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers to automatically update progress
DROP TRIGGER IF EXISTS trigger_update_progress_scorecard ON public.resume_scores;
DROP TRIGGER IF EXISTS trigger_update_progress_flags ON public.red_flags;
DROP TRIGGER IF EXISTS trigger_update_progress_calls ON public.call_simulations;

CREATE TRIGGER trigger_update_progress_scorecard
  AFTER INSERT OR UPDATE ON public.resume_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_assessment_progress();

CREATE TRIGGER trigger_update_progress_flags
  AFTER INSERT OR UPDATE ON public.red_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_assessment_progress();

CREATE TRIGGER trigger_update_progress_calls
  AFTER INSERT OR UPDATE ON public.call_simulations
  FOR EACH ROW EXECUTE FUNCTION public.update_assessment_progress();

-- Backfill existing assessment progress
INSERT INTO public.assessment_progress (resume_id, user_id, scorecard_completed, red_flags_completed, behavioral_completed)
SELECT DISTINCT 
  r.id as resume_id,
  r.user_id,
  CASE WHEN rs.id IS NOT NULL THEN true ELSE false END as scorecard_completed,
  CASE WHEN rf.user_id IS NOT NULL THEN true ELSE false END as red_flags_completed,
  CASE WHEN cs.id IS NOT NULL THEN true ELSE false END as behavioral_completed
FROM public.resumes r
LEFT JOIN public.resume_scores rs ON rs.resume_id = r.id AND rs.user_id = r.user_id
LEFT JOIN (
  SELECT DISTINCT resume_id, user_id 
  FROM public.red_flags
) rf ON rf.resume_id = r.id AND rf.user_id = r.user_id
LEFT JOIN public.call_simulations cs ON cs.resume_id = r.id AND cs.user_id = r.user_id
ON CONFLICT (resume_id, user_id) DO NOTHING;

-- Update completed_at for fully completed assessments
UPDATE public.assessment_progress 
SET completed_at = timezone('utc'::text, now())
WHERE scorecard_completed = true 
  AND red_flags_completed = true 
  AND behavioral_completed = true 
  AND completed_at IS NULL;