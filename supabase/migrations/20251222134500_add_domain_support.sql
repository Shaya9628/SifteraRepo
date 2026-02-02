-- Add domain support to assessment_questions table
ALTER TABLE public.assessment_questions 
ADD COLUMN domain TEXT NOT NULL DEFAULT 'Sales' 
CHECK (domain IN ('Sales', 'CRM'));

-- Add domain to users table for user domain preference
ALTER TABLE public.users 
ADD COLUMN domain TEXT NOT NULL DEFAULT 'Sales' 
CHECK (domain IN ('Sales', 'CRM'));

-- Create domain_settings table for admin controls
CREATE TABLE public.domain_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  allow_user_domain_change BOOLEAN NOT NULL DEFAULT true,
  allow_admin_domain_change BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insert default settings
INSERT INTO public.domain_settings (allow_user_domain_change, allow_admin_domain_change) 
VALUES (true, true);

-- Enable RLS for domain_settings
ALTER TABLE public.domain_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read domain settings
CREATE POLICY "Anyone can view domain settings"
ON public.domain_settings
FOR SELECT
USING (true);

-- Allow admins to update domain settings
CREATE POLICY "Admins can update domain settings"
ON public.domain_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update existing questions to have Sales domain by default
UPDATE public.assessment_questions SET domain = 'Sales';

-- Add sample CRM questions
INSERT INTO public.assessment_questions (stage, domain, question_text, description, hint, sort_order) VALUES
('scorecard', 'CRM', 'Customer Service Experience', 'Years of customer service or support experience', 'Look for direct customer-facing roles', 1),
('scorecard', 'CRM', 'Technical Aptitude', 'Ability to learn and use technical systems', 'Consider their comfort with technology', 2),
('scorecard', 'CRM', 'Communication Skills', 'Clarity in written and verbal communication', 'Essential for customer interactions', 3),
('scorecard', 'CRM', 'Problem-Solving Approach', 'How they handle customer issues', 'Look for structured thinking', 4),
('scorecard', 'CRM', 'Multitasking Ability', 'Can handle multiple customer cases simultaneously', 'Important for busy support environments', 5);

INSERT INTO public.assessment_questions (stage, domain, question_text, description, hint, sort_order) VALUES
('red_flags', 'CRM', 'Poor Customer Service Attitude', 'Shows impatience or dismissiveness toward customers', 'Critical red flag for CRM roles', 1),
('red_flags', 'CRM', 'Technology Aversion', 'Reluctance to learn new systems or tools', 'CRM requires constant system usage', 2),
('red_flags', 'CRM', 'Lack of Empathy', 'Cannot relate to customer frustrations', 'Essential for customer support', 3),
('red_flags', 'CRM', 'Poor Documentation Skills', 'Inadequate record-keeping abilities', 'Critical for case management', 4),
('red_flags', 'CRM', 'Conflict Avoidance', 'Avoids difficult customer conversations', 'Must handle challenging situations', 5);

INSERT INTO public.assessment_questions (stage, domain, category, question_text, description, sort_order) VALUES
('screening_calls', 'CRM', 'behavioral', 'Tell me about a time when you had to deal with an upset customer', 'Assess conflict resolution and empathy skills', 1),
('screening_calls', 'CRM', 'behavioral', 'How do you prioritize multiple customer requests?', 'Understand their organizational and priority management skills', 2),
('screening_calls', 'CRM', 'behavioral', 'Describe a situation where you had to learn a new system quickly', 'Assess adaptability and learning agility', 3),
('screening_calls', 'CRM', 'cultural', 'What motivates you in a customer service role?', 'Understand their passion for helping others', 4),
('screening_calls', 'CRM', 'cultural', 'How do you handle repetitive tasks?', 'Assess fit for routine CRM activities', 5);

-- Update trigger for domain_settings updated_at
CREATE TRIGGER update_domain_settings_updated_at 
    BEFORE UPDATE ON public.domain_settings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();