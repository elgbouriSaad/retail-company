import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/user/DashboardPage';
import { ShopPage } from './pages/user/ShopPage';
import { ContactPage } from './pages/user/ContactPage';
import { ProfilePage } from './pages/user/ProfilePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CatalogueManagement } from './pages/admin/CatalogueManagement';
import { UserManagement } from './pages/admin/UserManagement';
import { OrderPaymentManagement } from './pages/admin/OrderPaymentManagement';
import { Settings } from './pages/admin/Settings';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected User Routes */}
            <Route path="/dashboard" element={
              <AuthGuard>
                <Layout>
                  <DashboardPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/shop" element={
              <AuthGuard>
                <Layout>
                  <ShopPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/contact" element={
              <AuthGuard>
                <Layout>
                  <ContactPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/profile" element={
              <AuthGuard>
                <Layout>
                  <ProfilePage />
                </Layout>
              </AuthGuard>
            } />

            {/* Protected Admin Routes */}
            <Route path="/admin/dashboard" element={
              <AuthGuard requiredRole="admin">
                <Layout>
                  <AdminDashboard />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/admin/catalogue" element={
              <AuthGuard requiredRole="admin">
                <Layout>
                  <CatalogueManagement />
                </Layout>
              </AuthGuard>
            } />

            <Route path="/admin/users" element={
              <AuthGuard requiredRole="admin">
                <Layout>
                  <UserManagement />
                </Layout>
              </AuthGuard>
            } />

            <Route path="/admin/orders" element={
              <AuthGuard requiredRole="admin">
                <Layout>
                  <OrderPaymentManagement />
                </Layout>
              </AuthGuard>
            } />

            <Route path="/admin/settings" element={
              <AuthGuard requiredRole="admin">
                <Layout>
                  <Settings />
                </Layout>
              </AuthGuard>
            } />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;