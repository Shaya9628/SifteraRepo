# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the application.

## 🚨 IMMEDIATE FIX for "origin_mismatch" Error

If you're getting **"Access blocked: Authorization Error - origin_mismatch"**, follow these steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth Client ID: `1016027345593-3tkdmo57dlq30e0s33to0b2q6itfbrmu`
4. Click the **edit** button (pencil icon)
5. In **"Authorized JavaScript origins"**, add:
   ```
   http://localhost:8080
   http://localhost:8081
   http://localhost:8082
   http://localhost:3000
   http://127.0.0.1:8080
   http://127.0.0.1:8081
   http://127.0.0.1:8082
   ```
6. In **"Authorized redirect URIs"**, add:
   ```
   http://localhost:8080/dashboard
   http://localhost:8081/dashboard
   http://localhost:8082/dashboard
   http://localhost:3000/dashboard
   http://127.0.0.1:8080/dashboard
   http://127.0.0.1:8081/dashboard
   http://127.0.0.1:8082/dashboard
   ```
7. Click **Save**
8. Wait 5-10 minutes for changes to propagate
9. Try signing in again

⚠️ **Current server is running on**: `http://localhost:8082/`

## 1. Create Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth Client ID**
5. Choose **Web application** as the application type
6. Add authorized origins:
   - `http://localhost:8081` (for development)
   - `https://yourdomain.com` (for production)
7. Add authorized redirect URIs:
   - `http://localhost:8081/dashboard` (for development)
   - `https://yourdomain.com/dashboard` (for production)
8. Copy the generated Client ID

## 2. Configure Environment Variables

Update the `.env` file with your Google Client ID:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

⚠️ **Important**: Never commit your actual Client ID to version control. Use different Client IDs for development and production.

## 3. Configure Supabase for Google OAuth

**CRITICAL:** Your Supabase project must have Google OAuth properly configured for the sign-in to work.

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - **Client ID**: `1016027345593-3tkdmo57dlq30e0s33to0b2q6itfbrmu`
   - **Client Secret**: (get this from Google Cloud Console)
5. Set the **Redirect URL** to: `https://jlviuwiwfavvygxvvspj.supabase.co/auth/v1/callback`

### Getting Google Client Secret:
1. In Google Cloud Console → APIs & Services → Credentials
2. Click on your OAuth Client ID
3. Copy the **Client Secret**
4. Paste it in Supabase Google provider settings

⚠️ **Without proper Supabase Google OAuth setup, you'll get authentication errors even if Google sign-in completes successfully.**

## 4. Alternative: Manual User Creation

If Supabase Google OAuth isn't configured, the app will:
- Decode Google user info
- Update existing user profiles  
- Show message: "Please use regular login to access your account"
- New users will need to sign up manually first

## 4. Implementation Details

The application now uses `@react-oauth/google` for Google authentication:

### Components
- `GoogleLoginButton`: Reusable component for Google sign-in
- Wraps the entire app with `GoogleOAuthProvider`

### Authentication Flow
1. User clicks Google sign-in button
2. Google OAuth popup opens
3. User authenticates with Google
4. JWT token is received and decoded
5. User data is signed into Supabase
6. Profile is updated with Google information
7. User is redirected to dashboard

### Key Files
- `src/main.tsx`: GoogleOAuthProvider wrapper
- `src/lib/auth/googleAuth.ts`: Google auth handlers
- `src/components/auth/GoogleLoginButton.tsx`: Reusable Google login button
- `src/pages/Auth.tsx`: Updated to use new Google login
- `src/components/auth/StreamlinedSignUp.tsx`: Updated to use new Google login

## 5. Testing

1. Start the development server: `npm run dev`
2. Navigate to the auth page
3. Click "Sign in with Google"
4. Complete Google authentication
5. Verify successful redirect to dashboard

## 6. Security Considerations

- Always use HTTPS in production
- Validate Google tokens on the server side
- Use different Client IDs for different environments
- Keep Client Secret secure and never expose in frontend code
- Regularly rotate credentials

## 7. Troubleshooting

### Common Issues

- **"no registered origin"**: Add `http://localhost:8081` to Authorized JavaScript origins in Google Cloud Console
- **"popup_closed_by_user"**: User closed the popup (normal behavior)
- **"idpiframe_initialization_failed"**: Check OAuth settings and authorized domains
- **Button not rendering**: Ensure app is wrapped with GoogleOAuthProvider
- **"Invalid client"**: Verify Client ID is correct

### Debug Steps

1. Check browser console for errors
2. Verify environment variables are loaded
3. Confirm OAuth settings in Google Cloud Console
4. Test with different browsers/incognito mode