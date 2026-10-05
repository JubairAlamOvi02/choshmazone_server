import api from '../apiClient';
import { cacheManager } from '../cache';
import { compressImage } from '../imageCompressor';

export const productParams = {
    fetchAll: async (activeOnly = false) => {
        const cacheKey = 'products_' + (activeOnly ? 'active' : 'all');
        const cachedData = cacheManager.get(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const data = await api.get('/products', { activeOnly: activeOnly ? 'true' : 'false' });

        // Cache for 5 minutes
        cacheManager.set(cacheKey, data, 1000 * 60 * 5);
        return data;
    },

    fetchById: async (id) => {
        return await api.get('/products/' + id);
    },

    fetchByCategory: async (category) => {
        return await api.get('/products', { category, activeOnly: 'true' });
    },

    create: async (productData) => {
        const data = await api.post('/products', productData);
        cacheManager.invalidatePattern('products_');
        return data;
    },

    update: async (id, updateData) => {
        const data = await api.put('/products/' + id, updateData);
        cacheManager.invalidatePattern('products_');
        return data;
    },

    delete: async (id) => {
        const data = await api.delete('/products/' + id);
        cacheManager.invalidatePattern('products_');
        return data;
    },

    uploadImage: async (file) => {
        const compressedFile = await compressImage(file, {
            maxWidth: 1200,
            maxHeight: 1200,
            maxSizeBytes: 200 * 1024
        });

        const res = await api.upload(compressedFile);
        return res.url;
    }
};

export default productParams;
