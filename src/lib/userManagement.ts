import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions to manage users in the database
 */

// Remove user by email
export const removeUserByEmail = async (email: string) => {
  try {
    console.log(`Attempting to remove user: ${email}`);
    
    // First, find the user in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    if (profile) {
      // Delete from profiles table
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('email', email);

      if (deleteProfileError) {
        throw deleteProfileError;
      }

      console.log(`✅ Removed profile for: ${email}`);
    }

    // Note: To remove from auth.users, you need admin privileges or RLS policies
    // This typically needs to be done via Supabase Dashboard or server-side admin client
    
    return { success: true, message: `User ${email} removed from profiles table` };
  } catch (error) {
    console.error('Error removing user:', error);
    return { success: false, error: error.message };
  }
};

// Remove user by ID
export const removeUserById = async (userId: string) => {
  try {
    console.log(`Attempting to remove user ID: ${userId}`);
    
    // Delete from profiles table
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      throw deleteProfileError;
    }

    console.log(`✅ Removed profile for user ID: ${userId}`);
    
    return { success: true, message: `User ${userId} removed from profiles table` };
  } catch (error) {
    console.error('Error removing user:', error);
    return { success: false, error: error.message };
  }
};

// List all users (for debugging)
export const listAllUsers = async () => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('All users in database:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.email} (${profile.full_name}) - ID: ${profile.id}`);
    });

    return { success: true, data: profiles };
  } catch (error) {
    console.error('Error listing users:', error);
    return { success: false, error: error.message };
  }
};

// Remove all test users (users with specific criteria)
export const removeTestUsers = async () => {
  try {
    // Remove users with test emails or incomplete profiles
    const { data: testUsers, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .or('email.ilike.%test%,email.ilike.%example%,full_name.is.null');

    if (selectError) throw selectError;

    if (testUsers && testUsers.length > 0) {
      const testUserIds = testUsers.map(user => user.id);
      
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .in('id', testUserIds);

      if (deleteError) throw deleteError;

      console.log(`✅ Removed ${testUsers.length} test users`);
      testUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.full_name})`);
      });
    }

    return { success: true, message: `Removed ${testUsers?.length || 0} test users` };
  } catch (error) {
    console.error('Error removing test users:', error);
    return { success: false, error: error.message };
  }
};

// Usage examples (run in browser console):
// await removeUserByEmail('test@example.com');
// await removeUserById('user-id-here');
// await listAllUsers();
// await removeTestUsers();