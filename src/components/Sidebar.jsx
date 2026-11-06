import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/authSlice';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.stopPropagation();
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'BB';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className={`ov ${isOpen ? 'on' : ''}`}
        id="ov"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`side ${isOpen ? 'open' : ''}`} id="side">
        {/* Brand Header */}
        <div className="brand">
          <div className="logo">B</div>
          <div>
            <b>BillBook</b>
            <small>{user?.business_name || user?.shop_name || 'Smart Billing'}</small>
          </div>
          <button
            className="sq text-[#94a3b8] hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Sidebar Navigation Toggle"
            title="Toggle Navigation"
          >
            <svg
              className="hidden lg:block w-4 h-4 text-[#8b97b5] group-hover:text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            <i className="bi bi-x-lg lg:hidden text-white text-xs font-bold"></i>
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="lbl">SELL</div>
        <nav className="menu">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'on' : '')}
            onClick={onClose}
          >
            <i className="bi bi-grid-1x2"></i>
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/sales"
            className={({ isActive }) => (isActive ? 'on' : '')}
            onClick={onClose}
          >
            <i className="bi bi-receipt"></i>
            <span>Sales & Invoices</span>
            <span className="bd am">POS</span>
          </NavLink>
        </nav>

        <div className="lbl mt-2">INVENTORY</div>
        <nav className="menu">
          <NavLink
            to="/products"
            className={({ isActive }) => (isActive ? 'on' : '')}
            onClick={onClose}
          >
            <i className="bi bi-box-seam"></i>
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/categories"
            className={({ isActive }) => (isActive ? 'on' : '')}
            onClick={onClose}
          >
            <i className="bi bi-tags"></i>
            <span>Categories</span>
          </NavLink>

          <NavLink
            to="/parties"
            className={({ isActive }) => (isActive ? 'on' : '')}
            onClick={onClose}
          >
            <i className="bi bi-people"></i>
            <span>Customers / Parties</span>
          </NavLink>
        </nav>

        <div className="lbl mt-2">PREFERENCES</div>
        <nav className="menu">
          <NavLink
            to="/invoice-templates"
            className={({ isActive }) => (isActive ? 'on' : '')}
            onClick={onClose}
          >
            <i className="bi bi-palette"></i>
            <span>Invoice Templates</span>
          </NavLink>

          <NavLink
            to="/whatsapp"
            className={({ isActive }) => (isActive ? 'on' : '')}
            onClick={onClose}
          >
            <i className="bi bi-whatsapp text-[#25D366]"></i>
            <span>WhatsApp Connect</span>
          </NavLink>
        </nav>

        {/* Bottom user info */}
        <div className="sb">
          <div className="me">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 flex-1 min-w-0 no-underline text-inherit"
              title="Manage Profile & Settings"
            >
              <div className="av">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt={user.name || 'User'} />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <b className="truncate text-white block leading-tight text-[12.5px]">
                  {user?.name || 'Administrator'}
                </b>
                <small className="truncate block text-[#8b97b5] text-[10.5px]">
                  {user?.business_name || 'Admin Account'}
                </small>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-1 rounded-lg text-[#8b97b5] hover:text-rose-400 hover:bg-[#16244a] transition-colors ml-0.5"
              title="Sign Out"
              aria-label="Logout"
            >
              <i className="bi bi-box-arrow-right text-sm"></i>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
