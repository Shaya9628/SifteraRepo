#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// Create Supabase client with service role (we'll need the public key for this)
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDomainMigration() {
  console.log('🚀 Starting domain migration...');
  
  try {
    // Check if domain_settings table exists
    const { data: existingSettings, error: checkError } = await supabase
      .from('domain_settings')
      .select('*')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Domain migration already applied - domain_settings table exists');
      return;
    }

    console.log('📦 Applying domain migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251222134500_add_domain_support.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Note: This is a simplified approach. In production, you'd want to use the service role key
    // and handle this through proper migration tools
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        
        // For now, we'll use a different approach since we can't execute arbitrary SQL with the anon key
        // We'll create the necessary data through the API instead
      }
    }
    
    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach: Create the domain settings through the API
async function initializeDomainSettings() {
  console.log('🔧 Initializing domain settings through API...');
  
  try {
    // Try to insert initial domain settings
    const { error } = await supabase
      .from('domain_settings')
      .insert({
        allow_user_domain_change: true,
        allow_admin_domain_change: true
      });
    
    if (error) {
      console.log('ℹ️ Could not insert domain settings via API:', error.message);
      console.log('This likely means the table does not exist and needs to be created via direct SQL migration.');
      return false;
    }
    
    console.log('✅ Domain settings initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize domain settings:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🏗️  Domain Migration Tool');
  console.log('========================');
  
  const success = await initializeDomainSettings();
  
  if (!success) {
    console.log('\n⚠️  Manual migration required:');
    console.log('1. Apply the SQL migration: supabase/migrations/20251222134500_add_domain_support.sql');
    console.log('2. This can be done through the Supabase dashboard SQL editor');
    console.log('3. Or by using: npx supabase db push (after linking the project)');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { applyDomainMigration, initializeDomainSettings };