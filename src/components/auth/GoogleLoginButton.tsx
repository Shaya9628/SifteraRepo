import { GoogleLogin } from "@react-oauth/google";
import { handleGoogleSuccess, handleGoogleError } from "@/lib/auth/googleAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const GoogleLoginButton = ({ 
  onSuccess, 
  redirectTo = "/dashboard" 
}: GoogleLoginButtonProps) => {
  const navigate = useNavigate();

  const onGoogleSuccess = async (credentialResponse: any) => {
    const result = await handleGoogleSuccess(credentialResponse);
    
    if (result.error) {
      console.error('Google sign-in failed:', result.error);
      
      // Special handling for existing users who need regular login
      if (result.existingUser && result.userEmail) {
        toast.error(
          result.error.message,
          {
            duration: 8000,
            action: {
              label: 'Go to Login',
              onClick: () => {
                // Focus on email field and pre-fill it
                const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                if (emailInput) {
                  emailInput.value = result.userEmail;
                  emailInput.focus();
                }
              }
            }
          }
        );
        return;
      }
      
      toast.error(`Failed to sign in with Google: ${result.error.message || 'Unknown error'}`);
      return;
    }

    if (result.data?.requiresProfileCompletion) {
      // User needs to complete profile (existing user with missing details OR new user)
      const message = result.data.isNewUser 
        ? 'Welcome! Please complete your profile to get started.'
        : result.data.isExistingUser
        ? 'Welcome back! Please complete your missing profile details.'
        : 'Please complete your profile to continue.';
      
      toast.success(result.message || message);
      
      // Redirect to profile completion page with user data
// Use Google data from the auth response if available
        const userData = result.data.googleUserData || {
          fullName: result.data.isExistingUser 
            ? (result.data.user?.full_name || result.data.user?.name)
            : (result.data.user?.user_metadata?.full_name || result.data.user?.name),
          email: result.data.user?.email,
          avatarUrl: result.data.isExistingUser
            ? (result.data.user?.avatar_url || result.data.user?.picture)
            : (result.data.user?.user_metadata?.avatar_url || result.data.user?.picture)
        };

      if (onSuccess) {
        onSuccess();
      } else {
        // Check if we need profile completion vs domain selection
        const needsBasicInfo = result.data.missingFields?.includes('full_name') || 
                              result.data.missingFields?.includes('email') ||
                              result.data.missingFields?.includes('phone');
        
        const userData = result.data.isExistingUser 
          ? {
              fullName: result.data.user?.full_name,
              email: result.data.user?.email,
              avatarUrl: result.data.user?.avatar_url
            }
          : {
              fullName: result.data.user?.user_metadata?.full_name,
              email: result.data.user?.email,
              avatarUrl: result.data.user?.user_metadata?.avatar_url
            };

        if (needsBasicInfo) {
          // Go to profile completion for basic info
          navigate('/profile-completion', { 
            state: { 
              fromGoogleAuth: true,
              missingFields: result.data.missingFields,
              isNewUser: result.data.isNewUser,
              isExistingUser: result.data.isExistingUser,
              googleUserData: userData
            } 
          });
        } else {
          // Go to profile selection for domain selection
          navigate('/profile-selection', { 
            state: { 
              fromGoogleAuth: true,
              missingFields: result.data.missingFields,
              isNewUser: result.data.isNewUser,
              isExistingUser: result.data.isExistingUser,
              googleUserData: userData
            } 
          });
        }
      }
      return;
    }

    // User is complete and signed in successfully - proceed to dashboard
    toast.success(result.message || "Successfully signed in with Google!");
    
    if (onSuccess) {
      onSuccess();
    } else {
      navigate(redirectTo);
    }
  };

  const onGoogleError = () => {
    handleGoogleError();
    toast.error("Google sign-in was cancelled or failed");
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={onGoogleSuccess}
        onError={onGoogleError}
        useOneTap={false}
        width="100%"
        text="signin_with"
        shape="rectangular"
        size="large"
      />
    </div>
  );
};