import api from '../apiClient';

export const categoryParams = {
    fetchAll: async () => {
        const data = await api.get('/categories');
        return data || [];
    },

    fetchActive: async () => {
        const data = await api.get('/categories', { activeOnly: 'true' });
        return data || [];
    },

    create: async (categoryData) => {
        return await api.post('/categories', {
            ...categoryData,
            is_active: categoryData.is_active !== undefined ? categoryData.is_active : true
        });
    },

    update: async (id, updateData) => {
        return await api.put('/categories/' + id, updateData);
    },

    toggleActive: async (id, currentStatus) => {
        const newStatus = currentStatus === false ? true : false;
        return await categoryParams.update(id, { is_active: newStatus });
    },

    delete: async (id) => {
        return await api.delete('/categories/' + id);
    }
};

export default categoryParams;
