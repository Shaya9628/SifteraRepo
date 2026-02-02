-- Create table for AI training configurations
CREATE TABLE public.ai_training_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Required experience
  min_experience_years integer DEFAULT 0,
  preferred_backgrounds text[] DEFAULT '{}',
  
  -- Must-have skills
  required_skills text[] DEFAULT '{}',
  skill_weightage integer DEFAULT 20,
  
  -- Communication indicators
  communication_indicators text[] DEFAULT '{}',
  communication_weightage integer DEFAULT 15,
  
  -- Preferred industries/roles
  preferred_industries text[] DEFAULT '{}',
  preferred_roles text[] DEFAULT '{}',
  
  -- Achievement indicators
  achievement_indicators text[] DEFAULT '{}',
  achievement_weightage integer DEFAULT 20,
  
  -- Red flags
  red_flags text[] DEFAULT '{}',
  
  -- Custom keywords
  positive_keywords text[] DEFAULT '{}',
  negative_keywords text[] DEFAULT '{}',
  
  -- Domain-specific fields (for CRM)
  crm_tools text[] DEFAULT '{}',
  ticketing_experience_required boolean DEFAULT false,
  customer_interaction_depth text DEFAULT 'medium',
  conflict_handling_importance integer DEFAULT 50,
  
  -- Behavioral traits
  required_behavioral_traits text[] DEFAULT '{}',
  
  -- Weightage model
  experience_weightage integer DEFAULT 20,
  progression_weightage integer DEFAULT 15,
  cultural_fit_weightage integer DEFAULT 10,
  
  -- Overall notes
  evaluation_notes text DEFAULT ''
);

-- Enable RLS
ALTER TABLE public.ai_training_configs ENABLE ROW LEVEL SECURITY;

-- Admins can view all configs
CREATE POLICY "Admins can view all training configs"
ON public.ai_training_configs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert configs
CREATE POLICY "Admins can insert training configs"
ON public.ai_training_configs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update configs
CREATE POLICY "Admins can update training configs"
ON public.ai_training_configs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete configs
CREATE POLICY "Admins can delete training configs"
ON public.ai_training_configs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default Sales and CRM configurations
INSERT INTO public.ai_training_configs (domain, required_skills, communication_indicators, achievement_indicators, red_flags, positive_keywords, required_behavioral_traits)
VALUES 
  ('Sales', 
   ARRAY['negotiation', 'lead generation', 'closing deals', 'CRM proficiency', 'pipeline management'],
   ARRAY['persuasion', 'active listening', 'objection handling', 'presentation skills'],
   ARRAY['revenue targets met', 'quota achievement', 'client retention', 'deal closures'],
   ARRAY['frequent job changes', 'no quantifiable achievements', 'gaps in employment'],
   ARRAY['target', 'revenue', 'growth', 'client acquisition', 'upselling'],
   ARRAY['self-motivated', 'resilient', 'competitive', 'goal-oriented']
  ),
  ('CRM',
   ARRAY['Freshdesk', 'Zendesk', 'Salesforce', 'ticketing systems', 'customer support'],
   ARRAY['empathy', 'patience', 'clarity', 'professional tone'],
   ARRAY['customer satisfaction scores', 'resolution time', 'first-contact resolution'],
   ARRAY['poor documentation skills', 'lack of customer-facing experience', 'no conflict resolution examples'],
   ARRAY['customer satisfaction', 'SLA', 'escalation handling', 'knowledge base'],
   ARRAY['patient', 'detail-oriented', 'empathetic', 'solution-focused']
  );

-- Create a global settings table for the training toggle
CREATE TABLE public.ai_training_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apply_training_rules boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_training_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view settings
CREATE POLICY "Admins can view training settings"
ON public.ai_training_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update settings
CREATE POLICY "Admins can update training settings"
ON public.ai_training_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert settings
CREATE POLICY "Admins can insert training settings"
ON public.ai_training_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can read settings (for edge function)
CREATE POLICY "Public can read training settings"
ON public.ai_training_settings
FOR SELECT
USING (true);

-- Public can read training configs (for edge function)
CREATE POLICY "Public can read training configs"
ON public.ai_training_configs
FOR SELECT
USING (true);

-- Insert default settings
INSERT INTO public.ai_training_settings (apply_training_rules) VALUES (true);