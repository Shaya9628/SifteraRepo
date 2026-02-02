-- Add missing fields to assessment_reports table for complete AI analysis
ALTER TABLE public.assessment_reports 
ADD COLUMN red_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN interview_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN recommendation TEXT DEFAULT '',
ADD COLUMN reasoning TEXT DEFAULT '',
ADD COLUMN suitability_summary TEXT DEFAULT '';

-- Update existing records to have empty arrays/strings for new fields if needed
UPDATE public.assessment_reports 
SET 
  red_flags = COALESCE(red_flags, '[]'::jsonb),
  interview_questions = COALESCE(interview_questions, '[]'::jsonb),
  recommendation = COALESCE(recommendation, ''),
  reasoning = COALESCE(reasoning, ''),
  suitability_summary = COALESCE(suitability_summary, '')
WHERE 
  red_flags IS NULL OR 
  interview_questions IS NULL OR 
  recommendation IS NULL OR
  reasoning IS NULL OR
  suitability_summary IS NULL;