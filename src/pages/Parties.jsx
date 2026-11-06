import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import partyService from '../services/partyService';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const fmtCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return 'Rs. ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const Parties = () => {
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [totalSalesVolume, setTotalSalesVolume] = useState(0);
  const limit = 10;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingParty, setEditingParty] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    type: 'customer',
    notes: '',
  });

  const fetchParties = async (page = 1) => {
    setLoading(true);
    try {
      const res = await partyService.getParties({
        page,
        limit,
        search: search.trim(),
        type: typeFilter,
      });
      if (res.status && res.data) {
        if (res.data.parties) {
          setParties(res.data.parties || []);
          setTotalRows(res.data.total_rows || 0);
          setTotalPages(res.data.total_pages || 1);
          setCurrentPage(res.data.current_page || 1);
          if (res.data.total_sales_volume !== undefined) {
            setTotalSalesVolume(res.data.total_sales_volume);
          }
        } else if (Array.isArray(res.data)) {
          setParties(res.data);
          setTotalRows(res.data.length);
          setTotalPages(Math.ceil(res.data.length / limit) || 1);
          setCurrentPage(page);
        }
      }
    } catch (err) {
      console.error('Error fetching parties:', err);
      toast.error('Could not load parties list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParties(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchParties(1);
  };

  // Aggregates
  const totalBusiness = parties.reduce((acc, p) => acc + (parseFloat(p.total_business) || 0), 0);
  const totalOutstanding = parties.reduce((acc, p) => acc + (parseFloat(p.outstanding_amount) || 0), 0);

  // Open modal handlers
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingParty(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      gstin: '',
      address: '',
      city: '',
      state: '',
      type: 'customer',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (party) => {
    setModalMode('edit');
    setEditingParty(party);
    setFormData({
      name: party.name || '',
      phone: party.phone || '',
      email: party.email || '',
      company: party.company || '',
      gstin: party.gstin || '',
      address: party.address || '',
      city: party.city || '',
      state: party.state || '',
      type: party.type || 'customer',
      notes: party.notes || '',
    });
    setModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Party name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await partyService.addParty(formData);
        if (res.status) {
          toast.success(res.message || 'Party added successfully!');
          setModalOpen(false);
          fetchParties(1);
        } else {
          toast.error(res.message || 'Failed to add party.');
        }
      } else {
        const res = await partyService.updateParty({
          ...formData,
          id: editingParty.id,
        });
        if (res.status) {
          toast.success(res.message || 'Party updated successfully!');
          setModalOpen(false);
          fetchParties(currentPage);
        } else {
          toast.error(res.message || 'Failed to update party.');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving party details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await partyService.deleteParty(deleteId);
      if (res.status) {
        toast.success(res.message || 'Party deleted successfully!');
        setDeleteId(null);
        fetchParties(currentPage);
      } else {
        toast.error(res.message || 'Failed to delete party.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting party.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Header & Action Bar ── */}
      <div className="flex items-center justify-between gap-3 mb-1">
        <div>
          <div className="text-[11px] text-[var(--mut)] flex items-center gap-1.5 mb-0.5 font-medium">
            <i className="bi bi-people text-[var(--amber)]"></i>
            <span>Client & Vendor Relationship Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight">
            Customers & Parties
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="chip !hidden md:!inline-flex text-xs">
            <i className="bi bi-person-badge text-[var(--blue)]"></i>
            <span><b>{parties.length}</b> Clients</span>
            <span className="mx-1 opacity-40">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Volume: {fmtCurrency(totalBusiness)}
            </span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-b text-xs font-semibold !h-9 px-3.5 flex items-center gap-1.5"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Party</span>
          </button>
        </div>
      </div>

      {/* ── Mini KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="card2 !p-3">
          <span className="text-[10px] sm:text-[11px] text-[var(--mut)] block">Total Parties</span>
          <b className="text-sm sm:text-base font-bold text-[var(--ink)] block mt-0.5">
            {totalRows || parties.length} Registered
          </b>
        </div>

        <div className="card2 !p-3">
          <span className="text-[10px] sm:text-[11px] text-[var(--mut)] block">Total Sales Volume</span>
          <b className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
            {fmtCurrency(totalSalesVolume || totalBusiness)}
          </b>
        </div>

        <div className="card2 !p-3 col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-[11px] text-[var(--mut)] block">Outstanding Balance</span>
          <b className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
            {fmtCurrency(totalOutstanding)}
          </b>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="card2 !p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <form onSubmit={handleSearchSubmit} className="search-input-wrap w-full sm:w-80">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="search-input text-xs"
            placeholder="Search party by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchParties(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--mut)]"
            >
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="seg mobile-scroll text-xs flex-1 sm:flex-none justify-around sm:justify-start">
            <button
              className={typeFilter === 'all' ? 'on flex-1 sm:flex-initial' : 'flex-1 sm:flex-initial'}
              onClick={() => setTypeFilter('all')}
            >
              All ({totalRows || parties.length})
            </button>
            <button
              className={typeFilter === 'customer' ? 'on flex-1 sm:flex-initial' : 'flex-1 sm:flex-initial'}
              onClick={() => setTypeFilter('customer')}
            >
              Customers
            </button>
            <button
              className={typeFilter === 'vendor' ? 'on flex-1 sm:flex-initial' : 'flex-1 sm:flex-initial'}
              onClick={() => setTypeFilter('vendor')}
            >
              Vendors
            </button>
          </div>

          <button
            onClick={() => fetchParties(1)}
            className="chip !h-[38px] !px-3 text-xs shrink-0"
            title="Refresh directory"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* ── Parties Directory (Dual View: Mobile Cards + Desktop Table) ── */}
      {loading ? (
        <div className="card2 !p-8 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[var(--mut)]">Loading directory...</p>
        </div>
      ) : parties.length > 0 ? (
        <>
          {/* Mobile Native Card View (< 768px) */}
          <div className="mobile-only space-y-2.5">
            {parties.map((p) => (
              <div
                key={p.id}
                className="card2 !p-3.5 space-y-2.5 hover:border-[var(--blue)] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <b className="text-sm font-bold text-[var(--ink)] block truncate">
                      {p.name}
                    </b>
                    {p.company && (
                      <span className="text-[11px] text-[var(--mut)] block truncate">
                        {p.company}
                      </span>
                    )}
                  </div>
                  <span className={`pill !text-[10px] !py-0.5 !px-2 ${
                    p.type === 'vendor' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[var(--blue)]'
                  }`}>
                    {p.type === 'vendor' ? 'Vendor' : 'Customer'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--line)] text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--mut)] block">Phone & Email</span>
                    <b className="text-[var(--ink)] block font-semibold">{p.phone || '-'}</b>
                    <span className="text-[10px] text-[var(--mut)] truncate block">{p.email || ''}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--mut)] block">Total Business</span>
                    <b className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                      {fmtCurrency(p.total_business)}
                    </b>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                  <button
                    onClick={() => {
                      const addr = [p.address, p.city, p.state].filter(Boolean).join(', ');
                      navigate(`/sales?mode=create`, {
                        state: {
                          customer: {
                            id: p.id,
                            name: p.name || '',
                            phone: p.phone || '',
                            address: addr || '',
                          }
                        }
                      });
                    }}
                    className="text-xs text-[var(--blue)] font-semibold flex items-center gap-1 hover:underline"
                  >
                    <i className="bi bi-cart-plus"></i>
                    <span>Create Sale</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--ink)] flex items-center justify-center text-xs"
                        title="Call"
                      >
                        <i className="bi bi-telephone"></i>
                      </a>
                    )}
                    {p.phone && (
                      <a
                        href={`https://wa.me/91${p.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg border border-[var(--line)] bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs"
                        title="WhatsApp"
                      >
                        <i className="bi bi-whatsapp"></i>
                      </a>
                    )}
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--ink)] flex items-center justify-center text-xs"
                      title="Edit"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="w-7 h-7 rounded-lg border border-[var(--line)] text-rose-500 hover:bg-rose-50 flex items-center justify-center text-xs"
                      title="Delete"
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
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">City / Address</th>
                  <th className="py-3 px-3 text-right">Total Business</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {parties.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--soft)]/40 transition-colors">
                    <td className="py-3 px-4">
                      <b className="font-semibold text-sm text-[var(--ink)] block">{p.name}</b>
                      {p.company && (
                        <span className="text-[11px] text-[var(--mut)] block">{p.company}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`pill !text-[10px] !py-0.5 !px-2 ${
                        p.type === 'vendor' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[var(--blue)]'
                      }`}>
                        {p.type === 'vendor' ? 'Vendor' : 'Customer'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <b className="text-[var(--ink)] block">{p.phone || '-'}</b>
                      <span className="text-[10px] text-[var(--mut)] block">{p.email || ''}</span>
                    </td>
                    <td className="py-3 px-3 text-[var(--mut)] truncate max-w-[180px]" title={p.address}>
                      {p.city ? `${p.city}, ${p.state || ''}` : p.address || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {fmtCurrency(p.total_business)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            const addr = [p.address, p.city, p.state].filter(Boolean).join(', ');
                            navigate(`/sales?mode=create`, {
                              state: {
                                customer: {
                                  id: p.id,
                                  name: p.name || '',
                                  phone: p.phone || '',
                                  address: addr || '',
                                }
                              }
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:text-[var(--blue)] text-xs font-semibold flex items-center gap-1"
                          title="Create Sale with this Customer"
                        >
                          <i className="bi bi-cart-plus"></i>
                          <span>Sale</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] text-[var(--mut)] hover:text-[var(--blue)] flex items-center justify-center text-xs"
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>

                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--soft)] hover:bg-rose-50 text-rose-500 flex items-center justify-center text-xs"
                          title="Delete"
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
            limit={limit}
            onPageChange={(p) => fetchParties(p)}
            itemName="parties"
          />
        </>
      ) : (
        <div className="card2 !p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--soft)] border border-[var(--line)] mx-auto flex items-center justify-center text-2xl text-[var(--mut)] mb-3">
            <i className="bi bi-people"></i>
          </div>
          <h3 className="text-sm font-bold text-[var(--ink)]">No Parties Found</h3>
          <p className="text-xs text-[var(--mut)] mt-1 mb-4">
            {search
              ? 'No parties match your search criteria.'
              : 'Add your clients and suppliers to track client history and fast POS lookups.'}
          </p>
          <button onClick={handleOpenAdd} className="btn-b text-xs font-semibold !h-9 px-4">
            <i className="bi bi-plus-lg"></i>
            <span>Add First Party</span>
          </button>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <i className="bi bi-person-plus"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)]">
                    {modalMode === 'add' ? 'Add New Party / Customer' : 'Edit Party Details'}
                  </h3>
                  <p className="text-[11px] text-[var(--mut)]">
                    Contact details and tax identification
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

            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                    Party Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="auth-input text-xs font-medium"
                    placeholder="e.g. Ramesh Patel"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="auth-input text-xs"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                    Company / Firm Name
                  </label>
                  <input
                    type="text"
                    className="auth-input text-xs"
                    placeholder="Optional business entity"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                    Party Role
                  </label>
                  <select
                    className="auth-input text-xs cursor-pointer"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="customer">Customer / Client</option>
                    <option value="vendor">Vendor / Supplier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="auth-input text-xs"
                    placeholder="e.g. client@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    className="auth-input text-xs uppercase"
                    placeholder="24AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  className="auth-input text-xs !h-auto py-1.5"
                  placeholder="Street address, shop number, landmark..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    className="auth-input text-xs"
                    placeholder="e.g. Surat"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mut)] uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    className="auth-input text-xs"
                    placeholder="e.g. Gujarat"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="chip text-xs !h-9 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-b text-xs font-semibold !h-9 px-4"
                >
                  {submitting ? 'Saving...' : modalMode === 'add' ? 'Save Party' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-2xl">
              <i className="bi bi-person-x"></i>
            </div>
            <h3 className="text-sm font-bold text-[var(--ink)]">Delete Party Record?</h3>
            <p className="text-xs text-[var(--mut)]">
              Are you sure you want to remove this client from your directory?
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="chip text-xs !h-8 px-3"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                disabled={deleting}
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

export default Parties;
