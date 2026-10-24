export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

export function optionsResponse(req) {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    return null;
}

const STATIC_ORIGINS = new Set([
    "https://www.daydreamtechnologies.net",
    "https://daydreamtechnologies.net",
    "http://localhost:8765",
    "http://127.0.0.1:8765",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]);

export function isAllowedOrigin(origin) {
    if (!origin) return false;
    if (STATIC_ORIGINS.has(origin)) return true;
    try {
        const host = new URL(origin).hostname;
        return host === "localhost" || host === "127.0.0.1" || host.endsWith(".amplifyapp.com");
    } catch {
        return false;
    }
}

export function safeReturnUrl(value, fallback) {
    if (!value) return fallback;
    try {
        const url = new URL(value);
        if (isAllowedOrigin(url.origin)) return url.toString();
    } catch {
        /* ignore invalid URLs */
    }
    return fallback;
}
