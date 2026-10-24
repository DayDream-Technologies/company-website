export function mapInvoiceStatus(stripeStatus) {
    switch (stripeStatus) {
        case 'draft':
            return 'draft';
        case 'open':
            return 'sent';
        case 'paid':
            return 'paid';
        case 'void':
        case 'uncollectible':
            return 'void';
        default:
            return 'sent';
    }
}

export function subscriptionPriceId(subscription) {
    const item = subscription && subscription.items && subscription.items.data && subscription.items.data[0];
    if (!item || !item.price) return null;
    return typeof item.price === 'string' ? item.price : item.price.id || null;
}

export function periodBounds(subscription) {
    const item = subscription && subscription.items && subscription.items.data && subscription.items.data[0];
    const start = (subscription && subscription.current_period_start) || (item && item.current_period_start) || null;
    const end = (subscription && subscription.current_period_end) || (item && item.current_period_end) || null;
    return {
        current_period_start: start ? new Date(start * 1000).toISOString() : null,
        current_period_end: end ? new Date(end * 1000).toISOString() : null,
    };
}

export function unixToIso(seconds) {
    if (!seconds) return null;
    return new Date(seconds * 1000).toISOString();
}
