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

    if (!formData.designation.trim()) {
      toast({
        title: "Required field",
        description: "Please enter your job title/designation",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Complete your setup</CardTitle>
            <CardDescription>
              Choose your domain and confirm a few details to personalize your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <DomainSelector
                selectedDomain={formData.domain}
                onDomainSelect={(domain) => setFormData({ ...formData, domain })}
                showDescription={false}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    disabled
                    aria-disabled
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} disabled aria-disabled />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="designation">Job Title/Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    placeholder="e.g., Sales Representative, Customer Service Manager"
                    required
                    disabled={initializing}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="phone">Phone Number (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={initializing}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={initializing || loading}>
                {initializing ? "Loading..." : loading ? "Saving..." : "Finish"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
