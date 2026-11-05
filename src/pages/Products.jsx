import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import toast from 'react-hot-toast';

const Products = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'

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
    description: '',
    status: 'active',
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Products & Categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
      ]);

      if (prodRes.status && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }
      if (catRes.status && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error loading inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

    return matchesSearch && matchesCategory && matchesStock;
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
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      sale_price: '',
      purchase_price: '',
      quantity: '',
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
      description: prod.description || '',
      status: prod.isActive == 1 ? 'active' : 'inactive',
    });
    setPreviewImage(prod.image || null);
    setSelectedFile(null);
    setModalOpen(true);
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
          fetchData();
        } else {
          toast.error(res.message || 'Failed to create product.');
        }
      } else {
        const res = await productService.updateProduct(payload);
        if (res.status) {
          toast.success(res.message || 'Product updated successfully!');
          setModalOpen(false);
          fetchData();
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
        fetchData();
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

  return (
    <div className="space-y-4">
      {/* ── Header & Action Bar ── */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="text-[11px] text-[var(--mut)] flex items-center gap-1.5 mb-0.5 font-medium">
            <i className="bi bi-box-seam text-[var(--blue)]"></i>
            <span>Catalog & Stock Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight truncate">Products Inventory</h1>
          <p className="text-xs text-[var(--mut)] hidden sm:block mt-0.5">
            Manage items, sale prices, cost pricing, margins, and monitor stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="chip hidden md:inline-flex text-xs">
            <i className="bi bi-boxes text-[var(--blue)]"></i>
            <span><b>{products.length}</b> Items</span>
            <span className="mx-1 opacity-40">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Valuation: {fmtCurrency(totalStockValuation)}
            </span>
          </div>

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
        <div className="card2 !p-2.5 sm:!p-3.5 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 text-[var(--blue)] flex items-center justify-center text-sm sm:text-lg shrink-0">
            <i className="bi bi-box-seam"></i>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-[var(--mut)] block truncate">Total Items</span>
            <b className="text-xs sm:text-base font-bold text-[var(--ink)] leading-tight block">
              {products.length} <span className="hidden sm:inline">Products</span>
            </b>
          </div>
        </div>

        <div className="card2 !p-2.5 sm:!p-3.5 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm sm:text-lg shrink-0">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-[var(--mut)] block truncate">Valuation (Cost)</span>
            <b className="text-xs sm:text-base font-bold text-emerald-600 dark:text-emerald-400 leading-tight block truncate">
              {fmtCurrency(totalStockValuation)}
            </b>
          </div>
        </div>

        <div className="card2 !p-2.5 sm:!p-3.5 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm sm:text-lg shrink-0 ${
            lowStockCount > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-gray-500/10 text-gray-500'
          }`}>
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-[var(--mut)] block truncate">Low Stock (≤5)</span>
            <b className={`text-xs sm:text-base font-bold leading-tight block truncate ${
              lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ink)]'
            }`}>
              {lowStockCount} <span className="hidden sm:inline">Critical</span>
            </b>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="card2 !p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search Input Box (No Overlap) */}
        <div className="search-input-wrap md:w-80">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--mut)] hover:text-[var(--ink)] z-10"
              title="Clear search"
            >
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </div>

        {/* Dropdowns & Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between md:justify-end">
          {/* Category Dropdown */}
          <select
            className="auth-input !h-[38px] !w-auto text-xs py-1 px-3 cursor-pointer flex-1 sm:flex-none"
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

          {/* Stock Filter Segments */}
          <div className="seg text-xs shrink-0">
            <button
              className={stockFilter === 'all' ? 'on' : ''}
              onClick={() => setStockFilter('all')}
            >
              All
            </button>
            <button
              className={stockFilter === 'low_stock' ? 'on' : ''}
              onClick={() => setStockFilter('low_stock')}
            >
              Low Stock
            </button>
            <button
              className={stockFilter === 'out_of_stock' ? 'on' : ''}
              onClick={() => setStockFilter('out_of_stock')}
            >
              Out of Stock
            </button>
          </div>

          <button
            onClick={fetchData}
            className="chip !h-[38px] !px-2.5 text-xs shrink-0"
            title="Refresh inventory"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
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
      ) : filteredProducts.length > 0 ? (
        <div className="card2 !p-0 overflow-hidden">
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
                {filteredProducts.map((prod) => {
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
                            <span className="text-[11px] text-[var(--mut)] block truncate" title={prod.description}>
                              {prod.description || `SKU #${prod.id}`}
                            </span>
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
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs shadow-sm tracking-tight ${
                          qty === 0
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            : qty <= 5
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 animate-pulse'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        }`}>
                          <i className={`bi ${qty === 0 ? 'bi-x-circle-fill' : qty <= 5 ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}></i>
                          <span>{qty} in stock</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`pill !text-[11px] !py-0.5 !px-2.5 ${isActive ? '' : '!bg-gray-100 !text-gray-500 dark:!bg-gray-800'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                    Sale Price (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="auth-input text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                    placeholder="1500.00"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    required
                  />
                </div>

                {/* Purchase Cost */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                    Cost Price (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="auth-input text-xs"
                    placeholder="1000.00"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                    Stock Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="auth-input text-xs font-semibold"
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
    </div>
  );
};

export default Products;
