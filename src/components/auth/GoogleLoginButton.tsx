import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useState } from "react";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const GoogleLoginButton = ({ 
  onSuccess, 
  redirectTo = "/dashboard" 
}: GoogleLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });

      if (error) {
        console.error("Google sign-in error:", error);
        toast.error(`Google sign-in failed: ${error.message}`);
        setIsLoading(false);
        return;
      }

      // If successful and we have onSuccess callback, call it
      if (onSuccess) {
        onSuccess();
      }
      // Otherwise the page will redirect automatically
    } catch (err) {
      console.error("Google sign-in exception:", err);
      toast.error("Failed to initiate Google sign-in");
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-12 text-base font-medium border-2 hover:bg-muted/50 transition-colors"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      <FcGoogle className="w-5 h-5 mr-3" />
      {isLoading ? "Connecting..." : "Continue with Google"}
    </Button>
  );
};
