import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/authSlice';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const Header = ({ onToggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Dark / Light theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('billbook_theme') || 'light';
  });

  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('billbook_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Determine breadcrumb title
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview';
    if (path.startsWith('/sales')) return 'Sales & Invoices';
    if (path.startsWith('/products')) return 'Products Catalog';
    if (path.startsWith('/categories')) return 'Product Categories';
    if (path.startsWith('/parties')) return 'Customers & Parties';
    if (path.startsWith('/invoice-templates')) return 'Invoice Templates';
    if (path.startsWith('/profile')) return 'Business Profile';
    return 'Dashboard';
  };

  const getInitials = (name) => {
    if (!name) return 'BB';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="top">
      {/* Mobile Menu Hamburger */}
      <button
        className="ibtn lg:hidden"
        onClick={onToggleSidebar}
        aria-label="Toggle Navigation Menu"
      >
        <i className="bi bi-list text-xl"></i>
      </button>

      {/* Breadcrumb */}
      <div className="crumb min-w-0 shrink">
        <span className="truncate max-w-[90px] sm:max-w-none">{user?.business_name || 'BillBook'}</span>
        <i className="bi bi-chevron-right text-[11px] mx-1.5 opacity-60 shrink-0"></i>
        <b className="truncate">{getBreadcrumbTitle()}</b>
      </div>

      {/* Today Date Badge - hidden on small screens to prevent squishing */}
      <div className="chip chip-date ml-auto">
        <i className="bi bi-calendar3 text-[var(--blue)]"></i>
        <span>{todayFormatted}</span>
      </div>

      {/* Theme Switcher Button */}
      <button
        className="ibtn shrink-0"
        id="theme"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        aria-label="Toggle Theme"
      >
        <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-amber-400' : 'bi-moon'}`}></i>
      </button>

      {/* User Chip & Dropdown */}
      <div className="relative shrink-0">
        <button
          className="chip usr !px-2.5 sm:!px-3.5"
          onClick={() => setShowUserMenu(!showUserMenu)}
          aria-haspopup="true"
          aria-expanded={showUserMenu}
        >
          <div className="av">
            {user?.profile_image ? (
              <img src={user.profile_image} alt={user.name || 'User'} />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          <div className="hidden md:block text-left">
            <span className="font-semibold block text-[13px]">{user?.name || 'Admin'}</span>
            <small>{user?.business_name || 'Business'}</small>
          </div>
          <i className="bi bi-chevron-down text-[10px] ml-1 opacity-60"></i>
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div
            className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            onClick={() => setShowUserMenu(false)}
          >
            <div className="p-3 border-b border-[var(--line)] mb-1">
              <p className="font-semibold text-sm text-[var(--ink)] leading-tight">{user?.name}</p>
              <p className="text-xs text-[var(--mut)] truncate mt-0.5">{user?.email}</p>
              <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[var(--blue)] font-medium">
                {user?.business_name || 'Admin'}
              </span>
            </div>

            <Link
              to="/profile"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-[var(--ink)] hover:bg-[var(--soft)] transition-colors"
            >
              <i className="bi bi-person-circle text-sm text-[var(--blue)]"></i>
              <span>Profile & Settings</span>
            </Link>

            <Link
              to="/sales"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-[var(--ink)] hover:bg-[var(--soft)] transition-colors"
            >
              <i className="bi bi-receipt text-sm text-[var(--green)]"></i>
              <span>Sales & Invoices</span>
            </Link>

            <div className="my-1 border-t border-[var(--line)]"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-[var(--red)] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
            >
              <i className="bi bi-box-arrow-right text-sm"></i>
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* New Deal / Sale Button (Desktop Only) */}
      <Link to="/sales" className="btn-d !hidden lg:!inline-flex shrink-0 !h-10 text-xs">
        <i className="bi bi-plus-lg"></i>
        <span>New Sale</span>
      </Link>
    </header>
  );
};

export default Header;
