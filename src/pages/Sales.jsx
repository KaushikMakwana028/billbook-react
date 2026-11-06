import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import salesService from '../services/salesService';
import productService from '../services/productService';
import partyService from '../services/partyService';
import whatsappService from '../services/whatsappService';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const fmtCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return 'Rs. ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=60';
const DRAFT_BILLS_KEY = 'billbook_draft_bills_v2';

// Native Web Audio API POS scanner beeps
const playScanSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // AudioContext blocked or unsupported
  }
};

const playScanErrorSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // ignore
  }
};

const numberToWordsIndian = (num) => {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Zero Rupees only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (n) => {
    let str = '';
    if (n >= 10000000) {
      str += convert(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convert(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += convert(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str;
  };
  return convert(num).trim() + ' Rupees only';
};

const createEmptyItem = () => ({
  id: Date.now() + Math.random(),
  product_id: '',
  product_name: '',
  product_image: '',
  stock_quantity: 0,
  unit_price: 0,
  quantity: 1,
  discount: 0,
  discount_percent: 0,
  line_total: 0,
});

const createEmptyBill = (id, title) => ({
  id,
  title,
  customer_phone: '',
  customer_name: '',
  customer_address: '',
  sale_date: new Date().toISOString().split('T')[0],
  notes: '',
  items: [createEmptyItem()],
});

const SearchableProductSelect = ({ value, onChange, products, placeholder = '-- Choose Product / Item --' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  const selectedProduct = products.find((p) => String(p.id) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filtered = products.filter((p) => {
    // Only show active products in sales (disabled products are never sellable)
    const isAct = p.isActive == 1 || p.isActive === '1' || p.status === 'active';
    if (!isAct && p.isActive !== undefined) return false;

    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category_name && p.category_name.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.sale_price && String(p.sale_price).includes(q))
    );
  });

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setQuery('');
        }}
        className="auth-input text-xs !h-9 cursor-pointer w-full font-medium text-left flex items-center justify-between gap-2 px-3 bg-[var(--card)]"
      >
        <span className={`truncate ${selectedProduct ? 'text-[var(--ink)] font-semibold' : 'text-[var(--mut)]'}`}>
          {selectedProduct
            ? `${selectedProduct.name} — Rs. ${parseFloat(selectedProduct.sale_price || 0).toLocaleString('en-IN')}`
            : placeholder}
        </span>
        <i className={`bi bi-chevron-down text-[10px] text-[var(--mut)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Floating Dropdown Panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--card)] border border-[var(--line)] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[280px]">
          {/* Search Box */}
          <div className="p-2 border-b border-[var(--line)] bg-[var(--soft)]/50">
            <div className="search-input-wrap w-full !h-8">
              <i className="bi bi-search text-xs"></i>
              <input
                type="text"
                autoFocus
                className="search-input !h-8 text-xs !py-1"
                placeholder="Type to search product or barcode..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--mut)]"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-[var(--line)]/50">
            {filtered.length > 0 ? (
              filtered.map((p) => {
                const qty = parseInt(p.quantity, 10) || 0;
                const isSelected = String(p.id) === String(value);
                const outOfStock = qty <= 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left p-2.5 flex items-center justify-between gap-2.5 hover:bg-[var(--soft)] transition-colors ${
                      isSelected ? 'bg-blue-50/70 dark:bg-blue-950/30 font-semibold' : ''
                    } ${outOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.image ? (
                        <img src={p.image} alt="" className="w-7 h-7 rounded-md object-cover border border-[var(--line)] shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-[var(--soft)] border border-[var(--line)] flex items-center justify-center shrink-0">
                          <i className="bi bi-box-seam text-xs text-[var(--mut)]"></i>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs text-[var(--ink)] truncate font-medium">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-[var(--mut)] flex items-center gap-1.5">
                          {p.category_name && <span>{p.category_name}</span>}
                          {p.barcode && <span>• {p.barcode}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {parseFloat(p.sale_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className={`text-[10px] ${qty > 0 ? 'text-[var(--mut)]' : 'text-rose-500 font-semibold'}`}>
                        {qty > 0 ? `${qty} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-[var(--mut)]">
                No products match "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Sales = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const modeParam = searchParams.get('mode');
  // Default to POS billing mode ('create') unless explicitly requesting 'list'
  const initialMode = modeParam === 'list' ? 'list' : 'create';

  // Active Main Tab: 'create' (POS Billing - default) or 'list' (Records)
  const [activeTab, setActiveTab] = useState(initialMode);

  useEffect(() => {
    if (modeParam === 'list') {
      setActiveTab('list');
    } else if (modeParam === 'create') {
      setActiveTab('create');
    }
  }, [modeParam]);

  // ── Sales Records State ──
  const [sales, setSales] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingSales, setLoadingSales] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [deleteSaleId, setDeleteSaleId] = useState(null);
  const [deletingSale, setDeletingSale] = useState(false);

  // ── All Products for POS Picker ──
  const [allProducts, setAllProducts] = useState([]);

  // ── Open Bills (Multi-Tab / Multi-Sale System) ──
  const [bills, setBills] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_BILLS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bills && Object.keys(parsed.bills).length > 0) {
          return parsed.bills;
        }
      }
    } catch {
      // ignore
    }
    return {
      bill_1: createEmptyBill('bill_1', 'Bill 1'),
    };
  });

  const [activeBillId, setActiveBillId] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_BILLS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeBillId && parsed.bills[parsed.activeBillId]) {
          return parsed.activeBillId;
        }
      }
    } catch {
      // ignore
    }
    return 'bill_1';
  });

  // Current active bill object
  const currentBill = bills[activeBillId] || createEmptyBill(activeBillId, 'Bill 1');

  // ── Invoice Result Modal ──
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [submittingSale, setSubmittingSale] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // ── Hardware Barcode Scanner & Quick Scan State ──
  const barcodeInputRef = useRef(null);
  const [barcodeScanned, setBarcodeScanned] = useState('');
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const isDesktop =
    typeof window !== 'undefined' &&
    !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
    window.innerWidth > 768;

  // Live Barcode Scanner Desktop Auto-Focus Loop (Ready to Scan)
  useEffect(() => {
    if (activeTab !== 'create' || !isDesktop) return;

    const interval = setInterval(() => {
      const active = document.activeElement;
      const isTyping =
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
        active !== barcodeInputRef.current;
      if (!isTyping && barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [activeTab, isDesktop]);

  // Persist draft bills to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_BILLS_KEY,
        JSON.stringify({
          bills,
          activeBillId,
        })
      );
    } catch {
      // ignore
    }
  }, [bills, activeBillId]);

  // Handle customer prefill passed via navigation state (e.g. from Parties page)
  useEffect(() => {
    const passedCust = location.state?.customer;
    if (passedCust && (passedCust.name || passedCust.phone)) {
      setActiveTab('create');
      setBills((prev) => {
        const curId = activeBillId || Object.keys(prev)[0] || 'bill_1';
        const cur = prev[curId] || createEmptyBill(curId, 'Bill 1');
        return {
          ...prev,
          [curId]: {
            ...cur,
            customer_name: passedCust.name || 'Walk-in Customer',
            customer_phone: passedCust.phone || '',
            customer_address: passedCust.address || '',
          },
        };
      });
      toast.success(`Customer "${passedCust.name || passedCust.phone}" loaded into POS!`);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Real-time debounced search for sales records
  useEffect(() => {
    if (activeTab === 'list') {
      const timer = setTimeout(() => {
        fetchSales(1);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filterDateFrom, filterDateTo, activeTab]);

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productService.getProducts({ status_filter: 'active' });
      if (res.status && res.data) {
        let items = [];
        if (Array.isArray(res.data)) {
          items = res.data;
        } else if (res.data.products) {
          items = res.data.products;
        }
        // Strict active-only filter: disabled products must never appear in POS / Sales
        items = items.filter(
          (p) => p.isActive == 1 || p.isActive === '1' || p.status === 'active'
        );
        setAllProducts(items);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchSales = async (page = 1) => {
    setLoadingSales(true);
    try {
      const res = await salesService.getSales({
        search: searchQuery,
        date_from: filterDateFrom,
        date_to: filterDateTo,
        page,
      });
      if (res.status && res.data) {
        setSales(res.data.sales || []);
        setTotalRevenue(res.data.total_revenue || 0);
        setTotalRows(res.data.total_rows || 0);
        setTotalPages(res.data.total_pages || 1);
        setCurrentPage(res.data.current_page || 1);
      }
    } catch (err) {
      console.error('Error loading sales:', err);
      toast.error('Could not load sales records.');
    } finally {
      setLoadingSales(false);
    }
  };

  // ── Open Bills Tab Handlers ──
  const handleAddBill = () => {
    const existingKeys = Object.keys(bills);
    const nextIndex = existingKeys.length + 1;
    const newId = `bill_${Date.now()}`;
    const newTitle = `Bill ${nextIndex}`;
    const newBill = createEmptyBill(newId, newTitle);

    setBills((prev) => ({
      ...prev,
      [newId]: newBill,
    }));
    setActiveBillId(newId);
    toast.success(`Opened new draft ${newTitle}`);
  };

  const handleCloseBill = (e, billIdToClose) => {
    e.stopPropagation();
    const billKeys = Object.keys(bills);
    if (billKeys.length <= 1) {
      // Reset the current bill
      setBills({
        bill_1: createEmptyBill('bill_1', 'Bill 1'),
      });
      setActiveBillId('bill_1');
      toast('Reset Bill 1', { icon: 'ℹ️' });
      return;
    }

    // Filter out the closed bill and re-sequence remaining bills sequentially 1, 2, 3...
    const remainingKeys = billKeys.filter((id) => id !== billIdToClose);
    const renumbered = {};
    remainingKeys.forEach((id, index) => {
      renumbered[id] = {
        ...bills[id],
        title: `Bill ${index + 1}`,
      };
    });

    let nextActive = activeBillId;
    if (activeBillId === billIdToClose) {
      const closedIndex = billKeys.indexOf(billIdToClose);
      const nextIndex = Math.max(0, closedIndex - 1);
      nextActive = remainingKeys[nextIndex] || remainingKeys[0];
    }

    setBills(renumbered);
    setActiveBillId(nextActive);
  };

  // Update current bill state
  const updateCurrentBill = (patch) => {
    setBills((prev) => ({
      ...prev,
      [activeBillId]: {
        ...prev[activeBillId],
        ...patch,
      },
    }));
  };

  // ── Customer Lookup by Phone ──
  const handlePhoneChange = async (e) => {
    const phone = e.target.value.replace(/\D/g, '').slice(0, 15);
    updateCurrentBill({ customer_phone: phone });

    if (phone.length === 10) {
      setLookupLoading(true);
      try {
        const res = await partyService.customerLookup(phone);
        if (res.status && res.data) {
          toast.success(`Found client: ${res.data.name}`);
          updateCurrentBill({
            customer_phone: phone,
            customer_name: res.data.name || '',
            customer_address: res.data.address || '',
          });
        }
      } catch {
        // Not found is normal for walk-in or new clients
      } finally {
        setLookupLoading(false);
      }
    }
  };

  // ── Line Items Handlers ──
  const handleAddItemRow = () => {
    const newItems = [...(currentBill.items || []), createEmptyItem()];
    updateCurrentBill({ items: newItems });
  };

  const handleRemoveItemRow = (index) => {
    if (currentBill.items.length <= 1) {
      updateCurrentBill({ items: [createEmptyItem()] });
      return;
    }
    const newItems = currentBill.items.filter((_, i) => i !== index);
    updateCurrentBill({ items: newItems });
  };

  const handleSelectProduct = (index, productId) => {
    const product = allProducts.find((p) => String(p.id) === String(productId));
    const items = [...currentBill.items];
    if (!product) {
      items[index] = {
        ...items[index],
        product_id: '',
        product_name: '',
        product_image: '',
        stock_quantity: 0,
        unit_price: 0,
        line_total: 0,
      };
    } else {
      const unitPrice = parseFloat(product.sale_price) || 0;
      const qty = items[index].quantity > 0 ? items[index].quantity : 1;
      const base = unitPrice * qty;
      const disc = items[index].discount || 0;

      items[index] = {
        ...items[index],
        product_id: product.id,
        product_name: product.name,
        product_image: product.image || '',
        stock_quantity: parseInt(product.quantity, 10) || 0,
        unit_price: unitPrice,
        quantity: qty,
        line_total: Math.max(0, base - disc),
      };
    }
    updateCurrentBill({ items });
  };

  // ── Hardware & Quick Barcode Processing ──
  const processBarcodeScan = (code) => {
    const clean = String(code).trim().toLowerCase();
    if (!clean) return;

    const product = allProducts.find(
      (p) =>
        (p.barcode && String(p.barcode).trim().toLowerCase() === clean) ||
        String(p.id) === clean
    );

    if (!product) {
      playScanErrorSound();
      toast.error(`No active product matches barcode: ${code}`);
      return;
    }

    const availableStock = parseInt(product.quantity, 10) || 0;
    if (availableStock <= 0) {
      playScanErrorSound();
      toast.error(`"${product.name}" is out of stock!`);
      return;
    }

    playScanSuccessSound();

    // Check if item already exists in current bill
    const existingIdx = currentBill.items.findIndex(
      (it) => String(it.product_id) === String(product.id)
    );

    if (existingIdx >= 0) {
      const curItem = currentBill.items[existingIdx];
      const newQty = Math.min(curItem.quantity + 1, availableStock);
      if (newQty === curItem.quantity) {
        toast(`Max stock limit reached (${availableStock}) for "${product.name}".`, { icon: '⚠️' });
        return;
      }
      handleItemFieldChange(existingIdx, 'quantity', newQty);
      toast.success(`Incremented "${product.name}" (Qty: ${newQty})`);
    } else {
      // Find first empty row or append
      const emptyIdx = currentBill.items.findIndex((it) => !it.product_id);
      if (emptyIdx >= 0) {
        handleSelectProduct(emptyIdx, product.id);
      } else {
        const unitPrice = parseFloat(product.sale_price) || 0;
        const newItem = {
          id: Date.now() + Math.random(),
          product_id: product.id,
          product_name: product.name,
          product_image: product.image || '',
          stock_quantity: availableStock,
          unit_price: unitPrice,
          quantity: 1,
          discount: 0,
          discount_percent: 0,
          line_total: unitPrice,
        };
        updateCurrentBill({ items: [...currentBill.items, newItem] });
      }
      toast.success(`Scanned & added "${product.name}"!`);
    }

    setTimeout(() => {
      if (isDesktop && barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 50);
  };

  const handleBarcodeScanKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const code = barcodeScanned.trim();
      setBarcodeScanned('');
      if (code) {
        processBarcodeScan(code);
      }
    }
  };

  const handleItemFieldChange = (index, field, value) => {
    const items = [...currentBill.items];
    const item = { ...items[index] };

    if (field === 'quantity') {
      const q = Math.max(1, parseInt(value, 10) || 1);
      item.quantity = q;
      const base = item.unit_price * q;
      if (item.discount_percent !== '' && parseFloat(item.discount_percent) > 0) {
        item.discount = parseFloat(((base * parseFloat(item.discount_percent)) / 100).toFixed(2));
      } else if (item.discount !== '' && parseFloat(item.discount) > 0) {
        item.discount = Math.min(parseFloat(item.discount), base);
        item.discount_percent = base > 0 ? parseFloat(((item.discount / base) * 100).toFixed(2)) : 0;
      }
      item.line_total = Math.max(0, base - (parseFloat(item.discount) || 0));
    } else if (field === 'unit_price') {
      const p = Math.max(0, parseFloat(value) || 0);
      item.unit_price = p;
      const base = p * item.quantity;
      if (item.discount_percent !== '' && parseFloat(item.discount_percent) > 0) {
        item.discount = parseFloat(((base * parseFloat(item.discount_percent)) / 100).toFixed(2));
      } else if (item.discount !== '' && parseFloat(item.discount) > 0) {
        item.discount = Math.min(parseFloat(item.discount), base);
        item.discount_percent = base > 0 ? parseFloat(((item.discount / base) * 100).toFixed(2)) : 0;
      }
      item.line_total = Math.max(0, base - (parseFloat(item.discount) || 0));
    } else if (field === 'discount') {
      // User entered flat rupee amount -> auto calculate percentage
      const base = (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity, 10) || 1);
      if (value === '' || value === null) {
        item.discount = '';
        item.discount_percent = '';
        item.line_total = base;
      } else {
        const discNum = Math.max(0, parseFloat(value) || 0);
        const disc = Math.min(discNum, base);
        item.discount = value;
        item.discount_percent = base > 0 ? parseFloat(((disc / base) * 100).toFixed(2)) : 0;
        item.line_total = Math.max(0, base - disc);
      }
    } else if (field === 'discount_percent') {
      // User entered percentage -> auto calculate flat rupee amount
      const base = (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity, 10) || 1);
      if (value === '' || value === null) {
        item.discount = '';
        item.discount_percent = '';
        item.line_total = base;
      } else {
        const pctNum = Math.min(100, Math.max(0, parseFloat(value) || 0));
        item.discount_percent = value;
        const disc = parseFloat(((base * pctNum) / 100).toFixed(2));
        item.discount = disc;
        item.line_total = Math.max(0, base - disc);
      }
    }

    items[index] = item;
    updateCurrentBill({ items });
  };

  // Calculations for current bill
  const subtotal = (currentBill.items || []).reduce((acc, it) => {
    return acc + (it.unit_price || 0) * (it.quantity || 0);
  }, 0);

  const totalDiscount = (currentBill.items || []).reduce((acc, it) => {
    return acc + (it.discount || 0);
  }, 0);

  const grandTotal = Math.max(0, subtotal - totalDiscount);

  // ── Submit Order & Auto-Generate Invoice ──
  const handleSaveAndGenerateInvoice = async (e) => {
    e.preventDefault();

    const validItems = (currentBill.items || []).filter(
      (it) => it.product_id && it.quantity > 0
    );

    if (validItems.length === 0) {
      toast.error('Please select at least one valid product for this sale.');
      return;
    }

    // Check stock warning
    for (const item of validItems) {
      if (item.stock_quantity !== undefined && item.quantity > item.stock_quantity) {
        toast.error(
          `Insufficient stock for "${item.product_name}". Available: ${item.stock_quantity}`
        );
        return;
      }
    }

    const payload = {
      customer_name: currentBill.customer_name.trim() || 'Walk-in Customer',
      customer_phone: currentBill.customer_phone.trim(),
      customer_address: currentBill.customer_address.trim(),
      sale_date: currentBill.sale_date,
      notes: currentBill.notes.trim(),
      status: 'paid',
      items: validItems.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        price: it.unit_price,
        discount: it.discount,
        discount_percent: it.discount_percent,
      })),
    };

    setSubmittingSale(true);
    try {
      const res = await salesService.createSale(payload);
      if (res.status && res.data) {
        toast.success(`🎉 Sale created! Invoice: ${res.data.sale?.invoice_number}`);
        setCreatedInvoice({
          ...res.data.sale,
          pdfUrl: res.data.invoice_pdf_url,
          imageUrl: res.data.invoice_image_url || (res.data.sale?.id ? `http://localhost/kaushik/billbook/uploads/invoices/invoice-${res.data.sale.id}.jpg` : null),
          printUrl: res.data.print_invoice_url || `http://localhost/kaushik/billbook/sales/print_invoice/${res.data.sale?.id}`,
          whatsappUrl: res.data.whatsapp_url || res.data.sale?.whatsapp_url,
          whatsappRoute: res.data.whatsapp_route || res.data.sale?.whatsapp_route,
        });

        // If multiple bills were open, close this fulfilled bill and renumber the remaining bills
        const billKeys = Object.keys(bills);
        if (billKeys.length > 1) {
          const remainingKeys = billKeys.filter((id) => id !== activeBillId);
          const renumbered = {};
          remainingKeys.forEach((id, index) => {
            renumbered[id] = {
              ...bills[id],
              title: `Bill ${index + 1}`,
            };
          });
          setBills(renumbered);
          setActiveBillId(remainingKeys[0]);
        } else {
          // Reset current single bill
          updateCurrentBill({
            customer_phone: '',
            customer_name: '',
            customer_address: '',
            notes: '',
            items: [createEmptyItem()],
          });
        }

        // Refresh products stock & sales list in background
        fetchProducts();
        fetchSales();
      } else {
        toast.error(res.message || 'Failed to create sale.');
      }
    } catch (err) {
      console.error('Error saving sale:', err);
      toast.error(err.response?.data?.message || 'Error processing sale order.');
    } finally {
      setSubmittingSale(false);
    }
  };

  // ── Delete Sale Handler ──
  const handleDeleteSale = async () => {
    if (!deleteSaleId) return;
    setDeletingSale(true);
    try {
      const res = await salesService.deleteSale(deleteSaleId);
      if (res.status) {
        toast.success('Sale record deleted successfully.');
        setDeleteSaleId(null);
        fetchSales(currentPage);
      } else {
        toast.error(res.message || 'Could not delete sale.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting sale.');
    } finally {
      setDeletingSale(false);
    }
  };

  // Open single sale detail
  const handleOpenSaleDetail = async (sale) => {
    try {
      const res = await salesService.getSaleDetail(sale.id);
      if (res.status && res.data) {
        setSelectedSaleDetail(res.data);
      } else {
        setSelectedSaleDetail(sale);
      }
    } catch {
      setSelectedSaleDetail(sale);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Top Header & Tab Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div>
          <div className="text-[11px] text-[var(--mut)] flex items-center gap-1.5 mb-0.5 font-medium">
            <i className="bi bi-receipt text-[var(--blue)]"></i>
            <span>POS Billing & Invoice System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight">
            Sales & Orders
          </h1>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="seg mobile-scroll text-xs">
            <button
              className={activeTab === 'create' ? 'on' : ''}
              onClick={() => setActiveTab('create')}
            >
              <i className="bi bi-plus-circle me-1.5"></i>
              <span>Create Sale (POS)</span>
            </button>
            <button
              className={activeTab === 'list' ? 'on' : ''}
              onClick={() => setActiveTab('list')}
            >
              <i className="bi bi-card-list me-1.5"></i>
              <span>Invoices & History</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODE 1: CREATE SALE / POS BILLING (MULTI-ITEM ORDER)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <form onSubmit={handleSaveAndGenerateInvoice} className="space-y-3.5">
          {/* ── Open Bills Multi-Tab Bar ── */}
          <div className="card2 !p-2 flex items-center justify-between gap-2 bg-[var(--soft)]/50">
            <div className="flex items-center gap-1.5 overflow-x-auto mobile-scroll py-0.5">
              <span className="text-xs font-bold text-[var(--mut)] px-2 flex items-center gap-1 shrink-0">
                <i className="bi bi-files text-[var(--blue)]"></i>
                <span>Open Bills ({Object.keys(bills).length})</span>
              </span>

              {Object.keys(bills).map((bId) => {
                const b = bills[bId];
                const isActive = bId === activeBillId;
                return (
                  <div
                    key={bId}
                    onClick={() => setActiveBillId(bId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
                      isActive
                        ? 'bg-[var(--card)] text-[var(--blue)] shadow-sm border border-[var(--blue)]/40'
                        : 'text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--card)]'
                    }`}
                  >
                    <span>{b.title}</span>
                    <button
                      type="button"
                      onClick={(e) => handleCloseBill(e, bId)}
                      className="w-4 h-4 rounded-full hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/50 flex items-center justify-center text-[10px]"
                      title="Close Bill"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddBill}
              className="chip !h-8 !px-2.5 text-xs font-semibold shrink-0"
              title="Open a new bill tab"
            >
              <i className="bi bi-plus-lg text-[var(--blue)]"></i>
              <span className="hidden sm:inline">New Bill</span>
            </button>
          </div>

          {/* ── Customer Details Bar ── */}
          <div className="card2 !p-3.5">
            <div className="text-xs font-bold text-[var(--ink)] mb-2 flex items-center gap-1.5">
              <i className="bi bi-person text-[var(--blue)]"></i>
              <span>Customer Information (Walk-in or Registered)</span>
              {lookupLoading && (
                <span className="text-[10px] text-[var(--blue)] animate-pulse">
                  Searching client...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    className="auth-input text-xs"
                    placeholder="Enter phone to auto-fetch..."
                    value={currentBill.customer_phone}
                    onChange={handlePhoneChange}
                  />
                  {currentBill.customer_phone && (
                    <button
                      type="button"
                      onClick={() => updateCurrentBill({ customer_phone: '' })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--mut)]"
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  className="auth-input text-xs font-medium"
                  placeholder="Walk-in Customer"
                  value={currentBill.customer_name}
                  onChange={(e) => updateCurrentBill({ customer_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                  Address / City
                </label>
                <input
                  type="text"
                  className="auth-input text-xs"
                  placeholder="Optional customer address"
                  value={currentBill.customer_address}
                  onChange={(e) => updateCurrentBill({ customer_address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                  Sale Date
                </label>
                <input
                  type="date"
                  className="auth-input text-xs cursor-pointer"
                  value={currentBill.sale_date}
                  onChange={(e) => updateCurrentBill({ sale_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Main Order Items & Order Summary ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            {/* Left: Product Items Table / Cards (8 Cols) */}
            <div className="lg:col-span-8 space-y-3">
              <div className="card2 !p-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-2.5 mb-2 border-b border-[var(--line)] gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <i className="bi bi-cart3 text-[var(--blue)]"></i>
                      <h3 className="text-sm font-bold text-[var(--ink)]">
                        Order Items ({currentBill.items.length})
                      </h3>
                    </div>

                    {/* Ready to Scan Pulsing Status Badge */}
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shadow-2xs"
                      title="Hardware Barcode Scanner is armed. Scan any product with your barcode gun to add it instantly!"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>Ready to Scan</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Quick Manual Barcode Input */}
                    <div className="relative">
                      <i className="bi bi-upc-scan absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--mut)]"></i>
                      <input
                        type="text"
                        className="auth-input !h-8 text-xs !pl-7 !pr-2 w-36 sm:w-44 font-mono"
                        placeholder="Scan / Barcode..."
                        value={manualBarcodeInput}
                        onChange={(e) => setManualBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (manualBarcodeInput.trim()) {
                              processBarcodeScan(manualBarcodeInput.trim());
                              setManualBarcodeInput('');
                            }
                          }
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="btn-b text-xs font-semibold !h-8 px-3 flex items-center gap-1.5 shrink-0"
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>

                {/* Invisible Hardware Barcode Scanner Interceptor Input */}
                <input
                  ref={barcodeInputRef}
                  type="text"
                  autoComplete="off"
                  tabIndex={-1}
                  className="sr-only"
                  style={{
                    position: 'fixed',
                    top: -9999,
                    left: -9999,
                    opacity: 0,
                    width: 1,
                    height: 1,
                    pointerEvents: 'none',
                  }}
                  value={barcodeScanned}
                  onChange={(e) => setBarcodeScanned(e.target.value)}
                  onKeyDown={handleBarcodeScanKeyDown}
                />

                {/* Items List */}
                <div className="space-y-2.5">
                  {currentBill.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-xl border border-[var(--line)] bg-[var(--soft)]/30 space-y-2.5"
                    >
                      {/* Row 1: Product Selector & Thumbnail */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[var(--card)] border border-[var(--line)] overflow-hidden flex items-center justify-center shrink-0">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <i className="bi bi-box-seam text-sm text-[var(--blue)]"></i>
                          )}
                        </div>

                        {/* Product Dropdown (with real-time search) */}
                        <div className="flex-1 min-w-0">
                          <SearchableProductSelect
                            value={item.product_id}
                            onChange={(productId) => handleSelectProduct(idx, productId)}
                            products={allProducts}
                            placeholder="-- Choose Product / Item --"
                          />
                        </div>

                        {/* Remove Row Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="w-9 h-9 rounded-lg border border-[var(--line)] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center text-xs shrink-0"
                          title="Remove item"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>

                      {/* Row 2: Price, Qty, Discount (₹), Discount (%), Line Total */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                        {/* Price */}
                        <div>
                          <span className="text-[10px] text-[var(--mut)] block mb-0.5 font-medium">Price (₹)</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="auth-input !h-9 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                            value={item.unit_price}
                            onChange={(e) =>
                              handleItemFieldChange(idx, 'unit_price', e.target.value)
                            }
                          />
                        </div>

                        {/* Qty */}
                        <div>
                          <span className="text-[10px] text-[var(--mut)] block mb-0.5 font-medium">
                            Qty {item.stock_quantity > 0 ? `(Max: ${item.stock_quantity})` : ''}
                          </span>
                          <input
                            type="number"
                            min="1"
                            max={item.stock_quantity || 9999}
                            className="auth-input !h-9 text-xs font-semibold"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemFieldChange(idx, 'quantity', e.target.value)
                            }
                            required
                          />
                        </div>

                        {/* Discount (₹) */}
                        <div>
                          <span className="text-[10px] text-[var(--mut)] block mb-0.5 font-medium">Discount (₹)</span>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--mut)] font-bold pointer-events-none select-none">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              title="Flat Discount in Rupees"
                              className="auth-input !h-9 text-xs !pl-6 !pr-2 text-right font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={item.discount !== '' && item.discount !== null ? item.discount : ''}
                              onChange={(e) =>
                                handleItemFieldChange(idx, 'discount', e.target.value)
                              }
                            />
                          </div>
                        </div>

                        {/* Discount (%) */}
                        <div>
                          <span className="text-[10px] text-[var(--mut)] block mb-0.5 font-medium">Discount (%)</span>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder="0"
                              title="Percentage Discount"
                              className="auth-input !h-9 text-xs !pl-2 !pr-6 text-right font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={item.discount_percent !== '' && item.discount_percent !== null ? item.discount_percent : ''}
                              onChange={(e) =>
                                handleItemFieldChange(idx, 'discount_percent', e.target.value)
                              }
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--mut)] font-bold pointer-events-none select-none">
                              %
                            </span>
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="col-span-2 sm:col-span-1 text-right">
                          <span className="text-[10px] text-[var(--mut)] block mb-0.5 font-medium">Item Total</span>
                          <div className="h-9 flex items-center justify-end font-bold text-sm text-[var(--ink)]">
                            {fmtCurrency(item.line_total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-[var(--line)] flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[var(--blue)] font-semibold hover:underline flex items-center gap-1"
                  >
                    <i className="bi bi-plus-circle"></i>
                    <span>Add Another Product</span>
                  </button>
                  <span className="text-[var(--mut)] text-[11px]">
                    All items will be combined into a single invoice order
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Order Summary Sidebar (4 Cols) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="card2 !p-4 space-y-3.5">
                <div className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                  <i className="bi bi-wallet2 text-[var(--blue)]"></i>
                  <span>Payment & Invoice Summary</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--mut)]">Subtotal:</span>
                    <b className="text-[var(--ink)]">{fmtCurrency(subtotal)}</b>
                  </div>
                  <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <span>Discount Total:</span>
                    <b>− {fmtCurrency(totalDiscount)}</b>
                  </div>
                  <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-base">
                    <span className="font-bold text-[var(--ink)]">Grand Total:</span>
                    <b className="font-bold text-emerald-600 dark:text-emerald-400">
                      {fmtCurrency(grandTotal)}
                    </b>
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                    Order Remarks / Terms
                  </label>
                  <textarea
                    rows={2}
                    className="auth-input text-xs !h-auto py-1.5"
                    placeholder="e.g. Paid in cash, Thank you for your business!"
                    value={currentBill.notes}
                    onChange={(e) => updateCurrentBill({ notes: e.target.value })}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingSale}
                  className="btn-b w-full !h-10 justify-center text-xs font-bold shadow-lg"
                >
                  {submittingSale ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Generating Invoice...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <i className="bi bi-check-circle-fill"></i>
                      <span>Save & Generate Invoice</span>
                    </span>
                  )}
                </button>

                <p className="text-[10px] text-center text-[var(--mut)] leading-tight">
                  Automatically generates branded PDF using your store's selected invoice template.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODE 2: INVOICES & SALES HISTORY
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-3.5">
          {/* ── Summary & Filter Bar ── */}
          <div className="card2 !p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="search-input-wrap flex-1 md:max-w-sm">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="search-input text-xs"
                placeholder="Search invoice number, customer, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSales(1)}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchSales(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--mut)] hover:text-[var(--ink)] z-10"
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>

            {/* Date Filters + Refresh */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-[var(--mut)]">From:</span>
                <input
                  type="date"
                  className="auth-input !h-9 text-xs py-1 px-2 cursor-pointer"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-[var(--mut)]">To:</span>
                <input
                  type="date"
                  className="auth-input !h-9 text-xs py-1 px-2 cursor-pointer"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>

              <button
                onClick={() => fetchSales(1)}
                className="btn-b text-xs font-semibold !h-9 px-3"
              >
                <i className="bi bi-funnel"></i>
                <span>Filter</span>
              </button>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  fetchSales(1);
                }}
                className="chip !h-9 !px-2.5 text-xs shrink-0"
                title="Reset filters"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
            </div>
          </div>

          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="card2 !p-3">
              <span className="text-[11px] text-[var(--mut)] block">Total Invoices</span>
              <b className="text-base sm:text-lg font-bold text-[var(--ink)] block mt-0.5">
                {totalRows} Invoices
              </b>
            </div>

            <div className="card2 !p-3">
              <span className="text-[11px] text-[var(--mut)] block">Total Sales Revenue</span>
              <b className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {fmtCurrency(totalRevenue)}
              </b>
            </div>

            <div className="card2 !p-3 col-span-2 sm:col-span-1 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[var(--mut)] block">Fast POS Billing</span>
                <b className="text-xs font-semibold text-[var(--blue)] block mt-0.5">
                  Multi-item sales
                </b>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="btn-b text-xs font-semibold !h-8 px-3"
              >
                <i className="bi bi-plus-lg"></i>
                <span>New Sale</span>
              </button>
            </div>
          </div>

          {/* ── Sales Records (Dual View: Mobile Cards + Desktop Table) ── */}
          {loadingSales ? (
            <div className="card2 !p-8 text-center space-y-2">
              <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[var(--mut)]">Loading invoice records...</p>
            </div>
          ) : sales.length > 0 ? (
            <>
              {/* Mobile Native Cards View (< 768px) */}
              <div className="mobile-only space-y-2.5">
                {sales.map((s) => (
                  <div
                    key={s.id}
                    className="card2 !p-3.5 space-y-2.5 hover:border-[var(--blue)] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <b className="text-sm font-bold text-[var(--ink)] block">
                          {s.invoice_number}
                        </b>
                        <span className="text-[11px] text-[var(--mut)] block mt-0.5">
                          {s.sale_date ? s.sale_date.split(' ')[0] : 'Today'}
                        </span>
                      </div>
                      <span className="pill !text-[10px] !py-0.5 !px-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                        Paid
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[var(--line)] text-xs flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-[var(--mut)] block">Customer</span>
                        <b className="truncate block text-[var(--ink)]">
                          {s.customer_name || 'Walk-in Customer'}
                        </b>
                        <span className="text-[10px] text-[var(--mut)] block">
                          {s.customer_phone && s.customer_phone !== '-' ? s.customer_phone : ''}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-[var(--mut)] block">Grand Total</span>
                        <b className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {fmtCurrency(s.grand_total)}
                        </b>
                        <span className="text-[10px] text-[var(--mut)] block">
                          {s.items_count || 1} items
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenSaleDetail(s)}
                          className="text-xs text-[var(--blue)] font-semibold hover:underline flex items-center gap-1"
                        >
                          <i className="bi bi-eye"></i>
                          <span>View Details</span>
                        </button>
                        <a
                          href={s.print_invoice_url || `http://localhost/kaushik/billbook/sales/print_invoice/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-700 dark:text-slate-200 font-semibold hover:underline flex items-center gap-1"
                          title="Print Official Invoice"
                        >
                          <i className="bi bi-printer text-[var(--blue)]"></i>
                          <span>Print</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={s.print_invoice_url || `http://localhost/kaushik/billbook/sales/print_invoice/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-xs font-semibold text-[var(--ink)] flex items-center gap-1 hover:border-rose-400 hover:text-rose-600 transition-colors"
                          title="Open Invoice (Official HTML)"
                        >
                          <i className="bi bi-file-earmark-pdf text-rose-500"></i>
                          <span>PDF</span>
                        </a>

                        <a
                          href={s.invoice_image_url || `http://localhost/kaushik/billbook/uploads/invoices/invoice-${s.id}.jpg`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={`invoice-${s.invoice_number || s.id}.jpg`}
                          className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-xs font-semibold text-[var(--ink)] flex items-center gap-1 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                          title="Download / View Invoice JPG Image"
                        >
                          <i className="bi bi-file-earmark-image text-emerald-500"></i>
                          <span>JPG</span>
                        </a>

                        {s.customer_phone && s.customer_phone.length >= 10 && (
                          <a
                            href={s.whatsapp_url || `https://wa.me/91${s.customer_phone.replace(/\D/g, '')}?text=Dear%20${encodeURIComponent(s.customer_name || 'Customer')},%20Invoice%20%23${s.invoice_number}%20Amount:%20${s.grand_total}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg border border-[var(--line)] bg-emerald-50 text-[#25D366] hover:bg-emerald-100 flex items-center justify-center text-xs transition-colors"
                            title="Share Invoice on WhatsApp"
                          >
                            <i className="bi bi-whatsapp"></i>
                          </a>
                        )}

                        <button
                          onClick={() => setDeleteSaleId(s.id)}
                          className="w-7 h-7 rounded-lg border border-[var(--line)] text-rose-500 hover:bg-rose-50 flex items-center justify-center text-xs"
                          title="Delete Record"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (≥ 768px) */}
              <div className="desktop-only card2 !p-0 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[var(--soft)]/50 text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Items Sold</th>
                      <th className="py-3 px-3 text-right">Grand Total</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {sales.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--soft)]/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-[var(--ink)]">
                          {s.invoice_number}
                        </td>
                        <td className="py-3 px-3 text-[var(--mut)]">
                          {s.sale_date ? s.sale_date.split(' ')[0] : '-'}
                        </td>
                        <td className="py-3 px-3">
                          <b className="text-[var(--ink)] block">{s.customer_name || 'Walk-in Customer'}</b>
                          <span className="text-[10px] text-[var(--mut)]">
                            {s.customer_phone && s.customer_phone !== '-' ? s.customer_phone : ''}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[var(--mut)]">
                          <span className="font-semibold text-[var(--ink)]">
                            {s.items_count || 1}
                          </span>{' '}
                          items
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {fmtCurrency(s.grand_total)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="pill !text-[10px] !py-0.5 !px-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            Paid
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenSaleDetail(s)}
                              className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:text-[var(--blue)] text-[var(--mut)] flex items-center justify-center text-xs"
                              title="View Invoice Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>

                            <a
                              href={s.print_invoice_url || `http://localhost/kaushik/billbook/sales/print_invoice/${s.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-rose-50 hover:border-rose-300 text-rose-500 flex items-center justify-center text-xs transition-colors"
                              title="Open Invoice (Official HTML)"
                            >
                              <i className="bi bi-file-earmark-pdf"></i>
                            </a>

                            <a
                              href={s.invoice_image_url || `http://localhost/kaushik/billbook/uploads/invoices/invoice-${s.id}.jpg`}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={`invoice-${s.invoice_number || s.id}.jpg`}
                              className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-emerald-50 hover:border-emerald-300 text-emerald-600 flex items-center justify-center text-xs transition-colors"
                              title="Download / View Invoice JPG Image"
                            >
                              <i className="bi bi-file-earmark-image"></i>
                            </a>

                            {s.customer_phone && s.customer_phone.length >= 10 && (
                              <a
                                href={s.whatsapp_url || `https://wa.me/91${s.customer_phone.replace(/\D/g, '')}?text=Dear%20${encodeURIComponent(s.customer_name || 'Customer')},%20Invoice%20%23${s.invoice_number}%20Amount:%20${s.grand_total}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-emerald-50 text-[#25D366] hover:border-emerald-300 flex items-center justify-center text-xs transition-colors"
                                title="Share Invoice on WhatsApp"
                              >
                                <i className="bi bi-whatsapp"></i>
                              </a>
                            )}

                            <button
                              onClick={() => setDeleteSaleId(s.id)}
                              className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-rose-50 text-rose-500 flex items-center justify-center text-xs"
                              title="Delete Record"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRows={totalRows}
                limit={10}
                onPageChange={(p) => fetchSales(p)}
                itemName="sales"
              />
            </>
          ) : (
            <div className="card2 !p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--soft)] border border-[var(--line)] mx-auto flex items-center justify-center text-2xl text-[var(--mut)] mb-3">
                <i className="bi bi-receipt"></i>
              </div>
              <h3 className="text-sm font-bold text-[var(--ink)]">No Sales Records Found</h3>
              <p className="text-xs text-[var(--mut)] mt-1 mb-4">
                {searchQuery || filterDateFrom || filterDateTo
                  ? 'No sales matched your filters. Try clearing the search query.'
                  : 'Start billing items to see your order history and invoices here.'}
              </p>
              <button onClick={() => setActiveTab('create')} className="btn-b text-xs font-semibold !h-9 px-4">
                <i className="bi bi-plus-lg"></i>
                <span>Create New Sale</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          INVOICE CREATED SUCCESS MODAL (PDF & WHATSAPP)
      ══════════════════════════════════════════════════════════ */}
      {createdInvoice && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl">
              <i className="bi bi-check2-circle"></i>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--ink)]">Sale Created Successfully!</h3>
              <p className="text-xs text-[var(--mut)] mt-0.5">
                Invoice <b className="text-[var(--ink)]">{createdInvoice.invoice_number}</b> generated with your active theme.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--soft)] border border-[var(--line)] text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Customer:</span>
                <b className="text-[var(--ink)]">{createdInvoice.customer_name || 'Walk-in'}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Amount Paid:</span>
                <b className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {fmtCurrency(createdInvoice.grand_total)}
                </b>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Items:</span>
                <span className="text-[var(--ink)]">{createdInvoice.items?.length || 1} products</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <a
                href={createdInvoice.printUrl || `http://localhost/kaushik/billbook/sales/print_invoice/${createdInvoice.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-b text-xs font-semibold !h-9 justify-center flex items-center gap-1 shadow-sm"
              >
                <i className="bi bi-printer"></i>
                <span>Print</span>
              </a>

              {createdInvoice.pdfUrl ? (
                <a
                  href={createdInvoice.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip text-xs font-semibold !h-9 justify-center flex items-center gap-1"
                >
                  <i className="bi bi-file-earmark-pdf text-rose-500"></i>
                  <span>PDF</span>
                </a>
              ) : null}

              {createdInvoice.imageUrl ? (
                <a
                  href={createdInvoice.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`invoice-${createdInvoice.invoice_number || createdInvoice.id}.jpg`}
                  className="chip text-xs font-semibold !h-9 justify-center flex items-center gap-1 hover:border-emerald-400 hover:text-emerald-600"
                  title="Download / View JPG Image"
                >
                  <i className="bi bi-file-earmark-image text-emerald-500"></i>
                  <span>JPG</span>
                </a>
              ) : null}

              {createdInvoice.customer_phone ? (
                <>
                  {createdInvoice.whatsappRoute && createdInvoice.whatsappRoute !== 'skipped' && (
                    <div className="col-span-3 py-1.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <i className="bi bi-check-all text-base text-emerald-600"></i>
                      <span>WhatsApp auto-dispatched ({createdInvoice.whatsappRoute})</span>
                    </div>
                  )}

                  <a
                    href={createdInvoice.whatsappUrl || `https://wa.me/91${createdInvoice.customer_phone.replace(/\D/g, '')}?text=Dear%20${encodeURIComponent(createdInvoice.customer_name || 'Customer')},%20thank%20you%20for%20your%20purchase!%20Invoice%20%23${createdInvoice.invoice_number}%20Amount:%20Rs.%20${createdInvoice.grand_total}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-3 px-3 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-all shadow-md cursor-pointer"
                    title="Open WhatsApp chat and send invoice"
                  >
                    <i className="bi bi-whatsapp text-sm"></i>
                    <span>Share on WhatsApp</span>
                  </a>
                </>
              ) : null}
            </div>

            <button
              onClick={() => setCreatedInvoice(null)}
              className="text-xs text-[var(--mut)] hover:text-[var(--ink)] font-medium block mx-auto mt-2"
            >
              Continue to New Sale
            </button>
          </div>
        </div>
      )}

      {/* ── View Sale Detail Modal (Authentic PHP Tax Invoice Layout) ── */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Top Toolbar */}
            <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--card)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <b className="text-sm font-bold text-[var(--ink)]">
                  Tax Invoice #{selectedSaleDetail.invoice_number}
                </b>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedSaleDetail.print_invoice_url || `http://localhost/kaushik/billbook/sales/print_invoice/${selectedSaleDetail.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-b text-xs font-semibold !h-8 px-3 flex items-center gap-1.5 shadow-sm"
                  title="Open official PHP print view"
                >
                  <i className="bi bi-printer"></i>
                  <span>Print Official Invoice</span>
                </a>

                <a
                  href={selectedSaleDetail.print_invoice_url || `http://localhost/kaushik/billbook/sales/print_invoice/${selectedSaleDetail.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip text-xs !h-8 px-2.5 flex items-center gap-1 hover:border-rose-300 text-rose-600"
                  title="Open HTML Invoice"
                >
                  <i className="bi bi-file-earmark-pdf"></i>
                  <span>PDF View</span>
                </a>

                <button
                  onClick={() => setSelectedSaleDetail(null)}
                  className="w-7 h-7 rounded-lg text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--soft)] flex items-center justify-center"
                >
                  <i className="bi bi-x-lg text-xs"></i>
                </button>
              </div>
            </div>

            {/* Scrollable Authentic Invoice Sheet */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-slate-800 bg-white select-text">
              {/* Top Navy Header Banner */}
              <div
                className="p-4 sm:p-5 rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow"
                style={{ background: selectedSaleDetail.invoice_settings?.primary_color || '#0f172a' }}
              >
                <div className="flex items-center gap-3">
                  {selectedSaleDetail.business_info?.logo_url ? (
                    <img
                      src={selectedSaleDetail.business_info.logo_url}
                      alt="Store Logo"
                      className="w-14 h-14 rounded-lg object-cover bg-white/10 p-0.5 border border-white/20"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-white/15 flex items-center justify-center font-black text-xl text-white border border-white/20">
                      {(selectedSaleDetail.business_info?.name || 'KAUSHIK').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-black tracking-wide text-white">
                      {selectedSaleDetail.business_info?.name || 'KAUSHIK'}
                    </h2>
                    <p className="text-xs text-white/80 leading-relaxed max-w-sm">
                      {selectedSaleDetail.business_info?.address || 'Ahmedabad, Gujarat, India'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-white/85 space-y-0.5 shrink-0">
                  {selectedSaleDetail.business_info?.phone && (
                    <div className="flex sm:justify-end items-center gap-1.5 font-semibold">
                      <i className="bi bi-telephone text-sky-300"></i>
                      <span>{selectedSaleDetail.business_info.phone}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-white/70">
                    Smart Billing & POS System
                  </div>
                </div>
              </div>

              {/* TAX INVOICE Title Bar */}
              <div className="text-center py-2 border-b-2" style={{ borderColor: selectedSaleDetail.invoice_settings?.primary_color || '#0f172a' }}>
                <h3
                  className="text-base font-extrabold uppercase tracking-widest"
                  style={{ color: selectedSaleDetail.invoice_settings?.accent_color || '#2563eb' }}
                >
                  TAX INVOICE
                </h3>
              </div>

              {/* Dual Info Section: Bill To & Invoice Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Bill To */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider mb-1"
                    style={{ background: selectedSaleDetail.invoice_settings?.accent_color || '#2563eb' }}
                  >
                    BILL TO
                  </span>
                  <b className="block text-sm text-slate-900">
                    {selectedSaleDetail.customer_name || 'Walk-in Customer'}
                  </b>
                  {selectedSaleDetail.customer_phone && selectedSaleDetail.customer_phone !== '-' && (
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-700">Phone: </span>
                      {selectedSaleDetail.customer_phone}
                    </div>
                  )}
                  {selectedSaleDetail.customer_address && selectedSaleDetail.customer_address !== '-' && (
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-700">Address: </span>
                      {selectedSaleDetail.customer_address}
                    </div>
                  )}
                </div>

                {/* Invoice Details */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1 sm:text-right">
                  <div className="sm:flex sm:justify-end mb-1">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                      style={{ background: selectedSaleDetail.invoice_settings?.accent_color || '#2563eb' }}
                    >
                      INVOICE DETAILS
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Invoice No: </span>
                    <b className="font-mono text-slate-900">{selectedSaleDetail.invoice_number}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Date: </span>
                    <span className="font-semibold text-slate-800">{selectedSaleDetail.sale_date || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Payment Status: </span>
                    <span className="font-bold text-emerald-700">PAID</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr
                      className="text-white text-[10.5px] font-bold uppercase tracking-wider"
                      style={{ background: selectedSaleDetail.invoice_settings?.primary_color || '#0f172a' }}
                    >
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price / Unit</th>
                      <th className="py-2.5 px-3 text-right">Discount</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(selectedSaleDetail.items || []).map((it, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {it.product_name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                          {it.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {fmtCurrency(it.unit_price)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {parseFloat(it.discount_amount || 0) > 0 ? (
                            <span>
                              {fmtCurrency(it.discount_amount)}
                              {it.discount_percent > 0 && ` (${it.discount_percent}%)`}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {fmtCurrency(it.line_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold text-xs" style={{ borderColor: selectedSaleDetail.invoice_settings?.primary_color || '#0f172a' }}>
                      <td colSpan="2" className="py-2.5 px-3 text-slate-900">Total</td>
                      <td className="py-2.5 px-3 text-center text-slate-900">
                        {(selectedSaleDetail.items || []).reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)}
                      </td>
                      <td></td>
                      <td className="py-2.5 px-3 text-right text-rose-600">
                        {parseFloat(selectedSaleDetail.discount_amount || 0) > 0 ? fmtCurrency(selectedSaleDetail.discount_amount) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black" style={{ color: selectedSaleDetail.invoice_settings?.primary_color || '#0f172a' }}>
                        {fmtCurrency(selectedSaleDetail.grand_total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Section: Amount in Words + Terms + Summary Box */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-1 text-xs">
                {/* Left: Words & Terms */}
                <div className="sm:col-span-7 space-y-3">
                  <div className="p-3 rounded-xl border border-sky-100 bg-sky-50/50">
                    <span
                      className="text-[9.5px] font-bold uppercase tracking-wider block mb-0.5"
                      style={{ color: selectedSaleDetail.invoice_settings?.accent_color || '#2563eb' }}
                    >
                      INVOICE AMOUNT IN WORDS
                    </span>
                    <span className="text-slate-800 font-semibold italic text-xs leading-relaxed block">
                      {numberToWordsIndian(selectedSaleDetail.grand_total)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70">
                    <span className="text-[9.5px] font-bold text-amber-900 uppercase tracking-wider block mb-0.5">
                      TERMS & CONDITIONS
                    </span>
                    <p className="text-amber-950 text-[11px] leading-relaxed">
                      {selectedSaleDetail.notes || 'Multi-item POS order test'}
                    </p>
                  </div>
                </div>

                {/* Right: Summary Box */}
                <div className="sm:col-span-5 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white divide-y divide-slate-100 text-xs">
                  <div className="p-2.5 flex justify-between items-center text-slate-600">
                    <span>Sub Total</span>
                    <b className="text-slate-900">{fmtCurrency(selectedSaleDetail.subtotal)}</b>
                  </div>
                  <div className="p-2.5 flex justify-between items-center text-rose-600 font-medium">
                    <span>Discount</span>
                    <b>− {fmtCurrency(selectedSaleDetail.discount_amount)}</b>
                  </div>
                  {/* Highlighted Total Row */}
                  <div
                    className="p-3 flex justify-between items-center text-white font-extrabold text-sm shadow-inner"
                    style={{ background: selectedSaleDetail.invoice_settings?.accent_color || '#2563eb' }}
                  >
                    <span>Total</span>
                    <span className="text-base">{fmtCurrency(selectedSaleDetail.grand_total)}</span>
                  </div>
                  <div className="p-2.5 flex justify-between items-center text-slate-700">
                    <span>Received</span>
                    <b className="text-slate-900">{fmtCurrency(selectedSaleDetail.grand_total)}</b>
                  </div>
                  <div className="p-2.5 flex justify-between items-center text-slate-700">
                    <span>Balance</span>
                    <b className="text-slate-900">Rs. 0.00</b>
                  </div>
                  {parseFloat(selectedSaleDetail.discount_amount || 0) > 0 && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 flex justify-between items-center font-bold">
                      <span>You Saved</span>
                      <span>{fmtCurrency(selectedSaleDetail.discount_amount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Section */}
              <div className="pt-3 flex justify-end">
                <div className="text-right space-y-1">
                  <span className="text-xs text-slate-600 font-semibold block">
                    For: <b className="text-slate-900">{selectedSaleDetail.business_info?.name || 'KAUSHIK'}</b>
                  </span>
                  {selectedSaleDetail.signature_url ? (
                    <img
                      src={selectedSaleDetail.signature_url}
                      alt="Authorized Signature"
                      className="max-h-12 ml-auto object-contain my-1"
                    />
                  ) : (
                    <div className="w-36 h-9 ml-auto flex items-center justify-center border-b-2 border-slate-400">
                      <span className="text-[10px] text-slate-400 font-mono italic">Authorized Signature</span>
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 block">Authorized Signatory</span>
                </div>
              </div>
            </div>

            {/* Bottom Modal Footer */}
            <div className="p-3 border-t border-[var(--line)] bg-[var(--card)] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[var(--mut)]">
                Rendered with active theme settings
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSaleDetail(null)}
                  className="chip text-xs !h-8 px-4 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteSaleId && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-2xl">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h3 className="text-sm font-bold text-[var(--ink)]">Delete Sale Record?</h3>
            <p className="text-xs text-[var(--mut)]">
              Are you sure you want to delete this sale? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteSaleId(null)}
                className="chip text-xs !h-8 px-3"
                disabled={deletingSale}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSale}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                disabled={deletingSale}
              >
                {deletingSale ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
