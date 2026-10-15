// Compatibility layer for any remaining legacy Supabase references
import api from './apiClient';

const createChannelObj = () => {
    const ch = {
        on: () => ch,
        subscribe: (cb) => {
            if (typeof cb === 'function') cb('SUBSCRIBED');
            return ch;
        }
    };
    return ch;
};

export const supabase = {
    from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null })
        })
    }),
    storage: {
        from: () => ({
            upload: async (pathOrFile, maybeFile) => {
                const fileToUpload = (maybeFile instanceof File || maybeFile instanceof Blob) ? maybeFile : pathOrFile;
                try {
                    const res = await api.upload(fileToUpload);
                    return { data: { path: res.url, publicUrl: res.url }, error: null };
                } catch (err) {
                    return { data: null, error: err };
                }
            },
            getPublicUrl: (path) => ({
                data: { publicUrl: path && path.startsWith('http') ? path : (path && path.startsWith('/') ? path : `/uploads/${path}`) }
            }),
            list: () => Promise.resolve({ data: [], error: null })
        })
    },
    channel: () => createChannelObj(),
    removeChannel: () => {}
};

export default api;
