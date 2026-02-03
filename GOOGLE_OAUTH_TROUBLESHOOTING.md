# Google OAuth Error 401: invalid_client - Troubleshooting Guide

## The Problem
You're getting "Authorization Error: The OAuth client was not found" with error 401: invalid_client.

This means the Google Client ID `1016027345593-3tkdmo57dlq30e0s33to0b2q6itfbrmu.apps.googleusercontent.com` is either:
1. Invalid or doesn't exist
2. From a deleted Google Cloud project
3. Not properly configured
4. Restricted or disabled

## Step-by-Step Solution

### 1. Create a New Google Cloud Project and OAuth Client

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a New Project** (or select existing):
   - Click the project dropdown at the top
   - Click "New Project"
   - Give it a name like "Skill Scout Spark"
   - Click "Create"

3. **Enable Google+ API** (required for OAuth):
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click it and press "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (unless you have a Google Workspace)
   - Fill in required fields:
     - App name: "Skill Scout Spark"
     - User support email: your email
     - Developer contact email: your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your email) if in testing mode

5. **Create OAuth Client ID**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Name: "Skill Scout Spark Web Client"
   - **Authorized JavaScript origins**:
     ```
     http://localhost:8081
     http://localhost:3000
     https://yourdomain.com (when you deploy)
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:8081/dashboard
     http://localhost:3000/dashboard
     https://yourdomain.com/dashboard (when you deploy)
     ```
   - Click "Create"
   - **Copy the new Client ID**

### 2. Update Your Environment File

Replace the current Client ID in your `.env` file with the new one:

```env
VITE_GOOGLE_CLIENT_ID=your-new-client-id.apps.googleusercontent.com
```

### 3. Restart Development Server

After updating the `.env` file:
```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

### 4. Configure Supabase (Important!)

1. Go to your Supabase Dashboard
2. Navigate to "Authentication" → "Providers"
3. Enable the "Google" provider
4. Enter the same Client ID and Client Secret from Google Cloud Console
5. The redirect URL should be:
   ```
   https://jlviuwiwfavvygxvvspj.supabase.co/auth/v1/callback
   ```

### 5. Test the Integration

1. Open http://localhost:8081
2. Go to the sign-in page
3. Click "Sign in with Google"
4. You should see the Google OAuth consent screen

## Common Issues and Solutions

### Issue: "redirect_uri_mismatch"
**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches what your app is sending.

### Issue: "access_denied"
**Solution**: User declined permission, or app is not verified.

### Issue: Still getting "invalid_client"
**Solutions**:
1. Double-check the Client ID is copied correctly
2. Make sure there are no extra spaces
3. Restart the dev server after changing .env
4. Try creating a completely new OAuth client

### Issue: "This app isn't verified"
**Solution**: This is normal for development. Click "Advanced" → "Go to [App Name] (unsafe)" during testing.

## Development vs Production

### Development Setup
- Use `http://localhost:8081` in authorized origins
- App will show "unverified" warning (normal)

### Production Setup
- Use your actual domain `https://yourdomain.com`
- Submit app for verification if needed
- Use environment-specific Client IDs

## Security Best Practices

1. **Never commit Client IDs to public repositories**
2. **Use different Client IDs for dev/staging/production**
3. **Regularly rotate credentials**
4. **Keep Client Secret secure** (never expose in frontend)
5. **Use HTTPS in production**

## Testing Commands

```bash
# Check if environment variable is loaded
echo $VITE_GOOGLE_CLIENT_ID

# Restart dev server with fresh environment
npm run dev
```

## Need Help?

If you continue having issues:
1. Check the browser developer console for detailed error messages
2. Verify the Google Cloud Console project is active
3. Ensure all APIs are enabled
4. Try with a different Google account
5. Create a completely new Google Cloud project and OAuth client