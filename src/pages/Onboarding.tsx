import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DomainSelector } from '@/components/DomainSelector';

type Domain = 'Sales' | 'CRM';

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    designation: '',
    domain: 'Sales' as Domain,
  });

  const handleNext = () => {
    if (currentStep === 1 && (!formData.full_name || !formData.designation)) {
      toast({
        title: 'Required fields',
        description: 'Please fill in your name and designation',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Save user domain to localStorage
      localStorage.setItem(`user_domain_${user.id}`, formData.domain);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          designation: formData.designation,
          has_completed_onboarding: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Store domain in localStorage for immediate use
      localStorage.setItem('user_selected_domain', formData.domain);
      
      // Note: 'users' table doesn't exist in schema - domain is stored in profiles.selected_domain
      // which is already updated above

      toast({
        title: 'Profile completed!',
        description: `Welcome to the HR Training Platform - ${formData.domain} Domain`,
      });
      
      navigate('/profile-selection');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-2xl">
        {currentStep === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Welcome! Let's Get Started</CardTitle>
              <CardDescription>
                Step 1 of 2: Please tell us about yourself
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="designation">Job Title/Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g., Sales Representative, Customer Service Manager"
                    required
                  />
                </div>
                <Button onClick={handleNext} className="w-full">
                  Next: Choose Domain
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Domain</CardTitle>
              <CardDescription>
                Step 2 of 2: Select the domain that matches your role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <DomainSelector
                  selectedDomain={formData.domain}
                  onDomainSelect={(domain) => setFormData({ ...formData, domain })}
                  showDescription={false}
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Completing...' : 'Complete Setup'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
