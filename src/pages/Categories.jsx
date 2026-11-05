import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import categoryService from '../services/categoryService';
import toast from 'react-hot-toast';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryStatus, setCategoryStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load categories from API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getCategories();
      if (res.status && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        toast.error(res.message || 'Failed to load categories.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error connecting to categories API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories by search and status
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase().trim());
    const isActive = cat.isActive == 1 || cat.isActive === '1' || cat.status === 'active';
    if (statusFilter === 'active') return matchesSearch && isActive;
    if (statusFilter === 'inactive') return matchesSearch && !isActive;
    return matchesSearch;
  });

  const totalProductsCount = categories.reduce(
    (acc, c) => acc + (parseInt(c.productCount, 10) || 0),
    0
  );

  // Open modal for adding
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingCategory(null);
    setCategoryName('');
    setCategoryStatus('active');
    setModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (cat) => {
    setModalMode('edit');
    setEditingCategory(cat);
    setCategoryName(cat.name || '');
    setCategoryStatus(cat.isActive == 1 || cat.status === 'active' ? 'active' : 'inactive');
    setModalOpen(true);
  };

  // Submit category form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = categoryName.trim();
    if (!cleanName) {
      toast.error('Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await categoryService.addCategory({
          name: cleanName,
          status: categoryStatus,
        });
        if (res.status) {
          toast.success(res.message || 'Category added successfully!');
          setModalOpen(false);
          fetchCategories();
        } else {
          toast.error(res.message || 'Could not add category.');
        }
      } else {
        const res = await categoryService.updateCategory({
          id: editingCategory.id,
          name: cleanName,
          status: categoryStatus,
        });
        if (res.status) {
          toast.success(res.message || 'Category updated successfully!');
          setModalOpen(false);
          fetchCategories();
        } else {
          toast.error(res.message || 'Could not update category.');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving category.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm and delete category
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await categoryService.deleteCategory(deleteId);
      if (res.status) {
        toast.success(res.message || 'Category deleted successfully!');
        setDeleteId(null);
        fetchCategories();
      } else {
        toast.error(res.message || 'Failed to delete category.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting category.');
    } finally {
      setDeleting(false);
    }
  };

  // Predefined icon colors for cards
  const getCategoryTheme = (idx) => {
    const themes = [
      { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: 'bi-tag-fill' },
      { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: 'bi-box-seam-fill' },
      { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', icon: 'bi-layers-fill' },
      { bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', icon: 'bi-grid-fill' },
      { bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', icon: 'bi-bookmark-star-fill' },
      { bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', icon: 'bi-collection-fill' },
    ];
    return themes[idx % themes.length];
  };

  return (
    <div className="space-y-4">
      {/* ── Header & Action Bar ── */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="text-[11px] text-[var(--mut)] flex items-center gap-1.5 mb-0.5 font-medium">
            <i className="bi bi-tags text-[var(--amber)]"></i>
            <span>Inventory Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight truncate">Product Categories</h1>
          <p className="text-xs text-[var(--mut)] hidden sm:block mt-0.5">
            Group items into organized catalog categories for fast POS billing and inventory tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="chip hidden sm:inline-flex text-xs">
            <i className="bi bi-folder2-open text-[var(--blue)]"></i>
            <span><b>{categories.length}</b> Categories</span>
            <span className="mx-1 opacity-40">•</span>
            <span><b>{totalProductsCount}</b> Products</span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-b text-xs font-semibold !h-9 px-3.5 flex items-center gap-1.5 shrink-0"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="card2 !p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input Box (No Overlap) */}
        <div className="search-input-wrap sm:w-80">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search categories by name..."
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

        {/* Status filter segments */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="seg text-xs flex-1 sm:flex-none justify-center">
            <button
              className={statusFilter === 'all' ? 'on' : ''}
              onClick={() => setStatusFilter('all')}
            >
              All ({categories.length})
            </button>
            <button
              className={statusFilter === 'active' ? 'on' : ''}
              onClick={() => setStatusFilter('active')}
            >
              Active
            </button>
            <button
              className={statusFilter === 'inactive' ? 'on' : ''}
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
            </button>
          </div>

          <button
            onClick={fetchCategories}
            className="chip !h-[38px] !px-2.5 text-xs shrink-0"
            title="Refresh categories"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* ── Category Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card2 !p-5">
              <div className="flex items-center gap-3">
                <div className="skeleton w-11 h-11 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-28 rounded"></div>
                  <div className="skeleton h-3 w-16 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredCategories.map((cat, idx) => {
            const theme = getCategoryTheme(idx);
            const isActive = cat.isActive == 1 || cat.isActive === '1' || cat.status === 'active';
            const count = parseInt(cat.productCount, 10) || 0;

            return (
              <div
                key={cat.id}
                className="card2 !p-4 flex flex-col justify-between hover:border-[var(--blue)] transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${theme.bg} shrink-0`}>
                        <i className={`bi ${theme.icon}`}></i>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-[var(--ink)] truncate" title={cat.name}>
                          {cat.name}
                        </h3>
                        <span className="text-[11px] text-[var(--mut)] block">
                          ID: #{cat.id} • {cat.created_on ? cat.created_on.split(' ')[0] : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span className={`pill shrink-0 ${isActive ? '' : '!bg-gray-100 !text-gray-500 dark:!bg-gray-800'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Product count & Actions */}
                <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between">
                  <Link
                    to={`/products?category=${cat.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--mut)] hover:text-[var(--blue)] transition-colors font-medium"
                    title="View products in this category"
                  >
                    <i className="bi bi-box-seam"></i>
                    <span><b>{count}</b> {count === 1 ? 'Product' : 'Products'}</span>
                    <i className="bi bi-arrow-right text-[10px]"></i>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:text-[var(--blue)] text-[var(--mut)] flex items-center justify-center transition-colors text-xs"
                      title="Edit Category"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      onClick={() => setDeleteId(cat.id)}
                      className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 text-[var(--mut)] flex items-center justify-center transition-colors text-xs"
                      title="Delete Category"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="card2 !p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--soft)] border border-[var(--line)] mx-auto flex items-center justify-center text-3xl text-[var(--mut)] mb-3">
            <i className="bi bi-folder-x"></i>
          </div>
          <h3 className="text-base font-bold text-[var(--ink)]">No Categories Found</h3>
          <p className="text-xs text-[var(--mut)] max-w-sm mx-auto mt-1 mb-5">
            {search
              ? `No categories matching "${search}". Try searching for something else.`
              : 'You have not added any categories yet. Create your first product category.'}
          </p>
          <button onClick={handleOpenAdd} className="btn-b text-xs font-semibold !h-9 px-4">
            <i className="bi bi-plus-lg"></i>
            <span>Create New Category</span>
          </button>
        </div>
      )}

      {/* ── Add / Edit Category Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center font-bold">
                  <i className="bi bi-tags"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)]">
                    {modalMode === 'add' ? 'Create New Category' : 'Edit Category'}
                  </h3>
                  <p className="text-[11px] text-[var(--mut)]">
                    {modalMode === 'add'
                      ? 'Add a new product group to your store.'
                      : `Update details for category #${editingCategory?.id}`}
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
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="auth-input text-xs"
                  placeholder="e.g. Cricket, Electronics, Footwear..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--mut)] uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryStatus('active')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      categoryStatus === 'active'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-600 shadow-sm'
                        : 'border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:bg-[var(--soft)]'
                    }`}
                  >
                    <i className="bi bi-check-circle-fill text-emerald-600 dark:text-emerald-400"></i>
                    <span>Active</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryStatus('inactive')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      categoryStatus === 'inactive'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-600 shadow-sm'
                        : 'border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:bg-[var(--soft)]'
                    }`}
                  >
                    <i className="bi bi-dash-circle text-rose-600 dark:text-rose-400"></i>
                    <span>Inactive</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-end gap-2">
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
                    'Create Category'
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
            <h3 className="text-sm font-bold text-[var(--ink)]">Delete Category?</h3>
            <p className="text-xs text-[var(--mut)] mt-1 mb-5">
              Are you sure you want to delete this category? Products associated with it will remain intact.
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

export default Categories;
