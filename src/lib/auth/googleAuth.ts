import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to check for missing required profile fields
 */
export const checkMissingFields = (profile: any): string[] => {
  const requiredFields = [
    { field: 'selected_domain', label: 'Domain/Industry' },
  ];

  return requiredFields
    .filter(({ field }) => !profile[field] || profile[field].trim() === '')
    .map(({ label }) => label);
};

/**
 * Update or create user profile after OAuth sign-in
 */
export const updateProfileAfterOAuth = async (userId: string, userMetadata: {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}) => {
  if (!userId) return { success: false, error: 'No user ID provided' };
  
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Prepare update data - only update if values don't exist
    const updateData: any = {
      id: userId,
      updated_at: new Date().toISOString(),
    };

    if (!existingProfile?.full_name && userMetadata.full_name) {
      updateData.full_name = userMetadata.full_name;
    }
    if (!existingProfile?.email && userMetadata.email) {
      updateData.email = userMetadata.email;
    }
    if (!existingProfile?.avatar_url && userMetadata.avatar_url) {
      updateData.avatar_url = userMetadata.avatar_url;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(updateData, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Profile update error:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('OAuth profile update error:', error);
    return { success: false, error };
  }
};

/**
 * Check if user profile is complete for dashboard access
 */
export const isProfileComplete = async (userId: string): Promise<{
  complete: boolean;
  missingFields: string[];
  profile: any;
}> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return { complete: false, missingFields: ['Profile'], profile: null };
    }

    const missingFields = checkMissingFields(profile);
    
    return {
      complete: missingFields.length === 0,
      missingFields,
      profile
    };
  } catch (error) {
    console.error('Profile check error:', error);
    return { complete: false, missingFields: ['Profile'], profile: null };
  }
};
