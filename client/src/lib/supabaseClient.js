// Compatibility layer for any remaining legacy Supabase references
import api from './apiClient';

export const supabase = {
    from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null })
    }),
    storage: {
        from: () => ({
            upload: (path, file) => api.upload(file),
            getPublicUrl: (path) => ({ data: { publicUrl: path } })
        })
    }
};

export default api;
