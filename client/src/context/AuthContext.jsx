import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { getAuthToken, setAuthToken } from '../lib/apiClient';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'admin' | 'customer' | null
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // Check token and initialize user on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = getAuthToken();
            if (!token) {
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/auth/me');
                if (res && res.user) {
                    setUser(res.user);
                    setRole(res.user.role || 'customer');
                } else {
                    setAuthToken(null);
                    setUser(null);
                    setRole(null);
                }
            } catch (err) {
                setAuthToken(null);
                setUser(null);
                setRole(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        const handleUnauthorized = () => {
            setAuthToken(null);
            setUser(null);
            setRole(null);
        };

        window.addEventListener('cz:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('cz:unauthorized', handleUnauthorized);
    }, []);

    // Sign in (Customer or Admin)
    const signIn = async (email, password) => {
        try {
            setLoading(true);
            const res = await api.post('/auth/login', { email, password });
            if (res && res.token) {
                setAuthToken(res.token);
                setUser(res.user);
                setRole(res.user.role || 'customer');
                showToast('Welcome back, ' + (res.user.full_name || 'User') + '!', 'success');
                return { data: res, error: null };
            }
            throw new Error('Login failed');
        } catch (error) {
            showToast(error.message || 'Invalid email or password', 'error');
            return { data: null, error };
        } finally {
            setLoading(false);
        }
    };

    // Sign up
    const signUp = async (email, password, fullName = '') => {
        try {
            setLoading(true);
            const res = await api.post('/auth/register', { email, password, full_name: fullName });
            if (res && res.token) {
                setAuthToken(res.token);
                setUser(res.user);
                setRole(res.user.role || 'customer');
                showToast('Account created successfully!', 'success');
                return { data: res, error: null };
            }
            throw new Error('Registration failed');
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
            return { data: null, error };
        } finally {
            setLoading(false);
        }
    };

    // Sign out
    const signOut = async () => {
        setAuthToken(null);
        setUser(null);
        setRole(null);
        showToast('Logged out successfully', 'info');
        return { error: null };
    };

    // Update profile
    const updateProfile = async (updates) => {
        try {
            const res = await api.put('/auth/profile', updates);
            if (res && res.user) {
                setUser(res.user);
                showToast('Profile updated!', 'success');
                return { data: res.user, error: null };
            }
        } catch (err) {
            showToast(err.message || 'Profile update failed', 'error');
            return { data: null, error: err };
        }
    };

    const value = {
        user,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
