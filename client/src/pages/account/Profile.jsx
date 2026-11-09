import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/apiClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { User, Mail, Shield, LogOut, Lock, KeyRound, Save, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const UserProfile = () => {
    const { user, signOut, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [isSavingPass, setIsSavingPass] = useState(false);
    const [passMsg, setPassMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user]);

    const getProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            const userData = res?.user || user;
            setProfile(userData);
            setFullName(userData.full_name || '');
            setEmail(userData.email || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileMsg({ text: '', type: '' });

        if (!email.trim()) {
            setProfileMsg({ text: 'Email is required', type: 'error' });
            return;
        }

        setIsSavingProfile(true);
        try {
            const { error } = await updateProfile({
                full_name: fullName.trim(),
                email: email.trim().toLowerCase()
            });

            if (error) {
                setProfileMsg({ text: error.message || 'Failed to update profile', type: 'error' });
            } else {
                setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
                setTimeout(() => setProfileMsg({ text: '', type: '' }), 5000);
            }
        } catch (err) {
            setProfileMsg({ text: err.message || 'Error updating profile', type: 'error' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setPassMsg({ text: '', type: '' });

        if (!newPassword) {
            setPassMsg({ text: 'Please enter a new password', type: 'error' });
            return;
        }

        if (newPassword.length < 6) {
            setPassMsg({ text: 'New password must be at least 6 characters', type: 'error' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPassMsg({ text: 'Passwords do not match', type: 'error' });
            return;
        }

        setIsSavingPass(true);
        try {
            const { error } = await updateProfile({
                current_password: currentPassword,
                new_password: newPassword
            });

            if (error) {
                setPassMsg({ text: error.message || 'Failed to update password', type: 'error' });
            } else {
                setPassMsg({ text: 'Password updated successfully!', type: 'success' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setPassMsg({ text: '', type: '' }), 5000);
            }
        } catch (err) {
            setPassMsg({ text: err.message || 'Error updating password', type: 'error' });
        } finally {
            setIsSavingPass(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <User size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-wider">Account Settings</h1>
                                <p className="text-text-muted text-sm font-outfit">Manage your personal information and security</p>
                            </div>
                        </div>

                        <span className="inline-flex items-center px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider font-outfit">
                            {profile?.role || 'Customer'}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Personal Info Form */}
                            <div className="bg-white rounded-3xl border border-border/60 shadow-xl shadow-black/5 p-8 flex flex-col justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-text-main font-outfit uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Mail size={18} className="text-primary" /> Personal Information
                                    </h2>
                                    <p className="text-xs text-text-muted font-outfit mb-6">Update your contact details</p>

                                    {profileMsg.text && (
                                        <div className={`mb-4 p-3 rounded-xl text-xs font-outfit flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                            {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                            {profileMsg.text}
                                        </div>
                                    )}

                                    <form id="profile-edit-form" onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-text-main uppercase tracking-widest font-outfit mb-1.5">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl focus:bg-white focus:border-primary outline-none font-outfit text-sm transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-text-main uppercase tracking-widest font-outfit mb-1.5">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl focus:bg-white focus:border-primary outline-none font-outfit text-sm transition-all"
                                            />
                                        </div>
                                    </form>
                                </div>

                                <div className="pt-6 mt-6 border-t border-border">
                                    <button
                                        type="submit"
                                        form="profile-edit-form"
                                        disabled={isSavingProfile}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all text-xs font-outfit uppercase tracking-widest shadow-md shadow-primary/20 disabled:opacity-50"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                            </div>

                            {/* Password Form */}
                            <div className="bg-white rounded-3xl border border-border/60 shadow-xl shadow-black/5 p-8 flex flex-col justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-text-main font-outfit uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <KeyRound size={18} className="text-amber-500" /> Change Password
                                    </h2>
                                    <p className="text-xs text-text-muted font-outfit mb-6">Ensure your account remains safe</p>

                                    {passMsg.text && (
                                        <div className={`mb-4 p-3 rounded-xl text-xs font-outfit flex items-center gap-2 ${passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                            {passMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                            {passMsg.text}
                                        </div>
                                    )}

                                    <form id="pass-edit-form" onSubmit={handleUpdatePassword} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-text-main uppercase tracking-widest font-outfit mb-1.5">
                                                Current Password
                                            </label>
                                            <input
                                                type={showPass ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Enter current password"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl focus:bg-white focus:border-primary outline-none font-outfit text-sm transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-text-main uppercase tracking-widest font-outfit mb-1.5">
                                                New Password
                                            </label>
                                            <input
                                                type={showPass ? 'text' : 'password'}
                                                required
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Min 6 characters"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl focus:bg-white focus:border-primary outline-none font-outfit text-sm transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-text-main uppercase tracking-widest font-outfit mb-1.5">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type={showPass ? 'text' : 'password'}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl focus:bg-white focus:border-primary outline-none font-outfit text-sm transition-all"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="text-xs text-text-muted hover:text-text-main flex items-center gap-1 font-outfit"
                                        >
                                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />} {showPass ? 'Hide' : 'Show'} passwords
                                        </button>
                                    </form>
                                </div>

                                <div className="pt-6 mt-6 border-t border-border">
                                    <button
                                        type="submit"
                                        form="pass-edit-form"
                                        disabled={isSavingPass}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-xs font-outfit uppercase tracking-widest shadow-md shadow-black/10 disabled:opacity-50"
                                    >
                                        <Lock size={16} /> Update Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 flex justify-end">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all font-outfit uppercase tracking-widest text-xs"
                        >
                            <LogOut size={16} />
                            Sign Out Account
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default UserProfile;
