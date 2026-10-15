import api from '../apiClient';
import { compressImage } from '../imageCompressor';

const CACHE_STORAGE_KEY = 'cz_site_settings_cache';

let settingsCache = null;
try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    if (stored) {
        settingsCache = JSON.parse(stored);
    }
} catch {
    settingsCache = null;
}

const updateLocalStorage = (data) => {
    try {
        if (data) {
            localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
        }
    } catch {}
};

export const DEFAULT_CHECKOUT_FIELD_SETTINGS = {
    name: {
        id: 'name',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true,
        enabled: true,
        section: 'shipping'
    },
    phone: {
        id: 'phone',
        label: 'Phone Number',
        placeholder: '01XXXXXXXXX (11 digits)',
        required: true,
        enabled: true,
        section: 'contact'
    },
    email: {
        id: 'email',
        label: 'Email Address',
        placeholder: '(Optional, for tracking)',
        required: false,
        enabled: true,
        section: 'contact'
    },
    address: {
        id: 'address',
        label: 'Street Address',
        placeholder: 'House, road, flat, area...',
        required: true,
        enabled: true,
        section: 'shipping'
    },
    district: {
        id: 'district',
        label: 'District',
        placeholder: 'Select District',
        required: true,
        enabled: true,
        section: 'shipping'
    },
    thana: {
        id: 'thana',
        label: 'Thana / Upazila',
        placeholder: 'Select Thana',
        required: true,
        enabled: true,
        section: 'shipping'
    },
    notes: {
        id: 'notes',
        label: 'Order Notes',
        placeholder: 'Special instructions for delivery (optional)',
        required: false,
        enabled: true,
        section: 'notes'
    }
};

export const DEFAULT_CONTACT_SETTINGS = {
    contact_title: 'Get in Touch',
    contact_description: 'Have questions about our premium eyewear or your recent order? Our dedicated support team is here to assist you.',
    contact_showroom_title: 'Visit Our Showroom',
    contact_showroom_address: '123 Vision Street, Suite 456\nDhaka, Bangladesh',
    contact_email_title: 'Email Support',
    contact_email: 'support@choshmazone.com',
    contact_phone_title: 'Call Our Hotline',
    contact_phone: '+880 1234 567890'
};

export const DEFAULT_CHOSHMAZONE_SECTION = {
    badge: 'choshmazone.com',
    title: 'The Details Define Your Vision',
    description: 'From your first boardroom pitch to unforgettable weekend celebrations, Choshma Zone equips you with the finishing touches that turn dressed into distinguished.',
    enabled: true,
    items: [
        {
            id: 'col-1',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=800&q=80',
            title: 'Precision Craft',
            caption: 'Handcrafted luxury frames',
            product_id: '',
            custom_link: ''
        },
        {
            id: 'col-2',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
            title: 'Signature Silhouette',
            caption: 'Titanium & acetate',
            product_id: '',
            custom_link: ''
        },
        {
            id: 'col-3-top',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
            title: 'Refined Optics',
            caption: 'Ultra-clear Blue Cut lenses',
            product_id: '',
            custom_link: ''
        },
        {
            id: 'col-3-bottom',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80',
            title: 'Tailored Fit',
            caption: 'Ergonomic comfort',
            product_id: '',
            custom_link: ''
        },
        {
            id: 'col-4',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80',
            title: 'Timeless Aesthetic',
            caption: 'Architectural lines',
            product_id: '',
            custom_link: ''
        },
        {
            id: 'col-5',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=800&q=80',
            title: 'Distinguished Expression',
            caption: 'Elevated every day',
            product_id: '',
            custom_link: ''
        }
    ]
};

export const settingsParams = {
    getCachedAll: () => settingsCache || [],

    getCached: (key) => {
        if (!settingsCache) return null;
        if (Array.isArray(settingsCache)) {
            const cached = settingsCache.find(s => s.key === key);
            return cached ? cached.value : null;
        }
        if (typeof settingsCache === 'object') {
            return settingsCache[key] ?? null;
        }
        return null;
    },

    fetchAll: async () => {
        return await settingsParams.getAll();
    },

    listAssets: async () => {
        return [];
    },

    getAll: async () => {
        try {
            const data = await api.get('/settings');
            settingsCache = data;
            updateLocalStorage(data);
            return data;
        } catch (error) {
            if (settingsCache) return settingsCache;
            return [];
        }
    },

    get: async (key) => {
        if (settingsCache) {
            const cached = settingsCache.find(s => s.key === key);
            if (cached) return cached.value;
        }

        try {
            const res = await api.get('/settings/' + key);
            return res?.value;
        } catch {
            return null;
        }
    },

    set: async (key, value) => {
        const strVal = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
        const data = await api.post('/settings', { key, value: strVal });

        if (settingsCache) {
            const index = settingsCache.findIndex(s => s.key === key);
            if (index > -1) {
                settingsCache[index] = { ...settingsCache[index], value: strVal };
            } else {
                settingsCache.push({ key, value: strVal });
            }
            updateLocalStorage(settingsCache);
        }

        return data;
    },

    getCheckoutFieldSettings: async () => {
        try {
            const raw = await settingsParams.get('checkout_field_settings');
            if (!raw) return DEFAULT_CHECKOUT_FIELD_SETTINGS;

            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return {
                ...DEFAULT_CHECKOUT_FIELD_SETTINGS,
                ...parsed
            };
        } catch (e) {
            return DEFAULT_CHECKOUT_FIELD_SETTINGS;
        }
    },

    saveCheckoutFieldSettings: async (fieldSettings) => {
        return await settingsParams.set('checkout_field_settings', fieldSettings);
    },

    getContactSettings: async () => {
        try {
            await settingsParams.fetchAll();
            return {
                contact_title: settingsParams.getCached('contact_title') || DEFAULT_CONTACT_SETTINGS.contact_title,
                contact_description: settingsParams.getCached('contact_description') || DEFAULT_CONTACT_SETTINGS.contact_description,
                contact_showroom_title: settingsParams.getCached('contact_showroom_title') || DEFAULT_CONTACT_SETTINGS.contact_showroom_title,
                contact_showroom_address: settingsParams.getCached('contact_showroom_address') || DEFAULT_CONTACT_SETTINGS.contact_showroom_address,
                contact_email_title: settingsParams.getCached('contact_email_title') || DEFAULT_CONTACT_SETTINGS.contact_email_title,
                contact_email: settingsParams.getCached('contact_email') || DEFAULT_CONTACT_SETTINGS.contact_email,
                contact_phone_title: settingsParams.getCached('contact_phone_title') || DEFAULT_CONTACT_SETTINGS.contact_phone_title,
                contact_phone: settingsParams.getCached('contact_phone') || DEFAULT_CONTACT_SETTINGS.contact_phone
            };
        } catch (e) {
            console.warn('[Settings] Failed to fetch contact settings:', e);
            return DEFAULT_CONTACT_SETTINGS;
        }
    },

    saveContactSettings: async (contactSettings) => {
        const promises = Object.entries(contactSettings).map(([key, val]) =>
            settingsParams.set(key, val)
        );
        return await Promise.all(promises);
    },

    getChoshmazoneSection: async () => {
        try {
            const raw = await settingsParams.get('choshmazone_section');
            if (!raw) return DEFAULT_CHOSHMAZONE_SECTION;
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const rawItems = Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : DEFAULT_CHOSHMAZONE_SECTION.items;
            const items = rawItems.map(savedItem => {
                const def = DEFAULT_CHOSHMAZONE_SECTION.items.find(d => d.id === savedItem.id) || {};
                return {
                    product_id: '',
                    custom_link: '',
                    ...def,
                    ...savedItem
                };
            });

            return {
                ...DEFAULT_CHOSHMAZONE_SECTION,
                ...parsed,
                items
            };
        } catch (e) {
            console.warn('[Settings] Failed to fetch choshmazone_section:', e);
            return DEFAULT_CHOSHMAZONE_SECTION;
        }
    },

    saveChoshmazoneSection: async (sectionData) => {
        return await settingsParams.set('choshmazone_section', sectionData);
    },

    uploadAsset: async (file, path = 'site-assets') => {
        let uploadFile = file;
        const isVideo = file.type && (file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name));

        if (!isVideo && file.type && file.type.startsWith('image/')) {
            try {
                const isBanner = path.includes('banner') || (file.name && file.name.toLowerCase().includes('banner'));
                uploadFile = await compressImage(file, {
                    maxWidth: isBanner ? 1920 : 1200,
                    maxHeight: isBanner ? 1080 : 1200,
                    maxSizeBytes: isBanner ? 250 * 1024 : 150 * 1024
                });
            } catch (err) {
                console.warn('Image compression skipped, using original file:', err);
                uploadFile = file;
            }
        }

        const res = await api.upload(uploadFile);
        return res.url;
    }
};

export default settingsParams;
