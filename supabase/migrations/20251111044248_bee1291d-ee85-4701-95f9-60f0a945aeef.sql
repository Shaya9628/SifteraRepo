-- Create assessment_reports table to store comparative analysis
CREATE TABLE public.assessment_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_total_score NUMERIC NOT NULL,
  ai_total_score NUMERIC NOT NULL,
  user_scores JSONB NOT NULL,
  ai_scores JSONB NOT NULL,
  comparative_feedback JSONB NOT NULL,
  overall_feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.assessment_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view own assessment reports"
ON public.assessment_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert own assessment reports"
ON public.assessment_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users cannot update reports after creation
CREATE POLICY "Users cannot update assessment reports"
ON public.assessment_reports
FOR UPDATE
USING (false);

-- Users cannot delete reports
CREATE POLICY "Users cannot delete assessment reports"
ON public.assessment_reports
FOR DELETE
USING (false);

-- Admins can view all reports
CREATE POLICY "Admins can view all assessment reports"
ON public.assessment_reports
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_assessment_reports_user_id ON public.assessment_reports(user_id);
CREATE INDEX idx_assessment_reports_resume_id ON public.assessment_reports(resume_id);