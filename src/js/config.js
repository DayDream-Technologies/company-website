// Public browser config. The anon key and Stripe publishable key are safe to ship.
// Secret keys (Stripe secret, webhook secret, service role) belong in Supabase Edge Function secrets:
//   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_...
// Replace the placeholders below, then redeploy the static site.
window.APP_CONFIG = {
    supabaseUrl: 'https://amhfekfqijlikygwgqyt.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaGZla2ZxaWpsaWt5Z3dncXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTU1NTcsImV4cCI6MjEwODQzMTU1N30.TCytrEzZ_zgF_42HYOr4mh1jGBAb1R5sx_QEUbI-WhE',
    stripePublishableKey: 'YOUR_STRIPE_PUBLISHABLE_KEY',
};
