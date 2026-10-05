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

export const settingsParams = {
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

    uploadAsset: async (file, path = 'site-assets') => {
        const isBanner = path.includes('banner') || (file.name && file.name.toLowerCase().includes('banner'));
        const compressedFile = await compressImage(file, {
            maxWidth: isBanner ? 1920 : 1200,
            maxHeight: isBanner ? 1080 : 1200,
            maxSizeBytes: isBanner ? 250 * 1024 : 150 * 1024
        });

        const res = await api.upload(compressedFile);
        return res.url;
    }
};

export default settingsParams;
