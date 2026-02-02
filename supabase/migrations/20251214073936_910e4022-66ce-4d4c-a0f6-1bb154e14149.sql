-- Create assessment_questions table for admin-managed questions
CREATE TABLE public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage TEXT NOT NULL CHECK (stage IN ('scorecard', 'red_flags', 'screening_calls')),
  category TEXT DEFAULT NULL, -- For screening_calls: 'behavioral' or 'cultural'
  question_text TEXT NOT NULL,
  hint TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active questions
CREATE POLICY "Anyone can view active questions"
ON public.assessment_questions
FOR SELECT
USING (is_active = true);

-- Allow admins to view all questions (including inactive)
CREATE POLICY "Admins can view all questions"
ON public.assessment_questions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert questions
CREATE POLICY "Admins can insert questions"
ON public.assessment_questions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update questions
CREATE POLICY "Admins can update questions"
ON public.assessment_questions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete questions
CREATE POLICY "Admins can delete questions"
ON public.assessment_questions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default questions for each stage
-- Scorecard questions (based on existing SCORE_WEIGHTS)
INSERT INTO public.assessment_questions (stage, question_text, description, hint, sort_order) VALUES
('scorecard', 'Relevant Experience', 'Years of relevant experience in similar roles', 'Look for direct industry experience', 1),
('scorecard', 'Skills & Certifications', 'Technical skills and professional certifications', 'Check for required skills and valid certifications', 2),
('scorecard', 'Career Progression', 'Growth and advancement in career', 'Look for promotions and increasing responsibilities', 3),
('scorecard', 'Achievements', 'Notable accomplishments and results', 'Look for quantifiable achievements', 4),
('scorecard', 'Communication Clarity', 'Written communication quality in resume', 'Evaluate clarity and professionalism', 5);

-- Red Flags questions (based on existing RED_FLAGS)
INSERT INTO public.assessment_questions (stage, question_text, description, hint, sort_order) VALUES
('red_flags', 'Frequent Job Changes', 'Multiple jobs in short periods without clear progression', 'Look for 3+ jobs in 2 years or job hopping pattern', 1),
('red_flags', 'Vague Job Descriptions', 'Lacks specific responsibilities or accomplishments', 'Generic phrases like "responsible for tasks" without details', 2),
('red_flags', 'No Measurable Achievements', 'No quantifiable results or impact mentioned', 'Missing metrics, percentages, or concrete outcomes', 3),
('red_flags', 'Unexplained Employment Gaps', 'Gaps of 6+ months without explanation', 'Look for missing time periods between jobs', 4);

-- Screening Calls questions - Behavioral category
INSERT INTO public.assessment_questions (stage, category, question_text, description, sort_order) VALUES
('screening_calls', 'behavioral', 'Tell me about a time you exceeded sales targets', 'Assesses goal orientation and achievement', 1),
('screening_calls', 'behavioral', 'Describe a situation where you handled a difficult customer', 'Evaluates conflict resolution skills', 2),
('screening_calls', 'behavioral', 'Give an example of when you worked under pressure', 'Tests stress management abilities', 3),
('screening_calls', 'behavioral', 'How do you prioritize multiple competing tasks?', 'Assesses time management and organization', 4);

-- Screening Calls questions - Cultural category
INSERT INTO public.assessment_questions (stage, category, question_text, description, sort_order) VALUES
('screening_calls', 'cultural', 'What motivates you in your work?', 'Understand intrinsic motivation', 1),
('screening_calls', 'cultural', 'How do you handle feedback and criticism?', 'Evaluates growth mindset', 2),
('screening_calls', 'cultural', 'Describe your ideal work environment', 'Assess cultural fit', 3),
('screening_calls', 'cultural', 'What are your long-term career goals?', 'Understand career aspirations', 4);