import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/apiClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            try {
                const local = localStorage.getItem('cz_guest_wishlist');
                setWishlist(local ? JSON.parse(local) : []);
            } catch {
                setWishlist([]);
            }
        }
    }, [user]);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const data = await api.get('/wishlist');
            const formatted = (data || []).map(item => ({
                wishlist_id: item.wishlist_id || item.id,
                ...item,
                title: item.name,
                image: item.image_url
            }));
            setWishlist(formatted);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => (item.id === productId || item.product_id === productId));
    };

    const addToWishlist = async (product) => {
        if (!product) return;

        if (isInWishlist(product.id)) {
            showToast('Item already in wishlist', 'info');
            return;
        }

        if (user) {
            try {
                await api.post('/wishlist/' + product.id);
                setWishlist(prev => [
                    { ...product, wishlist_id: 'w_' + Date.now(), title: product.name, image: product.image_url },
                    ...prev
                ]);
                showToast('Added to wishlist', 'success');
            } catch (err) {
                showToast('Failed to add to wishlist', 'error');
            }
        } else {
            const updated = [
                { ...product, wishlist_id: 'guest_' + Date.now(), title: product.name, image: product.image_url },
                ...wishlist
            ];
            setWishlist(updated);
            localStorage.setItem('cz_guest_wishlist', JSON.stringify(updated));
            showToast('Added to wishlist', 'success');
        }
    };

    const removeFromWishlist = async (productId) => {
        if (user) {
            try {
                await api.delete('/wishlist/' + productId);
                setWishlist(prev => prev.filter(item => item.id !== productId && item.product_id !== productId));
                showToast('Removed from wishlist', 'info');
            } catch (err) {
                showToast('Failed to remove from wishlist', 'error');
            }
        } else {
            const updated = wishlist.filter(item => item.id !== productId && item.product_id !== productId);
            setWishlist(updated);
            localStorage.setItem('cz_guest_wishlist', JSON.stringify(updated));
            showToast('Removed from wishlist', 'info');
        }
    };

    const toggleWishlist = (product) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    return (
        <WishlistContext.Provider value={{
            wishlist,
            loading,
            isInWishlist,
            addToWishlist,
            removeFromWishlist,
            toggleWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export default WishlistContext;
