import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import Products from '../pages/Products';
import Categories from '../pages/Categories';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route Guard (prevents logged-in users from seeing login/register)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Main App Layout Wrapper with Theme Sidebar and Header
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main">
        <Header onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </main>
      <BottomNav onToggleSidebar={() => setSidebarOpen(true)} />
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Placeholders for subsequent steps */}
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <MainLayout>
              <div className="card2 p-8 text-center">
                <i className="bi bi-receipt text-4xl text-[var(--blue)] block mb-2"></i>
                <h3 className="text-lg font-bold">Sales & Invoicing Module</h3>
                <p className="text-xs text-[var(--mut)] mt-1">Ready for step 2 integration.</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Products />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Categories />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parties"
        element={
          <ProtectedRoute>
            <MainLayout>
              <div className="card2 p-8 text-center">
                <i className="bi bi-people text-4xl text-[var(--blue)] block mb-2"></i>
                <h3 className="text-lg font-bold">Customers & Parties Module</h3>
                <p className="text-xs text-[var(--mut)] mt-1">Ready for step 2 integration.</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoice-templates"
        element={
          <ProtectedRoute>
            <MainLayout>
              <div className="card2 p-8 text-center">
                <i className="bi bi-palette text-4xl text-rose-500 block mb-2"></i>
                <h3 className="text-lg font-bold">Invoice Templates Module</h3>
                <p className="text-xs text-[var(--mut)] mt-1">Ready for step 2 integration.</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 Catch All */}
      <Route
        path="*"
        element={
          <div className="auth-page">
            <div className="auth-card text-center">
              <i className="bi bi-exclamation-triangle text-5xl text-[var(--amber)] mb-3 block"></i>
              <h2 className="text-2xl font-bold mb-1">Page Not Found</h2>
              <p className="text-xs text-[var(--mut)] mb-6">
                The page you are looking for doesn't exist or has moved.
              </p>
              <a href="/" className="btn-b justify-center w-full">
                Back to Dashboard
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
