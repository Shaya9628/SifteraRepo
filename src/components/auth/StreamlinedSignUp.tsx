import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FcGoogle } from 'react-icons/fc';
import { GoogleLoginButton } from './GoogleLoginButton';
import { GLOBAL_DOMAINS, COUNTRY_CODES, type Domain, type CountryCode } from '@/lib/constants/domains';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Simplified validation schema
const signUpSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  domain: z.string().min(1, "Please select a domain"),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
});

interface StreamlinedSignUpProps {
  onSuccess?: () => void;
}

export function StreamlinedSignUp({ onSuccess }: StreamlinedSignUpProps) {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    countryCode: '+1' as CountryCode,
    phone: '',
    domain: '' as Domain | '',
  });
  const [isLoading, setIsLoading] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = signUpSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(
        formData.email, 
        formData.password, 
        formData.fullName,
        {
          domain: formData.domain,
          phone: formData.phone ? `${formData.countryCode}${formData.phone}` : undefined,
        }
      );
      
      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome to Siftera! 🎉',
          description: 'Your account has been created successfully.',
        });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Sign-In Button */}
      <GoogleLoginButton />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Streamlined Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="e.g., John Smith"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Work Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@company.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create password (min 8 characters)"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            minLength={8}
          />
        </div>

        {/* Phone with Country Code (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <div className="flex gap-2">
            <Select 
              value={formData.countryCode} 
              onValueChange={(value: CountryCode) => setFormData({...formData, countryCode: value})}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    <span className="flex items-center gap-2">
                      {item.flag} {item.code}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone"
              type="tel"
              placeholder="1234567890"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/[^\d]/g, '')})}
            />
          </div>
        </div>

        {/* Domain Selection */}
        <div className="space-y-2">
          <Label htmlFor="domain">Primary Domain</Label>
          <Select 
            value={formData.domain} 
            onValueChange={(value: Domain) => setFormData({...formData, domain: value})} 
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your primary domain" />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {GLOBAL_DOMAINS.map((domain) => (
                <SelectItem key={domain.value} value={domain.value}>
                  <span className="flex items-center gap-2">
                    {domain.icon} {domain.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This helps us provide relevant resume screening guidance
          </p>
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Start Building My Confidence'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        By signing up, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}