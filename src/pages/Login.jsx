import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/authSlice';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Enter Mobile, 2: Enter OTP
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanMobile = mobile.trim();

    if (!cleanMobile || cleanMobile.length !== 10 || !/^\d+$/.test(cleanMobile)) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.sendLoginOtp(cleanMobile);
      if (res.status) {
        toast.success(res.message || 'OTP sent successfully!');
        if (res.data?.otp) {
          // Dev convenience
          setOtp(res.data.otp);
        }
        setStep(2);
        startCountdown();
      } else {
        toast.error(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error connecting to the server.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP & Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyLoginOtp(mobile.trim(), otp.trim());
      if (res.status && res.data?.token) {
        toast.success('Login successful! Welcome back.');
        dispatch(
          setCredentials({
            token: res.data.token,
            user: res.data.user,
          })
        );
        navigate('/');
      } else {
        toast.error(res.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to verify OTP.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const res = await authService.sendLoginOtp(mobile.trim());
      if (res.status) {
        toast.success('New OTP sent!');
        if (res.data?.otp) setOtp(res.data.otp);
        startCountdown();
      } else {
        toast.error(res.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error resending OTP.');
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
            {step === 1 ? 'Welcome Back' : 'Verify Mobile OTP'}
          </h1>
          <p className="text-xs text-[var(--mut)] mt-1">
            {step === 1
              ? 'Sign in to access your business sales and inventory.'
              : `Enter the 6-digit OTP sent to +91 ${mobile}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
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
                  autoFocus
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
                  <span>Continue with OTP</span>
                  <i className="bi bi-arrow-right"></i>
                </span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[var(--mut)] uppercase tracking-wider">
                  6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[var(--blue)] hover:underline"
                >
                  Change number
                </button>
              </div>
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
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                <i className="bi bi-info-circle"></i>
                <span>Development Mode: Fixed OTP is <b>123456</b></span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-b w-full justify-center text-sm font-semibold !h-11 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Verifying...
                </span>
              ) : (
                'Verify & Enter Dashboard'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="text-xs text-[var(--mut)] hover:text-[var(--blue)] transition-colors disabled:opacity-50"
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Didn’t receive code? Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-[var(--line)] text-center text-xs text-[var(--mut)]">
          Don't have a business account?{' '}
          <Link to="/register" className="font-semibold text-[var(--blue)] hover:underline">
            Register your store
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
