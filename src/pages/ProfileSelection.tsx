import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DomainSelector } from '@/components/DomainSelector';
import { GLOBAL_DOMAINS, type Domain } from '@/lib/constants/domains';
import { ArrowLeft, Sparkles } from 'lucide-react';

const ProfileSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain>('general');

  const handleBack = () => {
    // React Router keeps an internal history index at window.history.state.idx.
    // If the user landed here directly (no in-app history), navigate(-1) appears to do nothing.
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  
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
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('selected_domain')
            .eq('id', user.id)
            .single();
          
          if (profile?.selected_domain && profile.selected_domain !== 'general' && !fromGoogleAuth) {
            // User already has a domain set and this isn't from Google auth
            navigate('/dashboard');
            return;
          }
        } catch (dbError) {
          console.log('Database check failed, checking localStorage:', dbError);
        }
        
        // Fallback to localStorage check
        const localDomain = localStorage.getItem(`user_domain_${user.id}`) || localStorage.getItem('user_selected_domain');
        if (localDomain && localDomain !== 'general' && !fromGoogleAuth) {
          console.log('Found existing domain in localStorage:', localDomain);
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

    if (!selectedDomain) {
      toast({
        title: 'Select a Domain',
        description: 'Please select a domain before continuing.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Updating domain for user:', user.id, 'Domain:', selectedDomain);
    setLoading(true);
    
    try {
      // Save domain to localStorage (this always works)
      localStorage.setItem(`user_domain_${user.id}`, selectedDomain);
      localStorage.setItem('user_selected_domain', selectedDomain);
      
      console.log('Domain saved to localStorage successfully');

      // Try to update database, but don't fail if it doesn't work
      try {
        // First check if user profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!checkError && existingProfile) {
          // Profile exists, try to update it
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

          if (updateError) {
            console.log('Database update failed, but localStorage saved:', updateError);
          } else {
            console.log('Profile updated successfully in database');
          }
        } else if (checkError?.code === 'PGRST116') {
          // Profile doesn't exist, create it
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

          if (insertError) {
            console.log('Database insert failed, but localStorage saved:', insertError);
          } else {
            console.log('New profile created successfully in database');
          }
        }
      } catch (dbError: any) {
        console.log('Database operation failed, but localStorage saved:', dbError);
        
        // Check if it's a constraint error (domain not allowed)
        if (dbError?.code === '23514' || dbError?.message?.includes('selected_domain_check')) {
          console.log('Database constraint error - domain not allowed in database, but saved locally');
        }
      }

      console.log('Domain selection completed successfully');
      const selectedDomainInfo = GLOBAL_DOMAINS.find(d => d.value === selectedDomain);
      
      toast({
        title: 'Domain Selected! 🎉',
        description: fromGoogleAuth && isNewUser 
          ? `Welcome! You've selected ${selectedDomainInfo?.label}. Let's get started!`
          : `You've selected ${selectedDomainInfo?.label}. Let's start building your confidence!`,
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error in domain selection:', error);
      
      // Check if localStorage save worked (it should always work)
      const savedDomain = localStorage.getItem(`user_domain_${user.id}`);
      
      if (savedDomain === selectedDomain) {
        // Domain was saved locally, proceed anyway
        console.log('Domain saved locally despite database error');
        
        toast({
          title: 'Domain Selected! 🎉',
          description: `${GLOBAL_DOMAINS.find(d => d.value === selectedDomain)?.label} selected! Note: Settings saved locally.`,
        });
        
        navigate('/dashboard');
      } else {
        // Complete failure
        toast({
          title: 'Setup Error',
          description: 'Failed to save your domain selection. Please try again.',
          variant: 'destructive',
        });
      }
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
          onClick={handleBack}
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
