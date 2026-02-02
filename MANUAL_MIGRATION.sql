-- Domain Support Migration
-- Copy and paste this SQL into the Supabase Dashboard > SQL Editor to apply the domain migration

-- 1. Add domain column to assessment_questions table
ALTER TABLE public.assessment_questions 
ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'Sales' 
CHECK (domain IN ('Sales', 'CRM'));

-- 2. Add domain to users table for user domain preference  
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'Sales' 
CHECK (domain IN ('Sales', 'CRM'));

-- 3. Create domain_settings table for admin controls
CREATE TABLE IF NOT EXISTS public.domain_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  allow_user_domain_change BOOLEAN NOT NULL DEFAULT true,
  allow_admin_domain_change BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Insert default settings (only if table is empty)
INSERT INTO public.domain_settings (allow_user_domain_change, allow_admin_domain_change) 
SELECT true, true
WHERE NOT EXISTS (SELECT 1 FROM public.domain_settings);

-- 5. Enable RLS for domain_settings
ALTER TABLE public.domain_settings ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view domain settings" ON public.domain_settings;
DROP POLICY IF EXISTS "Admins can update domain settings" ON public.domain_settings;

-- 7. Create policies for domain_settings
CREATE POLICY "Anyone can view domain settings"
ON public.domain_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can update domain settings"  
ON public.domain_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Update existing questions to have Sales domain by default
UPDATE public.assessment_questions SET domain = 'Sales' 
WHERE domain IS NULL;

-- 9. Add sample CRM questions (only if they don't exist)
INSERT INTO public.assessment_questions (stage, domain, question_text, description, hint, sort_order)
SELECT * FROM (
  VALUES
    ('scorecard', 'CRM', 'Customer Service Experience', 'Years of customer service or support experience', 'Look for direct customer-facing roles', 1),
    ('scorecard', 'CRM', 'Technical Aptitude', 'Ability to learn and use technical systems', 'Consider their comfort with technology', 2),
    ('scorecard', 'CRM', 'Communication Skills', 'Clarity in written and verbal communication', 'Essential for customer interactions', 3),
    ('scorecard', 'CRM', 'Problem-Solving Approach', 'How they handle customer issues', 'Look for structured thinking', 4),
    ('scorecard', 'CRM', 'Multitasking Ability', 'Can handle multiple customer cases simultaneously', 'Important for busy support environments', 5)
) AS new_questions(stage, domain, question_text, description, hint, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.assessment_questions 
  WHERE domain = 'CRM' AND stage = 'scorecard'
);

INSERT INTO public.assessment_questions (stage, domain, question_text, description, hint, sort_order)
SELECT * FROM (
  VALUES
    ('red_flags', 'CRM', 'Poor Customer Service Attitude', 'Shows impatience or dismissiveness toward customers', 'Critical red flag for CRM roles', 1),
    ('red_flags', 'CRM', 'Technology Aversion', 'Reluctance to learn new systems or tools', 'CRM requires constant system usage', 2),
    ('red_flags', 'CRM', 'Lack of Empathy', 'Cannot relate to customer frustrations', 'Essential for customer support', 3),
    ('red_flags', 'CRM', 'Poor Documentation Skills', 'Inadequate record-keeping abilities', 'Critical for case management', 4),
    ('red_flags', 'CRM', 'Conflict Avoidance', 'Avoids difficult customer conversations', 'Must handle challenging situations', 5)
) AS new_questions(stage, domain, question_text, description, hint, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.assessment_questions 
  WHERE domain = 'CRM' AND stage = 'red_flags'
);

INSERT INTO public.assessment_questions (stage, domain, category, question_text, description, sort_order)
SELECT * FROM (
  VALUES
    ('screening_calls', 'CRM', 'behavioral', 'Tell me about a time when you had to deal with an upset customer', 'Assess conflict resolution and empathy skills', 1),
    ('screening_calls', 'CRM', 'behavioral', 'How do you prioritize multiple customer requests?', 'Understand their organizational and priority management skills', 2),
    ('screening_calls', 'CRM', 'behavioral', 'Describe a situation where you had to learn a new system quickly', 'Assess adaptability and learning agility', 3),
    ('screening_calls', 'CRM', 'cultural', 'What motivates you in a customer service role?', 'Understand their passion for helping others', 4),
    ('screening_calls', 'CRM', 'cultural', 'How do you handle repetitive tasks?', 'Assess fit for routine CRM activities', 5)
) AS new_questions(stage, domain, category, question_text, description, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.assessment_questions 
  WHERE domain = 'CRM' AND stage = 'screening_calls'
);

-- 10. Create trigger for domain_settings updated_at (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_domain_settings_updated_at') THEN
    CREATE TRIGGER update_domain_settings_updated_at 
      BEFORE UPDATE ON public.domain_settings 
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

-- Migration complete!
-- You can now refresh your application and the domain features should work properly.