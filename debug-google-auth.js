// Debug Google Auth - Add this to browser console to test
// Open browser dev tools (F12) and paste this in the Console tab

console.log('🔍 Debugging Google Auth...');

// Check if Google Client ID is loaded
console.log('Google Client ID:', import.meta?.env?.VITE_GOOGLE_CLIENT_ID || 'NOT FOUND');

// Check if GoogleOAuthProvider is wrapping the app
const googleProvider = document.querySelector('script[src*="accounts.google.com"]');
console.log('Google SDK loaded:', !!googleProvider);

// Test Supabase connection
if (window.supabase) {
  console.log('✅ Supabase client available');
  
  // Test auth session
  window.supabase.auth.getSession().then(({ data, error }) => {
    console.log('Current session:', data.session ? 'Logged in' : 'Not logged in');
    if (error) console.error('Session error:', error);
  });
  
  // Test database connection
  window.supabase.from('profiles').select('count').then(({ data, error }) => {
    if (error) {
      console.error('❌ Database connection failed:', error);
    } else {
      console.log('✅ Database connection successful');
    }
  });
} else {
  console.error('❌ Supabase client not available');
}

console.log('Debug complete. Check the logs above for issues.');