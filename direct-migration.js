// Direct database migration using service role key
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations
const supabaseUrl = 'https://jlviuwiwfavvygxvvspj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsdml1d2l3ZmF2dnlneHZ2c3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc3ODg5NywiZXhwIjoyMDc1MzU0ODk3fQ.N_6_1c__S7mPnw_ZMmJd2GQ2nLZFf7gZhHc3SBHaHKQ'; // Service role key has admin privileges

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeMigration() {
  console.log('🚀 Executing database migration with admin privileges...\n');

  try {
    // Direct SQL execution using pg_query
    const migrationQueries = [
      'ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS position TEXT',
      'ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS seniority_level TEXT',
      `ALTER TABLE public.resumes 
       ADD CONSTRAINT IF NOT EXISTS resumes_seniority_level_check 
       CHECK (seniority_level IN ('entry', 'mid', 'senior', 'lead', 'director', 'executive'))`,
      'CREATE INDEX IF NOT EXISTS idx_resumes_position ON public.resumes(position)',
      'CREATE INDEX IF NOT EXISTS idx_resumes_seniority_level ON public.resumes(seniority_level)'
    ];

    for (let i = 0; i < migrationQueries.length; i++) {
      const query = migrationQueries[i];
      console.log(`${i + 1}️⃣ Executing: ${query.substring(0, 50)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { query });
        if (error) {
          console.log(`⚠️ Query ${i + 1} failed:`, error.message);
        } else {
          console.log(`✅ Query ${i + 1} executed successfully`);
        }
      } catch (queryError) {
        console.log(`⚠️ Query ${i + 1} error:`, queryError.message);
      }
    }

    // Test the result
    console.log('\n🔍 Testing migration result...');
    const { data, error } = await supabase
      .from('resumes')
      .select('id,position,seniority_level')
      .limit(1);
    
    if (!error) {
      console.log('🎉 SUCCESS! Position column migration complete!');
      console.log('✅ Resume upload error is now fixed');
    } else {
      console.log('❌ Still having issues:', error.message);
      
      // Alternative approach: Try inserting a test record first
      console.log('\n🔧 Trying alternative approach...');
      console.log('Please manually execute this SQL in your Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/jlviuwiwfavvygxvvspj/sql');
      console.log('\n```sql');
      console.log('ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS position TEXT;');
      console.log('ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS seniority_level TEXT;');
      console.log('```');
    }

  } catch (error) {
    console.log('💥 Migration execution error:', error.message);
    console.log('\n📋 Manual SQL execution required:');
    console.log('1. Open: https://supabase.com/dashboard/project/jlviuwiwfavvygxvvspj/sql');
    console.log('2. Execute: ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS position TEXT;');
    console.log('3. Execute: ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS seniority_level TEXT;');
  }
}

executeMigration();