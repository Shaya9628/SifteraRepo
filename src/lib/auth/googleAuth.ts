import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

export const signInWithGoogle = async () => {
  try {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}/dashboard`,
    });

    if (result?.error) throw result.error;

    return { data: result, error: null };
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