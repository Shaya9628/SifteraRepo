import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DomainSelector } from '@/components/DomainSelector';
import { GLOBAL_DOMAINS, type Domain } from '@/lib/constants/domains';
import { ArrowLeft } from 'lucide-react';
const ProfileSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain>('general');
  
  // Get data from Google authentication
  const { 
    fromGoogleAuth, 
    isNewUser, 
    isExistingUser, 
    googleUserData 
  } = location.state || {};

  useEffect(() => {
    // If user already has a domain selected, redirect them directly to dashboard
    const checkExistingDomain = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('selected_domain')
          .eq('id', user.id)
          .single();
        
        if (profile?.selected_domain && profile.selected_domain !== 'general' && !fromGoogleAuth) {
          // User already has a domain set and this isn't from Google auth
          navigate('/dashboard');
        }
      }
    };
    
    checkExistingDomain();
  }, [user, navigate, fromGoogleAuth]);

  const handleDomainSelect = async () => {
    if (!user) {
      console.error('No user found');
      toast({
        title: 'Error',
        description: 'Please log in to continue.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    console.log('Updating domain for user:', user.id, 'Domain:', selectedDomain);
    setLoading(true);
    
    try {
      // First check if user profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (checkError) {
        console.error('Error checking profile:', checkError);
        
        // If profile doesn't exist, create it first
        if (checkError.code === 'PGRST116') {
          console.log('Creating new profile for user:', user.id);
          
          const newProfile: any = {
            id: user.id,
            email: user.email,
            selected_domain: selectedDomain,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Add Google data if available
          if (fromGoogleAuth && googleUserData) {
            if (googleUserData.fullName) newProfile.full_name = googleUserData.fullName;
            if (googleUserData.email) newProfile.email = googleUserData.email;
            if (googleUserData.avatarUrl) newProfile.avatar_url = googleUserData.avatarUrl;
          }

          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);

          if (insertError) throw insertError;
        } else {
          throw checkError;
        }
      } else {
        // Profile exists, update it
        console.log('Updating existing profile');
        
        const updateData: any = { 
          selected_domain: selectedDomain,
          updated_at: new Date().toISOString(),
        };

        // Add Google data if available
        if (fromGoogleAuth && googleUserData) {
          if (googleUserData.fullName) updateData.full_name = googleUserData.fullName;
          if (googleUserData.email) updateData.email = googleUserData.email;
          if (googleUserData.avatarUrl) updateData.avatar_url = googleUserData.avatarUrl;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      console.log('Domain update successful');
      const selectedDomainInfo = GLOBAL_DOMAINS.find(d => d.value === selectedDomain);
      
      toast({
        title: 'Domain Updated! 🎉',
        description: fromGoogleAuth && isNewUser 
          ? `Welcome! You've selected ${selectedDomainInfo?.label}. Let's get started!`
          : `You've selected ${selectedDomainInfo?.label}. Let's start building your confidence!`,
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error updating domain:', error);
      
      let errorMessage = 'Failed to update domain. Please try again.';
      
      // Provide specific error messages
      if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please try logging out and back in.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === '23505') {
        errorMessage = 'Profile conflict. Please refresh and try again.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    console.log('Skipping domain selection');
    
    // Just navigate to dashboard without any domain update
    navigate('/dashboard');
    
    toast({
      title: 'Welcome to Siftera!',
      description: 'You can update your domain anytime in profile settings.',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {fromGoogleAuth && isNewUser 
              ? 'Welcome! Choose Your Assessment Domain'
              : 'Choose Your Assessment Domain'
            }
          </h1>
          <p className="text-muted-foreground">
            {fromGoogleAuth && isNewUser
              ? 'Great! Your account is created. Now select your domain to get personalized guidance.'
              : 'Select your primary domain to get personalized resume screening guidance'
            }
          </p>
        </div>

        <Card className="p-6">
          <DomainSelector
            selectedDomain={selectedDomain}
            onDomainSelect={setSelectedDomain}
            title="Select Your Domain"
            description="This will customize your assessment experience"
            showDescription={false}
          />
          
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
              className="min-w-32"
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleDomainSelect}
              disabled={loading}
              className="min-w-32"
            >
              {loading ? 'Updating...' : 'Continue with This Domain'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ProfileSelection;
