import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, User, KeyRound, CheckCircle2, AlertCircle, Save, Eye, EyeOff } from 'lucide-react';

const AdminProfile = () => {
    const { user, updateProfile } = useAuth();

    // Profile form state
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
    const [profileErrorMsg, setProfileErrorMsg] = useState('');

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [isSavingPass, setIsSavingPass] = useState(false);
    const [passSuccessMsg, setPassSuccessMsg] = useState('');
    const [passErrorMsg, setPassErrorMsg] = useState('');

    // Handle profile update (Email & Name)
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileSuccessMsg('');
        setProfileErrorMsg('');

        if (!email.trim()) {
            setProfileErrorMsg('Email address cannot be empty.');
            return;
        }

        setIsSavingProfile(true);
        try {
            const { data, error } = await updateProfile({
                full_name: fullName.trim(),
                email: email.trim().toLowerCase()
            });

            if (error) {
                setProfileErrorMsg(error.message || 'Failed to update admin profile.');
            } else {
                setProfileSuccessMsg('Admin profile updated successfully! Use your new email on next login.');
                setTimeout(() => setProfileSuccessMsg(''), 6000);
            }
        } catch (err) {
            setProfileErrorMsg(err.message || 'Unexpected error occurred.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Handle password update
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setPassSuccessMsg('');
        setPassErrorMsg('');

        if (!newPassword) {
            setPassErrorMsg('Please enter a new password.');
            return;
        }

        if (newPassword.length < 6) {
            setPassErrorMsg('New password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPassErrorMsg('New password and confirmation do not match.');
            return;
        }

        setIsSavingPass(true);
        try {
            const { error } = await updateProfile({
                current_password: currentPassword,
                new_password: newPassword
            });

            if (error) {
                setPassErrorMsg(error.message || 'Failed to update password.');
            } else {
                setPassSuccessMsg('Admin password updated successfully! Please remember your new password.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setPassSuccessMsg(''), 6000);
            }
        } catch (err) {
            setPassErrorMsg(err.message || 'Unexpected error occurred.');
        } finally {
            setIsSavingPass(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-text-main font-outfit uppercase tracking-tight flex items-center gap-3">
                        <Shield className="text-primary" size={32} />
                        Admin Security & Profile
                    </h1>
                    <p className="text-text-muted text-sm font-outfit mt-1">
                        Manage your master administrator login email, display name, and password
                    </p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold font-outfit uppercase tracking-widest w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Master Admin Access
                </div>
            </div>

            {/* Account Status Badge */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shrink-0">
                            <User size={32} />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-primary font-outfit">Active Administrator</span>
                            <h2 className="text-2xl font-bold font-outfit tracking-wide">{user?.full_name || 'Admin User'}</h2>
                            <p className="text-slate-300 text-sm font-outfit flex items-center gap-2 mt-1">
                                <Mail size={14} className="text-slate-400" />
                                {user?.email}
                            </p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400 font-outfit bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="font-bold text-white uppercase tracking-wider mb-1">Security Notice</p>
                        <p>Changing your email or password will take effect immediately. Keep your credentials private.</p>
                    </div>
                </div>
            </div>

            {/* Twin Form Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel 1: Update Name & Email */}
                <div className="bg-white rounded-3xl border border-border p-6 md:p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Mail size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main font-outfit uppercase tracking-wider">Account Credentials</h3>
                                <p className="text-xs text-text-muted font-outfit">Update your login email and full name</p>
                            </div>
                        </div>

                        {profileSuccessMsg && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
                                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                                <span>{profileSuccessMsg}</span>
                            </div>
                        )}

                        {profileErrorMsg && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
                                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                                <span>{profileErrorMsg}</span>
                            </div>
                        )}

                        <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-text-main uppercase tracking-widest font-outfit mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Administrator Name"
                                        className="w-full px-4 py-3 pl-11 bg-gray-50 border border-border rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-outfit text-sm"
                                    />
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-main uppercase tracking-widest font-outfit mb-2">
                                    Admin Login Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@choshmazone.com"
                                        className="w-full px-4 py-3 pl-11 bg-gray-50 border border-border rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-outfit text-sm"
                                    />
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                </div>
                                <p className="text-[11px] text-text-muted font-outfit mt-2">
                                    You will use this email address to log in to the admin panel.
                                </p>
                            </div>
                        </form>
                    </div>

                    <div className="pt-6 mt-6 border-t border-border">
                        <button
                            type="submit"
                            form="profile-form"
                            disabled={isSavingProfile}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 font-outfit uppercase tracking-widest text-xs cursor-pointer"
                        >
                            {isSavingProfile ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={16} /> Save Admin Details
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Panel 2: Change Password */}
                <div className="bg-white rounded-3xl border border-border p-6 md:p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                <KeyRound size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main font-outfit uppercase tracking-wider">Change Password</h3>
                                <p className="text-xs text-text-muted font-outfit">Set a secure password for your admin account</p>
                            </div>
                        </div>

                        {passSuccessMsg && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
                                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                                <span>{passSuccessMsg}</span>
                            </div>
                        )}

                        {passErrorMsg && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
                                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                                <span>{passErrorMsg}</span>
                            </div>
                        )}

                        <form id="password-form" onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-main uppercase tracking-widest font-outfit mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPass ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password (e.g. admin123456)"
                                        className="w-full px-4 py-3 pl-11 pr-11 bg-gray-50 border border-border rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-outfit text-sm"
                                    />
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                                    >
                                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-main uppercase tracking-widest font-outfit mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPass ? 'text' : 'password'}
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="At least 6 characters"
                                        className="w-full px-4 py-3 pl-11 pr-11 bg-gray-50 border border-border rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-outfit text-sm"
                                    />
                                    <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPass(!showNewPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                                    >
                                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-main uppercase tracking-widest font-outfit mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPass ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-type new password"
                                        className="w-full px-4 py-3 pl-11 pr-11 bg-gray-50 border border-border rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-outfit text-sm"
                                    />
                                    <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                                    >
                                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="pt-6 mt-6 border-t border-border">
                        <button
                            type="submit"
                            form="password-form"
                            disabled={isSavingPass}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50 font-outfit uppercase tracking-widest text-xs cursor-pointer"
                        >
                            {isSavingPass ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Lock size={16} /> Update Password
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;

