import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import invoiceService from '../services/invoiceService';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#0f172a',
  '#2563eb',
  '#059669',
  '#7c3aed',
  '#dc2626',
  '#ea580c',
  '#0891b2',
  '#1e293b',
];

const TEMPLATE_DESCRIPTIONS = {
  1: {
    name: 'Modern Slate',
    tagline: 'Clean, professional dual-tone layout with bold header & summary card.',
    badge: 'Popular',
    icon: 'bi-grid-1x2',
  },
  2: {
    name: 'Classic Corporate',
    tagline: 'Traditional invoice structure with structured borders and dense tabular alignment.',
    badge: 'Recommended',
    icon: 'bi-briefcase',
  },
  3: {
    name: 'Creative Accent',
    tagline: 'Vibrant highlight headers with spacious typography for retail and boutique stores.',
    badge: 'Creative',
    icon: 'bi-palette',
  },
  4: {
    name: 'Thermal POS Receipt',
    tagline: 'Compact, streamlined receipt format designed for rapid POS printing and thermal paper.',
    badge: 'POS Fast',
    icon: 'bi-receipt',
  },
  5: {
    name: 'Minimalist Clean',
    tagline: 'Ultra-light, borderless styling focused on typographic elegance and readability.',
    badge: 'Clean',
    icon: 'bi-file-earmark-text',
  },
  6: {
    name: 'Executive Detailed',
    tagline: 'Comprehensive invoice with full tax breakdowns, line discounts, and payment terms.',
    badge: 'Detailed',
    icon: 'bi-journal-check',
  },
};

const TemplateMiniPreview = ({ templateId, primaryColor, accentColor }) => {
  switch (templateId) {
    case 1:
      // Modern Slate / Classic standard top header
      return (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] overflow-hidden text-[9px] select-none shadow-sm">
          <div className="p-2 flex justify-between items-center text-white" style={{ background: primaryColor }}>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-white/25 flex items-center justify-center font-bold text-[7.5px]">B</div>
              <span className="font-bold tracking-wide text-[9.5px]">BILLBOOK STORE</span>
            </div>
            <span className="text-[7.5px] bg-white/20 px-1.5 py-0.5 rounded font-mono">INV-2026-0001</span>
          </div>
          <div className="p-2 space-y-1.5 bg-[var(--soft)]/40">
            <div className="flex justify-between items-center text-[7.5px] text-[var(--mut)]">
              <span className="font-semibold text-[var(--ink)]">BILL TO: Rahul Sharma</span>
              <span className="font-mono">06 Nov 2026</span>
            </div>
            <div className="rounded border border-[var(--line)] overflow-hidden">
              <div className="grid grid-cols-4 px-1.5 py-1 text-white font-bold text-[7.5px]" style={{ background: primaryColor }}>
                <span className="col-span-2">ITEM</span>
                <span className="text-center">QTY</span>
                <span className="text-right">AMT</span>
              </div>
              <div className="grid grid-cols-4 px-1.5 py-1 border-t border-[var(--line)] bg-white dark:bg-slate-800">
                <span className="col-span-2 truncate text-[var(--ink)]">Call of Duty MW-III</span>
                <span className="text-center text-[var(--mut)]">1</span>
                <span className="text-right font-semibold">5,549</span>
              </div>
              <div className="grid grid-cols-4 px-1.5 py-1 border-t border-[var(--line)] bg-slate-50/70 dark:bg-slate-800/50">
                <span className="col-span-2 truncate text-[var(--ink)]">Palworld Special</span>
                <span className="text-center text-[var(--mut)]">1</span>
                <span className="text-right font-semibold">1,170</span>
              </div>
            </div>
            <div className="pt-0.5 flex justify-between items-center">
              <span className="text-[8px] text-[var(--mut)]">TOTAL DUE:</span>
              <span className="font-bold text-[9.5px] px-2 py-0.5 rounded text-white" style={{ background: accentColor }}>
                Rs. 6,719.00
              </span>
            </div>
          </div>
        </div>
      );

    case 2:
      // Classic Corporate / Modern Sidebar Accent
      return (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] overflow-hidden text-[9px] select-none shadow-sm flex h-[132px]">
          <div className="w-[32%] p-2 text-white flex flex-col justify-between shrink-0" style={{ background: primaryColor }}>
            <div className="space-y-1">
              <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center font-bold text-[8.5px]">BB</div>
              <b className="block text-[8.5px] leading-tight font-bold">Kaushik Corp</b>
              <span className="block text-[7px] text-white/70">Ahmedabad</span>
            </div>
            <div className="text-[7px] text-white/80 border-t border-white/20 pt-1 font-semibold">
              TAX INVOICE
            </div>
          </div>
          <div className="flex-1 p-2 flex flex-col justify-between bg-white dark:bg-slate-900">
            <div>
              <div className="flex justify-between items-start border-b border-[var(--line)] pb-1 mb-1">
                <span className="font-extrabold text-[9.5px] tracking-wide" style={{ color: accentColor }}>INVOICE</span>
                <span className="font-mono text-[7.5px] text-[var(--mut)]">#INV-1864</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between text-[7.5px]">
                  <span className="text-[var(--mut)] truncate max-w-[65px]">Call of Duty</span>
                  <span className="font-semibold">Rs. 5,549</span>
                </div>
                <div className="flex justify-between text-[7.5px]">
                  <span className="text-[var(--mut)] truncate max-w-[65px]">Palworld</span>
                  <span className="font-semibold">Rs. 1,170</span>
                </div>
              </div>
            </div>
            <div className="p-1 rounded flex justify-between items-center text-white text-[8.5px] font-bold" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}>
              <span>TOTAL DUE</span>
              <span>Rs. 6,719</span>
            </div>
          </div>
        </div>
      );

    case 3:
      // Creative Accent / Clean Minimalist
      return (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-2.5 space-y-1.5 text-[9px] select-none shadow-sm">
          <div className="flex justify-between items-center border-b-2 pb-1.5" style={{ borderColor: accentColor }}>
            <div>
              <b className="text-[10px] tracking-tight block text-[var(--ink)]">BillBook Store</b>
              <span className="text-[7.5px] text-[var(--mut)]">Creative Minimal Layout</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[8.5px] font-bold block" style={{ color: primaryColor }}>#INV-1864</span>
              <span className="text-[7.5px] text-[var(--mut)]">06 Nov 2026</span>
            </div>
          </div>
          <div className="py-0.5 space-y-0.5 border-b border-dashed border-[var(--line)]">
            <div className="flex justify-between items-center text-[8px]">
              <span className="text-[var(--ink)]">1 × Call of Duty MW-III</span>
              <span className="font-medium text-[var(--mut)]">5,549.00</span>
            </div>
            <div className="flex justify-between items-center text-[8px]">
              <span className="text-[var(--ink)]">1 × Palworld Special</span>
              <span className="font-medium text-[var(--mut)]">1,170.00</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-[7.5px] uppercase tracking-wider text-[var(--mut)]">Balance Due</span>
            <span className="font-extrabold text-[10.5px]" style={{ color: primaryColor }}>
              Rs. 6,719.00
            </span>
          </div>
        </div>
      );

    case 4:
      // Thermal POS Receipt - Monospace, dashed lines, receipt paper look
      return (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-amber-50/20 dark:bg-slate-900/40 p-2 space-y-1 text-[8px] font-mono select-none shadow-inner">
          <div className="text-center border-b border-dashed border-[var(--line)] pb-1">
            <span className="font-bold tracking-widest block text-[9px] text-[var(--ink)]">*** BILLBOOK POS ***</span>
            <span className="text-[7px] text-[var(--mut)]">RECEIPT #1864 • TEL: 9099780463</span>
          </div>
          <div className="space-y-0.5 py-0.5 text-[7.5px]">
            <div className="flex justify-between">
              <span>1x COD MW-III</span>
              <span className="font-bold">5,549.00</span>
            </div>
            <div className="flex justify-between">
              <span>1x Palworld Game</span>
              <span className="font-bold">1,170.00</span>
            </div>
          </div>
          <div className="border-t border-dashed border-[var(--line)] pt-0.5 flex justify-between font-bold text-[8.5px]">
            <span>TOTAL DUE:</span>
            <span style={{ color: accentColor }}>Rs. 6,719.00</span>
          </div>
          <div className="text-center pt-0.5">
            <div className="tracking-[3px] text-[7.5px] text-[var(--mut)] font-bold opacity-70">
              ||| || | |||| | ||| ||
            </div>
            <span className="text-[6.5px] text-[var(--mut)] block">** THANK YOU FOR VISITING **</span>
          </div>
        </div>
      );

    case 5:
      // Minimalist Clean
      return (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-2 space-y-1.5 text-[8.5px] select-none shadow-sm">
          <div className="flex justify-between items-center">
            <b className="font-semibold text-[var(--ink)]">BillBook Minimal</b>
            <span className="font-mono text-[7.5px] text-[var(--mut)]">INV-001</span>
          </div>
          <div className="h-0.5 w-full bg-[var(--line)]"></div>
          <div className="space-y-0.5 text-[7.5px]">
            <div className="flex justify-between">
              <span>Items Total (2 pcs)</span>
              <span className="font-semibold">Rs. 6,719.00</span>
            </div>
          </div>
          <div className="pt-1 border-t border-[var(--line)] flex justify-between font-bold text-[9px]">
            <span>Total</span>
            <span style={{ color: accentColor }}>Rs. 6,719.00</span>
          </div>
        </div>
      );

    default:
      // Executive Detailed
      return (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-2 space-y-1 text-[8px] select-none shadow-sm">
          <div className="flex justify-between items-center border-b pb-1 font-bold" style={{ color: primaryColor }}>
            <span>EXECUTIVE TAX INVOICE</span>
            <span>#1864</span>
          </div>
          <div className="grid grid-cols-3 gap-1 py-1 text-center bg-[var(--soft)] rounded text-[7px]">
            <div>Tax: 18%</div>
            <div>Qty: 2</div>
            <div className="font-bold" style={{ color: accentColor }}>Net: 6,719</div>
          </div>
        </div>
      );
  }
};

const TemplateFullPreviewModal = ({ templateId, settings, user, onClose, onSelect }) => {
  if (!templateId) return null;

  const [scale, setScale] = useState(1);
  const info = TEMPLATE_DESCRIPTIONS[templateId] || { name: `Template #${templateId}` };
  const pc = settings.primary_color || '#0f172a';
  const ac = settings.accent_color || '#2563eb';
  const businessName = user?.business_name || user?.shop_name || 'KAUSHIK STORE';
  const businessAddress = user?.address || 'Ahmedabad, Gujarat, India';
  const businessPhone = user?.mobile || user?.phone || '9099780463';
  const logoUrl = user?.profile_image 
    ? (user.profile_image.startsWith('http') ? user.profile_image : `http://localhost/kaushik/billbook/uploads/profile/${user.profile_image}`)
    : null;
  const signatureUrl = settings.signature_url;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden h-[94vh] max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Modal Controls Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-[var(--line)] bg-[var(--card)] flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ background: ac }}></span>
            <div className="min-w-0">
              <b className="text-xs sm:text-sm font-bold text-[var(--ink)] block truncate">
                {info.name} — Full Layout Preview
              </b>
              <span className="text-[10px] text-[var(--mut)] block truncate">
                Template #{templateId} • Double-click Preview UI
              </span>
            </div>
          </div>

          {/* Center Zoom / Scale Controls */}
          <div className="hidden md:flex items-center gap-1.5 bg-[var(--soft)] px-2.5 py-1 rounded-xl border border-[var(--line)] text-xs">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.65, +(s - 0.1).toFixed(2)))}
              className="w-6 h-6 rounded-lg hover:bg-[var(--card)] flex items-center justify-center text-[var(--ink)] font-bold cursor-pointer"
              title="Zoom Out"
            >
              <i className="bi bi-dash"></i>
            </button>
            <span className="font-mono font-bold text-[11px] text-[var(--ink)] w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(1.3, +(s + 0.1).toFixed(2)))}
              className="w-6 h-6 rounded-lg hover:bg-[var(--card)] flex items-center justify-center text-[var(--ink)] font-bold cursor-pointer"
              title="Zoom In"
            >
              <i className="bi bi-plus"></i>
            </button>
            <div className="w-px h-4 bg-[var(--line)] mx-1"></div>
            <button
              type="button"
              onClick={() => setScale(scale === 0.85 ? 1 : 0.85)}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold cursor-pointer transition-colors ${
                scale === 0.85 ? 'bg-[var(--blue)] text-white' : 'hover:bg-[var(--card)] text-[var(--ink)]'
              }`}
              title="Toggle Fit to Screen View"
            >
              {scale === 0.85 ? 'Full Size' : 'Fit View'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onSelect(templateId);
                onClose();
              }}
              className="btn-b text-xs font-semibold !h-8 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <i className="bi bi-check2-circle"></i>
              <span className="hidden sm:inline">Activate This Template</span>
              <span className="sm:hidden">Activate</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--soft)] flex items-center justify-center cursor-pointer"
              title="Close Preview"
            >
              <i className="bi bi-x-lg text-xs"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Document Area with Clean Document Shadow */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-slate-200/70 dark:bg-slate-950/80 flex flex-col items-center">
          <div
            className="w-full max-w-[760px] bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-300 dark:border-slate-800 my-2 select-text font-sans transition-all duration-150 origin-top"
            style={{
              transform: `scale(${scale})`,
              marginBottom: scale < 1 ? `-${Math.round((1 - scale) * 750)}px` : '2rem',
            }}
          >
            {/* Template 1: Modern Slate / Classic standard */}
            {templateId === 1 && (
              <div className="bg-white text-slate-800">
                {/* 1. Header Bar */}
                <div className="p-5 sm:p-6 text-white" style={{ background: pc }}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="max-h-14 max-w-[80px] rounded-lg object-contain bg-white/10 p-1 border border-white/25"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center font-black text-xl text-white">
                          {businessName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-tight">
                          {businessName}
                        </h2>
                        <p className="text-xs text-white/80 mt-0.5">{businessAddress}</p>
                      </div>
                    </div>

                    <div className="text-right text-xs text-white/85 space-y-0.5">
                      <div className="font-bold">📞 {businessPhone}</div>
                      <div className="text-[11px] text-white/70">Smart Billing System</div>
                      <div className="text-[10px] text-white/60">ORIGINAL TAX INVOICE</div>
                    </div>
                  </div>
                </div>

                {/* 2. Title Bar */}
                <div className="text-center py-2.5 border-b-2" style={{ borderColor: pc }}>
                  <h3 className="text-sm font-extrabold uppercase tracking-widest" style={{ color: pc }}>
                    TAX INVOICE
                  </h3>
                </div>

                {/* 3. Info Section */}
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider mb-1"
                      style={{ background: ac }}
                    >
                      BILL TO
                    </span>
                    <b className="block text-sm text-slate-900">Rahul Sharma</b>
                    <div className="text-slate-600 text-xs">Phone: 9876501234</div>
                    <div className="text-slate-600 text-xs">Address: Ring Road, Surat, Gujarat</div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1 text-right">
                    <div className="flex justify-end mb-1">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                        style={{ background: ac }}
                      >
                        INVOICE DETAILS
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Invoice No: </span>
                      <b className="font-mono text-slate-900 font-bold">INV-2026-0001</b>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Date: </span>
                      <span className="font-semibold text-slate-800">06/11/2026</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Payment: </span>
                      <span className="font-bold text-emerald-700">PAID</span>
                    </div>
                  </div>
                </div>

                {/* 4. Table */}
                <div className="px-5 pb-4">
                  <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-white text-[10px] font-bold uppercase tracking-wider" style={{ background: pc }}>
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Price/Unit</th>
                          <th className="py-2.5 px-3 text-right">Discount</th>
                          <th className="py-2.5 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">1</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            Call of Duty: Modern Warfare III
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">1</td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">Rs. 5,599.00</td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">Rs. 50.00 (1%)</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">Rs. 5,549.00</td>
                        </tr>
                        <tr className="bg-slate-50/60">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">2</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            Palworld Survival Game
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">1</td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">Rs. 1,300.00</td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">Rs. 130.00 (10%)</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">Rs. 1,170.00</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold text-xs" style={{ borderColor: pc }}>
                          <td colSpan="2" className="py-2.5 px-3">Total Items (2)</td>
                          <td className="py-2.5 px-3 text-center font-mono">2</td>
                          <td></td>
                          <td className="py-2.5 px-3 text-right text-rose-600 font-mono">Rs. 180.00</td>
                          <td className="py-2.5 px-4 text-right font-black font-mono text-sm" style={{ color: pc }}>
                            Rs. 6,719.00
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 5. Bottom Section */}
                <div className="px-5 pb-5 grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-7 space-y-3">
                    <div className="p-3 rounded-xl border border-sky-100 bg-sky-50/50">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: ac }}>
                        INVOICE AMOUNT IN WORDS
                      </span>
                      <span className="text-slate-800 font-semibold italic text-xs leading-relaxed block">
                        Six Thousand Seven Hundred Nineteen Rupees only
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70">
                      <span className="text-[9.5px] font-bold text-amber-900 uppercase tracking-wider block mb-0.5">
                        TERMS & CONDITIONS
                      </span>
                      <p className="text-amber-950 text-[11px] leading-relaxed">
                        Thank you for your purchase! Goods once sold are not eligible for cash return.
                      </p>
                    </div>
                  </div>

                  <div className="col-span-5 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white divide-y divide-slate-100 text-xs">
                    <div className="p-2.5 flex justify-between text-slate-600">
                      <span>Sub Total</span>
                      <b className="text-slate-900 font-mono">Rs. 6,899.00</b>
                    </div>
                    <div className="p-2.5 flex justify-between text-rose-600 font-medium">
                      <span>Discount</span>
                      <b className="font-mono">− Rs. 180.00</b>
                    </div>
                    <div
                      className="p-3 flex justify-between items-center text-white font-extrabold text-sm shadow-inner"
                      style={{ background: ac }}
                    >
                      <span>Total Due</span>
                      <span className="text-base font-mono">Rs. 6,719.00</span>
                    </div>
                    <div className="p-2.5 flex justify-between text-slate-700">
                      <span>Received</span>
                      <b className="font-mono">Rs. 6,719.00</b>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 flex justify-between font-bold">
                      <span>You Saved</span>
                      <span className="font-mono">Rs. 180.00</span>
                    </div>
                  </div>
                </div>

                {/* 6. Signature & Page Footer */}
                <div className="px-5 pb-5 flex justify-between items-end border-t border-slate-100 pt-3">
                  <div className="text-[10px] text-slate-400">
                    <div>E. & O.E. • Computer Generated Invoice</div>
                    <div>Thank you for choosing {businessName}!</div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xs text-slate-600 font-semibold block">
                      For: <b className="text-slate-900">{businessName}</b>
                    </span>
                    {signatureUrl ? (
                      <img src={signatureUrl} alt="Signature" className="max-h-12 ml-auto object-contain my-1" />
                    ) : (
                      <div className="w-36 h-9 ml-auto flex items-center justify-center border-b-2 border-slate-400">
                        <span className="text-[10px] text-slate-400 font-mono italic">Authorized Signature</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 block">Authorized Signatory</span>
                  </div>
                </div>

                <div className="py-2 text-center text-[10px] text-white/80" style={{ background: pc }}>
                  Powered by BillBook System
                </div>
              </div>
            )}

            {/* Template 2: Classic Corporate (Exact PHP Parity) */}
            {templateId === 2 && (
              <div className="bg-white text-slate-800">
                {/* 1. Gradient Header Bar with rounded bottom */}
                <div
                  className="p-5 sm:p-6 text-white rounded-b-xl shadow"
                  style={{ background: `linear-gradient(135deg, ${pc} 0%, ${pc}dd 100%)` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="max-h-14 max-w-[80px] rounded-xl object-contain bg-white/10 p-1 border border-white/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-xl text-white">
                          {businessName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-tight">
                          {businessName}
                        </h2>
                        <p className="text-xs text-white/80 mt-0.5">{businessAddress}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-white/85 space-y-0.5">
                      <div className="font-bold">📞 {businessPhone}</div>
                      <div className="text-[11px] text-white/70">Corporate Tax System</div>
                      <div className="text-[10px] text-white/60">ORIGINAL TAX INVOICE</div>
                    </div>
                  </div>
                </div>

                {/* 2. Accent Title Bar */}
                <div className="mx-6 text-center py-2.5 border-b-3" style={{ borderColor: ac }}>
                  <h3 className="text-sm font-extrabold uppercase tracking-widest" style={{ color: ac }}>
                    TAX INVOICE
                  </h3>
                </div>

                {/* 3. Info Section with Pill Labels */}
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                    <span
                      className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider mb-1"
                      style={{ background: ac }}
                    >
                      BILLED TO
                    </span>
                    <b className="block text-sm text-slate-900">Rahul Sharma</b>
                    <div className="text-slate-600 text-xs">Phone: 9876501234</div>
                    <div className="text-slate-600 text-xs">Address: Ring Road, Surat, Gujarat</div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1 text-right">
                    <div className="flex justify-end mb-1">
                      <span
                        className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                        style={{ background: ac }}
                      >
                        INVOICE DETAILS
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Invoice No: </span>
                      <b className="font-mono text-slate-900 font-bold">INV-2026-0001</b>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Date: </span>
                      <span className="font-semibold text-slate-800">06/11/2026</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Status: </span>
                      <span className="font-bold text-emerald-700">PAID IN FULL</span>
                    </div>
                  </div>
                </div>

                {/* 4. Table */}
                <div className="px-6 pb-4">
                  <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-white text-[10px] font-bold uppercase tracking-wider" style={{ background: pc }}>
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Price/Unit</th>
                          <th className="py-2.5 px-3 text-right">Discount</th>
                          <th className="py-2.5 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">1</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            Call of Duty: Modern Warfare III
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">1</td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">Rs. 5,599.00</td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">Rs. 50.00 (1%)</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">Rs. 5,549.00</td>
                        </tr>
                        <tr className="bg-slate-50/60">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">2</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            Palworld Survival Game
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">1</td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">Rs. 1,300.00</td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">Rs. 130.00 (10%)</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">Rs. 1,170.00</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold text-xs" style={{ borderColor: ac }}>
                          <td colSpan="2" className="py-2.5 px-3">Total Items (2)</td>
                          <td className="py-2.5 px-3 text-center font-mono">2</td>
                          <td></td>
                          <td className="py-2.5 px-3 text-right text-rose-600 font-mono">Rs. 180.00</td>
                          <td className="py-2.5 px-4 text-right font-black font-mono text-sm" style={{ color: pc }}>
                            Rs. 6,719.00
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 5. Summary & Words */}
                <div className="px-6 pb-5 grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-7 space-y-3">
                    <div className="p-3 rounded-xl border border-sky-100 bg-sky-50/50">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: ac }}>
                        AMOUNT IN WORDS
                      </span>
                      <span className="text-slate-800 font-semibold italic text-xs leading-relaxed block">
                        Six Thousand Seven Hundred Nineteen Rupees only
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70">
                      <span className="text-[9.5px] font-bold text-amber-900 uppercase tracking-wider block mb-0.5">
                        TERMS & CONDITIONS
                      </span>
                      <p className="text-amber-950 text-[11px] leading-relaxed">
                        Thank you for your purchase! Goods once sold are not eligible for cash return.
                      </p>
                    </div>
                  </div>

                  <div className="col-span-5 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white divide-y divide-slate-100 text-xs">
                    <div className="p-2.5 flex justify-between text-slate-600">
                      <span>Sub Total</span>
                      <b className="text-slate-900 font-mono">Rs. 6,899.00</b>
                    </div>
                    <div className="p-2.5 flex justify-between text-rose-600 font-medium">
                      <span>Discount</span>
                      <b className="font-mono">− Rs. 180.00</b>
                    </div>
                    <div
                      className="p-3 flex justify-between items-center text-white font-extrabold text-sm shadow-inner"
                      style={{ background: `linear-gradient(135deg, ${pc}, ${ac})` }}
                    >
                      <span>Grand Total</span>
                      <span className="text-base font-mono">Rs. 6,719.00</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 flex justify-between font-bold">
                      <span>You Saved</span>
                      <span className="font-mono">Rs. 180.00</span>
                    </div>
                  </div>
                </div>

                {/* 6. Signature & Footer */}
                <div className="px-6 pb-5 flex justify-between items-end border-t border-slate-100 pt-3">
                  <div className="text-[10px] text-slate-400">
                    <div>Original Corporate Tax Invoice</div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-xs text-slate-600 font-semibold block">
                      For: <b className="text-slate-900">{businessName}</b>
                    </span>
                    {signatureUrl ? (
                      <img src={signatureUrl} alt="Signature" className="max-h-12 ml-auto object-contain my-1" />
                    ) : (
                      <div className="w-36 h-9 ml-auto flex items-center justify-center border-b-2" style={{ borderColor: ac }}>
                        <span className="text-[10px] text-slate-400 font-mono italic">Authorized Signature</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 block">Authorized Signatory</span>
                  </div>
                </div>

                <div className="py-2.5 text-center text-[10px] text-white/80 rounded-t-xl" style={{ background: pc }}>
                  Thank you for your business!
                </div>
              </div>
            )}

            {/* Template 3: Creative Accent / Minimalist Clean */}
            {templateId === 3 && (
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-end border-b-2 pb-4" style={{ borderColor: ac }}>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{businessName}</h2>
                    <span className="text-xs text-slate-500 font-mono">{businessAddress} • Tel: {businessPhone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block">STATEMENT</span>
                    <b className="font-mono text-base font-extrabold" style={{ color: pc }}>#INV-2026-0001</b>
                    <span className="text-xs text-slate-500 block">November 6, 2026</span>
                  </div>
                </div>

                <div className="flex justify-between py-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">CLIENT:</span>
                    <b className="text-sm text-slate-900">Rahul Sharma</b>
                    <p className="text-slate-600">Ring Road, Surat</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">PAYMENT METHOD:</span>
                    <span className="font-semibold text-slate-800">Cash / Immediate POS</span>
                  </div>
                </div>

                <div className="py-2">
                  <table className="w-full text-left text-xs border-b border-t border-slate-200">
                    <thead>
                      <tr className="text-slate-400 font-bold uppercase text-[9.5px] tracking-wider border-b border-slate-200">
                        <th className="py-3 px-1">DESCRIPTION</th>
                        <th className="py-3 px-2 text-center">QUANTITY</th>
                        <th className="py-3 px-2 text-right">UNIT PRICE</th>
                        <th className="py-3 px-1 text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-3 px-1 font-semibold text-slate-900">Call of Duty: Modern Warfare III</td>
                        <td className="py-3 px-2 text-center font-mono">1</td>
                        <td className="py-3 px-2 text-right font-mono text-slate-600">5,549.00</td>
                        <td className="py-3 px-1 text-right font-mono font-bold text-slate-900">5,549.00</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-1 font-semibold text-slate-900">Palworld Survival Game</td>
                        <td className="py-3 px-2 text-center font-mono">1</td>
                        <td className="py-3 px-2 text-right font-mono text-slate-600">1,170.00</td>
                        <td className="py-3 px-1 text-right font-mono font-bold text-slate-900">1,170.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-500 italic">Six Thousand Seven Hundred Nineteen Rupees only</span>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase font-semibold block">TOTAL AMOUNT</span>
                    <b className="text-2xl font-black" style={{ color: pc }}>Rs. 6,719.00</b>
                  </div>
                </div>
              </div>
            )}

            {/* Template 4: Thermal POS Receipt */}
            {templateId === 4 && (
              <div className="p-6 font-mono text-xs max-w-[420px] mx-auto bg-amber-50/20 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 space-y-3">
                <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                  <h3 className="font-extrabold text-sm tracking-wider">{businessName}</h3>
                  <p className="text-[11px] text-slate-600">{businessAddress}</p>
                  <p className="text-[11px] text-slate-600">TEL: {businessPhone}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">*** CASH RECEIPT ***</span>
                </div>

                <div className="text-[11px] text-slate-600 flex justify-between">
                  <span>INV: #2026-0001</span>
                  <span>06/11/2026 13:05</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  CUSTOMER: Rahul Sharma
                </div>

                <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="truncate max-w-[200px]">1x COD MW-III</span>
                    <span className="font-bold">5,549.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="truncate max-w-[200px]">1x Palworld Game</span>
                    <span className="font-bold">1,170.00</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>SUBTOTAL</span>
                    <span>6,899.00</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>DISCOUNT</span>
                    <span>- 180.00</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-300" style={{ color: ac }}>
                    <span>TOTAL:</span>
                    <span>Rs. 6,719.00</span>
                  </div>
                </div>

                <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-1">
                  <div className="text-center text-xs tracking-[4px] font-bold opacity-75">
                    |||| | || ||||| | || |||
                  </div>
                  <span className="text-[10px] text-slate-500 block">*** THANK YOU FOR VISITING! ***</span>
                </div>
              </div>
            )}

            {/* Template 5 & 6 */}
            {templateId > 4 && (
              <div className="p-6 space-y-4">
                <div className="h-10 px-4 rounded-lg flex items-center text-white font-bold" style={{ background: `linear-gradient(90deg, ${pc}, ${ac})` }}>
                  <span>{info.name} • Executive Invoice Preview</span>
                </div>
                <div className="p-4 rounded-xl border space-y-2 text-xs">
                  <div className="flex justify-between"><b>Customer: Rahul Sharma</b><span className="font-mono">#INV-2026-0001</span></div>
                  <div className="flex justify-between pt-2 border-t font-extrabold text-sm">
                    <span>Net Amount:</span><span style={{ color: ac }}>Rs. 6,719.00</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 px-5 border-t border-[var(--line)] bg-[var(--card)] flex items-center justify-between shrink-0">
          <span className="text-xs text-[var(--mut)]">
            Colors: Primary <span className="font-mono font-bold" style={{ color: pc }}>{pc}</span> • Accent <span className="font-mono font-bold" style={{ color: ac }}>{ac}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="chip text-xs !h-8 px-4 font-semibold"
            >
              Close
            </button>
            <button
              onClick={() => {
                onSelect(templateId);
                onClose();
              }}
              className="btn-b text-xs font-semibold !h-8 px-4 flex items-center gap-1.5 shadow-sm"
            >
              <i className="bi bi-check-lg"></i>
              <span>Activate This Layout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoiceTemplates = () => {
  const { user } = useSelector((state) => state.auth);
  const [previewTemplateId, setPreviewTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [settings, setSettings] = useState({
    template_id: 1,
    primary_color: '#0f172a',
    accent_color: '#2563eb',
    signature_url: null,
  });

  const [signatureUploading, setSignatureUploading] = useState(false);
  const signatureInputRef = useRef(null);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      const [settingsRes, templatesRes] = await Promise.all([
        invoiceService.getInvoiceSettings(),
        invoiceService.getInvoiceTemplates(),
      ]);

      if (settingsRes.status && settingsRes.data) {
        setSettings({
          template_id: parseInt(settingsRes.data.template_id, 10) || 1,
          primary_color: settingsRes.data.primary_color || '#0f172a',
          accent_color: settingsRes.data.accent_color || '#2563eb',
          signature_url: settingsRes.data.signature_url || null,
        });
      }

      if (templatesRes.status && Array.isArray(templatesRes.data)) {
        setTemplates(templatesRes.data);
      }
    } catch (err) {
      console.error('Error loading invoice settings:', err);
      toast.error('Could not load invoice settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  const handleSelectTemplate = (templateId) => {
    setSettings((prev) => ({ ...prev, template_id: templateId }));
    toast.success(`Selected Template #${templateId}`);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await invoiceService.saveInvoiceSettings({
        template_id: settings.template_id,
        primary_color: settings.primary_color,
        accent_color: settings.accent_color,
      });
      if (res.status) {
        toast.success('🎉 Invoice settings and brand theme saved successfully!');
      } else {
        toast.error(res.message || 'Failed to save invoice settings.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving invoice settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Signature image must be under 2MB.');
      return;
    }

    setSignatureUploading(true);
    try {
      const res = await invoiceService.uploadSignature(file);
      if (res.status && res.data) {
        toast.success('Signature uploaded successfully!');
        setSettings((prev) => ({
          ...prev,
          signature_url: res.data.signature_url || null,
        }));
      } else {
        toast.error(res.message || 'Failed to upload signature.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading signature.');
    } finally {
      setSignatureUploading(false);
    }
  };

  const handleRemoveSignature = async () => {
    try {
      const res = await invoiceService.removeSignature();
      if (res.status) {
        toast.success('Signature removed.');
        setSettings((prev) => ({ ...prev, signature_url: null }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error removing signature.');
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div>
          <div className="text-[11px] text-[var(--mut)] flex items-center gap-1.5 mb-0.5 font-medium">
            <i className="bi bi-palette text-rose-500"></i>
            <span>Theme & Document Customization</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight">
            Invoice Templates & Branding
          </h1>
          <p className="text-xs text-[var(--mut)] mt-0.5">
            Choose your default invoice style and color palette. Sales generated in POS will automatically render in your selected template.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="btn-b text-xs font-semibold !h-9 px-4 flex items-center gap-1.5 shrink-0 shadow-md"
        >
          {saving ? (
            <span>Saving Settings...</span>
          ) : (
            <>
              <i className="bi bi-check-lg"></i>
              <span>Save Theme Settings</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="card2 !p-12 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[var(--mut)]">Loading invoice templates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Template Selection Gallery (8 Cols) */}
          <div className="lg:col-span-8 space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <i className="bi bi-layout-text-window-reverse text-[var(--blue)]"></i>
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  Available Invoice Layouts
                </h3>
              </div>
              <span className="text-xs text-[var(--mut)]">
                Selected: <b className="text-[var(--blue)]">Template #{settings.template_id}</b>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((tId) => {
                const info = TEMPLATE_DESCRIPTIONS[tId] || {
                  name: `Template ${tId}`,
                  tagline: 'Standard formatted billing template.',
                  badge: 'Standard',
                  icon: 'bi-file-text',
                };
                const isSelected = settings.template_id === tId;

                return (
                  <div
                    key={tId}
                    onClick={() => handleSelectTemplate(tId)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplateId(tId);
                    }}
                    className={`card2 !p-4 cursor-pointer transition-all flex flex-col justify-between relative group ${
                      isSelected
                        ? 'border-2 border-[var(--blue)] shadow-md ring-2 ring-[var(--blue)]/10'
                        : 'hover:border-[var(--blue)]/50'
                    }`}
                    title="Click to select as active • Double-click to preview full layout"
                  >
                    <div>
                      {/* Top Bar with Badge & Preview action */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                              isSelected
                                ? 'bg-[var(--blue)] text-white'
                                : 'bg-[var(--soft)] text-[var(--blue)]'
                            }`}
                          >
                            <i className={`bi ${info.icon}`}></i>
                          </div>
                          <div>
                            <b className="text-sm font-bold text-[var(--ink)] block">
                              {info.name}
                            </b>
                            <span className="text-[10px] text-[var(--mut)] block">
                              Template #{tId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTemplateId(tId);
                            }}
                            className="chip !text-[10px] !py-0.5 !px-2 flex items-center gap-1 hover:border-[var(--blue)] text-[var(--blue)] font-bold transition-all"
                            title="Full Screen Preview (or double click card)"
                          >
                            <i className="bi bi-arrows-fullscreen text-[9px]"></i>
                            <span>Preview</span>
                          </button>

                          <span
                            className={`pill !text-[10px] !py-0.5 !px-2 ${
                              isSelected
                                ? '!bg-blue-100 !text-[var(--blue)] font-bold'
                                : ''
                            }`}
                          >
                            {isSelected ? '✓ Active' : info.badge}
                          </span>
                        </div>
                      </div>

                      {/* Distinct Template Design Preview */}
                      <TemplateMiniPreview
                        templateId={tId}
                        primaryColor={settings.primary_color}
                        accentColor={settings.accent_color}
                      />

                      <div className="text-[10px] text-[var(--mut)] flex items-center justify-center gap-1 mt-2 opacity-65 group-hover:opacity-100 transition-opacity">
                        <i className="bi bi-cursor"></i>
                        <span>Double-click to preview full invoice</span>
                      </div>

                      <p className="text-xs text-[var(--mut)] mt-2 leading-relaxed">
                        {info.tagline}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[var(--line)] flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--ink)]">
                        {isSelected ? 'Active Default Theme' : 'Click to Activate'}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                          isSelected
                            ? 'border-[var(--blue)] bg-[var(--blue)] text-white'
                            : 'border-[var(--line)]'
                        }`}
                      >
                        {isSelected && <i className="bi bi-check text-xs"></i>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Brand Colors & Digital Signature (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* ── Brand Colors Customizer ── */}
            <div className="card2 !p-4 space-y-3.5">
              <div className="flex items-center gap-2">
                <i className="bi bi-paint-bucket text-amber-500"></i>
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  Brand Colors & Accents
                </h3>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-9 h-9 rounded-xl border border-[var(--line)] cursor-pointer p-0.5 bg-[var(--card)] shrink-0"
                    value={settings.primary_color}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, primary_color: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="auth-input text-xs font-mono !h-9 uppercase"
                    value={settings.primary_color}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, primary_color: e.target.value }))
                    }
                  />
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, primary_color: c }))}
                      className="w-5 h-5 rounded-full border border-white/50 shadow-sm transition-transform hover:scale-110"
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                  Accent Highlight Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-9 h-9 rounded-xl border border-[var(--line)] cursor-pointer p-0.5 bg-[var(--card)] shrink-0"
                    value={settings.accent_color}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, accent_color: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    className="auth-input text-xs font-mono !h-9 uppercase"
                    value={settings.accent_color}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, accent_color: e.target.value }))
                    }
                  />
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, accent_color: c }))}
                      className="w-5 h-5 rounded-full border border-white/50 shadow-sm transition-transform hover:scale-110"
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="btn-b w-full !h-9 justify-center text-xs font-bold mt-2"
              >
                {saving ? 'Saving...' : 'Apply & Save Colors'}
              </button>
            </div>

            {/* ── Digital Signature ── */}
            <div className="card2 !p-4 space-y-3">
              <div className="flex items-center gap-2">
                <i className="bi bi-pen text-[var(--blue)]"></i>
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  Authorized Signatory
                </h3>
              </div>

              <p className="text-[11px] text-[var(--mut)]">
                Upload your digital stamp or signature image. It will appear at the bottom-right of every invoice PDF.
              </p>

              <div className="p-3 rounded-xl border border-dashed border-[var(--line)] bg-[var(--soft)]/50 text-center space-y-2">
                {settings.signature_url ? (
                  <div className="relative group mx-auto w-40 h-20 bg-[var(--card)] rounded-lg border border-[var(--line)] p-2 flex items-center justify-center">
                    <img
                      src={settings.signature_url}
                      alt="Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs hover:bg-rose-700 shadow-md"
                      title="Remove Signature"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ) : (
                  <div className="py-3 text-[var(--mut)]">
                    <i className="bi bi-card-image text-3xl block mb-1 opacity-50"></i>
                    <span className="text-[11px] block">No signature image uploaded</span>
                  </div>
                )}

                <input
                  type="file"
                  ref={signatureInputRef}
                  onChange={handleSignatureUpload}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={signatureUploading}
                  className="chip text-xs !h-8 px-3 mx-auto"
                >
                  <i className="bi bi-upload"></i>
                  <span>
                    {signatureUploading
                      ? 'Uploading...'
                      : settings.signature_url
                      ? 'Replace Signature'
                      : 'Upload Signature PNG'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Full Invoice Layout Preview Modal (Triggered by Double-Click or Preview Button) ── */}
      <TemplateFullPreviewModal
        templateId={previewTemplateId}
        settings={settings}
        user={user}
        onClose={() => setPreviewTemplateId(null)}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
};

export default InvoiceTemplates;
