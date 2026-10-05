import api from '../apiClient';
import { cacheManager } from '../cache';

export const orderParams = {
    create: async (orderData, items) => {
        const order = await api.post('/orders', {
            ...orderData,
            items
        });
        cacheManager.invalidatePattern('recent_purchased_');
        return order;
    },

    fetchRecentPurchased: async (limit = 4) => {
        const cacheKey = 'recent_purchased_' + limit;
        const cached = cacheManager.get(cacheKey);
        if (cached) return cached;

        try {
            const data = await api.get('/orders/recent-purchased', { limit });
            cacheManager.set(cacheKey, data, 1000 * 60 * 3);
            return data || [];
        } catch (err) {
            console.error('Error fetching recent purchased products:', err);
            return [];
        }
    },

    trackOrder: async (query) => {
        return await api.get('/orders/track', { query });
    },

    fetchByUserId: async () => {
        return await api.get('/orders/my');
    },

    fetchAll: async () => {
        return await api.get('/orders');
    },

    fetchById: async (id) => {
        return await api.get('/orders/' + id);
    },

    updateStatus: async (id, status) => {
        return await api.put('/orders/' + id + '/status', { status });
    },

    delete: async (id) => {
        return await api.delete('/orders/' + id);
    }
};

export default orderParams;
