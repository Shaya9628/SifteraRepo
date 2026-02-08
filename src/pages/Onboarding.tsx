import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DomainSelector } from "@/components/DomainSelector";
import { type Domain } from "@/lib/constants/domains";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    designation: "",
    domain: "sales" as Domain,
  });

  // Pull best-available identity info from the signed-in session
  const resolvedIdentity = useMemo(() => {
    const fullNameFromAuth =
      (user?.user_metadata as any)?.full_name ||
      (user?.user_metadata as any)?.name ||
      "";

    const emailFromAuth = user?.email || (user?.user_metadata as any)?.email || "";

    const fallbackName = emailFromAuth ? emailFromAuth.split("@")[0] : "";

    return {
      full_name: (fullNameFromAuth || fallbackName || "").toString(),
      email: (emailFromAuth || "").toString(),
    };
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone, email, designation, selected_domain")
          .eq("id", user.id)
          .single();

        setFormData((prev) => ({
          ...prev,
          full_name: profile?.full_name || resolvedIdentity.full_name || prev.full_name,
          email: profile?.email || resolvedIdentity.email || prev.email,
          phone: profile?.phone || prev.phone,
          designation: profile?.designation || prev.designation,
          domain: (profile?.selected_domain as Domain) || prev.domain,
        }));
      } catch (error) {
        // Non-blocking: we can still proceed using auth identity values.
        console.error("Error loading profile for onboarding:", error);
        setFormData((prev) => ({
          ...prev,
          full_name: prev.full_name || resolvedIdentity.full_name,
          email: prev.email || resolvedIdentity.email,
        }));
      } finally {
        setInitializing(false);
      }
    };

    loadProfile();
  }, [user, resolvedIdentity.email, resolvedIdentity.full_name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.phone.trim()) {
      toast({
        title: "Required field",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (!formData.designation.trim()) {
      toast({
        title: "Required field",
        description: "Please enter your job title",
        variant: "destructive",
      });
      return;
    }

    const fullNameToSave = formData.full_name?.trim() || resolvedIdentity.full_name;
    const emailToSave = formData.email?.trim() || resolvedIdentity.email;

    setLoading(true);
    try {
      // Save user domain to localStorage
      localStorage.setItem(`user_domain_${user.id}`, formData.domain);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullNameToSave,
          phone: formData.phone || null,
          email: emailToSave || null,
          designation: formData.designation,
          selected_domain: formData.domain,
          has_completed_onboarding: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Store domain in localStorage for immediate use
      localStorage.setItem("user_selected_domain", formData.domain);

      toast({
        title: "Setup completed!",
        description: `Welcome to the HR Training Platform - ${formData.domain} Domain`,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden py-8 px-4">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-primary-glow/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header with Gradient Text */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-medium mb-2">
            <span className="emoji-pop">✨</span>
            <span>Let's get you started</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Fill in your details and pick your vibe to personalize your experience 🚀
          </p>
        </div>

        <Card className="glass border-0 shadow-2xl glow-purple animate-scale-in">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl emoji-pop">👤</span>
                  <h2 className="text-xl font-bold">Personal Info</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 group">
                    <Label htmlFor="full_name" className="text-sm font-semibold">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      disabled
                      className="h-12 rounded-xl bg-muted/50 border-2 border-border/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="h-12 rounded-xl bg-muted/50 border-2 border-border/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      required
                      disabled={initializing}
                      className="h-12 rounded-xl border-2 border-border/50 focus:border-primary focus:glow-purple transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation" className="text-sm font-semibold">
                      Job Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g., Sales Manager, HR Executive"
                      required
                      disabled={initializing}
                      className="h-12 rounded-xl border-2 border-border/50 focus:border-primary focus:glow-purple transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Domain Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl emoji-pop">🎯</span>
                  <h2 className="text-xl font-bold">Pick Your Domain</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose what matches your professional vibe ✨
                </p>
                <DomainSelector
                  selectedDomain={formData.domain}
                  onDomainSelect={(domain) => setFormData({ ...formData, domain })}
                  showDescription={false}
                  title=""
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-primary hover:opacity-90 transition-all animate-pulse-glow" 
                disabled={initializing || loading}
              >
                {initializing ? (
                  "Loading..."
                ) : loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⚡</span> Setting things up...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Let's Go! <span className="emoji-pop">🚀</span>
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          You can update your profile anytime from settings 💫
        </p>
      </div>

      {/* Animation delay styles */}
      <style>{`
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default Onboarding;
