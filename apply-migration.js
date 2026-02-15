// Apply database migration to add position-based columns
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jlviuwiwfavvygxvvspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsdml1d2l3ZmF2dnlneHZ2c3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzg4OTcsImV4cCI6MjA3NTM1NDg5N30.KPrDDG9Laj_SU6PIRciHRwqxc4TSGA6RMsNvkh904Zw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Applying database migration for position-based assessment...\n');

  const migrationSQL = `
-- Add position-based assessment columns to resumes table
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS seniority_level TEXT;

-- Add constraints for seniority levels
ALTER TABLE public.resumes 
ADD CONSTRAINT IF NOT EXISTS resumes_seniority_level_check 
CHECK (seniority_level IN ('entry', 'mid', 'senior', 'lead', 'director', 'executive'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_position ON public.resumes(position);
CREATE INDEX IF NOT EXISTS idx_resumes_seniority_level ON public.resumes(seniority_level);

-- Update existing records (if any) with default values
UPDATE public.resumes 
SET 
  position = CASE 
    WHEN department = 'sales' THEN 'Sales Representative'
    WHEN department = 'marketing' THEN 'Marketing Specialist' 
    WHEN department = 'hr' THEN 'HR Coordinator'
    WHEN department = 'finance' THEN 'Financial Analyst'
    WHEN department = 'it' THEN 'Software Developer'
    WHEN department = 'operations' THEN 'Operations Coordinator'
    WHEN department = 'crm' THEN 'Customer Success Manager'
    ELSE 'Professional'
  END,
  seniority_level = 'mid'
WHERE position IS NULL;
`;

  console.log('📋 Migration SQL to execute:');
  console.log('=' .repeat(80));
  console.log(migrationSQL);
  console.log('=' .repeat(80));

  console.log('\n🔧 Applying migration using Supabase SQL Editor...');
  console.log('1. Open: https://supabase.com/dashboard/project/jlviuwiwfavvygxvvspj/sql');
  console.log('2. Copy the SQL above and paste it into the SQL Editor');
  console.log('3. Click "Run" to execute the migration');
  
  // Try to verify if we can test the connection while providing instructions
  try {
    console.log('\n🔍 Testing current schema before migration...');
    const { data: beforeTest, error: beforeError } = await supabase
      .from('resumes')
      .select('id,candidate_name,position,seniority_level')
      .limit(1);
    
    if (beforeError && beforeError.message?.includes('position')) {
      console.log('✅ Confirmed: position column does not exist (expected before migration)');
    } else if (!beforeError) {
      console.log('🎉 Migration might already be applied - position column exists!');
      return;
    }
    
    console.log('\n⏳ Waiting 10 seconds for you to apply the migration...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test after migration
    console.log('\n🔍 Testing schema after migration...');
    const { data: afterTest, error: afterError } = await supabase
      .from('resumes')
      .select('id,candidate_name,position,seniority_level,uploaded_at,status')
      .limit(1);
    
    if (!afterError) {
      console.log('🎉 SUCCESS! Migration applied successfully!');
      console.log('✅ Position and seniority_level columns are now available');
      console.log('✅ Resume upload will now work with position-based assessment');
    } else {
      console.log('❌ Migration not yet applied. Please run the SQL in Supabase Dashboard.');
      console.log('Error:', afterError.message);
    }
    
  } catch (error) {
    console.log('💥 Error during verification:', error.message);
  }
}

applyMigration();