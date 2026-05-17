// js/supabase-config.js

// TODO: Replace these with your actual Supabase project credentials
// You can find these in your Supabase Dashboard -> Settings -> API
const SUPABASE_URL = 'https://opshppxppeixnvmjauek.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2hwcHhwcGVpeG52bWphdWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTc1ODksImV4cCI6MjA5NDUzMzU4OX0.ijFX3NFVOPrvo_yWbyEEhsOmcwVCjuv6qeLTe2coiUU';

// Initialize Supabase Client
// We use the global supabase object loaded via CDN in the HTML files
let supabaseClient;
if (typeof supabase !== 'undefined' && !SUPABASE_URL.includes('YOUR_SUPABASE')) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Helper to check if initialized correctly
const checkConfig = () => {
    if (SUPABASE_URL.includes('YOUR_SUPABASE')) {
        console.warn('⚠️ Supabase credentials are not configured. Please update js/supabase-config.js');
        return false;
    }
    return true;
};
