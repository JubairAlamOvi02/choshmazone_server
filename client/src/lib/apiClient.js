/**
 * REST API Client for Choshmazone Custom VPS Backend
 * Replaces Supabase SDK with standard HTTP fetch calls
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export const getAuthToken = () => {
    return localStorage.getItem('cz_auth_token');
};

export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('cz_auth_token', token);
    } else {
        localStorage.removeItem('cz_auth_token');
    }
};

const request = async (endpoint, options = {}) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const url = API_BASE + '/api' + cleanEndpoint;
    const token = getAuthToken();

    const headers = {
        'Accept': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('cz:unauthorized'));
    }

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const errorMsg = (data && data.error) || response.statusText || 'API Request Failed';
        const err = new Error(errorMsg);
        err.status = response.status;
        err.data = data;
        throw err;
    }

    return data;
};

export const api = {
    get: (endpoint, params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null) {
                query.append(key, val);
            }
        });
        const qs = query.toString();
        return request(endpoint + (qs ? '?' + qs : ''), { method: 'GET' });
    },

    post: (endpoint, body) => {
        return request(endpoint, { method: 'POST', body });
    },

    put: (endpoint, body) => {
        return request(endpoint, { method: 'PUT', body });
    },

    delete: (endpoint) => {
        return request(endpoint, { method: 'DELETE' });
    },

    upload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return request('/upload', {
            method: 'POST',
            body: formData
        });
    }
};

export default api;
