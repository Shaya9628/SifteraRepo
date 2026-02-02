-- Add global domains to the domain_type enum
DO $$ 
BEGIN
    -- Check if the domain_type enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'domain_type') THEN
        -- Add new domain values if they don't exist
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'marketing';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'finance';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'hr';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'it';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'operations';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'healthcare';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'education';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'engineering';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'consulting';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'retail';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'manufacturing';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'legal';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'hospitality';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'logistics';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'real_estate';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'media';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'nonprofit';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'general';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    ELSE
        -- Create the domain_type enum if it doesn't exist
        CREATE TYPE domain_type AS ENUM (
            'sales', 'crm', 'marketing', 'finance', 'hr', 'it', 
            'operations', 'healthcare', 'education', 'engineering',
            'consulting', 'retail', 'manufacturing', 'legal', 
            'hospitality', 'logistics', 'real_estate', 'media', 
            'nonprofit', 'general'
        );
    END IF;
END $$;

-- Add domain column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domain domain_type;

-- Add phone column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Update existing profiles with default domain if they don't have one
UPDATE profiles 
SET domain = 'general' 
WHERE domain IS NULL;

-- Add global domain configurations to ai_training_configs if table exists
INSERT INTO ai_training_configs (domain, configuration_name, prompt_template, scoring_criteria) 
VALUES 
  ('marketing', 'Marketing Assessment', 'Analyze this resume for marketing roles focusing on campaign management, digital marketing skills, creative abilities, and data analysis capabilities.', '{"creativity": 25, "digital_skills": 25, "analytics": 25, "communication": 25}'),
  ('finance', 'Finance Assessment', 'Evaluate this resume for finance positions focusing on analytical skills, regulatory knowledge, financial modeling, and attention to detail.', '{"analytical_skills": 30, "technical_knowledge": 25, "attention_to_detail": 25, "regulatory_knowledge": 20}'),
  ('hr', 'Human Resources Assessment', 'Review this resume for HR roles focusing on people management, communication skills, policy knowledge, and employee relations.', '{"people_skills": 30, "communication": 25, "policy_knowledge": 25, "problem_solving": 20}'),
  ('it', 'IT Assessment', 'Review this resume for IT roles focusing on technical skills, problem-solving abilities, system knowledge, and learning agility.', '{"technical_skills": 40, "problem_solving": 25, "system_knowledge": 20, "learning_ability": 15}'),
  ('operations', 'Operations Assessment', 'Analyze this resume for operations roles focusing on process improvement, project management, efficiency optimization, and team leadership.', '{"process_improvement": 30, "project_management": 25, "leadership": 25, "analytical_thinking": 20}'),
  ('healthcare', 'Healthcare Assessment', 'Evaluate this resume for healthcare positions focusing on medical knowledge, patient care, compliance, and teamwork.', '{"medical_knowledge": 35, "patient_care": 25, "compliance": 20, "teamwork": 20}'),
  ('education', 'Education Assessment', 'Review this resume for education roles focusing on teaching skills, curriculum development, student engagement, and learning outcomes.', '{"teaching_skills": 30, "curriculum_knowledge": 25, "student_engagement": 25, "assessment_skills": 20}'),
  ('engineering', 'Engineering Assessment', 'Analyze this resume for engineering positions focusing on technical expertise, problem-solving, innovation, and project execution.', '{"technical_expertise": 35, "problem_solving": 25, "innovation": 20, "project_execution": 20}'),
  ('consulting', 'Consulting Assessment', 'Evaluate this resume for consulting roles focusing on analytical thinking, client management, communication, and industry expertise.', '{"analytical_thinking": 30, "client_management": 25, "communication": 25, "industry_expertise": 20}'),
  ('retail', 'Retail Assessment', 'Review this resume for retail positions focusing on customer service, sales skills, inventory management, and team collaboration.', '{"customer_service": 30, "sales_skills": 25, "operations_knowledge": 25, "teamwork": 20}'),
  ('general', 'General Assessment', 'Analyze this resume with a broad perspective focusing on core professional skills, adaptability, communication, and overall competency.', '{"core_skills": 25, "adaptability": 25, "communication": 25, "competency": 25}')
ON CONFLICT (domain, configuration_name) DO NOTHING;

-- Create index on domain column for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_domain ON profiles (domain);