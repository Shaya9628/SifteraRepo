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
import { Sparkles, User, Mail, Briefcase, Phone } from 'lucide-react';

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Gen Z Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.2s'}} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-neon-purple/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-neon-cyan/20 rounded-full blur-3xl animate-blob" />
      </div>

      <div className="w-full max-w-md mx-auto px-4 relative z-10">
        <Card className="glass-strong glow-cyan border-neon">
          <CardHeader className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-4 mx-auto">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Complete Your Profile ✨</span>
            </div>
            <CardTitle className="text-3xl text-gradient-neon">
              {isNewUser ? 'Welcome to Siftera!' : 'Let\'s Finish Up!'} 🎉
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              {isNewUser 
                ? 'Just a few more details to get you started on your HR journey! 🚀' 
                : 'Complete the missing info to unlock your full potential! ✨'
              }
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name - Auto-filled from Google */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-bold text-gradient flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your awesome name 😄"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="glass border-primary/30 focus:border-primary focus:glow-purple text-lg"
                />
              </div>

              {/* Email - Auto-filled from Google */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-gradient flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="glass border-primary/30 focus:border-primary focus:glow-purple text-lg"
                />
              </div>

              {shouldShowField('domain') && (
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-sm font-bold text-gradient flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Domain/Industry *
                  </Label>
                  <Select 
                    value={formData.domain} 
                    onValueChange={(value) => handleInputChange('domain', value)}
                    required
                  >
                    <SelectTrigger className="glass border-primary/30 focus:border-primary focus:glow-purple text-lg">
                      <SelectValue placeholder="Choose your domain 🎨" />
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
                <Label htmlFor="phone" className="text-sm font-bold text-gradient flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number (Optional)
                </Label>
                <div className="flex gap-3">
                  <Select 
                    value={formData.countryCode} 
                    onValueChange={(value: CountryCode) => handleInputChange('countryCode', value)}
                  >
                    <SelectTrigger className="w-28 glass border-primary/30 focus:border-primary">
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
                    placeholder="123-456-7890 📱"
                    value={formData.phone}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      handleInputChange('phone', value);
                    }}
                    className="flex-1 glass border-primary/30 focus:border-primary focus:glow-purple text-lg"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 glass border-primary/30 hover:border-primary hover:glow-purple font-bold py-6 text-lg"
                >
                  Skip for Now 🚀
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-primary hover:bg-gradient-neon glow-purple hover:glow-cyan transition-all duration-300 font-bold py-6 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Complete Profile ✨
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};