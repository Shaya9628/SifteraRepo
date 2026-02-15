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
      className="w-full h-14 text-lg font-semibold glass-strong border-2 border-white/20 hover:glow-cyan hover:scale-[1.02] transition-all duration-300 backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5 text-white group"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
          Connecting magic...
        </>
      ) : (
        <>
          <FcGoogle className="w-6 h-6 mr-3 group-hover:animate-bounce transition-transform" />
          Continue with Google ✨
        </>
      )}
    </Button>
  );
};
