-- Quick Test: Check if domain migration is needed
-- Run this first to see what tables exist

SELECT 
  table_name, 
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('domain_settings', 'assessment_questions', 'users');

-- Check if domain column exists in assessment_questions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'assessment_questions' 
  AND column_name = 'domain';