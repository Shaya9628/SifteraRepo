// Debug script to test database schema and position column availability
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jlviuwiwfavvygxvvspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsdml1d2l3ZmF2dnlneHZ2c3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzg4OTcsImV4cCI6MjA3NTM1NDg5N30.KPrDDG9Laj_SU6PIRciHRwqxc4TSGA6RMsNvkh904Zw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSchema() {
  console.log('🔍 Testing database connection and resume schema...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      console.log('❌ Connection failed:', connectionError.message);
      return;
    } else {
      console.log('✅ Database connection successful');
    }

    // Test 2: Try modern schema with position column
    console.log('\n2️⃣ Testing modern schema (with position column)...');
    const { data: modernData, error: modernError } = await supabase
      .from('resumes')
      .select('id,candidate_name,position,seniority_level,uploaded_at,status')
      .limit(1);

    if (!modernError) {
      console.log('✅ Modern schema available - position column exists');
      if (modernData && modernData.length > 0) {
        console.log('📋 Sample modern data:', modernData[0]);
      } else {
        console.log('💡 Modern schema exists but no data found');
      }
    } else {
      console.log('❌ Modern schema failed:', modernError.message);
    }

    // Test 3: Try legacy schema with department column  
    console.log('\n3️⃣ Testing legacy schema (with department column)...');
    const { data: legacyData, error: legacyError } = await supabase
      .from('resumes') 
      .select('id,candidate_name,department,domain,uploaded_at,status')
      .limit(1);

    if (!legacyError) {
      console.log('✅ Legacy schema available - department column exists');
      if (legacyData && legacyData.length > 0) {
        console.log('📋 Sample legacy data:', legacyData[0]);
      } else {
        console.log('💡 Legacy schema exists but no data found');
      }
    } else {
      console.log('❌ Legacy schema failed:', legacyError.message);
    }

    // Test 4: Try basic schema with minimal columns
    console.log('\n4️⃣ Testing basic schema (minimal columns)...');
    const { data: basicData, error: basicError } = await supabase
      .from('resumes') 
      .select('id,candidate_name,uploaded_at,status')
      .limit(5);

    if (!basicError) {
      console.log('✅ Basic schema available');
      console.log(`📊 Found ${basicData?.length || 0} resume records in database`);
      if (basicData && basicData.length > 0) {
        console.log('📋 Sample basic data:', basicData[0]);
      }
    } else {
      console.log('❌ Basic schema failed:', basicError.message);
    }

    // Test 5: Check what columns actually exist
    console.log('\n5️⃣ Testing column introspection...');
    const { data: allData, error: allError } = await supabase
      .from('resumes')
      .select('*')
      .limit(1);

    if (!allError && allData && allData.length > 0) {
      console.log('✅ Available columns:', Object.keys(allData[0]));
    } else {
      console.log('❌ Could not introspect columns:', allError?.message || 'No data available');
    }

  } catch (error) {
    console.log('💥 Unexpected error:', error.message);
  }
}

testDatabaseSchema();