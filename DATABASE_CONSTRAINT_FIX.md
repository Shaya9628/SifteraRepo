# Database Constraint Fix Required

## Issue
The "Failed to save your setup" error is caused by a database constraint that only allows 'sales' and 'crm' values in the `profiles.selected_domain` column, but the app now supports 20+ domains.

## Solution
Run this SQL command in your Supabase SQL Editor (https://supabase.com/dashboard/project/jlviuwiwfavvygxvvspj/sql):

```sql
-- Fix profiles table domain constraint to support all global domains
-- This migration fixes the "Failed to save your setup" error by allowing all 20+ domains

-- Drop the restrictive CHECK constraint on profiles.selected_domain
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_selected_domain_check;

-- Add new CHECK constraint supporting all global domains
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_selected_domain_check 
CHECK (selected_domain IN (
  'sales', 'crm', 'marketing', 'finance', 'hr', 'it', 'operations', 
  'healthcare', 'education', 'engineering', 'consulting', 'retail', 
  'manufacturing', 'legal', 'hospitality', 'logistics', 'real_estate', 
  'media', 'nonprofit', 'general'
));

-- Also fix the resumes table domain constraint
ALTER TABLE public.resumes 
DROP CONSTRAINT IF EXISTS resumes_domain_check;

ALTER TABLE public.resumes 
ADD CONSTRAINT resumes_domain_check 
CHECK (domain IN (
  'sales', 'crm', 'marketing', 'finance', 'hr', 'it', 'operations', 
  'healthcare', 'education', 'engineering', 'consulting', 'retail', 
  'manufacturing', 'legal', 'hospitality', 'logistics', 'real_estate', 
  'media', 'nonprofit', 'general'
));
```

## Temporary Fix Applied
The ProfileSelection.tsx has been updated to:
1. Always save domain selections to localStorage (which works)
2. Handle database constraint errors gracefully  
3. Allow users to proceed even if database save fails
4. Provide clear messaging about what's happening

## How to Apply Database Fix
1. Go to: https://supabase.com/dashboard/project/jlviuwiwfavvygxvvspj/sql
2. Copy and paste the SQL command above
3. Click "Run"
4. The constraint error will be resolved permanently

## Testing
After applying the database fix, domain selection should work perfectly for all 20+ domains without any "Failed to save your setup" errors.