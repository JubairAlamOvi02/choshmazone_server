import api from './apiClient';

const VISITOR_KEY = 'cz_visitor_id';
const SESSION_KEY = 'cz_session_id';
const SESSION_INIT_KEY = 'cz_session_init_ts';
const GEO_CACHE_KEY = 'cz_geo_cache';

let inFlightGeoPromise = null;
export const getGeoInfo = async () => {
    if (typeof window === 'undefined') return null;

    try {
        const cached = sessionStorage.getItem(GEO_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch {}

    if (inFlightGeoPromise) return inFlightGeoPromise;

    inFlightGeoPromise = (async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const res = await fetch('https://ipwho.is/', { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error('Geo fetch failed');
            const data = await res.json();

            if (data && data.success !== false) {
                const geo = {
                    ip: data.ip || '',
                    city: data.city || 'Unknown City',
                    region: data.region || '',
                    country: data.country || 'Unknown Country',
                    countryCode: data.country_code || '',
                    latitude: data.latitude || null,
                    longitude: data.longitude || null,
                    flag: data.flag?.emoji || '🌐',
                    isp: data.connection?.isp || data.connection?.org || 'Unknown ISP',
                    asn: data.connection?.asn || null
                };
                try {
                    sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geo));
                } catch {}
                return geo;
            }
        } catch {}
        return null;
    })();

    return inFlightGeoPromise;
};

export const getOrCreateVisitorId = () => {
    if (typeof window === 'undefined') return 'server';
    let visitorId = localStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
        visitorId = 'vis_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
        localStorage.setItem(VISITOR_KEY, visitorId);
    }
    return visitorId;
};

export const getOrCreateSessionId = () => {
    if (typeof window === 'undefined') return 'server_session';
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = 'ses_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
        sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
};

export const getDeviceType = () => {
    if (typeof window === 'undefined') return 'desktop';
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return 'mobile';
    return 'desktop';
};

export const getBrowserName = () => {
    if (typeof window === 'undefined') return 'Unknown';
    const ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Trident') > -1) return 'Internet Explorer';
    if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    return 'Other';
};

export const getOS = () => {
    if (typeof window === 'undefined') return 'Unknown';
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'macOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('like Mac') > -1) return 'iOS';
    return 'Other';
};

export const initSession = async (user = null) => {
    if (typeof window === 'undefined') return;

    try {
        const sessionId = getOrCreateSessionId();
        const visitorId = getOrCreateVisitorId();
        const geo = await getGeoInfo();

        await api.post('/analytics/session', {
            session_id: sessionId,
            visitor_id: visitorId,
            first_page: window.location.pathname,
            last_page: window.location.pathname,
            referrer: document.referrer || '',
            device_type: getDeviceType(),
            browser: getBrowserName(),
            operating_system: getOS(),
            ip_address: geo?.ip || '',
            city: geo?.city || '',
            region: geo?.region || '',
            country: geo?.country || '',
            isp: geo?.isp || ''
        });
    } catch (e) {
        // Silently handle
    }
};

export const trackEvent = async (eventType, metadata = {}) => {
    if (typeof window === 'undefined') return;

    try {
        const sessionId = getOrCreateSessionId();
        const visitorId = getOrCreateVisitorId();

        await api.post('/analytics/event', {
            session_id: sessionId,
            visitor_id: visitorId,
            event_type: eventType,
            path: window.location.pathname,
            page_title: document.title || '',
            metadata,
            device_type: getDeviceType()
        });
    } catch (e) {
        // Silently handle
    }
};

export const trackPageView = (path) => trackEvent('page_view', { path });
export const trackProductView = (product) => trackEvent('view_product', { product_id: product?.id, name: product?.name, price: product?.price });
export const trackAddToCart = (product, quantity = 1) => trackEvent('add_to_cart', { product_id: product?.id, name: product?.name, quantity, price: product?.price });
export const trackRemoveFromCart = (product) => trackEvent('remove_from_cart', { product_id: product?.id, name: product?.name });
export const trackInitiateCheckout = (cartItems, total) => trackEvent('initiate_checkout', { items_count: cartItems?.length, total_amount: total });
export const trackPurchase = (orderData) => trackEvent('purchase', orderData);
export const trackWishlistAdd = (product) => trackEvent('wishlist_add', { product_id: product?.id, name: product?.name });


export const touchSession = async (path = '/') => {
    try {
        const sessionId = getOrCreateSessionId();
        const visitorId = getOrCreateVisitorId();
        await api.post('/analytics/session', {
            session_id: sessionId,
            visitor_id: visitorId,
            last_page: path
        });
    } catch {
        // Non-critical
    }
};
