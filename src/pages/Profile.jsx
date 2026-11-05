import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser, logoutUser } from '../redux/authSlice';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    email: '',
    mobile: '',
    address: '',
    instagram: '',
    facebook: '',
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch latest profile from API
  const loadProfile = async () => {
    setFetching(true);
    try {
      const res = await authService.getMyProfile();
      if (res.status && res.data) {
        const u = res.data;
        setFormData({
          name: u.name || '',
          business_name: u.business_name || '',
          email: u.email || '',
          mobile: u.mobile || '',
          address: u.address || '',
          instagram: u.instagram || '',
          facebook: u.facebook || '',
        });
        setPreviewImage(u.profile_image || u.image || null);
        dispatch(updateUser(u));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load profile details.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMobileChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: clean }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Profile image size must be less than 2MB.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Full Name is required.');
      return;
    }
    if (!formData.business_name.trim()) {
      toast.error('Business / Store Name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please provide a valid email address.');
      return;
    }
    if (formData.mobile.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    try {
      let payload;
      if (selectedFile) {
        payload = new FormData();
        payload.append('full_name', formData.name.trim());
        payload.append('business_name', formData.business_name.trim());
        payload.append('email', formData.email.trim());
        payload.append('mobile', formData.mobile.trim());
        payload.append('address', formData.address.trim());
        payload.append('instagram', formData.instagram.trim());
        payload.append('facebook', formData.facebook.trim());
        payload.append('profile_image', selectedFile);
      } else {
        payload = {
          full_name: formData.name.trim(),
          business_name: formData.business_name.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.trim(),
          address: formData.address.trim(),
          instagram: formData.instagram.trim(),
          facebook: formData.facebook.trim(),
        };
      }

      const res = await authService.updateMyProfile(payload);
      if (res.status && res.data) {
        toast.success(res.message || 'Profile updated successfully!');
        dispatch(updateUser(res.data));
        setPreviewImage(res.data.profile_image || res.data.image || previewImage);
        setSelectedFile(null);
      } else {
        toast.error(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    dispatch(logoutUser());
    toast.success('Signed out successfully.');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'BB';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (fetching) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-24 w-full rounded-2xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-5">
            <div className="skeleton h-64 w-full rounded-2xl"></div>
            <div className="skeleton h-44 w-full rounded-2xl"></div>
          </div>
          <div className="lg:col-span-8">
            <div className="skeleton h-96 w-full rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header / Banner ── */}
      <div className="card2 !p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
              Store & Business Profile
            </h1>
            <span className="pill !text-xs !py-0.5 !px-2.5">Active</span>
          </div>
          <p className="text-xs text-[var(--mut)] mt-1">
            Manage your store identification, contact details, branding, and billing preferences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadProfile}
            className="chip text-xs hover:border-[var(--blue)] transition-colors"
            title="Reload profile"
          >
            <i className="bi bi-arrow-clockwise text-sm text-[var(--blue)]"></i>
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="chip text-xs text-[var(--red)] hover:border-[var(--red)] transition-colors"
          >
            <i className="bi bi-box-arrow-right text-sm"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── Main Profile Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Avatar & Summary Snapshot (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Avatar Snapshot Card */}
          <div className="card2 text-center flex flex-col items-center">
            <div className="relative group my-2">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[var(--card)] shadow-lg bg-[var(--soft)] flex items-center justify-center">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt={formData.name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-[var(--blue)]">
                    {getInitials(formData.name)}
                  </span>
                )}
              </div>

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                title="Change Profile Photo"
              >
                <i className="bi bi-camera text-xl mb-0.5"></i>
                <span className="text-[10px] font-semibold">Change</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
              />
            </div>

            <h2 className="text-lg font-bold text-[var(--ink)] mt-2">
              {formData.name || 'Store Owner'}
            </h2>
            <p className="text-xs text-[var(--mut)]">
              {formData.business_name || 'Business Account'}
            </p>

            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[var(--blue)] border border-blue-200/50 dark:border-blue-800/40">
              <i className="bi bi-shield-check"></i>
              <span>Store Administrator</span>
            </span>

            <div className="w-full mt-6 pt-5 border-t border-[var(--line)] space-y-2.5 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--mut)]">Mobile:</span>
                <b className="text-[var(--ink)]">+91 {formData.mobile}</b>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--mut)]">Email:</span>
                <span className="text-[var(--ink)] truncate max-w-[170px]" title={formData.email}>
                  {formData.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--mut)]">Member Since:</span>
                <span className="text-[var(--ink)]">{user?.created_on || 'March 2026'}</span>
              </div>
            </div>
          </div>

          {/* Account Security & Fast Links Card */}
          <div className="card2">
            <div className="h">
              <div>
                <b>Security & Authentication</b>
                <small>Connected login method</small>
              </div>
              <i className="bi bi-shield-lock text-lg text-emerald-500"></i>
            </div>

            <div className="p-3 rounded-xl bg-[var(--soft)] border border-[var(--line)] text-xs space-y-2 mb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <i className="bi bi-check-circle-fill"></i>
                <span>OTP Login Enabled</span>
              </div>
              <p className="text-[11px] text-[var(--mut)] leading-relaxed">
                Logins require a 6-digit one-time code sent directly to your verified mobile number.
              </p>
            </div>

            <div className="text-[11px] text-[var(--mut)] flex items-center justify-between">
              <span>Account ID:</span>
              <span className="font-mono font-semibold text-[var(--ink)]">#{user?.id || '5'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form (8 cols) */}
        <div className="lg:col-span-8">
          <div className="card2">
            <div className="h">
              <div>
                <b>Edit Business & Personal Details</b>
                <small>Updates will reflect on invoices and headers instantly</small>
              </div>
              <i className="bi bi-pencil-square text-lg text-[var(--blue)]"></i>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="e.g. Makwana Kaushik"
                    required
                  />
                </div>

                {/* Business / Shop Name */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                    Business / Store Name
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    className="auth-input font-medium"
                    placeholder="e.g. KAUSHIK Electronics"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="e.g. store@example.com"
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="phone-input-group">
                    <span className="phone-prefix">+91</span>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleMobileChange}
                      className="phone-input"
                      placeholder="9876543210"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Store Address */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                  Store / Office Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  className="auth-input !h-auto py-2.5"
                  placeholder="Street, Landmark, City, State, Pincode"
                />
              </div>

              {/* Social Media Links */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="bi bi-globe2 text-[var(--blue)]"></i>
                  <span>Social Profiles & Online Links (Optional)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--mut)] mb-1">
                      Instagram Handle
                    </label>
                    <div className="flex items-center rounded-xl border border-[var(--line)] bg-[var(--soft)] overflow-hidden focus-within:border-[var(--blue)] focus-within:ring-2 focus-within:ring-[var(--blue)]/20 transition-all">
                      <span className="px-3 text-rose-500 text-sm">
                        <i className="bi bi-instagram"></i>
                      </span>
                      <input
                        type="text"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        className="flex-1 bg-transparent border-0 outline-none py-2 text-xs text-[var(--ink)]"
                        placeholder="e.g. @your_store"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--mut)] mb-1">
                      Facebook Page
                    </label>
                    <div className="flex items-center rounded-xl border border-[var(--line)] bg-[var(--soft)] overflow-hidden focus-within:border-[var(--blue)] focus-within:ring-2 focus-within:ring-[var(--blue)]/20 transition-all">
                      <span className="px-3 text-blue-600 text-sm">
                        <i className="bi bi-facebook"></i>
                      </span>
                      <input
                        type="text"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleChange}
                        className="flex-1 bg-transparent border-0 outline-none py-2 text-xs text-[var(--ink)]"
                        placeholder="e.g. facebook.com/yourstore"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-6 border-t border-[var(--line)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={loadProfile}
                  disabled={loading}
                  className="chip text-xs font-medium hover:bg-[var(--soft)]"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-b text-xs font-semibold px-6 !h-10 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Saving Changes...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <i className="bi bi-check2"></i>
                      <span>Save Profile Changes</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
