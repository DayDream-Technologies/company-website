(function () {
    if (window.supabaseClient) return;

    const cfg = window.APP_CONFIG || {};
    const url = typeof cfg.supabaseUrl === 'string' ? cfg.supabaseUrl.trim() : '';
    const key = typeof cfg.supabaseAnonKey === 'string' ? cfg.supabaseAnonKey.trim() : '';
    const configured = url.startsWith('https://') &&
        key.length > 20 &&
        !url.includes('YOUR_') &&
        !key.includes('YOUR_');

    window.isSupabaseConfigured = function () {
        return configured;
    };

    if (!configured || !window.supabase || typeof window.supabase.createClient !== 'function') {
        window.supabaseClient = null;
        return;
    }

    window.supabaseClient = window.supabase.createClient(url, key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });
})();
