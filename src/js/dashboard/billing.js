(function () {
    const cfg = function () { return window.APP_CONFIG || {}; };
    const publishable = (cfg().stripePublishableKey || '');
    window.stripeClient = window.Stripe && publishable.indexOf('pk_') === 0
        ? window.Stripe(publishable)
        : null;

    async function callFunction(name, body) {
        const client = window.supabaseClient;
        if (!client) throw new Error('Supabase is not configured.');
        const { data, error } = await client.auth.getSession();
        if (error || !data.session) throw new Error('Sign in again to continue.');

        const config = cfg();
        const response = await fetch(config.supabaseUrl.replace(/\/$/, '') + '/functions/v1/' + name, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + data.session.access_token,
                apikey: config.supabaseAnonKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body || {}),
        });
        const payload = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(payload.error || 'Request failed.');
        return payload;
    }

    function pageUrl(path) {
        return window.location.origin + path;
    }

    window.DaydreamBilling = {
        startCheckout: async function (priceId) {
            const payload = await callFunction('create-checkout-session', {
                priceId: priceId,
                successUrl: pageUrl('/dashboard?billing=success'),
                cancelUrl: pageUrl('/dashboard?billing=cancel'),
            });
            if (!payload.url) throw new Error('Checkout did not return a URL.');
            window.location.assign(payload.url);
        },
        payInvoice: async function (invoiceId) {
            const payload = await callFunction('create-checkout-session', {
                invoiceId: invoiceId,
                successUrl: pageUrl('/dashboard?billing=success'),
                cancelUrl: pageUrl('/dashboard?billing=cancel'),
            });
            if (!payload.url) throw new Error('Payment did not return a URL.');
            window.location.assign(payload.url);
        },
        openPortal: async function (options) {
            const payload = await callFunction('create-portal-session', {
                returnUrl: pageUrl('/dashboard'),
                flow: options && options.flow,
                subscriptionId: options && options.subscriptionId,
            });
            if (!payload.url) throw new Error('Billing portal did not return a URL.');
            window.location.assign(payload.url);
        },
        createInvoice: async function (details) {
            return callFunction('create-invoice', details);
        },
    };
})();
