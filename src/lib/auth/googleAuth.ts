import { supabase } from '@/integrations/supabase/client';

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { data: null, error };
  }
};

export const handleGoogleCallback = async (userMetadata: any) => {
  if (!userMetadata) return;
  
  try {
    // Extract user info from Google
    const { full_name, email, picture, sub } = userMetadata;
    
    // Update profile with Google data
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: sub,
        full_name: full_name || email?.split('@')[0] || 'User',
        email,
        avatar_url: picture,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Profile update error:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Google callback error:', error);
    return { success: false, error };
  }
};