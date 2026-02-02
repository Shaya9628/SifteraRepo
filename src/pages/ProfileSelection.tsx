import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DomainSelector } from '@/components/DomainSelector';
import { GLOBAL_DOMAINS, type Domain } from '@/lib/constants/domains';

const ProfileSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain>('general');

  const handleDomainSelect = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          domain: selectedDomain,
          selected_domain: selectedDomain // Keep backwards compatibility
        })
        .eq('id', user.id);

      if (error) throw error;

      const selectedDomainInfo = GLOBAL_DOMAINS.find(d => d.value === selectedDomain);
      toast({
        title: 'Domain Updated! 🎉',
        description: `You've selected ${selectedDomainInfo?.label}. Let's start building your confidence!`,
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error selecting domain:', error);
      toast({
        title: 'Error',
        description: 'Failed to update domain. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: 'Welcome to Siftera!',
      description: 'You can update your domain anytime in profile settings.',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Assessment Domain</h1>
          <p className="text-muted-foreground">
            Select your primary domain to get personalized resume screening guidance
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
