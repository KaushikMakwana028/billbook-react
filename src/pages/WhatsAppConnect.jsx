import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { whatsappService } from '../services/whatsappService';

export default function WhatsAppConnect() {
  const { user } = useSelector((state) => state.auth);

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const isLoggingOutRef = useRef(false);
  const intervalRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check connection status & update QR code
  const checkStatus = useCallback(async () => {
    if (isLoggingOutRef.current) return;

    try {
      const res = await whatsappService.getStatus();
      const isConn = Boolean(res?.data?.connected);
      setConnected(isConn);
      setLastCheck(new Date());

      if (isConn) {
        setQrCode('');
        setQrLoading(false);
      } else {
        // Fetch new QR if not connected
        setQrLoading(true);
        const qrRes = await whatsappService.getQr();
        if (qrRes?.data?.qr) {
          setQrCode(qrRes.data.qr);
        }
        if (qrRes?.data?.connected) {
          setConnected(true);
          setQrCode('');
        }
        setQrLoading(false);
      }
    } catch (err) {
      console.warn('Failed to poll WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up polling loop
  useEffect(() => {
    checkStatus();

    intervalRef.current = setInterval(() => {
      checkStatus();
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkStatus]);

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (disconnecting) return;
    if (!window.confirm('Are you sure you want to disconnect WhatsApp from BillBook?')) {
      return;
    }

    try {
      isLoggingOutRef.current = true;
      setDisconnecting(true);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      await whatsappService.logout();
      setConnected(false);
      setQrCode('');
      showToast('WhatsApp disconnected successfully.', 'info');

      // Wait a moment then restart polling for fresh QR
      setTimeout(() => {
        isLoggingOutRef.current = false;
        setDisconnecting(false);
        checkStatus();
        intervalRef.current = setInterval(checkStatus, 4000);
      }, 3500);
    } catch (err) {
      console.error('WhatsApp logout error:', err);
      showToast('Failed to disconnect WhatsApp. Please try again.', 'error');
      isLoggingOutRef.current = false;
      setDisconnecting(false);
      intervalRef.current = setInterval(checkStatus, 4000);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
              : toast.type === 'info'
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
          }`}
        >
          <i
            className={`bi ${
              toast.type === 'error'
                ? 'bi-exclamation-octagon'
                : toast.type === 'info'
                ? 'bi-info-circle'
                : 'bi-check2-circle'
            } text-base`}
          ></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--mut)] mb-1">
            <i className="bi bi-whatsapp text-[#25D366]"></i>
            <span>Automation & Messaging Gateway</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
            WhatsApp Connect
          </h1>
          <p className="text-xs text-[var(--mut)] mt-0.5">
            Link your phone to automatically send digital invoices and follow-ups to customers after every sale.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <span className="badge-chip bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              WhatsApp Connected
            </span>
          ) : (
            <span className="badge-chip bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Scan QR to Connect
            </span>
          )}
        </div>
      </div>

      {/* ── Main Connect Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Visual Mockup & Feature Highlights */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
          {/* Hero Banner Card */}
          <div className="card2 !p-6 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
              <i className="bi bi-shield-check text-base"></i>
              Official WhatsApp Integration
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--ink)] mb-2">
              Instant Bill Dispatch from Your Number
            </h2>
            <p className="text-xs text-[var(--mut)] leading-relaxed mb-4">
              Your customers receive high-definition PDF invoices directly on WhatsApp from your verified account. No separate business software required!
            </p>

            {/* Chat Mockup */}
            <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--border)] shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs">
                    <i className="bi bi-whatsapp"></i>
                  </div>
                  <div>
                    <b className="text-xs text-[var(--ink)] block leading-tight">
                      {user?.business_name || user?.name || 'My Store'}
                    </b>
                    <small className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Verified Store Sender
                    </small>
                  </div>
                </div>
                <span className="text-[10px] text-[var(--mut)]">Just now</span>
              </div>

              {/* Chat Bubble */}
              <div className="bg-emerald-500/10 dark:bg-emerald-950/40 rounded-xl p-3 border border-emerald-500/20 text-xs text-[var(--ink)] space-y-1.5">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Greetings from {user?.business_name || 'Our Store'} 👋
                </div>
                <div className="text-[11px] text-[var(--mut)]">
                  Dear Valued Customer, thank you for your order!
                </div>
                <div className="bg-white/80 dark:bg-black/30 rounded-lg p-2 text-[11px] font-mono space-y-0.5 border border-emerald-500/10">
                  <div>📄 Invoice: <b>INV-2026-0042</b></div>
                  <div>💰 Amount: <b>Rs. 1,499.00</b></div>
                </div>
                <div className="pt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <i className="bi bi-file-earmark-pdf"></i>
                  <span>invoice-42.pdf (Attached)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Three Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card2 !p-3.5 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2">
                <i className="bi bi-send text-sm"></i>
              </div>
              <div>
                <b className="text-xs text-[var(--ink)] block leading-tight mb-1">
                  One-Click Send
                </b>
                <p className="text-[10.5px] text-[var(--mut)] leading-snug">
                  Send instantly after finishing a sale or re-send from your invoices list anytime.
                </p>
              </div>
            </div>

            <div className="card2 !p-3.5 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#25D366] flex items-center justify-center mb-2">
                <i className="bi bi-phone text-sm"></i>
              </div>
              <div>
                <b className="text-xs text-[var(--ink)] block leading-tight mb-1">
                  Existing Number
                </b>
                <p className="text-[10.5px] text-[var(--mut)] leading-snug">
                  Works seamlessly with your current personal or WhatsApp Business number.
                </p>
              </div>
            </div>

            <div className="card2 !p-3.5 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2">
                <i className="bi bi-shield-lock text-sm"></i>
              </div>
              <div>
                <b className="text-xs text-[var(--ink)] block leading-tight mb-1">
                  Direct & Private
                </b>
                <p className="text-[10.5px] text-[var(--mut)] leading-snug">
                  End-to-end multi-device pairing powered by safe official protocols.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Connection Control Panel / Live QR */}
        <div className="lg:col-span-6">
          <div className="card2 !p-6 h-full flex flex-col justify-between">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs text-[var(--mut)]">Checking connection status...</div>
              </div>
            ) : connected ? (
              /* Connected State */
              <div className="flex flex-col items-center text-center justify-center py-10 space-y-6 flex-1">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-5xl">
                    <i className="bi bi-check2-circle"></i>
                  </div>
                  <span className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs ring-4 ring-[var(--card-bg)]">
                    <i className="bi bi-wifi"></i>
                  </span>
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-lg font-bold text-[var(--ink)]">
                    WhatsApp is Connected!
                  </h3>
                  <p className="text-xs text-[var(--mut)] leading-relaxed">
                    Your phone is actively linked. Invoices created in the POS will now be sent automatically or can be shared to any customer in one click.
                  </p>
                  {lastCheck && (
                    <div className="text-[11px] text-[var(--mut)] font-mono">
                      Last verified active: {lastCheck.toLocaleTimeString()}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm justify-center">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="btn-danger w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:opacity-90"
                  >
                    {disconnecting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Disconnecting...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-power"></i>
                        <span>Disconnect WhatsApp</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={checkStatus}
                    className="chip px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Refresh connection status"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                    <span>Verify Connection</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Disconnected State / Scan QR */
              <div className="flex flex-col items-center text-center space-y-5 flex-1 justify-center">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                    Scan QR Code to Connect
                  </h3>
                  <p className="text-xs text-[var(--mut)]">
                    Pair your WhatsApp account to enable automatic customer invoice dispatch.
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="relative p-4 rounded-2xl bg-white border border-gray-200 shadow-md inline-block">
                  {qrLoading && !qrCode ? (
                    <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[11px] text-gray-500">Generating QR...</span>
                    </div>
                  ) : qrCode ? (
                    <img
                      src={qrCode}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 object-contain rounded-xl select-none"
                    />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 bg-gray-50 rounded-xl text-gray-400">
                      <i className="bi bi-qr-code text-3xl"></i>
                      <span className="text-[11px]">Waiting for QR Code...</span>
                    </div>
                  )}

                  <div className="mt-2 text-[10.5px] text-gray-400 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Auto-refreshing every 4s</span>
                  </div>
                </div>

                {/* Step by Step Instructions */}
                <div className="w-full max-w-md text-left bg-[var(--bg)] p-4 rounded-2xl border border-[var(--border)] space-y-2.5">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-[var(--ink)]">
                      Open WhatsApp on your phone and tap <b>Linked Devices</b> in Settings.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-[var(--ink)]">
                      Tap <b>Link a device</b> and point your phone camera at this QR code.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-xs text-[var(--ink)]">
                      After scanning, status will update to <b>Connected</b> automatically!
                    </p>
                  </div>
                </div>

                {/* Manual Reload Button */}
                <button
                  type="button"
                  onClick={checkStatus}
                  className="chip text-xs px-3.5 py-1.5 flex items-center gap-1.5 cursor-pointer hover:text-emerald-600"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                  <span>Reload QR</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
