import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav = ({ onToggleSidebar }) => {
  return (
    <nav className="bnav" aria-label="Mobile Bottom Navigation">
      {/* 1. Overview */}
      <NavLink
        to="/"
        end
        className={({ isActive }) => `bnav-item ${isActive ? 'on' : ''}`}
      >
        <i className="bi bi-grid-1x2"></i>
        <span>Overview</span>
      </NavLink>

      {/* 2. Sales */}
      <NavLink
        to="/sales"
        className={({ isActive }) => `bnav-item ${isActive ? 'on' : ''}`}
      >
        <i className="bi bi-receipt"></i>
        <span>Sales</span>
      </NavLink>

      {/* 3. Products */}
      <NavLink
        to="/products"
        className={({ isActive }) => `bnav-item ${isActive ? 'on' : ''}`}
      >
        <i className="bi bi-box-seam"></i>
        <span>Products</span>
      </NavLink>

      {/* 4. Parties */}
      <NavLink
        to="/parties"
        className={({ isActive }) => `bnav-item ${isActive ? 'on' : ''}`}
      >
        <i className="bi bi-people"></i>
        <span>Parties</span>
      </NavLink>

      {/* 5. More (Opens Sidebar Drawer) */}
      <button
        type="button"
        className="bnav-item relative"
        onClick={onToggleSidebar}
        aria-label="Open More Menu"
      >
        <div className="relative">
          <i className="bi bi-grid-fill"></i>
          <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-1 border border-[#0e1a38]"></span>
        </div>
        <span>More</span>
      </button>
    </nav>
  );
};

export default BottomNav;
