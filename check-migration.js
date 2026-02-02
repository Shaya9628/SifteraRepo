// Direct Migration Applier
// This will attempt to create the necessary tables/columns through direct SQL execution

import { supabase } from './src/integrations/supabase/client.js';

async function applyMigrationDirectly() {
  console.log('🔄 Attempting direct migration through RPC calls...');
  
  try {
    // Test 1: Try to check if domain_settings exists
    const { data: testData, error: testError } = await supabase
      .from('domain_settings')
      .select('count(*)')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Domain settings table already exists!');
      console.log('Migration appears to be already applied.');
      return true;
    }
    
    console.log('❌ Domain settings table missing:', testError.message);
    
    // If we reach here, the table doesn't exist
    console.log('\n📋 To fix this issue, please:');
    console.log('1. Go to: https://supabase.com/dashboard/project/jlviuwiwfavvygxvvspj/sql/new');
    console.log('2. Copy and paste the contents of MANUAL_MIGRATION.sql');
    console.log('3. Click "Run" to execute the migration');
    console.log('4. Refresh your application');
    
    console.log('\n🔧 Alternative: Run this in Supabase SQL Editor:');
    console.log(`
CREATE TABLE IF NOT EXISTS public.domain_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  allow_user_domain_change BOOLEAN NOT NULL DEFAULT true,
  allow_admin_domain_change BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.domain_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view domain settings" ON public.domain_settings FOR SELECT USING (true);

INSERT INTO public.domain_settings (allow_user_domain_change, allow_admin_domain_change) 
SELECT true, true WHERE NOT EXISTS (SELECT 1 FROM public.domain_settings);
`);

    return false;
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    return false;
  }
}

// Run the check
applyMigrationDirectly()
  .then(success => {
    if (success) {
      console.log('\n🎉 Migration is complete! Refresh your app to see the changes.');
    } else {
      console.log('\n⚠️  Manual migration required. Please follow the instructions above.');
    }
  })
  .catch(console.error);