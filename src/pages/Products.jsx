import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const Products = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [serverValuation, setServerValuation] = useState(0);
  const [serverCatalogCount, setServerCatalogCount] = useState(0);
  const [serverLowStockCount, setServerLowStockCount] = useState(0);
  const limit = 10;

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low_stock', 'out_of_stock'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'disabled'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    sale_price: '',
    purchase_price: '',
    quantity: '',
    barcode: '',
    description: '',
    status: 'active',
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Barcode Print Sheet State
  const [barcodePrintModalOpen, setBarcodePrintModalOpen] = useState(false);
  const [barcodePrintLoading, setBarcodePrintLoading] = useState(false);
  const [barcodeSheetData, setBarcodeSheetData] = useState([]);
  const [barcodeCopiesMap, setBarcodeCopiesMap] = useState({});

  // Fetch Categories for Dropdown
  const fetchCategories = async () => {
    try {
      const catRes = await categoryService.getCategories();
      if (catRes.status && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
    } catch {
      // ignore
    }
  };

  // Fetch Paginated Products
  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      let mappedStock = 'all';
      if (stockFilter === 'low_stock') mappedStock = 'low';
      if (stockFilter === 'out_of_stock') mappedStock = 'out';

      const res = await productService.getProducts({
        page,
        limit,
        search: search.trim(),
        category_id: selectedCategory,
        stock_filter: mappedStock,
        status_filter: statusFilter,
      });

      if (res.status && res.data) {
        if (res.data.products) {
          setProducts(res.data.products || []);
          setTotalRows(res.data.total_rows || 0);
          setTotalPages(res.data.total_pages || 1);
          setCurrentPage(res.data.current_page || 1);
          if (res.data.total_valuation !== undefined) {
            setServerValuation(res.data.total_valuation);
            setServerCatalogCount(res.data.total_catalog);
            setServerLowStockCount(res.data.low_stock_count);
          }
        } else if (Array.isArray(res.data)) {
          setProducts(res.data);
          setTotalRows(res.data.length);
          setTotalPages(Math.ceil(res.data.length / limit) || 1);
          setCurrentPage(page);
        }
      }
    } catch (err) {
      toast.error('Error loading inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, stockFilter, statusFilter]);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  // Currency Formatter
  const fmtCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return (
      'Rs. ' +
      num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase().trim()) ||
      p.description?.toLowerCase().includes(search.toLowerCase().trim());

    const matchesCategory =
      selectedCategory === 'all' ||
      String(p.category_id) === String(selectedCategory);

    const qty = parseInt(p.quantity, 10) || 0;
    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = qty > 5;
    if (stockFilter === 'low_stock') matchesStock = qty > 0 && qty <= 5;
    if (stockFilter === 'out_of_stock') matchesStock = qty === 0;

    const isActive = p.isActive == 1 || p.isActive === '1' || p.status === 'active';
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = isActive;
    if (statusFilter === 'disabled') matchesStatus = !isActive;

    return matchesSearch && matchesCategory && matchesStock && matchesStatus;
  });

  // Inventory Totals
  const totalStockValuation = products.reduce((acc, p) => {
    const qty = parseInt(p.quantity, 10) || 0;
    const cost = parseFloat(p.purchase_price) || 0;
    return acc + qty * cost;
  }, 0);

  const lowStockCount = products.filter((p) => {
    const qty = parseInt(p.quantity, 10) || 0;
    return qty <= 5;
  }).length;

  // Form Handlers
  const handleOpenAdd = async () => {
    setModalMode('add');
    setEditingProduct(null);
    let initialBarcode = '';
    try {
      const res = await productService.generateBarcode();
      if (res.status && res.data?.barcode) {
        initialBarcode = res.data.barcode;
      }
    } catch {
      initialBarcode = String(Math.floor(100000 + Math.random() * 900000));
    }
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      sale_price: '',
      purchase_price: '',
      quantity: '',
      barcode: initialBarcode,
      description: '',
      status: 'active',
    });
    setPreviewImage(null);
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setModalMode('edit');
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      category_id: prod.category_id || '',
      sale_price: prod.sale_price || prod.price || '',
      purchase_price: prod.purchase_price || '',
      quantity: prod.quantity || '0',
      barcode: prod.barcode || '',
      description: prod.description || '',
      status: prod.isActive == 1 ? 'active' : 'inactive',
    });
    setPreviewImage(prod.image || null);
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleGenerateBarcode = async () => {
    try {
      const res = await productService.generateBarcode();
      if (res.status && res.data?.barcode) {
        setFormData((prev) => ({ ...prev, barcode: res.data.barcode }));
        toast.success(`Generated barcode: ${res.data.barcode}`);
      }
    } catch {
      const rnd = String(Math.floor(100000 + Math.random() * 900000));
      setFormData((prev) => ({ ...prev, barcode: rnd }));
      toast.success(`Generated barcode: ${rnd}`);
    }
  };

  // Barcode Print Sheet Handlers
  const handleOpenBarcodePrint = async (productOrProducts) => {
    const list = Array.isArray(productOrProducts) ? productOrProducts : [productOrProducts];
    if (list.length === 0) {
      toast.error('No products available to print barcodes.');
      return;
    }

    setBarcodePrintModalOpen(true);
    setBarcodePrintLoading(true);

    const copiesMap = {};
    list.forEach((p) => {
      copiesMap[p.id] = list.length === 1 ? 4 : 2;
    });
    setBarcodeCopiesMap(copiesMap);

    try {
      const param = list.map((p) => `${p.id}:${copiesMap[p.id] || 1}`).join(',');
      const res = await productService.getBarcodeSheet(param);
      if (res.status && res.data?.items) {
        setBarcodeSheetData(res.data.items);
      } else {
        toast.error('Could not load barcode sheet.');
      }
    } catch (err) {
      console.error('Barcode sheet error:', err);
      toast.error('Error connecting to barcode printing service.');
    } finally {
      setBarcodePrintLoading(false);
    }
  };

  const handleUpdateCopies = async (productId, delta) => {
    const current = barcodeCopiesMap[productId] || 1;
    const next = Math.max(1, Math.min(100, current + delta));
    const updatedMap = { ...barcodeCopiesMap, [productId]: next };
    setBarcodeCopiesMap(updatedMap);

    const param = Object.entries(updatedMap)
      .map(([id, copies]) => `${id}:${copies}`)
      .join(',');

    try {
      const res = await productService.getBarcodeSheet(param);
      if (res.status && res.data?.items) {
        setBarcodeSheetData(res.data.items);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Product image must be less than 2MB.');
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
      toast.error('Product name is required.');
      return;
    }
    if (!formData.category_id) {
      toast.error('Please select a category.');
      return;
    }
    if (formData.sale_price === '' || isNaN(formData.sale_price)) {
      toast.error('Valid selling price is required.');
      return;
    }

    setSubmitting(true);
    try {
      let payload;
      if (selectedFile) {
        payload = new FormData();
        payload.append('name', formData.name.trim());
        payload.append('category', formData.category_id);
        payload.append('category_id', formData.category_id);
        payload.append('price', formData.sale_price);
        payload.append('costPrice', formData.purchase_price || '0');
        payload.append('stock', formData.quantity || '0');
        payload.append('description', formData.description.trim());
        payload.append('status', formData.status);
        payload.append('barcode', (formData.barcode || '').trim());
        payload.append('product_image', selectedFile);

        if (modalMode === 'edit') {
          payload.append('id', editingProduct.id);
        }
      } else {
        payload = {
          name: formData.name.trim(),
          category: formData.category_id,
          category_id: formData.category_id,
          price: formData.sale_price,
          costPrice: formData.purchase_price || '0',
          stock: formData.quantity || '0',
          barcode: (formData.barcode || '').trim(),
          description: formData.description.trim(),
          status: formData.status,
        };

        if (modalMode === 'edit') {
          payload.id = editingProduct.id;
        }
      }

      if (modalMode === 'add') {
        const res = await productService.addProduct(payload);
        if (res.status) {
          toast.success(res.message || 'Product created successfully!');
          setModalOpen(false);
          fetchProducts(1);
        } else {
          toast.error(res.message || 'Failed to create product.');
        }
      } else {
        const res = await productService.updateProduct(payload);
        if (res.status) {
          toast.success(res.message || 'Product updated successfully!');
          setModalOpen(false);
          fetchProducts(currentPage);
        } else {
          toast.error(res.message || 'Failed to update product.');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await productService.deleteProduct(deleteId);
      if (res.status) {
        toast.success(res.message || 'Product deleted successfully!');
        setDeleteId(null);
        fetchProducts(currentPage);
      } else {
        toast.error(res.message || 'Could not delete product.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting product.');
    } finally {
      setDeleting(false);
    }
  };

  // Margin calculation helper
  const saleNum = parseFloat(formData.sale_price) || 0;
  const costNum = parseFloat(formData.purchase_price) || 0;
  const marginAmt = saleNum - costNum;
  const marginPct = saleNum > 0 ? Math.round((marginAmt / saleNum) * 100) : 0;

  // Stock badge helper
  const renderStockBadge = (qty) => {
    if (qty === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 shadow-sm">
          <i className="bi bi-x-circle-fill"></i>
          <span>Out of Stock</span>
        </span>
      );
    }
    if (qty <= 5) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 shadow-sm animate-pulse">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>{qty} left (Low)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-sm">
        <i className="bi bi-check-circle-fill"></i>
        <span>{qty} in stock</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Header & Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
        <div className="min-w-0">
          <div className="text-[11px] text-[var(--mut)] flex items-center gap-1.5 mb-0.5 font-medium">
            <i className="bi bi-box-seam text-[var(--blue)]"></i>
            <span>Catalog & Stock Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight">Products Inventory</h1>
          <p className="text-xs text-[var(--mut)] hidden sm:block mt-0.5">
            Manage items, sale prices, cost pricing, margins, and monitor stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="chip !hidden md:!inline-flex text-xs">
            <i className="bi bi-boxes text-[var(--blue)]"></i>
            <span><b>{serverCatalogCount || totalRows || products.length}</b> Items</span>
            <span className="mx-1 opacity-40">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Valuation: {fmtCurrency(serverValuation || totalStockValuation)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleOpenBarcodePrint(products)}
            className="chip !h-9 !px-3 text-xs font-semibold flex items-center gap-1.5 shrink-0 hover:text-[var(--blue)] cursor-pointer"
            title="Print barcode stickers for visible products"
          >
            <i className="bi bi-printer text-[var(--blue)]"></i>
            <span className="hidden sm:inline">Print Barcodes</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn-b text-xs font-semibold !h-9 px-3.5 flex items-center gap-1.5 shrink-0"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* ── Mini KPI Row (Compact 3-column row on all screens) ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        <div className="card2 !p-2 sm:!p-3.5 flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 text-[var(--blue)] flex items-center justify-center text-xs sm:text-lg shrink-0">
            <i className="bi bi-box-seam"></i>
          </div>
          <div className="min-w-0 w-full sm:w-auto">
            <span className="text-[9px] sm:text-[11px] text-[var(--mut)] block truncate">Total Items</span>
            <b className="text-[11px] sm:text-base font-bold text-[var(--ink)] leading-tight block truncate">
              {serverCatalogCount || totalRows || products.length} <span className="hidden sm:inline">Products</span>
            </b>
          </div>
        </div>

        <div className="card2 !p-2 sm:!p-3.5 flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs sm:text-lg shrink-0">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="min-w-0 w-full sm:w-auto">
            <span className="text-[9px] sm:text-[11px] text-[var(--mut)] block truncate">Valuation (Cost)</span>
            <b className="text-[11px] sm:text-base font-bold text-emerald-600 dark:text-emerald-400 leading-tight block truncate" title={fmtCurrency(serverValuation || totalStockValuation)}>
              {fmtCurrency(serverValuation || totalStockValuation)}
            </b>
          </div>
        </div>

        <div className="card2 !p-2 sm:!p-3.5 flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
          <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-lg shrink-0 ${
            (serverLowStockCount || lowStockCount) > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-gray-500/10 text-gray-500'
          }`}>
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <div className="min-w-0 w-full sm:w-auto">
            <span className="text-[9px] sm:text-[11px] text-[var(--mut)] block truncate">Low Stock (≤5)</span>
            <b className={`text-[11px] sm:text-base font-bold leading-tight block truncate ${
              (serverLowStockCount || lowStockCount) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ink)]'
            }`}>
              {serverLowStockCount || lowStockCount} <span className="hidden sm:inline">Critical</span>
            </b>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="card2 !p-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Search Input Box + Mobile Refresh Button */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <div className="search-input-wrap flex-1">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="search-input text-xs"
                placeholder="Search products by name or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--mut)] hover:text-[var(--ink)] z-10"
                  title="Clear search"
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>

            {/* Refresh Button on Mobile (Aligned right beside search input) */}
            <button
              type="button"
              onClick={() => fetchProducts(1)}
              className="chip !h-[38px] !w-[38px] !px-0 flex md:hidden items-center justify-center shrink-0 cursor-pointer hover:text-[var(--blue)]"
              title="Refresh inventory"
            >
              <i className="bi bi-arrow-clockwise text-sm"></i>
            </button>
          </div>

          {/* Filter Dropdowns: Full-width Category on Mobile, 50-50 Status & Stock; Inline on Desktop */}
          <div className="grid grid-cols-2 md:flex md:items-center gap-2 shrink-0">
            {/* Category Filter Dropdown (Spans full width on mobile so names never truncate!) */}
            <div className="col-span-2 md:col-auto md:w-[165px]">
              <select
                className="auth-input !h-[38px] text-xs py-1 px-3 cursor-pointer w-full truncate"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Dropdown */}
            <div className="col-span-1 md:w-[125px]">
              <select
                className="auth-input !h-[38px] text-xs py-1 px-3 cursor-pointer w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            {/* Stock Level Filter Dropdown */}
            <div className="col-span-1 md:w-[135px]">
              <select
                className="auth-input !h-[38px] text-xs py-1 px-3 cursor-pointer w-full"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="all">All Stock</option>
                <option value="low_stock">Low Stock (≤5)</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Refresh Button on Desktop (at end of single horizontal line) */}
            <button
              type="button"
              onClick={() => fetchProducts(1)}
              className="chip !h-[38px] !w-[38px] !px-0 hidden md:flex items-center justify-center shrink-0 cursor-pointer hover:text-[var(--blue)]"
              title="Refresh inventory"
            >
              <i className="bi bi-arrow-clockwise text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* ── Products List / Table ── */}
      {loading ? (
        <div className="card2 !p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex items-center gap-4 py-2 border-b border-[var(--line)]">
              <div className="skeleton w-10 h-10 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-44 rounded"></div>
                <div className="skeleton h-3 w-28 rounded"></div>
              </div>
              <div className="skeleton h-4 w-20 rounded"></div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          {/* Mobile Native Card List (Visible on < 768px) */}
          <div className="mobile-only space-y-2.5">
            {products.map((prod) => {
              const qty = parseInt(prod.quantity, 10) || 0;
              const saleP = parseFloat(prod.sale_price) || parseFloat(prod.price) || 0;
              const costP = parseFloat(prod.purchase_price) || 0;
              const margin = saleP - costP;
              const isActive = prod.isActive == 1 || prod.isActive === '1';

              return (
                <div
                  key={prod.id}
                  className="card2 !p-3.5 space-y-2.5 hover:border-[var(--blue)] transition-all"
                >
                  {/* Top: Product image + Name + Status */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--soft)] border border-[var(--line)] overflow-hidden flex items-center justify-center shrink-0">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <i className="bi bi-box-seam text-lg text-[var(--blue)]"></i>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <b className="font-bold text-[13px] text-[var(--ink)] leading-snug line-clamp-1" title={prod.name}>
                          {prod.name}
                        </b>
                        <span className={`pill shrink-0 !text-[10px] !py-0.5 !px-2 font-medium ${isActive ? '' : 'pill-danger'}`}>
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--mut)] flex-wrap">
                        <span className="inline-flex items-center gap-1 font-medium text-[var(--blue)]">
                          <i className="bi bi-tag text-[10px]"></i> {prod.category_name || 'Unassigned'}
                        </span>
                        <span>•</span>
                        <span>#{prod.id}</span>
                        {prod.barcode && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-[var(--mut)] bg-[var(--soft)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                              <i className="bi bi-upc mr-1 text-[var(--blue)]"></i>
                              {prod.barcode}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Pricing & Stock status */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--line)] text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--mut)] block">Sale Price</span>
                      <b className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {fmtCurrency(saleP)}
                      </b>
                      <span className="text-[10px] text-[var(--mut)] block mt-0.5">
                        Cost: {fmtCurrency(costP)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[var(--mut)] block mb-0.5">Inventory Stock</span>
                      {renderStockBadge(qty)}
                      {margin !== 0 && (
                        <span className={`text-[10px] block font-medium mt-1 ${margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          Margin: {margin >= 0 ? '+' : ''}{fmtCurrency(margin)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Quantity count & Actions */}
                  <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--mut)]">
                      Units: <b className="text-[var(--ink)] font-semibold">{qty} available</b>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenBarcodePrint(prod)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:text-emerald-600 text-xs font-semibold text-[var(--ink)] flex items-center gap-1 transition-colors"
                        title="Print Barcode Stickers"
                      >
                        <i className="bi bi-printer text-emerald-600"></i>
                        <span>Print</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:text-[var(--blue)] text-xs font-semibold text-[var(--ink)] flex items-center gap-1 transition-colors"
                      >
                        <i className="bi bi-pencil"></i>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteId(prod.id)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 text-xs font-semibold text-rose-500 flex items-center gap-1 transition-colors"
                      >
                        <i className="bi bi-trash"></i>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (Visible on ≥ 768px) */}
          <div className="desktop-only card2 !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--soft)]/50 text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Sale Price</th>
                    <th className="py-3 px-3 text-right hidden sm:table-cell">Purchase Cost</th>
                    <th className="py-3 px-3 text-center">Stock Qty</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-xs">
                  {products.map((prod) => {
                    const qty = parseInt(prod.quantity, 10) || 0;
                    const saleP = parseFloat(prod.sale_price) || parseFloat(prod.price) || 0;
                    const costP = parseFloat(prod.purchase_price) || 0;
                    const margin = saleP - costP;
                    const isActive = prod.isActive == 1 || prod.isActive === '1';

                    return (
                      <tr key={prod.id} className="hover:bg-[var(--soft)]/40 transition-colors">
                        {/* Product Thumbnail & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--soft)] border border-[var(--line)] overflow-hidden flex items-center justify-center shrink-0">
                              {prod.image ? (
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <i className="bi bi-box-seam text-base text-[var(--blue)]"></i>
                              )}
                            </div>
                            <div className="min-w-0 max-w-[220px]">
                              <b className="font-semibold text-[13px] text-[var(--ink)] block truncate" title={prod.name}>
                                {prod.name}
                              </b>
                              <div className="flex items-center gap-1.5 text-[11px] text-[var(--mut)] truncate">
                                {prod.barcode ? (
                                  <span className="font-mono text-[10px] bg-[var(--soft)] px-1.5 py-0.5 rounded border border-[var(--line)] inline-flex items-center gap-1 text-[var(--ink)]">
                                    <i className="bi bi-upc text-[var(--blue)]"></i>
                                    <span>{prod.barcode}</span>
                                  </span>
                                ) : (
                                  <span>#{prod.id}</span>
                                )}
                                {prod.description && (
                                  <span className="truncate opacity-75">• {prod.description}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[var(--blue)] font-medium text-[11px]">
                            <i className="bi bi-tag text-[10px]"></i>
                            <span>{prod.category_name || 'Unassigned'}</span>
                          </span>
                        </td>

                        {/* Sale Price */}
                        <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {fmtCurrency(saleP)}
                        </td>

                        {/* Purchase Cost & Margin */}
                        <td className="py-3 px-3 text-right hidden sm:table-cell">
                          <div className="text-[var(--mut)]">{fmtCurrency(costP)}</div>
                          {margin > 0 && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                              +{fmtCurrency(margin)} margin
                            </span>
                          )}
                        </td>

                        {/* Stock Quantity Badge */}
                        <td className="py-3 px-3 text-center">
                          {renderStockBadge(qty)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span className={`pill !text-[11px] !py-0.5 !px-2.5 font-medium ${isActive ? '' : 'pill-danger'}`}>
                            {isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenBarcodePrint(prod)}
                              className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:text-emerald-600 text-[var(--mut)] flex items-center justify-center transition-colors text-xs"
                              title="Print Barcode Stickers"
                            >
                              <i className="bi bi-printer text-emerald-600"></i>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(prod)}
                              className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:text-[var(--blue)] text-[var(--mut)] flex items-center justify-center transition-colors text-xs"
                              title="Edit Product"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              onClick={() => setDeleteId(prod.id)}
                              className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 text-[var(--mut)] flex items-center justify-center transition-colors text-xs"
                              title="Delete Product"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRows={totalRows}
            limit={limit}
            onPageChange={(p) => fetchProducts(p)}
            itemName="products"
          />
        </>
      ) : (
        /* Empty State */
        <div className="card2 !p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--soft)] border border-[var(--line)] mx-auto flex items-center justify-center text-3xl text-[var(--mut)] mb-3">
            <i className="bi bi-box-seam"></i>
          </div>
          <h3 className="text-base font-bold text-[var(--ink)]">No Products Found</h3>
          <p className="text-xs text-[var(--mut)] max-w-sm mx-auto mt-1 mb-5">
            {search || selectedCategory !== 'all' || stockFilter !== 'all'
              ? 'No products match your current search or filter criteria.'
              : 'Your store catalog is empty. Add your first product to start generating sales and invoices.'}
          </p>
          <button onClick={handleOpenAdd} className="btn-b text-xs font-semibold !h-9 px-4">
            <i className="bi bi-plus-lg"></i>
            <span>Add First Product</span>
          </button>
        </div>
      )}

      {/* ── Add / Edit Product Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center font-bold">
                  <i className="bi bi-box-seam"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)]">
                    {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
                  </h3>
                  <p className="text-[11px] text-[var(--mut)]">
                    {modalMode === 'add'
                      ? 'Add an item with pricing and stock to your catalog.'
                      : `Update details for product #${editingProduct?.id}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-lg text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--soft)] flex items-center justify-center"
              >
                <i className="bi bi-x-lg text-xs"></i>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Product Photo Upload */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--soft)] border border-[var(--line)]">
                <div className="relative group w-16 h-16 rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--line)] flex items-center justify-center shrink-0">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <i className="bi bi-image text-2xl text-[var(--mut)]"></i>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Change Photo"
                  >
                    <i className="bi bi-camera text-sm"></i>
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <b className="text-xs font-semibold text-[var(--ink)] block">Product Image</b>
                  <p className="text-[11px] text-[var(--mut)] mt-0.5">JPG, PNG, WebP up to 2MB.</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[var(--blue)] hover:underline font-medium mt-1 inline-block"
                  >
                    {previewImage ? 'Replace Image' : 'Upload Image'}
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="auth-input text-xs"
                  placeholder="e.g. Call of Duty: Modern Warfare III"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  className="auth-input text-xs cursor-pointer"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="" disabled>
                    -- Select Category --
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Barcode / SKU */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider">
                    Barcode / SKU
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-xs text-[var(--blue)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    title="Generate unique 6-digit barcode"
                  >
                    <i className="bi bi-magic"></i>
                    <span>Generate Code</span>
                  </button>
                </div>
                <div className="relative">
                  <i className="bi bi-upc absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mut)] text-sm"></i>
                  <input
                    type="text"
                    className="auth-input text-xs !pl-9 font-mono font-medium"
                    placeholder="e.g. 581379 (Auto-generated if left empty)"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* Selling Price */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1 truncate">
                    Sale (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="auth-input text-xs font-semibold text-emerald-600 dark:text-emerald-400 !px-2.5"
                    placeholder="1500"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    required
                  />
                </div>

                {/* Purchase Cost */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1 truncate">
                    Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="auth-input text-xs !px-2.5"
                    placeholder="1000"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1 truncate">
                    Stock Qty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="auth-input text-xs font-semibold !px-2.5"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Profit Margin Preview Pill */}
              {saleNum > 0 && costNum > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                    Calculated Profit Margin:
                  </span>
                  <b className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {fmtCurrency(marginAmt)} ({marginPct}%)
                  </b>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                  Product Description (Optional)
                </label>
                <textarea
                  rows={2}
                  className="auth-input text-xs !h-auto py-2"
                  placeholder="Additional specifications, brand, size, warranty..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                  Item Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'active' })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formData.status === 'active'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-600 shadow-sm'
                        : 'border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:bg-[var(--soft)]'
                    }`}
                  >
                    <i className="bi bi-check-circle-fill text-emerald-600 dark:text-emerald-400"></i>
                    <span>Active for Sale</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'inactive' })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formData.status === 'inactive'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-600 shadow-sm'
                        : 'border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:bg-[var(--soft)]'
                    }`}
                  >
                    <i className="bi bi-dash-circle text-rose-600 dark:text-rose-400"></i>
                    <span>Disabled / Hidden</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="chip text-xs hover:bg-[var(--soft)] !h-9"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-b text-xs font-semibold !h-9 px-4 disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </span>
                  ) : modalMode === 'add' ? (
                    'Add Product'
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteId && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl p-5 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center text-xl mb-3">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h3 className="text-sm font-bold text-[var(--ink)]">Delete Product?</h3>
            <p className="text-xs text-[var(--mut)] mt-1 mb-5">
              Are you sure you want to delete this product from your inventory? Existing completed sales will not be affected.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="chip text-xs !h-9 flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-d !bg-rose-600 hover:!bg-rose-700 text-white text-xs !h-9 flex-1 justify-center disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Barcode Print Sheet Modal ── */}
      {barcodePrintModalOpen && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header (Hidden on print) */}
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-lg">
                  <i className="bi bi-upc-scan"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)]">Print Barcode Stickers</h3>
                  <p className="text-[11px] text-[var(--mut)]">
                    Standard 4-column printable sticker layout. Compatible with A4 label sheets & barcode printers.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-b text-xs font-semibold !h-9 px-4 flex items-center gap-2 cursor-pointer"
                >
                  <i className="bi bi-printer"></i>
                  <span>Print Sheet Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBarcodePrintModalOpen(false)}
                  className="w-8 h-8 rounded-lg text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--soft)] flex items-center justify-center text-xs"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            {/* Quick Copies Toolbar (Hidden on print) */}
            <div className="p-3 bg-[var(--soft)]/50 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-xs no-print">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[var(--mut)] font-semibold uppercase tracking-wider text-[11px]">Adjust Copies:</span>
                <div className="flex items-center gap-2 flex-wrap max-h-24 overflow-y-auto">
                  {barcodeSheetData.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--line)]"
                    >
                      <span className="font-semibold truncate max-w-[120px]" title={item.product_name}>
                        {item.product_name}:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCopies(item.product_id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-[var(--soft)] text-[var(--ink)] font-bold"
                      >
                        -
                      </button>
                      <span className="font-bold text-[var(--blue)] min-w-[18px] text-center">
                        {barcodeCopiesMap[item.product_id] || item.copies}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCopies(item.product_id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-[var(--soft)] text-[var(--ink)] font-bold"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-[var(--mut)] shrink-0">
                Total Stickers:{' '}
                <b className="text-[var(--ink)] font-bold">
                  {barcodeSheetData.reduce(
                    (acc, it) => acc + (barcodeCopiesMap[it.product_id] || it.copies || 1),
                    0
                  )}
                </b>
              </div>
            </div>

            {/* Barcode Stickers Printable Sheet */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-950">
              {barcodePrintLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-[var(--mut)] font-medium">Rendering Code 128 barcode stickers...</p>
                </div>
              ) : (
                <div
                  id="printable-barcode-sheet"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow-sm text-black"
                >
                  {barcodeSheetData.flatMap((item) => {
                    const copies = barcodeCopiesMap[item.product_id] || item.copies || 1;
                    return Array.from({ length: copies }).map((_, i) => (
                      <div
                        key={`${item.product_id}_${i}`}
                        className="p-2.5 border border-dashed border-gray-400 rounded-lg text-center flex flex-col items-center justify-between min-h-[110px] bg-white break-inside-avoid"
                      >
                        <div className="text-[10px] font-bold text-gray-900 truncate w-full mb-1">
                          {item.product_name}
                        </div>
                        <img
                          src={`data:image/png;base64,${item.image_base64}`}
                          alt={item.barcode}
                          className="max-h-12 w-auto object-contain my-auto"
                        />
                        <div className="w-full mt-1 flex items-center justify-between text-[10px] font-mono text-gray-600 px-1 border-t border-gray-200 pt-0.5">
                          <span className="tracking-widest font-bold">{item.barcode}</span>
                          <span className="font-bold text-gray-900">
                            Rs. {Math.round(item.sale_price).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ));
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
