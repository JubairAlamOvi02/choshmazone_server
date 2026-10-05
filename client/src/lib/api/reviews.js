import api from '../apiClient';

export const reviewParams = {
    fetchByProduct: async (productId) => {
        try {
            return await api.get('/reviews/product/' + productId);
        } catch (err) {
            console.error('[Reviews Fetch Error]:', err);
            return [];
        }
    },

    create: async (reviewData) => {
        return await api.post('/reviews', reviewData);
    }
};

export default reviewParams;
