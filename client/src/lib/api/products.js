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
    },

    uploadImages: async (files) => {
        const uploadPromises = files.map(file => productParams.uploadImage(file));
        return Promise.all(uploadPromises);
    },

    fetchRecentlyViewed: async (limit = 4, excludeId = null) => {
        const cacheKey = `global_recently_viewed_${limit}_${excludeId || 'none'}`;
        const cached = cacheManager.get(cacheKey);
        if (cached) return cached;

        try {
            const allProducts = await productParams.fetchAll(true);
            if (!allProducts || allProducts.length === 0) return [];

            const filtered = allProducts
                .filter(p => !excludeId || String(p.id) !== String(excludeId))
                .slice(0, limit)
                .map(p => ({
                    ...p,
                    title: p.name || p.title,
                    image: p.image_url || p.image,
                    images: p.images || (p.image_url ? [p.image_url] : [])
                }));

            cacheManager.set(cacheKey, filtered, 1000 * 60 * 2);
            return filtered;
        } catch (err) {
            console.error('Failed to fetch recently viewed products:', err);
            return [];
        }
    }
};

export default productParams;
