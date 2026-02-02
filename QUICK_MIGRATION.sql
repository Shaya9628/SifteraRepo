-- MINIMAL DOMAIN MIGRATION
-- Copy this entire block and paste into Supabase Dashboard > SQL Editor > Run

-- Step 1: Create domain_settings table
CREATE TABLE IF NOT EXISTS public.domain_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  allow_user_domain_change BOOLEAN NOT NULL DEFAULT true,
  allow_admin_domain_change BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Step 2: Enable security
ALTER TABLE public.domain_settings ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies
CREATE POLICY "Anyone can view domain settings" ON public.domain_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update domain settings" ON public.domain_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 4: Insert default settings
INSERT INTO public.domain_settings (allow_user_domain_change, allow_admin_domain_change) 
SELECT true, true 
WHERE NOT EXISTS (SELECT 1 FROM public.domain_settings);

-- Step 5: Add domain column to assessment_questions (if not exists)
ALTER TABLE public.assessment_questions ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'Sales';

-- Step 6: Add domain column to users (if not exists) 
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'Sales';

-- DONE! Refresh your app after running this.