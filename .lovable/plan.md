
# Fix Google Sign-In: ERR_BLOCKED_BY_RESPONSE Error

## Problem Analysis

The error `accounts.google.com refused to connect - ERR_BLOCKED_BY_RESPONSE` occurs because:

1. **Current implementation** uses `@react-oauth/google` library which renders Google's embedded OAuth button
2. This button opens an **iframe** to `accounts.google.com`
3. The preview environment (and many browsers) blocks this due to **Cross-Origin-Opener-Policy (COOP)** restrictions
4. Google's servers send headers that prevent embedding in iframes from other origins

## Solution

Replace the `@react-oauth/google` iframe-based approach with **Lovable Cloud's managed OAuth flow** which uses a **redirect-based** authentication that works properly in all environments.

## Implementation Steps

### Step 1: Create New Google Sign-In Button Component

Replace the current `GoogleLoginButton` component to use Lovable Cloud's `signInWithOAuth`:

```typescript
// src/components/auth/GoogleLoginButton.tsx
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useState } from "react";

export const GoogleLoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (error) {
        toast.error(`Google sign-in failed: ${error.message}`);
      }
      // If successful, the page will redirect automatically
    } catch (err) {
      toast.error("Failed to initiate Google sign-in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-12 text-base"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      <FcGoogle className="w-5 h-5 mr-2" />
      {isLoading ? "Connecting..." : "Continue with Google"}
    </Button>
  );
};
```

### Step 2: Update main.tsx

Remove the `GoogleOAuthProvider` wrapper since we no longer need the `@react-oauth/google` library:

```typescript
// src/main.tsx - simplified without GoogleOAuthProvider
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

### Step 3: Simplify googleAuth.ts

Remove the complex JWT decoding logic since Lovable Cloud handles all of this automatically. The authentication callback will update the user profile as needed.

### Step 4: Update Auth Page for Redirect Handling

Add logic to handle the OAuth redirect callback when users return from Google sign-in:

```typescript
// In Auth.tsx useEffect
useEffect(() => {
  // Handle OAuth redirect callback
  const handleAuthCallback = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Check profile completion and redirect accordingly
      // ... existing logic
    }
  };
  
  handleAuthCallback();
}, []);
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/auth/GoogleLoginButton.tsx` | Replace with redirect-based implementation using Lovable Cloud |
| `src/main.tsx` | Remove `GoogleOAuthProvider` wrapper |
| `src/lib/auth/googleAuth.ts` | Simplify or remove (no longer needed for core flow) |
| `src/components/auth/StreamlinedSignUp.tsx` | Update to use new GoogleLoginButton (no changes needed if importing same component) |
| `src/pages/Auth.tsx` | Add redirect callback handling |

## Technical Details

### Why This Works

- **Redirect-based OAuth** opens a new browser tab/window to Google's login page
- After authentication, Google redirects back to your app with tokens
- Lovable Cloud's `signInWithOAuth` handles all token exchange and session management
- No iframe restrictions apply to full page redirects

### Authentication Flow After Fix

```text
User clicks "Continue with Google"
       ↓
lovable.auth.signInWithOAuth("google") called
       ↓
Browser redirects to Google login page
       ↓
User authenticates with Google
       ↓
Google redirects back to app with tokens
       ↓
Lovable Cloud sets session automatically
       ↓
User lands on dashboard (or profile completion if needed)
```

## Dependencies

- Can **remove** `@react-oauth/google` package after migration
- Can **remove** `jwt-decode` package (was only used for decoding Google tokens)

## Testing Checklist

After implementation:
1. Click "Continue with Google" on Sign In tab
2. Verify redirect to Google login page works
3. Complete Google authentication
4. Verify redirect back to app and automatic login
5. Check that profile completion flow works for new users
6. Verify existing users go directly to dashboard
