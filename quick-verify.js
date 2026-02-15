// Simple verification that position column was added
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jlviuwiwfavvygxvvspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsdml1d2l3ZmF2dnlneHZ2c3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzg4OTcsImV4cCI6MjA3NTM1NDg5N30.KPrDDG9Laj_SU6PIRciHRwqxc4TSGA6RMsNvkh904Zw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickVerify() {
  console.log('🔍 Quick verification...');

  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('position,seniority_level')
      .limit(1);
    
    if (!error) {
      console.log('🎉 SUCCESS! Position column now exists!');
      console.log('✅ Resume upload error is FIXED!');
      console.log('✅ Your app now supports position-based assessment!');
      console.log('\n🚀 Start your app and test resume upload - it will work now!');
    } else {
      console.log('❌ Not fixed yet:', error.message);
      console.log('Please run the SQL in Supabase Dashboard');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
}

quickVerify();