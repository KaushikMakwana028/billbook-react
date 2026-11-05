import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/authSlice';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const Register = () => {
  const [step, setStep] = useState(1); // 1: Email + Mobile, 2: Details + OTP
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Step 1: Initiate Registration
  const handleInitiate = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanMobile = mobile.trim();

    if (!cleanEmail || !cleanMobile) {
      toast.error('Email and mobile number are required.');
      return;
    }
    if (cleanMobile.length !== 10 || !/^\d+$/.test(cleanMobile)) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.registerUser(cleanEmail, cleanMobile);
      if (res.status) {
        toast.success(res.message || 'OTP sent successfully!');
        if (res.data?.otp) {
          setOtp(res.data.otp);
        }
        setStep(2);
      } else {
        toast.error(res.message || 'Registration failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete Registration with OTP & Profile
  const handleComplete = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the OTP.');
      return;
    }
    if (!fullName.trim() || !businessName.trim()) {
      toast.error('Please enter your full name and business name.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        mobile: mobile.trim(),
        otp: otp.trim(),
        full_name: fullName.trim(),
        business_name: businessName.trim(),
        email: email.trim(),
      };

      const res = await authService.verifyRegisterOtp(payload);
      if (res.status && res.data?.token) {
        toast.success('Registration successful! Welcome to BillBook.');
        dispatch(
          setCredentials({
            token: res.data.token,
            user: res.data.user,
          })
        );
        navigate('/');
      } else {
        toast.error(res.message || 'Could not verify OTP.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="logo">B</div>
          <div>
            <h2 className="text-xl font-bold leading-tight text-[var(--ink)]">BillBook</h2>
            <p className="text-xs text-[var(--mut)]">Modern Billing & Invoicing Suite</p>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">
            {step === 1 ? 'Register New Store' : 'Complete Setup'}
          </h1>
          <p className="text-xs text-[var(--mut)] mt-1">
            {step === 1
              ? 'Start generating invoices and managing sales in minutes.'
              : `Enter the OTP sent to +91 ${mobile} and your business details.`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleInitiate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="auth-input"
                placeholder="store@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="phone-input-group">
                <span className="phone-prefix">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  className="phone-input"
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-b w-full justify-center text-sm font-semibold !h-11 mt-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Sending OTP...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Send Verification Code</span>
                  <i className="bi bi-arrow-right"></i>
                </span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                className="auth-input text-center font-mono text-lg tracking-widest font-bold"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                Your Full Name
              </label>
              <input
                type="text"
                className="auth-input"
                placeholder="Kaushik Makwana"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                Business / Store Name
              </label>
              <input
                type="text"
                className="auth-input"
                placeholder="Kaushik Electronics"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-b w-full justify-center text-sm font-semibold !h-11 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating Account...
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-xs text-[var(--mut)] hover:underline text-center pt-1"
            >
              Back to change email/mobile
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-[var(--line)] text-center text-xs text-[var(--mut)]">
          Already have a registered account?{' '}
          <Link to="/login" className="font-semibold text-[var(--blue)] hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
