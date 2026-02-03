import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { StreamlinedSignUp } from '@/components/auth/StreamlinedSignUp';
import { FcGoogle } from 'react-icons/fc';
import { signInWithGoogle } from '@/lib/auth/googleAuth';
import { z } from 'zod';

// Validation schemas
const signInSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (user) {
        // Check if user has completed profile setup
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          // If user has domain, go to dashboard, otherwise complete setup
          if (profile.selected_domain) {
            navigate('/dashboard');
          } else {
            // Skip onboarding, user already has basic info from sign-up
            navigate('/dashboard');
          }
        } else {
          // Create basic profile and go to dashboard
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              email: user.email,
              selected_domain: user.user_metadata?.domain || 'general',
              phone: user.user_metadata?.phone,
            });
          navigate('/dashboard');
        }
      }
    };

    checkUserStatus();
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validate input
    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    } else {
      // Navigation will be handled by useEffect after user state updates
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    // Validate email
    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      setResetLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Check your email for password reset instructions",
        });
        setShowForgotPassword(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>
      
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Siftera
          </CardTitle>
          <CardDescription>
            Where HR confidence is built through hands-on practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <div className="space-y-6">
                {/* Google Sign-In Button */}
                <Button 
                  onClick={async () => {
                    setIsLoading(true);
                    const { error } = await signInWithGoogle();
                    if (error) {
                      toast({
                        title: 'Google Sign-In Failed',
                        description: 'Please try again.',
                        variant: 'destructive',
                      });
                    }
                    setIsLoading(false);
                  }}
                  variant="outline" 
                  className="w-full h-12 text-base"
                  disabled={isLoading}
                >
                  <FcGoogle className="mr-3 h-5 w-5" />
                  Continue with Google
                </Button>

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

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="hr@company.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                    <p className="text-xs text-muted-foreground mt-2">
                      If you forgot your password, click on 'Forgot Password' to reset it.
                    </p>
                  </div>
                </form>
              </div>
              
              {showForgotPassword && (
                <div className="mt-4 p-4 border rounded-lg bg-secondary/20">
                  <h3 className="font-semibold mb-2">Reset Password</h3>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={resetLoading} size="sm">
                        {resetLoading ? 'Sending...' : 'Send Reset Email'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <StreamlinedSignUp onSuccess={() => setIsLoading(false)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
