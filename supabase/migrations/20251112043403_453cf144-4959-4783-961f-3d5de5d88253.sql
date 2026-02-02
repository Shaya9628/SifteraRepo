-- Add is_pool_resume column to resumes table
ALTER TABLE public.resumes 
ADD COLUMN is_pool_resume boolean DEFAULT false;

-- Add last_pool_resume_index to profiles table to track round-robin
ALTER TABLE public.profiles 
ADD COLUMN last_pool_resume_index integer DEFAULT 0;

-- Create index for efficient pool resume queries
CREATE INDEX idx_resumes_pool ON public.resumes(is_pool_resume, domain) 
WHERE is_pool_resume = true;