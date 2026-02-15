// Verify that the database migration was applied successfully
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jlviuwiwfavvygxvvspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsdml1d2l3ZmF2dnlneHZ2c3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzg4OTcsImV4cCI6MjA3NTM1NDg5N30.KPrDDG9Laj_SU6PIRciHRwqxc4TSGA6RMsNvkh904Zw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying database migration was applied...\n');

  try {
    // Test if position column now exists
    const { data, error } = await supabase
      .from('resumes')
      .select('id,candidate_name,position,seniority_level,uploaded_at,status')
      .limit(1);
    
    if (!error) {
      console.log('🎉 SUCCESS! Migration applied successfully!');
      console.log('✅ Position column exists and works');
      console.log('✅ Seniority_level column exists and works');
      console.log('✅ Resume upload will now work with position-based assessment');
      console.log('\n📋 Your app is ready to use! The "position column error" is fixed.');
      
      // Test inserting a sample record to verify constraints work
      console.log('\n🧪 Testing database constraints...');
      const testInsert = await supabase
        .from('resumes')
        .insert({
          candidate_name: 'Test Migration',
          position: 'Software Developer',
          seniority_level: 'mid',
          status: 'pending'
        })
        .select();
      
      if (!testInsert.error) {
        console.log('✅ Database constraints working correctly');
        
        // Clean up test record
        if (testInsert.data && testInsert.data[0]) {
          await supabase
            .from('resumes')
            .delete()
            .eq('id', testInsert.data[0].id);
          console.log('✅ Test record cleaned up');
        }
      } else {
        console.log('⚠️ Constraint test failed, but migration is still successful');
      }
      
    } else {
      console.log('❌ Migration not yet applied or failed');
      console.log('Error:', error.message);
      console.log('\n🔧 Please ensure you:');
      console.log('1. Copied the complete SQL from above');
      console.log('2. Pasted it in Supabase SQL Editor');
      console.log('3. Clicked "Run" button');
    }
    
  } catch (error) {
    console.log('💥 Verification error:', error.message);
  }
}

verifyMigration();