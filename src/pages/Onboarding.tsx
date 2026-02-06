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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 py-8 px-4">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Fill in your details and select your domain to personalize your experience
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold border-b pb-2">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      required
                      disabled={initializing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation">Job Title <span className="text-destructive">*</span></Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g., Sales Manager, HR Executive"
                      required
                      disabled={initializing}
                    />
                  </div>
                </div>
              </div>

              {/* Domain Selection Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold border-b pb-2">Select Your Domain</h2>
                <p className="text-sm text-muted-foreground">
                  Choose the domain that best matches your professional focus
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
                className="w-full h-12 text-base font-medium" 
                disabled={initializing || loading}
              >
                {initializing ? "Loading..." : loading ? "Setting up your account..." : "Get Started"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          You can update your profile and domain preferences anytime from settings
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
