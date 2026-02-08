
# Fix Google Sign-In: Replace Blocked iframe with Redirect Flow

## Problem

When clicking "Sign in with Google", you see:
```
accounts.google.com is blocked
accounts.google.com refused to connect.
ERR_BLOCKED_BY_RESPONSE
```

This happens because the current implementation uses an iframe-based approach that Google blocks for security reasons.

## Solution

Replace the iframe-based Google button with a redirect-based sign-in that opens Google in the same tab, authenticates, and returns to your app.

## What Will Change

### 1. Google Sign-In Button (Complete Rewrite)
Replace the embedded Google widget with a custom button that uses the redirect flow:

| Before | After |
|--------|-------|
| Embedded Google iframe widget | Custom styled button matching your design |
| Blocked by cross-origin policy | Works in all browsers |
| Complex token handling | Automatic session management |

### 2. Main App Entry (Simplify)
Remove the `GoogleOAuthProvider` wrapper that's no longer needed:

| Before | After |
|--------|-------|
| App wrapped in `GoogleOAuthProvider` | Direct rendering without extra wrapper |

### 3. Auth Page (Add Redirect Handler)
Add logic to handle users returning from Google sign-in:

- Detect when user lands on `/auth` after Google redirect
- Check if session exists and profile is complete
- Route to dashboard or profile completion as needed

### 4. Cleanup Old Code
Remove the complex JWT decoding logic that's no longer needed since Lovable Cloud handles this automatically.

## User Experience After Fix

```text
1. User clicks "Continue with Google" button
2. Browser navigates to Google's login page (full page, not popup)
3. User selects their Google account
4. Google redirects back to your app
5. App detects session and routes appropriately:
   → New user: Profile completion page
   → Existing user with complete profile: Dashboard
   → Existing user missing details: Profile completion
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/auth/GoogleLoginButton.tsx` | Replace with redirect-based implementation |
| `src/main.tsx` | Remove `GoogleOAuthProvider` wrapper |
| `src/pages/Auth.tsx` | Add OAuth redirect callback handling |
| `src/lib/auth/googleAuth.ts` | Simplify to only handle post-auth profile logic |

## Technical Details

### New GoogleLoginButton Implementation
```typescript
import { lovable } from "@/integrations/lovable";

const handleGoogleSignIn = async () => {
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  
  if (error) {
    toast.error("Failed to connect to Google");
  }
  // Browser redirects to Google automatically
};
```

### Post-Redirect Handling in Auth.tsx
When user returns from Google, check session and route:
- Listen for `onAuthStateChange` events
- Check profile completion status
- Navigate to appropriate page

### Dependencies
After this change, you can optionally remove:
- `@react-oauth/google` 
- `jwt-decode`

These were only used for the iframe approach.
