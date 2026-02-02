# Domain Migration Instructions

## Issues Fixed

### 1. Question Management Not Displaying Questions
**Problem**: Admin Question section was using mock data instead of fetching from database.
**Solution**: Updated `fetchQuestions()` function in `QuestionManagement.tsx` to properly query the database.

### 2. Domain Settings "Migration Required" Warning
**Problem**: Domain settings table doesn't exist in database.
**Solution**: Database migration needs to be applied.

## How to Apply Domain Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard: https://jlviuwiwfavvygxvvspj.supabase.co
2. Navigate to SQL Editor
3. Copy and paste the contents of `MANUAL_MIGRATION.sql`
4. Click "Run" to execute the migration
5. Refresh your application

### Option 2: Using Supabase CLI (if you have access)
```bash
# Link your project (requires Supabase account access)
npx supabase login
npx supabase link --project-ref jlviuwiwfavvygxvvspj

# Push the migration
npx supabase db push
```

## What the Migration Does

The migration adds:
- `domain` column to `assessment_questions` table (Sales/CRM support)
- `domain` column to `users` table (user domain preference)
- `domain_settings` table (admin controls for domain switching)
- Sample CRM questions for all assessment stages
- Proper RLS policies for security

## Verifying the Fix

After applying the migration:

1. **Question Management**: 
   - Go to Admin → Questions
   - You should see existing questions grouped by domain (Sales/CRM)
   - You can switch between domains using the domain selector
   - Add/Edit/Delete functions should work properly

2. **Domain Settings**:
   - Go to Admin → Settings  
   - The "Migration Required" warning should disappear
   - You can toggle domain switching permissions
   - Settings save properly to database

## Files Modified

- `src/components/QuestionManagement.tsx` - Fixed database query
- `src/components/DomainSettingsPreview.tsx` - Added proper database integration
- `src/pages/Profile.tsx` - Updated domain settings loading
- `MANUAL_MIGRATION.sql` - Migration SQL for manual execution

## Notes

- All existing questions will be automatically assigned to "Sales" domain
- Users will default to "Sales" domain until they change it
- Admins can manage questions for both domains regardless of their personal domain setting
- No existing data or functionality is broken by this migration