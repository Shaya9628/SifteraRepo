import { supabase } from '@/integrations/supabase/client';
import { jwtDecode } from 'jwt-decode';

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

export const handleGoogleSuccess = async (credentialResponse: any) => {
  try {
    if (!credentialResponse?.credential) {
      throw new Error('No credential received from Google');
    }

    // Decode the JWT token to get user information
    const decoded = jwtDecode<GoogleUser>(credentialResponse.credential);
    console.log('Google User Info:', decoded);

    // First try Supabase's native Google OAuth
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credentialResponse.credential,
    });

    if (error) {
      console.log('Supabase native OAuth failed, handling manually:', error.message);
      
      // Check if user exists in profiles table
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', decoded.email)
        .single();

      if (existingProfile) {
        // User exists - update their profile with latest Google info
        console.log('Existing user found, updating profile and signing in');
        
        await handleGoogleCallback({
          full_name: decoded.name,
          email: decoded.email,
          picture: decoded.picture,
          sub: existingProfile.id,
        });
        
        // Check for missing required fields
        const missingFields = checkMissingFields(existingProfile);
        
        // Try to sign in the existing user using a password reset approach
        // Since we can't know their original password, we'll create a temporary session
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        
        if (signInError) {
          console.error('Failed to create session for existing user:', signInError);
          // Fallback: direct them to regular login but with clear instructions
          return { 
            data: null, 
            error: new Error(`Account found! Please complete your sign-in using your email/password, or reset your password if needed.`),
            existingUser: true,
            userEmail: decoded.email
          };
        }
        
        if (missingFields.length > 0) {
          // User exists but missing details - ask for details then proceed to dashboard
          return { 
            data: { 
              user: existingProfile,
              requiresProfileCompletion: true,
              missingFields: missingFields,
              isExistingUser: true
            }, 
            error: null,
            message: 'Welcome back! Please complete your profile to continue.'
          };
        } else {
          // User exists and details are complete - proceed directly to dashboard
          return { 
            data: { 
              user: existingProfile,
              requiresProfileCompletion: false,
              isExistingUser: true
            }, 
            error: null,
            message: 'Welcome back! Signing you in...'
          };
        }
      } else {
        // User doesn't exist - create new user and ask for details
        console.log('New user detected, creating account');
        
        const randomPassword = generateSecurePassword();
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: decoded.email,
          password: randomPassword,
          options: {
            data: {
              full_name: decoded.name,
              avatar_url: decoded.picture,
              provider: 'google',
              google_id: decoded.sub,
              email_verified: true,
            }
          }
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          
          if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
            // This means user exists in auth but not in profiles - handle as existing user
            return { 
              data: null, 
              error: new Error(`Account found! Please use your regular email/password login, or reset your password if needed.`),
              existingUser: true,
              userEmail: decoded.email
            };
          }
          
          throw new Error(`Failed to create account: ${signUpError.message}`);
        }

        // Create profile with Google data
        if (signUpData.user) {
          await handleGoogleCallback({
            full_name: decoded.name,
            email: decoded.email,
            picture: decoded.picture,
            sub: signUpData.user.id,
          });

          // New users need to complete required fields
          const requiredFields = ['domain'];
          
          return { 
            data: { 
              user: {
                ...signUpData.user,
                // Preserve Google data for profile completion
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture,
              },
              requiresProfileCompletion: true,
              missingFields: requiredFields,
              isNewUser: true,
              googleUserData: {
                fullName: decoded.name,
                email: decoded.email,
                avatarUrl: decoded.picture
              }
            }, 
            error: null,
            message: 'Account created! Please complete your profile to get started.'
          };
        }

        return { data: signUpData, error: null };
      }
    }

    // If Supabase native OAuth succeeded
    if (data.user) {
      await handleGoogleCallback({
        full_name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        sub: data.user.id,
      });

      // Check if profile needs completion
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const missingFields = userProfile ? checkMissingFields(userProfile) : ['domain'];
      
      if (missingFields.length > 0) {
        return { 
          data: { 
            ...data,
            requiresProfileCompletion: true,
            missingFields: missingFields,
            isExistingUser: !!userProfile,
            googleUserData: {
              fullName: decoded.name,
              email: decoded.email,
              avatarUrl: decoded.picture
            }
          }, 
          error: null,
          message: userProfile ? 'Welcome back! Please complete your profile.' : 'Welcome! Please complete your profile to get started.'
        };
      } else {
        // Profile is complete - proceed to dashboard
        return { 
          data: { 
            ...data,
            requiresProfileCompletion: false,
            isExistingUser: true
          }, 
          error: null,
          message: 'Welcome back!'
        };
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { data: null, error };
  }
};

// Helper function to generate a secure password
const generateSecurePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Helper function to check for missing required fields
const checkMissingFields = (profile: any): string[] => {
  const requiredFields = [
    { field: 'domain', label: 'Domain/Industry' },
    { field: 'phone', label: 'Phone Number' },
    // Add other required fields as needed
  ];

  return requiredFields
    .filter(({ field }) => !profile[field] || profile[field].trim() === '')
    .map(({ label }) => label);
};

export const handleGoogleError = () => {
  console.error('Google sign-in failed');
  return { data: null, error: 'Google sign-in failed' };
};

export const handleGoogleCallback = async (userMetadata: any) => {
  if (!userMetadata) return;
  
  try {
    // Extract user info from Google
    const { full_name, email, picture, sub } = userMetadata;
    
    // Update or insert profile with Google data
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: sub,
        full_name: full_name || email?.split('@')[0] || 'User',
        email,
        avatar_url: picture,
        updated_at: new Date().toISOString(),
        // Don't overwrite existing domain and phone if they exist
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
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