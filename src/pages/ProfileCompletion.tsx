import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Domain = 'technology' | 'healthcare' | 'finance' | 'marketing' | 'sales' | 'education' | 'consulting' | 'other';
type CountryCode = '+1' | '+44' | '+91' | '+81' | '+49' | '+33' | '+86';

const domainOptions: { value: Domain; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'education', label: 'Education' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
];

const countryOptions: { value: CountryCode; label: string; flag: string }[] = [
  { value: '+1', label: 'United States', flag: '🇺🇸' },
  { value: '+44', label: 'United Kingdom', flag: '🇬🇧' },
  { value: '+91', label: 'India', flag: '🇮🇳' },
  { value: '+81', label: 'Japan', flag: '🇯🇵' },
  { value: '+49', label: 'Germany', flag: '🇩🇪' },
  { value: '+33', label: 'France', flag: '🇫🇷' },
  { value: '+86', label: 'China', flag: '🇨🇳' },
];

export const ProfileCompletion = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { missingFields, isNewUser, googleUserData } = location.state || {};
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    domain: '',
    countryCode: '+1' as CountryCode,
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill Google user data
  useEffect(() => {
    if (googleUserData) {
      setFormData(prev => ({
        ...prev,
        fullName: googleUserData.fullName || '',
        email: googleUserData.email || '',
      }));
    }
  }, [googleUserData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Combine country code and phone number
      const fullPhone = formData.phone ? `${formData.countryCode}${formData.phone}` : null;
      
      // Update user profile with form data
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName || null,
          email: formData.email || null,
          domain: formData.domain || null,
          phone: fullPhone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const shouldShowField = (fieldName: string) => {
    return !missingFields || missingFields.includes(fieldName) || missingFields.includes(fieldName.charAt(0).toUpperCase() + fieldName.slice(1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isNewUser ? 'Welcome! Complete Your Profile' : 'Complete Your Profile'}
          </CardTitle>
          <p className="text-muted-foreground">
            {isNewUser 
              ? 'Please provide some additional information to get started.' 
              : 'Please complete the missing information in your profile.'
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name - Auto-filled from Google */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="bg-gray-50" // Slightly grayed to show it's auto-filled
              />
            </div>

            {/* Email - Auto-filled from Google */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-gray-50" // Slightly grayed to show it's auto-filled
              />
            </div>

            {shouldShowField('domain') && (
              <div className="space-y-2">
                <Label htmlFor="domain">Domain/Industry *</Label>
                <Select 
                  value={formData.domain} 
                  onValueChange={(value) => handleInputChange('domain', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domainOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Enhanced Phone Number Input */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.countryCode} 
                  onValueChange={(value: CountryCode) => handleInputChange('countryCode', value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue>
                      {countryOptions.find(opt => opt.value === formData.countryCode)?.flag} {formData.countryCode}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.flag} {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="1234567890"
                  value={formData.phone}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/\D/g, '');
                    handleInputChange('phone', value);
                  }}
                  className="flex-1"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};